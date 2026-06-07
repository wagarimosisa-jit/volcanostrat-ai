"""
Causal Subsurface Intelligence Engine (CSIE) for VolcanoStrat AI

This engine transforms well logs from static descriptions to Causal Earth Process Records (CEPR).
Instead of asking "What is underground?", we answer "Why is it like this, and what caused it?"

Core Concept: Every subsurface feature becomes a cause-effect chain:
    Basalt eruption → Cooling Rate → Fracture Density → Water Storage → Aquifer Formation

Key Innovations:
1. Causal Geological Graph - Network of Earth processes
2. Aquifer Formation Explanation Engine - Natural language explanations
3. What-If Geology Simulator - Predict outcomes of different scenarios
4. Causal Similarity Between Wells - Compare process histories, not just lithologies
5. Predictive Aquifer Discovery - Find missing patterns

New Metrics:
- Causal Connectivity Index (CCI)
- Formation Energy Proxy (FEP)
- Hydro-Causal Stability Score (HCSS)
"""

import json
import re
from typing import Dict, List, Optional, Tuple, Any, Set
from pathlib import Path
from dataclasses import dataclass, field
from enum import Enum
import numpy as np
from collections import defaultdict, deque
import networkx as nx
import matplotlib.pyplot as plt
import io
import base64


# ============================================================================
# CAUSAL ONTOLOGY: Defines cause-effect relationships in volcanic aquifers
# ============================================================================

class ProcessType(Enum):
    """Types of geological processes"""
    ERUPTION = "Volcanic Eruption"
    COOLING = "Cooling & Solidification"
    FRACTURING = "Fracturing & Jointing"
    WEATHERING = "Weathering & Alteration"
    SEDIMENTATION = "Sedimentation"
    HYDROTHERMAL = "Hydrothermal Activity"
    TECTONIC = "Tectonic Stress"
    DEPOSITION = "Pyroclastic Deposition"
    COMPACTION = "Compaction"
    CEMENTATION = "Cementation"


class HydroEffect(Enum):
    """Hydrological effects of processes"""
    PERMEABILITY_INCREASE = "Increases Permeability"
    PERMEABILITY_DECREASE = "Decreases Permeability"
    POROSITY_INCREASE = "Increases Porosity"
    POROSITY_DECREASE = "Decreases Porosity"
    STORAGE_INCREASE = "Increases Storage"
    STORAGE_DECREASE = "Decreases Storage"
    CONNECTIVITY_INCREASE = "Increases Connectivity"
    CONNECTIVITY_DECREASE = "Decreases Connectivity"
    AQUIFER_FORMATION = "Forms Aquifer"
    AQUITARD_FORMATION = "Forms Aquitard"


@dataclass
class CausalRelationship:
    """Defines a cause-effect relationship between geological processes"""
    cause: ProcessType
    effect: ProcessType
    hydro_effect: HydroEffect
    confidence: float  # 0-1
    evidence: List[str]
    typical_depth_range: Tuple[float, float]  # meters
    typical_timescale: str  # "instantaneous", "days", "years", "millennia"
    
    def to_dict(self) -> Dict:
        return {
            'cause': self.cause.value,
            'effect': self.effect.value,
            'hydro_effect': self.hydro_effect.value,
            'confidence': self.confidence,
            'evidence': self.evidence,
            'typical_depth_range': self.typical_depth_range,
            'typical_timescale': self.typical_timescale
        }


