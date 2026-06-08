"""
Hybrid chat router for GVAS AI Geologist.
Routes to causal engine, structured analysis, geology KB, or external LLM.
"""

import re
from typing import Any, Dict, List, Optional

from .ai_geologist_base import ai_geologist_base
from .causal_engine import causal_engine
from .geology_knowledge import match_geology_knowledge, knowledge_summary_for_llm
from .llm_service import llm_service
def wells_to_well_data(wells: List[Dict]) -> Dict:
    """Convert standardized frontend wells to WellData-compatible dict."""
    well_logs = []
    for w in wells:
        layers = w.get("Layers", [])
        max_depth = max((l.get("Depth_End", 0) for l in layers), default=0)
        coords = w.get("Coordinates", {})
        desc = "; ".join(
            ", ".join(l.get("Modifiers", []) or []) or l.get("Hydro_Property", "unknown")
            for l in layers
        ) or "unknown"
        well_logs.append({
            "Well_ID": w.get("Well_ID", "Unknown"),
            "X_Coordinate": coords.get("X", 0),
            "Y_Coordinate": coords.get("Y", 0),
            "Elevation_m": coords.get("Elevation", 0),
            "Depth_Start_m": 0,
            "Depth_End_m": int(max_depth) or 1,
            "Raw_Lithology_Description": desc,
        })
    return {"wells": well_logs}


def build_project_context(wells: List[Dict], voxel_model: Optional[Dict] = None) -> str:
    """Build compact context string for LLM prompts."""
    if not wells:
        return "No well data loaded in this session."

    lines = [f"Project has {len(wells)} well(s):"]
    for w in wells[:10]:
        layers = w.get("Layers", [])
        aquifers = sum(1 for l in layers if "Aquifer" in (l.get("Hydro_Property") or ""))
        lines.append(
            f"- {w.get('Well_ID')}: {len(layers)} layers, {aquifers} aquifer layers, "
            f"coords ({w.get('Coordinates', {}).get('X')}, {w.get('Coordinates', {}).get('Y')})"
        )
        for layer in layers[:5]:
            lines.append(
                f"  Layer {layer.get('Layer_Number')}: {layer.get('Depth_Start')}-"
                f"{layer.get('Depth_End')}m, {layer.get('Hydro_Property')}, "
                f"modifiers: {', '.join(layer.get('Modifiers', []) or [])}"
            )

    summary = ai_geologist_base.aquifer_summary(wells)
    lines.append(
        f"Aquifer summary: {summary['aquifers']} aquifer layers, "
        f"{summary['aquitards']} aquitard layers "
        f"({summary['aquifer_percentage']:.1f}% aquifer)."
    )

    if voxel_model:
        lines.append(f"Voxel model loaded: {voxel_model.get('extent', 'grid available')}")

    lines.append(knowledge_summary_for_llm()[:1500])
    return "\n".join(lines)


def _format_productive_layers(wells: List[Dict]) -> str:
    result = ai_geologist_base.analyze_productive_layers(wells)
    if result.get("error"):
        return result["error"]
    layers = result.get("layers", [])
    if not layers:
        return "No highly productive aquifer layers found in your data."
    text = "**Most Productive Layers:**\n\n"
    for l in layers:
        text += (
            f"- **Layer {l.get('Layer_Number')}** ({l.get('Well_ID')}, "
            f"{l.get('Depth_Start')}-{l.get('Depth_End')}m): "
            f"{', '.join(l.get('Modifiers', []) or [])} — {l.get('Hydro_Property')}\n"
        )
    return text


def _format_layer_details(layer_num: int, wells: List[Dict]) -> str:
    result = ai_geologist_base.analyze_layer_details(layer_num, wells)
    if not result.get("details"):
        return f"No Layer {layer_num} found in your data."
    text = f"**Layer {layer_num} Details:**\n\n"
    for d in result["details"]:
        text += (
            f"- **Well {d.get('Well_ID')}:** {d.get('Depth_Start')}-{d.get('Depth_End')}m, "
            f"{d.get('Hydro_Property')}, T={d.get('Predicted_T', 'N/A')} m²/day, "
            f"confidence {d.get('Confidence', 0) * 100:.0f}%\n"
        )
    return text


