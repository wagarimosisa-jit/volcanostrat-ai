"""
Tests for hybrid AI Geologist chat routing.
"""

import asyncio
import pytest
from app.services.chat_service import handle_chat
from app.services.geology_knowledge import match_geology_knowledge


def _run(coro):
    return asyncio.get_event_loop().run_until_complete(coro)


class TestGeologyKnowledge:
    def test_ethiopia_match(self):
        result = match_geology_knowledge("What is Ethiopian geology?")
        assert result is not None
        assert "Ethiopian" in result

    def test_basalt_match(self):
        result = match_geology_knowledge("Explain basalt aquifers")
        assert result is not None
        assert "Basalt" in result


class TestChatRouting:
    def test_geology_only_mode(self):
        result = _run(handle_chat("Hello random question xyz", mode="geology_only"))
        assert result["source"] == "geology_kb"
        assert "geology-only" in result["response"].lower()

    def test_structured_well_data(self):
        wells = [{
            "Well_ID": "W1",
            "Coordinates": {"X": 36.8, "Y": 7.6, "Elevation": 1800},
            "Layers": [{
                "Layer_Number": 1,
                "Depth_Start": 0,
                "Depth_End": 50,
                "Thickness": 50,
                "Modifiers": ["fractured", "basalt"],
                "Hydro_Property": "Aquifer (High Productivity)",
                "Confidence": 0.9,
            }],
        }]
        result = _run(handle_chat(
            "What are the most productive layers?",
            wells=wells,
            mode="geology_only",
        ))
        assert result["source"] == "ai_geologist"
        assert "Productive" in result["response"]