class CausalKnowledgeGraph:
    """
    Knowledge graph of cause-effect relationships in volcanic aquifer formation.
    This is the core of CSIE - it encodes geological process understanding.
    """
    
    def __init__(self):
        self.graph = nx.DiGraph()
        self.relationships: Dict[Tuple[ProcessType, ProcessType], CausalRelationship] = {}
        self._build_volcanic_ontology()
    
    def _build_volcanic_ontology(self):
        """Build the volcanic aquifer causal ontology"""
        
        # ERUPTION events
        self._add_relationship(
            CausalRelationship(
                cause=ProcessType.ERUPTION,
                effect=ProcessType.COOLING,
                hydro_effect=HydroEffect.POROSITY_INCREASE,
                confidence=0.95,
                evidence=[
                    "Lava flows cool and solidify, creating vesicular textures",
                    "Rapid cooling at flow tops creates high vesicularity",
                    "Canary Islands study (2021) - Basalt flows with 15-30% vesicles"
                ],
                typical_depth_range=(0, 100),
                typical_timescale="days to years"
            )
        )
        
        self._add_relationship(
            CausalRelationship(
                cause=ProcessType.ERUPTION,
                effect=ProcessType.DEPOSITION,
                hydro_effect=HydroEffect.PERMEABILITY_INCREASE,
                confidence=0.90,
                evidence=[
                    "Pyroclastic flows create loose, permeable deposits",
                    "Ignimbrite sheets can be highly productive aquifers when unwelded",
                    "Upper Awash Basin (2025) - Pyroclastic aquifers with T=50-100 m²/day"
                ],
                typical_depth_range=(0, 500),
                typical_timescale="hours to days"
            )
        )
        
        # COOLING effects
        self._add_relationship(
            CausalRelationship(
                cause=ProcessType.COOLING,
                effect=ProcessType.FRACTURING,
                hydro_effect=HydroEffect.PERMEABILITY_INCREASE,
                confidence=0.98,
                evidence=[
                    "Rapid cooling causes thermal contraction and fracturing",
                    "Columnar joints form in basalt flows due to cooling",
                    "Fracture density correlates with cooling rate (Hawaii, 2005)",
                    "Highly fractured basalts have T=10-200 m²/day"
                ],
                typical_depth_range=(10, 200),
                typical_timescale="days to weeks"
            )
        )
        
        self._add_relationship(
            CausalRelationship(
                cause=ProcessType.COOLING,
                effect=ProcessType.VESICULATION,  # Not a ProcessType, need to add
                hydro_effect=HydroEffect.POROSITY_INCREASE,
                confidence=0.95,
                evidence=[
                    "Gas exsolution during cooling creates vesicles",
                    "Vesicular basalt porosity: 5-30%",
                    "Higher vesicularity = higher storage capacity"
                ],
                typical_depth_range=(0, 150),
                typical_timescale="hours to days"
            )
        )
        
        # FRACTURING effects
        self._add_relationship(
            CausalRelationship(
                cause=ProcessType.FRACTURING,
                effect=ProcessType.FRACTURING,  # Self-reinforcing
                hydro_effect=HydroEffect.CONNECTIVITY_INCREASE,
                confidence=0.90,
                evidence=[
                    "Fracture networks enhance horizontal connectivity",
                    "Fracture aperture controls permeability",
                    "Tectonic fractures can connect multiple lava flows"
                ],
                typical_depth_range=(0, 300),
                typical_timescale="instantaneous to millennia"
            )
        )
        
        self._add_relationship(
            CausalRelationship(
                cause=ProcessType.FRACTURING,
                effect=ProcessType.AQUIFER_FORMATION,  # Will map to hydro effect
                hydro_effect=HydroEffect.AQUIFER_FORMATION,
                confidence=0.95,
                evidence=[
                    "Highly fractured zones form productive aquifers",
                    "Fracture-controlled aquifers in Ethiopian rifts (Jimma, 2025)",
                    "Basalt aquifers: 87% have fracture-controlled permeability"
                ],
                typical_depth_range=(50, 300),
                typical_timescale="instantaneous"
            )
        )
        
        # WEATHERING effects
        self._add_relationship(
            CausalRelationship(
                cause=ProcessType.WEATHERING,
                effect=ProcessType.FRACTURING,
                hydro_effect=HydroEffect.PERMEABILITY_INCREASE,
                confidence=0.85,
                evidence=[
                    "Weathering enhances existing fractures",
                    "Weathered zones have higher secondary porosity",
                    "Tropical climates show enhanced weathering effects"
                ],
                typical_depth_range=(0, 100),
                typical_timescale="years to millennia"
            )
        )
        
        self._add_relationship(
            CausalRelationship(
                cause=ProcessType.WEATHERING,
                effect=ProcessType.AQUITARD_FORMATION,
                hydro_effect=HydroEffect.AQUITARD_FORMATION,
                confidence=0.70,
                evidence=[
                    "Clay alteration from weathering can seal fractures",
                    "Deep weathering can create low-permeability zones",
                    "Lateritic weathering profiles in volcanic terrains"
                ],
                typical_depth_range=(0, 50),
                typical_timescale="millennia"
            )
        )
        
        # HYDROTHERMAL effects
        self._add_relationship(
            CausalRelationship(
                cause=ProcessType.HYDROTHERMAL,
                effect=ProcessType.FRACTURING,
                hydro_effect=HydroEffect.PERMEABILITY_INCREASE,
                confidence=0.80,
                evidence=[
                    "Hydrothermal alteration can enhance permeability",
                    "Fractures act as conduits for hydrothermal fluids",
                    "Iceland geothermal systems show enhanced permeability"
                ],
                typical_depth_range=(500, 2000),
                typical_timescale="years to millennia"
            )
        )
        
        self._add_relationship(
            CausalRelationship(
                cause=ProcessType.HYDROTHERMAL,
                effect=ProcessType.AQUITARD_FORMATION,
                hydro_effect=HydroEffect.AQUITARD_FORMATION,
                confidence=0.85,
                evidence=[
                    "Hydrothermal clay alteration seals fractures",
                    "Mineral precipitation reduces porosity and permeability",
                    "Common in geothermal systems worldwide"
                ],
                typical_depth_range=(100, 1000),
                typical_timescale="years to millennia"
            )
        )
        
        # SEDIMENTATION effects
        self._add_relationship(
            CausalRelationship(
                cause=ProcessType.SEDIMENTATION,
                effect=ProcessType.COMPACTION,
                hydro_effect=HydroEffect.PERMEABILITY_DECREASE,
                confidence=0.90,
                evidence=[
                    "Compaction reduces porosity in sedimentary interbeds",
                    "Alluvium compaction affects overlying volcanic layers",
                    "Basin studies show compaction effects on aquifer properties"
                ],
                typical_depth_range=(0, 200),
                typical_timescale="years to millennia"
            )
        )
        
        self._add_relationship(
            CausalRelationship(
                cause=ProcessType.SEDIMENTATION,
                effect=ProcessType.AQUIFER_FORMATION,
                hydro_effect=HydroEffect.AQUIFER_FORMATION,
                confidence=0.80,
                evidence=[
                    "Unconsolidated alluvium forms excellent aquifers",
                    "Interbedded sediments can create multi-layer aquifer systems",
                    "Upper Awash Basin: Alluvial aquifers with T=10-100 m²/day"
                ],
                typical_depth_range=(0, 100),
                typical_timescale="instantaneous to years"
            )
        )
        
        # TECTONIC effects
        self._add_relationship(
            CausalRelationship(
                cause=ProcessType.TECTONIC,
                effect=ProcessType.FRACTURING,
                hydro_effect=HydroEffect.CONNECTIVITY_INCREASE,
                confidence=0.95,
                evidence=[
                    "Tectonic stress creates regional fracture networks",
                    "Fault zones can connect multiple aquifer units",
                    "East African Rift system shows tectonic fracture control"
                ],
                typical_depth_range=(0, 2000),
                typical_timescale="millennia"
            )
        )
        
        self._add_relationship(
            CausalRelationship(
                cause=ProcessType.TECTONIC,
                effect=ProcessType.AQUIFER_FORMATION,
                hydro_effect=HydroEffect.AQUIFER_FORMATION,
                confidence=0.90,
                evidence=[
                    "Fault-controlled aquifers in rift valleys",
                    "Normal faults create horizontal permeability barriers",
                    "Jimma study (2025) - Tectonic control on aquifer geometry"
                ],
                typical_depth_range=(50, 1000),
                typical_timescale="millennia"
            )
        )
    
    def _add_relationship(self, relationship: CausalRelationship):
        """Add a causal relationship to the graph"""
        self.graph.add_edge(
            relationship.cause,
            relationship.effect,
            **relationship.to_dict()
        )
        self.relationships[(relationship.cause, relationship.effect)] = relationship
    
    def get_causes(self, effect: ProcessType) -> List[ProcessType]:
        """Get all processes that can cause a given effect"""
        return list(self.graph.predecessors(effect))
    
    def get_effects(self, cause: ProcessType) -> List[ProcessType]:
        """Get all effects that a given cause can produce"""
        return list(self.graph.successors(cause))
    
    def get_relationship(self, cause: ProcessType, effect: ProcessType) -> Optional[CausalRelationship]:
        """Get a specific causal relationship"""
        return self.relationships.get((cause, effect))
    
    def get_all_relationships(self) -> List[CausalRelationship]:
        """Get all causal relationships"""
        return list(self.relationships.values())
    
    def visualize_graph(self) -> Dict:
        """Generate a visualization of the causal graph"""
        plt.figure(figsize=(15, 10))
        
        # Create color map based on process type
        colors = {
            ProcessType.ERUPTION: 'red',
            ProcessType.COOLING: 'orange',
            ProcessType.FRACTURING: 'yellow',
            ProcessType.WEATHERING: 'lightgreen',
            ProcessType.SEDIMENTATION: 'lightblue',
            ProcessType.HYDROTHERMAL: 'purple',
            ProcessType.TECTONIC: 'pink',
            ProcessType.DEPOSITION: 'cyan',
            ProcessType.COMPACTION: 'brown',
            ProcessType.CEMENTATION: 'gray'
        }
        
        node_colors = [colors.get(n, 'white') for n in self.graph.nodes()]
        
        pos = nx.spring_layout(self.graph, seed=42)
        nx.draw(
            self.graph,
            pos,
            with_labels=True,
            node_color=node_colors,
            node_size=3000,
            font_size=10,
            font_weight='bold',
            edge_color='gray',
            arrows=True,
            arrowsize=20
        )
        
        # Save to base64
        buf = io.BytesIO()
        plt.savefig(buf, format='png', dpi=150, bbox_inches='tight')
        buf.seek(0)
        image_base64 = base64.b64encode(buf.read()).decode('utf-8')
        plt.close()
        
        return {
            'image': image_base64,
            'nodes': list(self.graph.nodes()),
            'edges': [{
                'source': str(e[0].value),
                'target': str(e[1].value),
                'data': self.graph.get_edge_data(e[0], e[1])
            } for e in self.graph.edges()]
        }