def _format_aquifer_summary(wells: List[Dict]) -> str:
    s = ai_geologist_base.aquifer_summary(wells)
    return (
        f"**Aquifer/Aquitard Summary:**\n\n"
        f"- Aquifers: {s['aquifers']} layers ({s['aquifer_percentage']:.1f}%)\n"
        f"- Aquitards: {s['aquitards']} layers\n"
        f"- Productivity breakdown: {s.get('productivity_breakdown', {})}"
    )


async def _handle_causal(question: str, wells: List[Dict]) -> Optional[str]:
    """Run CSIE endpoints for causal questions. Returns None if not a causal query."""
    q = question.lower()
    if not wells:
        return None

    if "what if" in q or "what-if" in q:
        cepr = causal_engine.transform_to_cepr(wells[0])
        result = causal_engine.get_what_if_scenario(cepr, question)
        orig, mod = result["original_metrics"], result["modified_metrics"]
        text = f"**What-If Analysis:** {question}\n\n"
        text += f"**Original:** CCI {(orig['cci']*100):.1f}%, FEP {orig.get('fep', 0):.1f}, HCSS {(orig['hcss']*100):.1f}%\n"
        text += f"**Modified:** CCI {(mod['cci']*100):.1f}%, FEP {mod.get('fep', 0):.1f}, HCSS {(mod['hcss']*100):.1f}%\n\n"
        for c in result.get("changes", []):
            text += f"- {c}\n"
        return text

    if any(w in q for w in ("causal", "cepr", "analyze")):
        ceprs = [causal_engine.transform_to_cepr(w) for w in wells]
        cepr = ceprs[0]
        d = cepr.to_dict()
        text = f"**Causal Analysis (CEPR) for {d['well_id']}:**\n\n"
        text += f"- CCI: {d['cci']*100:.1f}%\n- FEP: {d.get('fep', 0):.1f}\n- HCSS: {d['hcss']*100:.1f}%\n"
        text += f"- Processes: {len(d.get('processes', []))}\n"
        for chain in d.get("causal_chains", [])[:3]:
            text += f"- Chain: {' → '.join(chain)}\n"
        return text

    if any(w in q for w in ("predict", "target")):
        ceprs = [causal_engine.transform_to_cepr(w) for w in wells]
        targets = causal_engine.predict_aquifer_targets(ceprs)
        if not targets:
            return "No aquifer targets predicted. Upload more wells for better predictions."
        text = "**Predicted Aquifer Targets:**\n\n"
        for t in targets:
            depth = t.get("depth_range") or f"{t.get('depth_start')}-{t.get('depth_end')}m"
            text += f"- **{depth}** ({t.get('confidence', 0)*100:.0f}%): {t.get('reason', '')}\n"
        return text

    if "compare" in q and len(wells) >= 2:
        by_id = {w["Well_ID"]: w for w in wells}
        ids = list(by_id.keys())
        well_id1, well_id2 = ids[0], ids[1]
        match = re.search(r"compare\s+(\S+)\s+(?:and|vs|with)\s+(\S+)", q)
        if match:
            well_id1, well_id2 = match.group(1), match.group(2)
        cepr1 = causal_engine.transform_to_cepr(by_id.get(well_id1, wells[0]))
        cepr2 = causal_engine.transform_to_cepr(by_id.get(well_id2, wells[1]))
        result = causal_engine.compare_causal_similarity(cepr1, cepr2)
        m = result["metrics"]
        return (
            f"**Causal Comparison:** {result['well1']} vs {result['well2']}\n\n"
            f"- Type: {result['similarity_type']}\n"
            f"- Overall similarity: {m['overall_similarity']*100:.1f}%\n"
            f"- Process similarity: {m['process_similarity']*100:.1f}%\n"
            f"- Chain similarity: {m['chain_similarity']*100:.1f}%"
        )

    return None


