"""
Multi-provider LLM service for GVAS AI Geologist.
Supports OpenAI, Anthropic, Google Gemini, and Ollama (local).
"""

import os
import json
from typing import List, Dict, Optional, Tuple

import requests

SYSTEM_PROMPT = """You are GVAS AI Geologist — an expert assistant for Global Volcanic Aquifer Solutions (GVAS).

Your specialties:
- Volcanic hydrostratigraphy and aquifer modeling
- East African Rift and Ethiopian geology
- Well log interpretation, aquifer/aquitard classification
- Causal subsurface intelligence (CEPR, CSIE)

Rules:
1. When project well data is provided in context, ground answers in that data.
2. Never invent CCI, FEP, HCSS, or transmissivity values — defer to provided CSIE results.
3. Distinguish general geological knowledge from project-specific analysis.
4. Be clear, scientific, and helpful. Use markdown for structure when useful.
5. You may also answer general questions (writing, coding, science) when asked."""


class LLMService:
    """Unified interface for multiple LLM providers."""

    PROVIDERS = ("openai", "anthropic", "gemini", "ollama")

    DEFAULT_MODELS = {
        "openai": "gpt-4o-mini",
        "anthropic": "claude-3-5-haiku-20241022",
        "gemini": "gemini-1.5-flash",
        "ollama": "llama3.2",
    }

    def __init__(self):
        self.default_provider = os.getenv("LLM_PROVIDER", "auto").lower()
        self.enabled = os.getenv("LLM_ENABLED", "true").lower() in ("1", "true", "yes")

    def list_providers(self) -> List[Dict]:
        """Return configured providers and availability."""
        result = []
        for name in self.PROVIDERS:
            result.append({
                "name": name,
                "configured": self._is_configured(name),
                "model": os.getenv(f"{name.upper()}_MODEL", self.DEFAULT_MODELS[name]),
            })
        return result

    def _is_configured(self, provider: str) -> bool:
        if provider == "openai":
            return bool(os.getenv("OPENAI_API_KEY"))
        if provider == "anthropic":
            return bool(os.getenv("ANTHROPIC_API_KEY"))
        if provider == "gemini":
            return bool(os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY"))
        if provider == "ollama":
            base = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
            try:
                r = requests.get(f"{base}/api/tags", timeout=2)
                return r.status_code == 200
            except Exception:
                return False
        return False

    def resolve_provider(self, override: Optional[str] = None) -> Optional[str]:
        """Pick provider: explicit override, env default, or first configured."""
        if override and override in self.PROVIDERS:
            if self._is_configured(override):
                return override
            raise ValueError(f"Provider '{override}' is not configured")

        preferred = override or self.default_provider
        if preferred in self.PROVIDERS and self._is_configured(preferred):
            return preferred

        if preferred == "auto" or preferred not in self.PROVIDERS:
            for name in self.PROVIDERS:
                if self._is_configured(name):
                    return name
        return None

    def chat(
        self,
        message: str,
        history: Optional[List[Dict[str, str]]] = None,
        context: Optional[str] = None,
        provider: Optional[str] = None,
    ) -> Tuple[str, str]:
        """
        Send a chat completion. Returns (response_text, provider_used).
        """
        if not self.enabled:
            raise ValueError("LLM is disabled. Set LLM_ENABLED=true in .env")

        resolved = self.resolve_provider(provider)
        if not resolved:
            raise ValueError(
                "No LLM provider configured. Set OPENAI_API_KEY, ANTHROPIC_API_KEY, "
                "GOOGLE_API_KEY, or run Ollama locally."
            )

        system = SYSTEM_PROMPT
        if context:
            system += f"\n\n--- Project Context ---\n{context}"

        if resolved == "openai":
            text = self._chat_openai(system, message, history or [])
        elif resolved == "anthropic":
            text = self._chat_anthropic(system, message, history or [])
        elif resolved == "gemini":
            text = self._chat_gemini(system, message, history or [])
        elif resolved == "ollama":
            text = self._chat_ollama(system, message, history or [])
        else:
            raise ValueError(f"Unknown provider: {resolved}")

        return text, resolved

    def _chat_openai(self, system: str, message: str, history: List[Dict]) -> str:
        try:
            from openai import OpenAI
        except ImportError as e:
            raise ImportError("pip install openai") from e

        client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        model = os.getenv("OPENAI_MODEL", self.DEFAULT_MODELS["openai"])
        messages = [{"role": "system", "content": system}]
        for h in history[-10:]:
            messages.append({"role": h["role"], "content": h["content"]})
        messages.append({"role": "user", "content": message})

        resp = client.chat.completions.create(model=model, messages=messages, max_tokens=2048)
        return resp.choices[0].message.content or ""

    def _chat_anthropic(self, system: str, message: str, history: List[Dict]) -> str:
        try:
            import anthropic
        except ImportError as e:
            raise ImportError("pip install anthropic") from e

        client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
        model = os.getenv("ANTHROPIC_MODEL", self.DEFAULT_MODELS["anthropic"])
        messages = [{"role": h["role"], "content": h["content"]} for h in history[-10:]]
        messages.append({"role": "user", "content": message})

        resp = client.messages.create(
            model=model,
            max_tokens=2048,
            system=system,
            messages=messages,
        )
        return resp.content[0].text if resp.content else ""

    def _chat_gemini(self, system: str, message: str, history: List[Dict]) -> str:
        try:
            import google.generativeai as genai
        except ImportError as e:
            raise ImportError("pip install google-generativeai") from e

        api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
        genai.configure(api_key=api_key)
        model_name = os.getenv("GEMINI_MODEL", self.DEFAULT_MODELS["gemini"])
        model = genai.GenerativeModel(model_name, system_instruction=system)

        parts = []
        for h in history[-10:]:
            prefix = "User" if h["role"] == "user" else "Assistant"
            parts.append(f"{prefix}: {h['content']}")
        parts.append(f"User: {message}")
        prompt = "\n\n".join(parts)

        resp = model.generate_content(prompt)
        return resp.text or ""

    def _chat_ollama(self, system: str, message: str, history: List[Dict]) -> str:
        base = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
        model = os.getenv("OLLAMA_MODEL", self.DEFAULT_MODELS["ollama"])
        messages = [{"role": "system", "content": system}]
        for h in history[-10:]:
            messages.append({"role": h["role"], "content": h["content"]})
        messages.append({"role": "user", "content": message})

        resp = requests.post(
            f"{base}/api/chat",
            json={"model": model, "messages": messages, "stream": False},
            timeout=120,
        )
        resp.raise_for_status()
        return resp.json().get("message", {}).get("content", "")


llm_service = LLMService()