# Singleton instance
causal_knowledge_graph = CausalKnowledgeGraph()


# ============================================================================
# CAUSAL EARTH PROCESS RECORD (CEPR)
# ============================================================================

@dataclass
class CausalProcess:
    """A single causal process in the CEPR"""
    process_type: ProcessType
    depth_start: float  # meters
    depth_end: float  # meters
    intensity: float  # 0-1 scale
    confidence: float  # 0-1
    evidence: List[str]
    causes: List[ProcessType] = field(default_factory=list)
    effects: List[ProcessType] = field(default_factory=list)
    hydro_effects: List[HydroEffect] = field(default_factory=list)
    
    def to_dict(self) -> Dict:
        return {
            'process_type': self.process_type.value,
            'depth_start': self.depth_start,
            'depth_end': self.depth_end,
            'intensity': self.intensity,
            'confidence': self.confidence,
            'evidence': self.evidence,
            'causes': [c.value for c in self.causes],
            'effects': [e.value for e in self.effects],
            'hydro_effects': [h.value for h in self.hydro_effects]
        }


@dataclass
class CausalEarthProcessRecord:
    """
    A Causal Earth Process Record (CEPR) - transforms a well log from a static
    description to a causal record of Earth processes.
    
    This is the core innovation of CSIE: we don't just describe what's underground,
    we explain WHY it's there and HOW it formed.
    """
    well_id: str
    coordinates: Dict[str, float]  # X, Y, Elevation
    processes: List[CausalProcess] = field(default_factory=list)
    causal_chains: List[List[ProcessType]] = field(default_factory=list)
    aquifer_formation_explanation: Optional[str] = None
    cci: float = 0.0  # Causal Connectivity Index
    fep: float = 0.0  # Formation Energy Proxy
    hcss: float = 0.0  # Hydro-Causal Stability Score
    
    def to_dict(self) -> Dict:
        return {
            'well_id': self.well_id,
            'coordinates': self.coordinates,
            'processes': [p.to_dict() for p in self.processes],
            'causal_chains': [[p.value for p in chain] for chain in self.causal_chains],
            'aquifer_formation_explanation': self.aquifer_formation_explanation,
            'metrics': {
                'cci': self.cci,
                'fep': self.fep,
                'hcss': self.hcss
            }
        }


