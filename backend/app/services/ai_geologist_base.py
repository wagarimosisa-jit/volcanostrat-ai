"""
Base AI Geologist Service for VolcanoStrat AI
Core functionality for geological analysis and recommendations
"""

import re
import json
from typing import Dict, List, Optional
from datetime import datetime
import numpy as np


class AIGeologistBase:
    """Base AI Geologist with core analysis capabilities."""
    
    VOLCANIC_KNOWLEDGE_BASE = {
        "basalt": {
            "description": "Mafic extrusive volcanic rock",
            "productivity": "High when fractured",
            "global_examples": ["Iceland", "Columbia River Basalt", "Hawaii"]
        },
        "andesite": {
            "description": "Intermediate extrusive volcanic rock",
            "productivity": "Moderate to High",
            "global_examples": ["Andes Mountains", "Cascade Range"]
        },
        "rhyolite": {
            "description": "Felsic extrusive volcanic rock",
            "productivity": "Low unless highly fractured",
            "global_examples": ["Yellowstone", "Taupo Volcanic Zone"]
        }
    }
    
    def __init__(self):
        self.feedback_log = []
    
    def analyze_productive_layers(self, wells: List[Dict]) -> Dict:
        """Identify and analyze the most productive layers."""
        if not wells:
            return {"error": "No well data provided"}
        
        productive_layers = []
        for well in wells:
            for layer in well.get('Layers', []):
                if 'Aquifer' in layer.get('Hydro_Property', ''):
                    productive_layers.append({
                        **layer,
                        'Well_ID': well.get('Well_ID'),
                        'Coordinates': well.get('Coordinates', {})
                    })
        
        # Sort by productivity (High > Moderate > Low)
        productive_layers.sort(key=lambda x: {
            'High': 3, 'Moderate': 2, 'Low': 1
        }.get(x.get('Hydro_Property', ''), 0), reverse=True)
        
        return {
            'total_productive': len(productive_layers),
            'layers': productive_layers[:5],  # Top 5
            'all_layers': productive_layers
        }
    
    def analyze_layer_details(self, layer_number: int, wells: List[Dict]) -> Dict:
        """Get detailed information about a specific layer."""
        layer_details = []
        for well in wells:
            for layer in well.get('Layers', []):
                if layer.get('Layer_Number') == layer_number:
                    layer_details.append({
                        'Well_ID': well.get('Well_ID'),
                        'Coordinates': well.get('Coordinates', {}),
                        **layer
                    })
        
        return {
            'layer_number': layer_number,
            'count': len(layer_details),
            'details': layer_details
        }
    
    def aquifer_summary(self, wells: List[Dict]) -> Dict:
        """Generate summary of aquifers and aquitards."""
        aquifers = 0
        aquitards = 0
        productivity = {}
        
        for well in wells:
            for layer in well.get('Layers', []):
                hydro_prop = layer.get('Hydro_Property', 'Unknown')
                if 'Aquifer' in hydro_prop:
                    aquifers += 1
                    prod_level = 'High' if 'High' in hydro_prop else 'Moderate' if 'Moderate' in hydro_prop else 'Low'
                    productivity[prod_level] = productivity.get(prod_level, 0) + 1
                elif 'Aquitard' in hydro_prop:
                    aquitards += 1
        
        total = aquifers + aquitards
        return {
            'aquifers': aquifers,
            'aquitards': aquitards,
            'total': total,
            'aquifer_percentage': (aquifers / total * 100) if total > 0 else 0,
            'productivity_breakdown': productivity
        }
    
    def complexity_metrics(self, wells: List[Dict]) -> Dict:
        """Calculate complexity reduction metrics."""
        total_original = sum(len(w.get('Layers', [])) for w in wells)
        unique_units = set()
        
        for well in wells:
            for layer in well.get('Layers', []):
                key = (
                    tuple(sorted(layer.get('Modifiers', []))),
                    layer.get('Hydro_Property', 'Unknown')
                )
                unique_units.add(key)
        
        complexity_reduction = ((total_original - len(unique_units)) / total_original * 100) if total_original > 0 else 0
        
        return {
            'total_original_layers': total_original,
            'unique_standardized_units': len(unique_units),
            'complexity_reduction_index': round(complexity_reduction, 1)
        }
    
    def uncertainty_analysis(self, wells: List[Dict]) -> Dict:
        """Analyze uncertainty in the data."""
        confidences = []
        for well in wells:
            for layer in well.get('Layers', []):
                conf = layer.get('Confidence', 0.5)
                confidences.append(conf)
        
        if not confidences:
            return {'average_confidence': 0.5, 'uncertainty_level': 'Moderate'}
        
        avg_conf = np.mean(confidences)
        std_conf = np.std(confidences)
        
        if avg_conf > 0.85:
            uncertainty = 'Low'
        elif avg_conf > 0.7:
            uncertainty = 'Moderate'
        elif avg_conf > 0.5:
            uncertainty = 'High'
        else:
            uncertainty = 'Very High'
        
        return {
            'average_confidence': round(avg_conf, 3),
            'confidence_std': round(std_conf, 4),
            'uncertainty_level': uncertainty
        }
    
    def discover_aquifers(self, wells: List[Dict]) -> Dict:
        """Identify the best aquifer targets."""
        aquifer_layers = []
        
        for well in wells:
            for layer in well.get('Layers', []):
                if 'Aquifer' in layer.get('Hydro_Property', ''):
                    aquifer_layers.append({
                        'Well_ID': well.get('Well_ID'),
                        'Depth_Start': layer.get('Depth_Start'),
                        'Depth_End': layer.get('Depth_End'),
                        'Thickness': layer.get('Thickness'),
                        'Hydro_Property': layer.get('Hydro_Property'),
                        'Confidence': layer.get('Confidence', 0.5),
                        'Predicted_T': layer.get('Predicted_T', 0),
                        'Modifiers': layer.get('Modifiers', [])
                    })
        
        # Sort by predicted T (transmissivity)
        aquifer_layers.sort(key=lambda x: x.get('Predicted_T', 0), reverse=True)
        
        return {
            'total_aquifers': len(aquifer_layers),
            'top_targets': aquifer_layers[:5],
            'all_targets': aquifer_layers
        }
    
    def generate_correlation_explanation(self, wells: List[Dict]) -> Dict:
        """Generate explainable correlation analysis."""
        if len(wells) < 2:
            return {'error': 'Need at least 2 wells for correlation'}
        
        # Find most common layer type
        layer_type_counts = {}
        for well in wells:
            for layer in well.get('Layers', []):
                key = (tuple(sorted(layer.get('Modifiers', []))), layer.get('Hydro_Property', ''))
                if key not in layer_type_counts:
                    layer_type_counts[key] = {'wells': set(), 'count': 0}
                layer_type_counts[key]['wells'].add(well.get('Well_ID'))
                layer_type_counts[key]['count'] += 1
        
        # Find most widespread
        most_common = max(layer_type_counts.items(), key=lambda x: len(x[1]['wells']))
        key, data = most_common
        
        confidence = min(0.95, 0.7 + (len(data['wells']) / len(wells)) * 0.25)
        
        return {
            'correlated_unit': key,
            'wells_involved': len(data['wells']),
            'layer_count': data['count'],
            'confidence': round(confidence, 2),
            'evidence': [
                f"{len(data['wells'])} wells contain this layer type",
                f"Lithological similarity across {len(data['wells'])} wells",
                "Consistent hydraulic properties"
            ]
        }


# Singleton
ai_geologist_base = AIGeologistBase()
