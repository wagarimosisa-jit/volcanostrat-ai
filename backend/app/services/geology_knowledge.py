"""
Built-in volcanic geology knowledge base for GVAS AI Geologist.
Used as fast offline fallback and as context for LLM prompts.
"""

from typing import Optional

GEOLOGY_KNOWLEDGE = {
    "ethiopia": {
        "geology": (
            "Ethiopia is located in the East African Rift System, one of the world's most active "
            "continental rift zones. The geology is dominated by Cenozoic volcanic rocks, "
            "particularly the Ethiopian Flood Basalts (31-26 Ma) and Quaternary volcanoes."
        ),
        "aquifers": (
            "The Ethiopian rift valley contains productive aquifers in fractured basalts and ignimbrites. "
            "The Upper Awash Basin is a well-studied example with transmissivity values ranging from "
            "50-200 m²/day in basaltic aquifers."
        ),
        "references": "Ayenew & Legesse (2005), Tadesse et al. (2017), Kitessa (2025 - Jimma University)",
    },
    "east_african_rift": {
        "geology": (
            "The East African Rift is an active continental rift zone from the Afar Triangle to Mozambique, "
            "characterized by normal faulting, volcanic activity, and rift valley development."
        ),
        "hydrogeology": (
            "Groundwater in the EAR occurs in fractured volcanic rocks, alluvial sediments in rift floors, "
            "and weathered zones. Transmissivity can reach 500 m²/day in highly fractured zones."
        ),
    },
    "basalt": {
        "description": "Basalt is a mafic extrusive igneous rock, the most common volcanic rock on Earth.",
        "hydrogeology": (
            "Basalts form excellent aquifers when fractured. Primary porosity is typically 1-5%, "
            "but secondary fracture porosity can be much higher."
        ),
        "productivity": "Transmissivity in basalt aquifers ranges from 10-500 m²/day depending on fracturing.",
    },
    "andesite": {
        "description": "Andesite is an intermediate volcanic rock typical of subduction zone volcanoes.",
        "hydrogeology": "Andesitic aquifers are generally less productive than basalts but can yield from fractures.",
        "productivity": "Transmissivity typically ranges from 1-100 m²/day.",
    },
    "rhyolite": {
        "description": "Rhyolite is a felsic extrusive volcanic rock with high silica content.",
        "hydrogeology": "Rhyolite typically has low primary porosity unless intensely fractured or weathered.",
        "productivity": "Transmissivity is usually low (0.1-10 m²/day) unless in highly fractured zones.",
    },
    "pyroclastic": {
        "description": "Pyroclastic rocks include tuff, ignimbrite, and volcanic breccia from explosive eruptions.",
        "hydrogeology": "Unwelded pyroclastic deposits can form excellent aquifers (15-40% porosity).",
        "productivity": "Transmissivity in unwelded ignimbrites can reach 100-500 m²/day.",
    },
    "general": {
        "volcanic_aquifers": (
            "Volcanic aquifers are heterogeneous; permeability is controlled by fractures, vesicles, and weathering."
        ),
        "fracture_control": "Fractures are the primary water-bearing features in volcanic rocks.",
    },
}

GVAS_PLATFORM_EXPLANATION = """**How GVAS Works:**

1. **Standardization:** Raw lithology descriptions are matched against a global volcanic ontology.
2. **Modifier Extraction:** Properties like fracturing, weathering, and porosity are identified.
3. **Classification:** Layers are classified as aquifers/aquitards using global case studies.
4. **Prediction:** Hydraulic properties (T, K) are predicted from similar aquifers worldwide.
5. **3D Modeling:** Voxel-based 3D models are generated for visualization.
6. **Causal Analysis:** CSIE transforms static logs into Causal Earth Process Records (CEPR)."""


def match_geology_knowledge(question: str) -> Optional[str]:
    """Return a knowledge-base answer if the question matches a known topic."""
    q = question.lower()

    if any(w in q for w in ("how gvas", "how does gvas", "how this works", "how does this work")):
        return GVAS_PLATFORM_EXPLANATION

    if "ethiopia" in q or "ethiopian" in q:
        k = GEOLOGY_KNOWLEDGE["ethiopia"]
        return (
            f"**Ethiopian Geology (East African Rift System):**\n\n{k['geology']}\n\n"
            f"**Aquifer Characteristics:**\n{k['aquifers']}\n\n"
            f"**Key References:** {k['references']}"
        )

    if "east african rift" in q or "rift valley" in q or "afar" in q:
        k = GEOLOGY_KNOWLEDGE["east_african_rift"]
        return f"**East African Rift Geology:**\n\n{k['geology']}\n\n**Hydrogeology:**\n{k['hydrogeology']}"

    if "basalt" in q:
        k = GEOLOGY_KNOWLEDGE["basalt"]
        return (
            f"**Basalt - Volcanic Aquifer Rock:**\n\n{k['description']}\n\n"
            f"**Hydrogeological Properties:**\n{k['hydrogeology']}\n\n"
            f"**Productivity:**\n{k['productivity']}"
        )

    if "andesite" in q:
        k = GEOLOGY_KNOWLEDGE["andesite"]
        return (
            f"**Andesite:**\n\n{k['description']}\n\n"
            f"**Hydrogeology:**\n{k['hydrogeology']}\n\n**Productivity:**\n{k['productivity']}"
        )

    if "rhyolite" in q:
        k = GEOLOGY_KNOWLEDGE["rhyolite"]
        return (
            f"**Rhyolite:**\n\n{k['description']}\n\n"
            f"**Hydrogeology:**\n{k['hydrogeology']}\n\n**Productivity:**\n{k['productivity']}"
        )

    if any(w in q for w in ("pyroclastic", "tuff", "ignimbrite")):
        k = GEOLOGY_KNOWLEDGE["pyroclastic"]
        return (
            f"**Pyroclastic Rocks:**\n\n{k['description']}\n\n"
            f"**Hydrogeology:**\n{k['hydrogeology']}\n\n**Productivity:**\n{k['productivity']}"
        )

    if any(w in q for w in ("volcanic aquifer", "volcanic rock", "hydrogeology")):
        k = GEOLOGY_KNOWLEDGE["general"]
        return (
            f"**Volcanic Aquifers:**\n\n{k['volcanic_aquifers']}\n\n"
            f"**Fracture Control:**\n{k['fracture_control']}"
        )

    return None


def knowledge_summary_for_llm() -> str:
    """Compact geology reference injected into LLM system prompts."""
    lines = ["GVAS Geology Knowledge Base (reference only):"]
    for topic, data in GEOLOGY_KNOWLEDGE.items():
        lines.append(f"- {topic}: " + " ".join(str(v) for v in data.values())[:200])
    return "\n".join(lines)
