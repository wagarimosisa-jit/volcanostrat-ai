"""
Unit Tests for Causal Subsurface Intelligence Engine (CSIE)
"""

import pytest
from app.services.causal_engine import (
    causal_engine, 
    CausalEngine, 
    CausalKnowledgeGraph, 
    ProcessType, 
    HydroEffect,
    CausalProcess,
    CausalEarthProcessRecord
)


class TestCausalKnowledgeGraph:
    """Tests for the Causal Knowledge Graph"""
    
    def test_knowledge_graph_initialization(self):
        """Test that knowledge graph initializes correctly"""
        graph = CausalKnowledgeGraph()
        assert graph.graph is not None
        assert len(graph.relationships) > 0
    
    def test_get_causes(self):
        """Test getting causes for a process"""
        graph = CausalKnowledgeGraph()
        causes = graph.get_causes(ProcessType.FRACTURING)
        assert ProcessType.COOLING in causes
        assert ProcessType.TECTONIC in causes
    
    def test_get_effects(self):
        """Test getting effects for a process"""
        graph = CausalKnowledgeGraph()
        effects = graph.get_effects(ProcessType.COOLING)
        assert ProcessType.FRACTURING in effects
    
    def test_get_all_relationships(self):
        """Test getting all relationships"""
        graph = CausalKnowledgeGraph()
        relationships = graph.get_all_relationships()
        assert len(relationships) > 0
        assert all(hasattr(r, 'cause') for r in relationships)
        assert all(hasattr(r, 'effect') for r in relationships)


class TestCausalEngine:
    """Tests for the Causal Engine"""
    
    def test_identify_processes(self):
        """Test identifying processes from lithology descriptions"""
        engine = CausalEngine()
        
        # Test basalt description
        description = "Highly fractured basalt with vesicular textures"
        processes = engine._identify_processes(description)
        assert ProcessType.ERUPTION in processes or ProcessType.FRACTURING in processes
        
        # Test weathered description
        description = "Highly weathered andesite with clay alteration"
        processes = engine._identify_processes(description)
        assert ProcessType.WEATHERING in processes or ProcessType.ALTERATION in processes
    
    def test_estimate_intensity_confidence(self):
        """Test estimating intensity and confidence"""
        engine = CausalEngine()
        
        # High intensity
        desc = "Highly fractured basalt"
        intensity, confidence, evidence = engine._estimate_intensity_confidence(desc, ProcessType.FRACTURING)
        assert intensity > 0.5
        assert confidence > 0.7
        
        # Low intensity
        desc = "Slightly fractured basalt"
        intensity, confidence, evidence = engine._estimate_intensity_confidence(desc, ProcessType.FRACTURING)
        assert intensity < 0.5
        assert confidence > 0.7
    
    def test_transform_to_cepr(self):
        """Test transforming well data to CEPR"""
        engine = CausalEngine()
        
        well_data = {
            'Well_ID': 'Test_Well_1',
            'Coordinates': {'X': 100, 'Y': 200, 'Elevation': 500},
            'Depth_Intervals': [
                {
                    'depth_start': 0,
                    'depth_end': 50,
                    'raw_lithology': 'Highly fractured basalt with vesicular textures'
                },
                {
                    'depth_start': 50,
                    'depth_end': 100,
                    'raw_lithology': 'Moderately weathered andesite'
                }
            ]
        }
        
        cepr = engine.transform_to_cepr(well_data)
        
        assert cepr.well_id == 'Test_Well_1'
        assert cepr.coordinates == {'X': 100, 'Y': 200, 'Elevation': 500}
        assert len(cepr.processes) > 0
        assert cepr.cci >= 0
        assert cepr.fep >= 0
        assert cepr.hcss >= 0
    
    def test_what_if_scenario(self):
        """Test what-if scenario simulation"""
        engine = CausalEngine()
        
        well_data = {
            'Well_ID': 'Test_Well_2',
            'Coordinates': {'X': 100, 'Y': 200, 'Elevation': 500},
            'Depth_Intervals': [
                {
                    'depth_start': 0,
                    'depth_end': 50,
                    'raw_lithology': 'Highly fractured basalt'
                }
            ]
        }
        
        cepr = engine.transform_to_cepr(well_data)
        
        # Test increasing fracturing
        result = engine.get_what_if_scenario(cepr, "What if fracturing was more intense?")
        assert 'original_metrics' in result
        assert 'modified_metrics' in result
        assert 'changes' in result
        
        # Test decreasing cooling
        result = engine.get_what_if_scenario(cepr, "What if cooling was slower?")
        assert 'changes' in result
    
    def test_compare_causal_similarity(self):
        """Test comparing causal similarity between wells"""
        engine = CausalEngine()
        
        well1 = {
            'Well_ID': 'Well_1',
            'Coordinates': {'X': 100, 'Y': 200, 'Elevation': 500},
            'Depth_Intervals': [
                {
                    'depth_start': 0,
                    'depth_end': 50,
                    'raw_lithology': 'Highly fractured basalt'
                }
            ]
        }
        
        well2 = {
            'Well_ID': 'Well_2',
            'Coordinates': {'X': 150, 'Y': 250, 'Elevation': 550},
            'Depth_Intervals': [
                {
                    'depth_start': 0,
                    'depth_end': 50,
                    'raw_lithology': 'Highly fractured basalt'
                }
            ]
        }
        
        cepr1 = engine.transform_to_cepr(well1)
        cepr2 = engine.transform_to_cepr(well2)
        
        result = engine.compare_causal_similarity(cepr1, cepr2)
        
        assert 'well1' in result
        assert 'well2' in result
        assert 'similarity_type' in result
        assert 'metrics' in result
        assert 'overall_similarity' in result['metrics']
        assert 0 <= result['metrics']['overall_similarity'] <= 1


