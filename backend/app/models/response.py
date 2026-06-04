from pydantic import BaseModel
from typing import List, Dict, Optional

class VoxelModel(BaseModel):
    resolution: str
    total_voxels: int
    bounding_box: Dict[str, float]

class CrossSection(BaseModel):
    name: str
    coordinates: List[Dict[str, float]]
    length: float
    layers_intersected: List[int]

class ExportResponse(BaseModel):
    format: str
    data: str  # Base64 encoded or direct content
    filename: str
