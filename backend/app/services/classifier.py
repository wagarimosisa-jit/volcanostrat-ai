from typing import Dict, List, Optional
import numpy as np

ONTOLOGY = {
    "Basalt": {"Highly fractured": 139.0, "Moderately fractured": 45.0, "Slightly fractured": 5.2, "Massive": 0.25},
    "Ignimbrite": {"Highly fractured": 120.0, "Moderately fractured": 30.0, "Massive": 0.5, "Welded": 0.1},
    "Tuff": {"Welded": 0.1, "Unwelded": 10.0},
    "Clay": 0.01,
    "Alluvium": 50.0
}

def predict_hydraulic_properties(layer: Dict) -> Dict:
    """
    Predicts T (transmissivity) based on lithology and modifiers.
    Uses empirical relationships from global studies.
    """
    lithology = layer.get('standard_lithology', '')
    modifiers = layer.get('modifiers', [])

    # Empirical T values from global studies (m²/day)
    base_t_values = {
        "Basalt": {
            "Highly fractured": 139.0,
            "Moderately fractured": 45.0,
            "Slightly fractured": 5.2,
            "Massive": 0.25
        },
        "Ignimbrite": {
            "Highly fractured": 120.0,
            "Moderately fractured": 30.0,
            "Massive": 0.5,
            "Welded": 0.1
        },
        "Tuff": {
            "Welded": 0.1,
            "Unwelded": 10.0
        },
        "Clay": 0.01,
        "Alluvium": 50.0
    }

    # Get base T
    t_value = None
    if lithology in base_t_values:
        for mod in modifiers:
            if mod in base_t_values[lithology]:
                t_value = base_t_values[lithology][mod]
                break
        if t_value is None:
            t_value = np.mean(list(base_t_values[lithology].values()))

    if t_value is None:
        t_value = 10.0  # Default

    # Add uncertainty
    uncertainty = 0.2 * t_value  # ±20%
    t_min = max(0.01, t_value - uncertainty)
    t_max = t_value + uncertainty

    return {
        "Predicted_T": round(t_value, 1),
        "T_Range": f"{round(t_min, 1)}-{round(t_max, 1)} m²/day",
        "Confidence": 0.85
    }