def _handle_structured_data(question: str, wells: List[Dict]) -> Optional[str]:
    """Answer well-data questions using ai_geologist_base."""
    if not wells:
        return None
    q = question.lower()

    if "most productive" in q or "best layer" in q:
        return _format_productive_layers(wells)

    match = re.search(r"layer\s+(\d+)", q)
    if match and ("detail" in q or "show" in q or "layer" in q):
        return _format_layer_details(int(match.group(1)), wells)

    if "aquifer" in q or "aquitard" in q:
        return _format_aquifer_summary(wells)

    if "uncertainty" in q or "confidence" in q:
        u = ai_geologist_base.uncertainty_analysis(wells)
        return (
            f"**Uncertainty Analysis:**\n\n"
            f"- Average confidence: {u['average_confidence']*100:.1f}%\n"
            f"- Uncertainty level: {u['uncertainty_level']}"
        )

    if "complexity" in q or "cri" in q:
        c = ai_geologist_base.complexity_metrics(wells)
        return (
            f"**Complexity Reduction:**\n\n"
            f"- Original layers: {c['total_original_layers']}\n"
            f"- Standardized units: {c['unique_standardized_units']}\n"
            f"- CRI: {c['complexity_reduction_index']}%"
        )

    return None


async def handle_chat(
    message: str,
    history: Optional[List[Dict[str, str]]] = None,
    wells: Optional[List[Dict]] = None,
    voxel_model: Optional[Dict] = None,
    provider: Optional[str] = None,
    mode: str = "hybrid",
) -> Dict[str, Any]:
    """
    Main chat handler. mode: hybrid | geology_only | general
    """
    wells = wells or []
    history = history or []
    source = "local"

    # General mode: skip specialized routing, go straight to LLM
    if mode == "general":
        context = build_project_context(wells, voxel_model)
        try:
            text, used = llm_service.chat(message, history, context, provider)
            return {"response": text, "source": f"llm:{used}", "mode": mode}
        except Exception as e:
            kb = match_geology_knowledge(message)
            if kb:
                return {"response": kb, "source": "geology_kb", "mode": mode}
            return {
                "response": f"LLM unavailable ({e}). Try geology_only mode or configure an API key.",
                "source": "error",
                "mode": mode,
            }

    # Hybrid / geology_only: specialized handlers first
    causal = await _handle_causal(message, wells)
    if causal:
        return {"response": causal, "source": "causal_engine", "mode": mode}

    structured = _handle_structured_data(message, wells)
    if structured:
        return {"response": structured, "source": "ai_geologist", "mode": mode}

    kb = match_geology_knowledge(message)
    if kb:
        return {"response": kb, "source": "geology_kb", "mode": mode}

    if mode == "geology_only":
        return {
            "response": (
                "I'm in **geology-only** mode. I can answer questions about your well data, "
                "causal analysis, and built-in volcanic geology topics.\n\n"
                "Try: *What are the most productive layers?*, *Explain basalt aquifers*, "
                "or *What if fracturing was more intense?*\n\n"
                "Switch to **hybrid** or **general** mode for open-ended LLM conversation."
            ),
            "source": "geology_kb",
            "mode": mode,
        }

    # Hybrid: fall through to LLM
    context = build_project_context(wells, voxel_model)
    try:
        text, used = llm_service.chat(message, history, context, provider)
        return {"response": text, "source": f"llm:{used}", "mode": mode}
    except Exception as e:
        return {
            "response": (
                f"I couldn't reach an LLM ({e}).\n\n"
                "Configure one of: OPENAI_API_KEY, ANTHROPIC_API_KEY, GOOGLE_API_KEY, "
                "or run Ollama locally. See .env.example.\n\n"
                "You can still ask about your well data or volcanic geology topics."
            ),
            "source": "fallback",
            "mode": mode,
        }