class TestMetrics:
    """Tests for causal metrics calculations"""
    
    def test_cci_calculation(self):
        """Test Causal Connectivity Index calculation"""
        engine = CausalEngine()
        
        well_data = {
            'Well_ID': 'Test_Well_CCI',
            'Coordinates': {'X': 100, 'Y': 200, 'Elevation': 500},
            'Depth_Intervals': [
                {
                    'depth_start': 0,
                    'depth_end': 50,
                    'raw_lithology': 'Highly fractured basalt'
                },
                {
                    'depth_start': 50,
                    'depth_end': 100,
                    'raw_lithology': 'Moderately weathered andesite'
                }
            ]
        }
        
        cepr = engine.transform_to_cepr(well_data)
        cci = engine.calculate_cci(cepr)
        
        assert 0 <= cci <= 1
    
    def test_fep_calculation(self):
        """Test Formation Energy Proxy calculation"""
        engine = CausalEngine()
        
        well_data = {
            'Well_ID': 'Test_Well_FEP',
            'Coordinates': {'X': 100, 'Y': 200, 'Elevation': 500},
            'Depth_Intervals': [
                {
                    'depth_start': 0,
                    'depth_end': 50,
                    'raw_lithology': 'Highly fractured basalt'
                }
            ]
        }
        
        cepr = engine.transform_to_cepr(well_data)
        fep = engine.calculate_fep(cepr)
        
        assert 0 <= fep <= 100
    
    def test_hcss_calculation(self):
        """Test Hydro-Causal Stability Score calculation"""
        engine = CausalEngine()
        
        well_data = {
            'Well_ID': 'Test_Well_HCSS',
            'Coordinates': {'X': 100, 'Y': 200, 'Elevation': 500},
            'Depth_Intervals': [
                {
                    'depth_start': 0,
                    'depth_end': 50,
                    'raw_lithology': 'Highly fractured basalt'
                }
            ]
        }
        
        cepr = engine.transform_to_cepr(well_data)
        hcss = engine.calculate_hcss(cepr)
        
        assert 0 <= hcss <= 1


class TestPredictiveTargets:
    """Tests for predictive aquifer targets"""
    
    def test_predict_aquifer_targets(self):
        """Test predicting aquifer targets"""
        engine = CausalEngine()
        
        well1 = {
            'Well_ID': 'Well_A',
            'Coordinates': {'X': 100, 'Y': 200, 'Elevation': 500},
            'Depth_Intervals': [
                {
                    'depth_start': 0,
                    'depth_end': 50,
                    'raw_lithology': 'Highly fractured basalt'
                },
                {
                    'depth_start': 60,
                    'depth_end': 100,
                    'raw_lithology': 'Moderately fractured basalt'
                }
            ]
        }
        
        well2 = {
            'Well_ID': 'Well_B',
            'Coordinates': {'X': 150, 'Y': 250, 'Elevation': 550},
            'Depth_Intervals': [
                {
                    'depth_start': 0,
                    'depth_end': 50,
                    'raw_lithology': 'Highly fractured basalt'
                },
                {
                    'depth_start': 60,
                    'depth_end': 100,
                    'raw_lithology': 'Moderately fractured basalt'
                }
            ]
        }
        
        cepr1 = engine.transform_to_cepr(well1)
        cepr2 = engine.transform_to_cepr(well2)
        
        targets = engine.predict_aquifer_targets([cepr1, cepr2])
        
        # With only two wells and no gaps, we might not get targets
        # This test mainly ensures the function doesn't crash
        assert isinstance(targets, list)


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
