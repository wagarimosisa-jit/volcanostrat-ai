from pydantic import BaseModel, Field
from typing import Any, Dict, List, Optional


class ChatMessage(BaseModel):
    role: str = Field(..., description="user or assistant")
    content: str


class ChatRequest(BaseModel):
    message: str = Field(..., description="User message")
    history: Optional[List[ChatMessage]] = []
    wells: Optional[List[Dict[str, Any]]] = None
    voxel_model: Optional[Dict[str, Any]] = None
    provider: Optional[str] = Field(None, description="openai | anthropic | gemini | ollama | auto")
    mode: Optional[str] = Field("hybrid", description="hybrid | geology_only | general")


class ChatResponse(BaseModel):
    response: str
    source: str
    mode: str
    provider: Optional[str] = None
