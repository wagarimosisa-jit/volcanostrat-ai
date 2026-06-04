import re
import json
from typing import Dict, List, Optional, Tuple
from pathlib import Path
import numpy as np

# Load ontology
ONTOLOGY_PATH = Path(__file__).parent.parent / "data" / "volcanic_ontology.json"
with open(ONTOLOGY_PATH, "r") as f:
    ONTOLOGY = json.load(f)

def standardize_lithology(raw_text: str) -> Dict[str, Optional[str]]:
    """
    Standardizes raw lithology descriptions to global volcanic ontology.
    Returns: {
        'standard_lithology': str or None,
        'modifiers': List[str],
        'interbeds': List[str]
    }
    """
    raw_text = raw_text.lower().strip()

    # Step 1: Extract interbeds (e.g., "with tuff interbeds")
    interbeds = []
    for interbed_type, synonyms in ONTOLOGY['modifiers']['Interbeds'].items():
        for synonym in synonyms:
            if f" {synonym} " in f" {raw_text} " or f" {synonym} interbeds" in raw_text:
                interbeds.append(interbed_type)
                raw_text = raw_text.replace(synonym, "").replace("interbeds", "").strip()

    # Step 2: Extract modifiers (e.g., "highly fractured")
    modifiers = []
    for modifier_category, category_data in ONTOLOGY['modifiers'].items():
        if modifier_category == "Interbeds":
            continue
        for standard_mod, mod_synonyms in category_data.items():
            for synonym in mod_synonyms:
                if f" {synonym} " in f" {raw_text} ":
                    modifiers.append(standard_mod)
                    raw_text = raw_text.replace(synonym, "").strip()

    # Step 3: Match lithology
    standard_lithology = None
    for lith, data in ONTOLOGY['lithology'].items():
        for synonym in data['synonyms']:
            if synonym in raw_text:
                standard_lithology = lith
                break
        if standard_lithology:
            break

    # Step 4: Clean up and try partial matching if no match
    raw_text = re.sub(r'[^\w\s]', '', raw_text).strip()
    if not standard_lithology and raw_text:
        for lith, data in ONTOLOGY['lithology'].items():
            if any(synonym in raw_text for synonym in data['synonyms']):
                standard_lithology = lith
                break

    return {
        'standard_lithology': standard_lithology,
        'modifiers': list(set(modifiers)),  # Remove duplicates
        'interbeds': list(set(interbeds))
    }

def classify_hydro_property(standard_lithology: str, modifiers: List[str], interbeds: List[str]) -> Tuple[str, float]:
    """
    Classifies hydro property (aquifer/aquitard) and confidence score.
    Returns: (hydro_property, confidence)
    """
    if not standard_lithology:
        return "Unknown", 0.0

    # Check for aquitard indicators
    aquitard_modifiers = ["Massive", "Welded", "Dense", "Fresh"]
    aquitard_lithologies = ["Clay", "Tuff"]
    if any(mod in modifiers for mod in aquitard_modifiers) or standard_lithology in aquitard_lithologies:
        return "Aquitard", 0.95

    # Check for aquifer indicators
    aquifer_modifiers = ["Highly fractured", "Highly weathered", "Vesicular", "Unwelded"]
    aquifer_lithologies = ["Basalt", "Ignimbrite", "Alluvium"]
    if any(mod in modifiers for mod in aquifer_modifiers) or standard_lithology in aquifer_lithologies:
        productivity = "High" if any(mod in modifiers for mod in ["Highly fractured", "Highly weathered"]) else "Moderate"
        return f"Aquifer ({productivity} Productivity)", 0.95

    # Default to low productivity aquifer
    return "Aquifer (Low Productivity)", 0.80

def prepare_well_data(
    well_id: str,
    depth_intervals: List[Dict],
    x_coord: float,
    y_coord: float,
    elevation: float
) -> Dict:
    """
    Processes well data and returns standardized layers with modifiers.
    """
    layers = []
    for i, interval in enumerate(depth_intervals, 1):
        std = standardize_lithology(interval['raw_lithology'])
        hydro_property, confidence = classify_hydro_property(
            std['standard_lithology'],
            std['modifiers'],
            std['interbeds']
        )

        layer = {
            "Layer_Number": i,
            "Depth_Start": interval['depth_start'],
            "Depth_End": interval['depth_end'],
            "Thickness": interval['depth_end'] - interval['depth_start'],
            "Modifiers": std['modifiers'],
            "Interbeds": std['interbeds'] if std['interbeds'] else None,
            "Hydro_Property": hydro_property,
            "Confidence": round(confidence, 2)
        }
        layers.append(layer)

    return {
        "Well_ID": well_id,
        "Coordinates": {
            "X": float(x_coord),
            "Y": float(y_coord),
            "Elevation": float(elevation),
            "Datum": "WGS84"
        },
        "Layers": layers
    }
