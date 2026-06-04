from pydantic import BaseModel, Field, condecimal, conint
from typing import List, Optional

class WellLog(BaseModel):
    Well_ID: str = Field(..., description="Unique well identifier")
    X_Coordinate: condecimal(ge=-180, le=180) = Field(..., description="Longitude (WGS84 decimal degrees)")
    Y_Coordinate: condecimal(ge=-90, le=90) = Field(..., description="Latitude (WGS84 decimal degrees)")
    Elevation_m: float = Field(..., description="Elevation in meters (WGS84)")
    Depth_Start_m: conint(ge=0) = Field(..., description="Start depth in meters (below ground)")
    Depth_End_m: conint(gt=0) = Field(..., description="End depth in meters (below ground)")
    Raw_Lithology_Description: str = Field(..., description="Raw lithology description from well log")

class WellData(BaseModel):
    wells: List[WellLog] = Field(..., description="List of well logs")

class Layer(BaseModel):
    Layer_Number: int
    Depth_Start: float
    Depth_End: float
    Thickness: float
    Modifiers: List[str]
    Interbeds: Optional[List[str]] = None
    Hydro_Property: Optional[str] = None
    Confidence: Optional[float] = None

class StandardizedWell(BaseModel):
    Well_ID: str
    Coordinates: dict
    Layers: List[Layer]

class WellResponse(BaseModel):
    wells: List[StandardizedWell]
    project_name: Optional[str] = "VolcanoStrat AI Project"
    global_comparisons: Optional[dict] = None