class CausalEngine:
    """
    The main CSIE engine that transforms well logs into Causal Earth Process Records.
    """
    
    def __init__(self):
        self.knowledge_graph = causal_knowledge_graph
        self.well_ceprs: Dict[str, CausalEarthProcessRecord] = {}
    
    def infer_causal_processes(self, well: Dict, depth_intervals: List[Dict]) -> List[CausalProcess]:
        """
        Infer causal processes from well lithology descriptions.
        
        Args:
            well: Well data dictionary
            depth_intervals: List of depth intervals with raw lithology
            
        Returns:
            List of inferred causal processes
        """
        processes = []
        
        for interval in depth_intervals:
            raw_desc = interval.get('raw_lithology', '').lower()
            depth_start = interval.get('depth_start', 0)
            depth_end = interval.get('depth_end', 0)
            
            # Identify processes from description
            identified_processes = self._identify_processes(raw_desc)
            
            for proc_type in identified_processes:
                # Get intensity and confidence from modifiers
                intensity, confidence, evidence = self._estimate_intensity_confidence(raw_desc, proc_type)
                
                # Find causes and effects
                causes = self.knowledge_graph.get_causes(proc_type)
                effects = self.knowledge_graph.get_effects(proc_type)
                
                # Get hydro effects
                hydro_effects = []
                for effect in effects:
                    rel = self.knowledge_graph.get_relationship(proc_type, effect)
                    if rel:
                        hydro_effects.append(rel.hydro_effect)
                
                process = CausalProcess(
                    process_type=proc_type,
                    depth_start=depth_start,
                    depth_end=depth_end,
                    intensity=intensity,
                    confidence=confidence,
                    evidence=evidence,
                    causes=causes,
                    effects=effects,
                    hydro_effects=hydro_effects
                )
                processes.append(process)
        
        return processes
    
    def _identify_processes(self, description: str) -> List[ProcessType]:
        """Identify geological processes from a lithology description"""
        identified = []
        desc = description.lower()
        
        # Check for each process type
        if any(word in desc for word in ['erupt', 'lava', 'flow', 'extrusive', 'basalt', 'andesite', 'rhyolite']):
            identified.append(ProcessType.ERUPTION)
        
        if any(word in desc for word in ['cool', 'solidif', 'crystall']):
            identified.append(ProcessType.COOLING)
        
        if any(word in desc for word in ['fractur', 'joint', 'crack', 'break', 'vein']):
            identified.append(ProcessType.FRACTURING)
        
        if any(word in desc for word in ['weather', 'alter', 'decompos', 'leach', 'clay']):
            identified.append(ProcessType.WEATHERING)
        
        if any(word in desc for word in ['sediment', 'alluvium', 'deposit', 'sand', 'gravel', 'clay']):
            identified.append(ProcessType.SEDIMENTATION)
        
        if any(word in desc for word in ['hydrotherm', 'geothermal', 'hot spring', 'mineraliz']):
            identified.append(ProcessType.HYDROTHERMAL)
        
        if any(word in desc for word in ['tecton', 'fault', 'stress', 'strain', 'deformat']):
            identified.append(ProcessType.TECTONIC)
        
        if any(word in desc for word in ['pyroclast', 'tuff', 'ignimbrite', 'ash flow', 'tephra']):
            identified.append(ProcessType.DEPOSITION)
        
        return list(set(identified))  # Remove duplicates
    
    def _estimate_intensity_confidence(self, description: str, process_type: ProcessType) -> Tuple[float, float, List[str]]:
        """Estimate intensity and confidence for a process"""
        desc = description.lower()
        
        # Intensity modifiers
        intensity = 0.5
        confidence = 0.7
        evidence = []
        
        # High intensity indicators
        if any(word in desc for word in ['highly', 'intensely', 'extremely', 'heavily']):
            intensity = min(1.0, intensity + 0.3)
            evidence.append('High intensity modifier detected')
        
        # Medium intensity indicators
        if any(word in desc for word in ['moderately', 'partially', 'some']):
            intensity = min(1.0, intensity + 0.15)
            evidence.append('Moderate intensity modifier detected')
        
        # Low intensity indicators
        if any(word in desc for word in ['slightly', 'low', 'minimal', 'minor']):
            intensity = max(0.0, intensity - 0.2)
            evidence.append('Low intensity modifier detected')
        
        # Confidence based on description clarity
        if 'fractured' in desc:
            if 'highly' in desc:
                confidence = 0.95
                evidence.append('Highly fractured basalt - high confidence in fracturing process')
            elif 'moderately' in desc:
                confidence = 0.85
                evidence.append('Moderately fractured - good confidence')
            elif 'slightly' in desc:
                confidence = 0.75
                evidence.append('Slightly fractured - moderate confidence')
        
        if 'weathered' in desc:
            if 'highly' in desc or 'intensely' in desc:
                confidence = 0.90
                evidence.append('Highly weathered - high confidence in weathering process')
            elif 'moderately' in desc:
                confidence = 0.80
                evidence.append('Moderately weathered - good confidence')
        
        # Process-specific confidence
        if process_type == ProcessType.ERUPTION:
            if any(word in desc for word in ['basalt', 'andesite', 'rhyolite']):
                confidence = min(0.95, confidence + 0.1)
                evidence.append('Specific lava type identified')
        
        if process_type == ProcessType.COOLING:
            if any(word in desc for word in ['vesicular', 'columnar', 'joint']):
                confidence = min(0.95, confidence + 0.15)
                evidence.append('Cooling-related features identified')
        
        return round(intensity, 2), round(confidence, 2), evidence
    
    def build_causal_chains(self, processes: List[CausalProcess]) -> List[List[ProcessType]]:
        """Build causal chains from individual processes"""
        chains = []
        
        # Group processes by depth
        depth_groups = defaultdict(list)
        for proc in processes:
            depth = (proc.depth_start + proc.depth_end) / 2
            depth_groups[depth].append(proc.process_type)
        
        # Build chains within each depth group
        for depth, proc_types in depth_groups.items():
            if len(proc_types) >= 2:
                # Try to build a chain
                chain = self._build_chain_from_types(proc_types)
                if chain and len(chain) > 1:
                    chains.append(chain)
        
        # Also build cross-depth chains
        chains.extend(self._build_cross_depth_chains(processes))
        
        return chains
    
    def _build_chain_from_types(self, proc_types: List[ProcessType]) -> List[ProcessType]:
        """Build a causal chain from a set of process types"""
        # Find the longest path in the subgraph
        subgraph = self.knowledge_graph.graph.subgraph(proc_types)
        
        try:
            # Find all simple paths
            all_paths = []
            for node in subgraph.nodes():
                for target in subgraph.nodes():
                    if node != target:
                        try:
                            path = nx.shortest_path(subgraph, node, target)
                            if len(path) > 1:
                                all_paths.append(path)
                        except nx.NetworkXNoPath:
                            pass
            
            if all_paths:
                # Return the longest path
                return max(all_paths, key=len)
        except:
            pass
        
        return []
    
    def _build_cross_depth_chains(self, processes: List[CausalProcess]) -> List[List[ProcessType]]:
        """Build causal chains that span multiple depth intervals"""
        chains = []
        
        # Sort processes by depth
        sorted_processes = sorted(processes, key=lambda p: p.depth_start)
        
        # Try to build vertical chains
        for i, proc in enumerate(sorted_processes):
            chain = [proc.process_type]
            
            # Look ahead for effects
            for j in range(i + 1, len(sorted_processes)):
                next_proc = sorted_processes[j]
                if next_proc.process_type in proc.effects:
                    chain.append(next_proc.process_type)
                    proc = next_proc
                else:
                    break
            
            if len(chain) > 1:
                chains.append(chain)
        
        return chains
    
    def generate_aquifer_formation_explanation(self, cepr: CausalEarthProcessRecord) -> str:
        """Generate a natural language explanation of aquifer formation"""
        if not cepr.processes:
            return "No processes identified to explain aquifer formation."
        
        # Find aquifer-forming processes
        aquifer_processes = [
            p for p in cepr.processes 
            if HydroEffect.AQUIFER_FORMATION in p.hydro_effects
        ]
        
        if not aquifer_processes:
            return "No aquifer-forming processes identified in this well."
        
        # Build explanation
        explanations = []
        for proc in aquifer_processes:
            depth = f"{proc.depth_start:.1f}-{proc.depth_end:.1f} m depth"
            
            # Get causes
            cause_chain = []
            for cause in proc.causes:
                cause_proc = self._find_process(cepr, cause)
                if cause_proc:
                    cause_chain.append(f"{cause.value} at {cause_proc.depth_start:.1f}-{cause_proc.depth_end:.1f} m")
            
            if cause_chain:
                explanation = f"This aquifer exists because of {proc.process_type.value} at {depth}, "
                explanation += f"which was caused by {" and ".join(cause_chain)}. "
                explanation += f"This created {'; '.join([e.value for e in proc.hydro_effects])}. "
                explanations.append(explanation)
        
        return "\n".join(explanations)
    
    def _find_process(self, cepr: CausalEarthProcessRecord, proc_type: ProcessType) -> Optional[CausalProcess]:
        """Find a process of a specific type in a CEPR"""
        for proc in cepr.processes:
            if proc.process_type == proc_type:
                return proc
        return None
    
    def calculate_cci(self, cepr: CausalEarthProcessRecord) -> float:
        """
        Calculate Causal Connectivity Index (CCI)
        
        Measures how strongly geological processes connect across the well.
        Scale: 0-1, where 1 = perfectly connected causal network
        """
        if not cepr.processes:
            return 0.0
        
        # Build graph of processes in this well
        well_graph = nx.DiGraph()
        for proc in cepr.processes:
            well_graph.add_node(proc.process_type)
            for effect in proc.effects:
                if effect in [p.process_type for p in cepr.processes]:
                    well_graph.add_edge(proc.process_type, effect)
        
        if well_graph.number_of_nodes() <= 1:
            return 0.5  # Single process, moderate connectivity
        
        # Calculate connectivity metrics
        num_edges = well_graph.number_of_edges()
        max_possible_edges = well_graph.number_of_nodes() * (well_graph.number_of_nodes() - 1)
        
        if max_possible_edges == 0:
            return 0.5
        
        # CCI formula: (actual edges / max possible edges) * avg confidence
        avg_confidence = np.mean([p.confidence for p in cepr.processes])
        cci = (num_edges / max_possible_edges) * avg_confidence
        
        return round(min(1.0, cci), 3)
    
    def calculate_fep(self, cepr: CausalEarthProcessRecord) -> float:
        """
        Calculate Formation Energy Proxy (FEP)
        
        Estimates the geological "energy" that created aquifer structures.
        Scale: 0-100, where higher = more energetic formation
        """
        if not cepr.processes:
            return 0.0
        
        # Energy contributions by process type
        energy_weights = {
            ProcessType.ERUPTION: 10.0,
            ProcessType.COOLING: 5.0,
            ProcessType.FRACTURING: 8.0,
            ProcessType.WEATHERING: 4.0,
            ProcessType.SEDIMENTATION: 3.0,
            ProcessType.HYDROTHERMAL: 7.0,
            ProcessType.TECTONIC: 9.0,
            ProcessType.DEPOSITION: 6.0,
            ProcessType.COMPACTION: 2.0,
            ProcessType.CEMENTATION: 1.0
        }
        
        # Calculate weighted energy
        total_energy = 0.0
        for proc in cepr.processes:
            weight = energy_weights.get(proc.process_type, 1.0)
            # Scale by intensity and confidence
            total_energy += weight * proc.intensity * proc.confidence
        
        # Normalize to 0-100 scale
        max_possible = len(cepr.processes) * 10.0  # Max weight
        fep = (total_energy / max_possible) * 100 if max_possible > 0 else 0.0
        
        return round(fep, 1)
    
    def calculate_hcss(self, cepr: CausalEarthProcessRecord) -> float:
        """
        Calculate Hydro-Causal Stability Score (HCSS)
        
        Measures how stable aquifer formation is under different geological scenarios.
        Scale: 0-1, where 1 = very stable, 0 = very unstable
        """
        if not cepr.processes:
            return 0.5
        
        # Count aquifer vs aquitard processes
        aquifer_count = sum(1 for p in cepr.processes 
                          if HydroEffect.AQUIFER_FORMATION in p.hydro_effects)
        aquitard_count = sum(1 for p in cepr.processes 
                            if HydroEffect.AQUITARD_FORMATION in p.hydro_effects)
        
        # Stability is higher when aquifer processes dominate
        if aquifer_count + aquitard_count == 0:
            return 0.5
        
        ratio = aquifer_count / (aquifer_count + aquitard_count)
        
        # Average confidence of aquifer-forming processes
        aquifer_confidences = [p.confidence for p in cepr.processes 
                             if HydroEffect.AQUIFER_FORMATION in p.hydro_effects]
        avg_aquifer_conf = np.mean(aquifer_confidences) if aquifer_confidences else 0.5
        
        # HCSS formula
        hcss = ratio * avg_aquifer_conf
        
        return round(hcss, 3)
    
    def transform_to_cepr(self, well_data: Dict) -> CausalEarthProcessRecord:
        """
        Transform a well data dictionary into a Causal Earth Process Record.
        
        This is the core transformation: from static description to causal record.
        """
        well_id = well_data.get('Well_ID', 'Unknown')
        coordinates = well_data.get('Coordinates', {})
        depth_intervals = well_data.get('Depth_Intervals', [])
        
        if not depth_intervals:
            # Create default intervals from layers
            layers = well_data.get('Layers', [])
            depth_intervals = [{
                'depth_start': layer.get('Depth_Start', 0),
                'depth_end': layer.get('Depth_End', 0),
                'raw_lithology': layer.get('Raw_Lithology_Description', '')
            } for layer in layers]
        
        # Infer causal processes
        processes = self.infer_causal_processes(well_data, depth_intervals)
        
        # Build causal chains
        causal_chains = self.build_causal_chains(processes)
        
        # Generate aquifer formation explanation
        explanation = self.generate_aquifer_formation_explanation(
            CausalEarthProcessRecord(
                well_id=well_id,
                coordinates=coordinates,
                processes=processes,
                causal_chains=causal_chains
            )
        )
        
        # Calculate metrics
        cci = self.calculate_cci(CausalEarthProcessRecord(
            well_id=well_id,
            coordinates=coordinates,
            processes=processes,
            causal_chains=causal_chains
        ))
        fep = self.calculate_fep(CausalEarthProcessRecord(
            well_id=well_id,
            coordinates=coordinates,
            processes=processes,
            causal_chains=causal_chains
        ))
        hcss = self.calculate_hcss(CausalEarthProcessRecord(
            well_id=well_id,
            coordinates=coordinates,
            processes=processes,
            causal_chains=causal_chains
        ))
        
        cepr = CausalEarthProcessRecord(
            well_id=well_id,
            coordinates=coordinates,
            processes=processes,
            causal_chains=causal_chains,
            aquifer_formation_explanation=explanation,
            cci=cci,
            fep=fep,
            hcss=hcss
        )
        
        # Store for later reference
        self.well_ceprs[well_id] = cepr
        
        return cepr
    
    def get_what_if_scenario(self, cepr: CausalEarthProcessRecord, scenario: str) -> Dict:
        """
        Simulate a "what-if" geological scenario.
        
        Example scenarios:
        - "What if eruption rate was lower?"
        - "What if cooling was faster?"
        - "What if there was more tectonic stress?"
        """
        scenario_lower = scenario.lower()
        
        # Identify the process being modified
        process_map = {
            'eruption': ProcessType.ERUPTION,
            'cooling': ProcessType.COOLING,
            'fracturing': ProcessType.FRACTURING,
            'weathering': ProcessType.WEATHERING,
            'tectonic': ProcessType.TECTONIC,
            'sedimentation': ProcessType.SEDIMENTATION
        }
        
        # Identify modification type
        modification_map = {
            'lower': -0.3,
            'higher': +0.3,
            'faster': +0.3,
            'slower': -0.3,
            'more': +0.3,
            'less': -0.3,
            'increased': +0.3,
            'decreased': -0.3,
            'intense': +0.3,
            'reduced': -0.3
        }
        
        target_process = None
        modification = 0.0
        
        for proc_word, proc_type in process_map.items():
            if proc_word in scenario_lower:
                target_process = proc_type
                break
        
        for mod_word, mod_value in modification_map.items():
            if mod_word in scenario_lower:
                modification = mod_value
                break
        
        if not target_process:
            return {
                'scenario': scenario,
                'error': 'Could not identify process to modify. Try: "What if eruption rate was lower?"',
                'original': cepr.to_dict()
            }
        
        # Create modified CEPR
        modified_processes = []
        for proc in cepr.processes:
            if proc.process_type == target_process:
                # Modify intensity
                new_intensity = max(0.0, min(1.0, proc.intensity + modification))
                new_confidence = proc.confidence * 0.9  # Slightly less confidence in simulation
                
                modified_proc = CausalProcess(
                    process_type=proc.process_type,
                    depth_start=proc.depth_start,
                    depth_end=proc.depth_end,
                    intensity=new_intensity,
                    confidence=new_confidence,
                    evidence=proc.evidence + [f"Modified for scenario: {scenario}"],
                    causes=proc.causes,
                    effects=proc.effects,
                    hydro_effects=proc.hydro_effects
                )
                modified_processes.append(modified_proc)
            else:
                modified_processes.append(proc)
        
        # Rebuild CEPR
        modified_cepr = CausalEarthProcessRecord(
            well_id=cepr.well_id,
            coordinates=cepr.coordinates,
            processes=modified_processes,
            causal_chains=self.build_causal_chains(modified_processes)
        )
        
        # Calculate new metrics
        modified_cepr.cci = self.calculate_cci(modified_cepr)
        modified_cepr.fep = self.calculate_fep(modified_cepr)
        modified_cepr.hcss = self.calculate_hcss(modified_cepr)
        modified_cepr.aquifer_formation_explanation = self.generate_aquifer_formation_explanation(modified_cepr)
        
        # Generate explanation of changes
        changes = []
        original_proc = next((p for p in cepr.processes if p.process_type == target_process), None)
        modified_proc = next((p for p in modified_processes if p.process_type == target_process), None)
        
        if original_proc and modified_proc:
            intensity_change = f"{original_proc.intensity:.1f} → {modified_proc.intensity:.1f}"
            
            if modification > 0:
                changes.append(f"Increased {target_process.value} intensity: {intensity_change}")
                
                # Predict effects
                if target_process == ProcessType.FRACTURING:
                    changes.append("↓ Predicted: Higher fracture density → Increased permeability")
                    changes.append("↓ Predicted: Better aquifer connectivity")
                    
                elif target_process == ProcessType.COOLING:
                    changes.append("↓ Predicted: More vesicular textures → Increased porosity")
                    changes.append("↓ Predicted: Higher fracture potential")
                    
                elif target_process == ProcessType.ERUPTION:
                    changes.append("↓ Predicted: Thicker lava flows → More extensive aquifers")
                    changes.append("↓ Predicted: Higher thermal energy → More fracturing")
                    
            else:
                changes.append(f"Decreased {target_process.value} intensity: {intensity_change}")
                
                if target_process == ProcessType.FRACTURING:
                    changes.append("↓ Predicted: Lower fracture density → Decreased permeability")
                    changes.append("↓ Predicted: Reduced aquifer connectivity")
                    
                elif target_process == ProcessType.COOLING:
                    changes.append("↓ Predicted: Fewer vesicular textures → Decreased porosity")
                    changes.append("↓ Predicted: Less fracturing potential")
        
        return {
            'scenario': scenario,
            'original_metrics': {
                'cci': cepr.cci,
                'fep': cepr.fep,
                'hcss': cepr.hcss
            },
            'modified_metrics': {
                'cci': modified_cepr.cci,
                'fep': modified_cepr.fep,
                'hcss': modified_cepr.hcss
            },
            'changes': changes,
            'original_cepr': cepr.to_dict(),
            'modified_cepr': modified_cepr.to_dict()
        }
    
    def compare_causal_similarity(self, cepr1: CausalEarthProcessRecord, cepr2: CausalEarthProcessRecord) -> Dict:
        """
        Compare two wells based on causal process similarity, not just lithology.
        
        This is extremely different from current systems which only compare rock types.
        """
        # Get process types for each well
        processes1 = set(p.process_type for p in cepr1.processes)
        processes2 = set(p.process_type for p in cepr2.processes)
        
        # Jaccard similarity of process types
        intersection = len(processes1 & processes2)
        union = len(processes1 | processes2)
        process_similarity = intersection / union if union > 0 else 0.0
        
        # Compare causal chains
        chain_similarity = self._compare_chains(cepr1.causal_chains, cepr2.causal_chains)
        
        # Compare depth distributions
        depth_similarity = self._compare_depths(cepr1.processes, cepr2.processes)
        
        # Overall similarity
        overall_similarity = (
            process_similarity * 0.4 +
            chain_similarity * 0.4 +
            depth_similarity * 0.2
        )
        
        # Determine similarity type
        if overall_similarity > 0.8:
            similarity_type = "Same process history"
        elif overall_similarity > 0.6:
            similarity_type = "Similar formation dynamics"
        elif overall_similarity > 0.4:
            similarity_type = "Partial process overlap"
        else:
            similarity_type = "Different process regimes"
        
        return {
            'well1': cepr1.well_id,
            'well2': cepr2.well_id,
            'similarity_type': similarity_type,
            'metrics': {
                'process_similarity': round(process_similarity, 3),
                'chain_similarity': round(chain_similarity, 3),
                'depth_similarity': round(depth_similarity, 3),
                'overall_similarity': round(overall_similarity, 3)
            },
            'common_processes': list(processes1 & processes2),
            'unique_to_well1': list(processes1 - processes2),
            'unique_to_well2': list(processes2 - processes1)
        }
    
    def _compare_chains(self, chains1: List[List[ProcessType]], chains2: List[List[ProcessType]]) -> float:
        """Compare causal chains between two wells"""
        if not chains1 or not chains2:
            return 0.0
        
        # Convert chains to sets of process pairs
        pairs1 = set()
        for chain in chains1:
            for i in range(len(chain) - 1):
                pairs1.add((chain[i], chain[i+1]))
        
        pairs2 = set()
        for chain in chains2:
            for i in range(len(chain) - 1):
                pairs2.add((chain[i], chain[i+1]))
        
        intersection = len(pairs1 & pairs2)
        union = len(pairs1 | pairs2)
        
        return intersection / union if union > 0 else 0.0
    
    def _compare_depths(self, processes1: List[CausalProcess], processes2: List[CausalProcess]) -> float:
        """Compare depth distributions of processes"""
        if not processes1 or not processes2:
            return 0.0
        
        # Get depth centers
        depths1 = [(p.depth_start + p.depth_end) / 2 for p in processes1]
        depths2 = [(p.depth_start + p.depth_end) / 2 for p in processes2]
        
        # Calculate overlap
        min_depth = max(min(depths1), min(depths2))
        max_depth = min(max(depths1), max(depths2))
        
        if min_depth >= max_depth:
            return 0.0
        
        # Overlap ratio
        range1 = max(depths1) - min(depths1)
        range2 = max(depths2) - min(depths2)
        overlap = max_depth - min_depth
        
        avg_range = (range1 + range2) / 2
        
        return min(1.0, overlap / avg_range) if avg_range > 0 else 0.0
    
    def predict_aquifer_targets(self, ceprs: List[CausalEarthProcessRecord]) -> List[Dict]:
        """
        Predict new aquifer targets based on missing causal patterns.
        
        This is predictive: "New productive aquifer likely between 180–220 m based on 
        missing causal pattern continuation."
        """
        if not ceprs or len(ceprs) < 2:
            return []
        
        # Find common aquifer-forming process chains
        common_chains = self._find_common_chains(ceprs)
        
        # Identify gaps in the chains
        targets = []
        for chain in common_chains:
            if len(chain) >= 2:
                # Find depth ranges for this chain
                depth_ranges = []
                for cepr in ceprs:
                    for c in cepr.causal_chains:
                        if tuple(c) == tuple(chain):
                            # Get depth range for this chain
                            depths = []
                            for proc_type in c:
                                for proc in cepr.processes:
                                    if proc.process_type == proc_type:
                                        depths.append((proc.depth_start, proc.depth_end))
                                        break
                            if depths:
                                depth_ranges.append((min(d[0] for d in depths), max(d[1] for d in depths)))
                
                if depth_ranges:
                    # Find gaps between depth ranges
                    gaps = self._find_depth_gaps(depth_ranges)
                    
                    for gap_start, gap_end in gaps:
                        if gap_end - gap_start > 10:  # Only consider gaps > 10m
                            # Calculate confidence based on chain frequency
                            chain_freq = sum(1 for c in ceprs if chain in [tuple(c) for c in c.causal_chains]) / len(ceprs)
                            confidence = min(0.95, 0.7 + chain_freq * 0.25)
                            
                            targets.append({
                                'depth_range': f"{gap_start:.1f}-{gap_end:.1f} m",
                                'process_chain': [p.value for p in chain],
                                'confidence': round(confidence, 2),
                                'reason': f"Missing {chain[0].value} → {chain[-1].value} pattern continuation",
                                'well_ids': [cepr.well_id for cepr in ceprs if chain in [tuple(c) for c in cepr.causal_chains]]
                            })
        
        # Sort by confidence
        targets.sort(key=lambda x: x['confidence'], reverse=True)
        
        return targets[:5]  # Top 5 targets
    
    def _find_common_chains(self, ceprs: List[CausalEarthProcessRecord]) -> List[List[ProcessType]]:
        """Find chains that appear in multiple wells"""
        chain_counts = defaultdict(int)
        
        for cepr in ceprs:
            for chain in cepr.causal_chains:
                chain_tuple = tuple(chain)
                chain_counts[chain_tuple] += 1
        
        # Filter chains that appear in at least 2 wells
        common = [chain for chain, count in chain_counts.items() if count >= 2]
        
        # Sort by frequency
        common.sort(key=lambda x: chain_counts[tuple(x)], reverse=True)
        
        return common
    
    def _find_depth_gaps(self, depth_ranges: List[Tuple[float, float]]) -> List[Tuple[float, float]]:
        """Find gaps between depth ranges"""
        gaps = []
        
        # Sort by start depth
        sorted_ranges = sorted(depth_ranges, key=lambda x: x[0])
        
        # Find gaps
        for i in range(len(sorted_ranges) - 1):
            current_end = sorted_ranges[i][1]
            next_start = sorted_ranges[i+1][0]
            
            if next_start - current_end > 10:  # Gap > 10m
                gaps.append((current_end, next_start))
        
        return gaps
    
    def get_causal_visualization(self, cepr: CausalEarthProcessRecord) -> Dict:
        """Generate a visualization of the causal relationships in a CEPR"""
        # Create a subgraph with only the processes in this CEPR
        process_types = [p.process_type for p in cepr.processes]
        subgraph = self.knowledge_graph.graph.subgraph(process_types)
        
        if subgraph.number_of_nodes() == 0:
            return {'error': 'No causal relationships to visualize'}
        
        # Create visualization
        plt.figure(figsize=(12, 8))
        
        # Color map
        colors = {
            ProcessType.ERUPTION: '#e74c3c',
            ProcessType.COOLING: '#e67e22',
            ProcessType.FRACTURING: '#f39c12',
            ProcessType.WEATHERING: '#2ecc71',
            ProcessType.SEDIMENTATION: '#3498db',
            ProcessType.HYDROTHERMAL: '#9b59b6',
            ProcessType.TECTONIC: '#e91e63',
            ProcessType.DEPOSITION: '#1abc9c',
            ProcessType.COMPACTION: '#95a5a6',
            ProcessType.CEMENTATION: '#7f8c8d'
        }
        
        node_colors = [colors.get(n, '#95a5a6') for n in subgraph.nodes()]
        
        # Node sizes based on intensity
        node_sizes = []
        for node in subgraph.nodes():
            proc = next((p for p in cepr.processes if p.process_type == node), None)
            if proc:
                node_sizes.append(2000 + proc.intensity * 1000)
            else:
                node_sizes.append(2000)
        
        # Edge widths based on confidence
        edge_widths = []
        for u, v in subgraph.edges():
            data = subgraph.get_edge_data(u, v)
            if data:
                # Use relationship confidence
                rel = self.knowledge_graph.get_relationship(u, v)
                if rel:
                    edge_widths.append(1 + rel.confidence * 3)
                else:
                    edge_widths.append(1)
            else:
                edge_widths.append(1)
        
        pos = nx.spring_layout(subgraph, seed=42)
        
        nx.draw(
            subgraph,
            pos,
            with_labels=True,
            node_color=node_colors,
            node_size=node_sizes,
            font_size=10,
            font_weight='bold',
            edge_color='#7f8c8d',
            edge_width=edge_widths,
            arrows=True,
            arrowsize=20
        )
        
        # Add edge labels with hydro effects
        for u, v in subgraph.edges():
            data = subgraph.get_edge_data(u, v)
            if data:
                hydro = data.get('hydro_effect', '')
                if hydro:
                    x, y = pos[u]
                    x2, y2 = pos[v]
                    plt.text(
                        (x + x2) / 2,
                        (y + y2) / 2,
                        hydro,
                        fontsize=8,
                        ha='center',
                        va='center',
                        backgroundcolor='white',
                        alpha=0.7
                    )
        
        plt.title(f"Causal Geological Graph - Well {cepr.well_id}")
        
        # Save to base64
        buf = io.BytesIO()
        plt.savefig(buf, format='png', dpi=150, bbox_inches='tight')
        buf.seek(0)
        image_base64 = base64.b64encode(buf.read()).decode('utf-8')
        plt.close()
        
        return {
            'image': image_base64,
            'well_id': cepr.well_id,
            'nodes': [{
                'process': n.value,
                'intensity': next((p.intensity for p in cepr.processes if p.process_type == n), 0),
                'confidence': next((p.confidence for p in cepr.processes if p.process_type == n), 0)
            } for n in subgraph.nodes()],
            'edges': [{
                'from': str(e[0].value),
                'to': str(e[1].value),
                'hydro_effect': subgraph.get_edge_data(e[0], e[1]).get('hydro_effect', '')
            } for e in subgraph.edges()]
        }


# Singleton instance
causal_engine = CausalEngine()
