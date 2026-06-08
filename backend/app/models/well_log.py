from pydantic import BaseModel, Field, validator
from typing import List, Optional
import decimal

class WellLog(BaseModel):
    Well_ID: str = Field(..., description="Unique well identifier")
    X_Coordinate: float = Field(..., description="Longitude (WGS84 decimal degrees)")
    Y_Coordinate: float = Field(..., description="Latitude (WGS84 decimal degrees)")
    Elevation_m: float = Field(..., description="Elevation in meters (WGS84)")
    Depth_Start_m: float = Field(..., description="Start depth in meters (below ground)")
    Depth_End_m: float = Field(..., description="End depth in meters (below ground)")
    Raw_Lithology_Description: str = Field(..., description="Raw lithology description from well log")

    @validator('X_Coordinate', 'Y_Coordinate', 'Elevation_m', 'Depth_Start_m', 'Depth_End_m', pre=True)
    def parse_numbers(cls, v):
        """Accept integers, floats, decimals, and numeric strings"""
        if isinstance(v, (int, float, decimal.Decimal)):
            return float(v)
        if isinstance(v, str):
            try:
                return float(v)
            except ValueError:
                raise ValueError(f"'{v}' is not a valid number")
        return v

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
    project_name: Optional[str] = "GVAS Project"
    global_comparisons: Optional[dict] = None
