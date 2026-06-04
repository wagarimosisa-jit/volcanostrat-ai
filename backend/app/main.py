from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
import pandas as pd
import json
import os
from typing import List, Optional
from pathlib import Path
import base64
import io

# Import local modules
from .models.well_log import WellData, WellLog
from .models.response import VoxelModel, CrossSection, ExportResponse
from .services.standardizer import prepare_well_data, standardize_lithology
from .services.classifier import predict_hydraulic_properties
from .engines.voxel_engine import create_voxel_model, extract_layers
from .engines.cross_section import generate_cross_section
from .engines.exporter import export_to_csv, export_to_vtk, export_to_kml

# Initialize FastAPI
app = FastAPI(
    title="VolcanoStrat AI",
    description="AI-Powered Volcanic Aquifer Stratigraphy Platform",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load ontology
ONTOLOGY_PATH = Path(__file__).parent / "data" / "volcanic_ontology.json"
with open(ONTOLOGY_PATH, "r") as f:
    ONTOLOGY = json.load(f)

# --- API Endpoints ---

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "version": "1.0.0"}

@app.post("/api/standardize")
async def standardize_wells(well_data: WellData):
    """
    Standardizes well logs and extracts modifiers.
    Returns wells with layers containing ONLY modifiers.
    """
    try:
        standardized_wells = []
        for well in well_data.wells:
            intervals = [{
                "depth_start": well.Depth_Start_m,
                "depth_end": well.Depth_End_m,
                "raw_lithology": well.Raw_Lithology_Description
            }]
            standardized = prepare_well_data(
                well.Well_ID,
                intervals,
                well.X_Coordinate,
                well.Y_Coordinate,
                well.Elevation_m
            )

            # Add hydro property predictions
            for layer in standardized['Layers']:
                std_lith = None
                for interval in intervals:
                    std = standardize_lithology(interval['raw_lithology'])
                    if std['standard_lithology']:
                        std_lith = std['standard_lithology']
                        break

                if std_lith:
                    prediction = predict_hydraulic_properties({
                        'standard_lithology': std_lith,
                        'modifiers': layer['Modifiers']
                    })
                    layer['Predicted_T'] = prediction['Predicted_T']
                    layer['T_Range'] = prediction['T_Range']

            standardized_wells.append(standardized)

        return JSONResponse(content={"wells": standardized_wells})

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/3d-model")
async def generate_3d_model(well_data: WellData, resolution: float = 10.0):
    """
    Generates a 3D voxel model from well data.
    Returns voxel model and extracted layers.
    """
    try:
        # First standardize
        standardized = await standardize_wells(well_data)

        # Create voxel model
        voxel_model = create_voxel_model(standardized['wells'], resolution)

        # Extract layers
        layers = extract_layers(voxel_model)

        return JSONResponse(content={
            "voxel_model": voxel_model,
            "layers": layers,
            "wells": standardized['wells']
        })

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/cross-section")
async def generate_cross_section_endpoint(
    well_data: WellData,
    line_points: List[dict] = [
        {"x": 0, "y": 0},
        {"x": 100, "y": 100}
    ],
    resolution: float = 10.0
):
    """
    Generates a 2D cross-section from well data.
    """
    try:
        # Generate 3D model first
        model_data = await generate_3d_model(well_data, resolution)

        # Generate cross-section
        cross_section = generate_cross_section(model_data['voxel_model'], line_points)

        return JSONResponse(content={
            "cross_section": cross_section,
            "wells": model_data['wells']
        })

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/export")
async def export_data(
    well_data: WellData,
    export_format: str = "csv",
    export_type: str = "layers",
    resolution: float = 10.0,
    line_points: Optional[List[dict]] = None
):
    """
    Exports data in various formats.
    export_type: "layers", "combined_2d", "combined_3d"
    export_format: "csv", "json", "vtk", "png", "kml"
    """
    try:
        if export_type == "layers":
            standardized = await standardize_wells(well_data)
            if export_format == "csv":
                csv_data = export_to_csv(standardized['wells'])
                return JSONResponse(content={
                    "format": "csv",
                    "data": csv_data,
                    "filename": "volcanostrat_layers.csv"
                })
            elif export_format == "json":
                return JSONResponse(content={
                    "format": "json",
                    "data": standardized['wells'],
                    "filename": "volcanostrat_layers.json"
                })

        elif export_type == "combined_2d":
            if line_points is None:
                line_points = [{"x": 0, "y": 0}, {"x": 100, "y": 100}]
            cross_section = await generate_cross_section_endpoint(well_data, line_points, resolution)
            if export_format == "png":
                return JSONResponse(content={
                    "format": "png",
                    "data": cross_section['image'],
                    "filename": "cross_section.png"
                })

        elif export_type == "combined_3d":
            model_data = await generate_3d_model(well_data, resolution)
            if export_format == "vtk":
                vtk_data = export_to_vtk(model_data['voxel_model'])
                return JSONResponse(content={
                    "format": "vtk",
                    "data": vtk_data,
                    "filename": "3d_model.vti"
                })
            elif export_format == "kml":
                standardized = await standardize_wells(well_data)
                kml_data = export_to_kml(standardized['wells'])
                return JSONResponse(content={
                    "format": "kml",
                    "data": kml_data,
                    "filename": "wells.kml"
                })

        raise HTTPException(status_code=400, detail="Invalid export parameters")

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- File Upload Endpoint ---
@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    """
    Uploads a CSV/Excel file and processes it.
    """
    try:
        # Read file
        contents = await file.read()
        df = pd.read_csv(io.BytesIO(contents))

        # Validate required columns
        required_columns = ['Well_ID', 'X_Coordinate', 'Y_Coordinate', 'Elevation_m',
                           'Depth_Start_m', 'Depth_End_m', 'Raw_Lithology_Description']
        for col in required_columns:
            if col not in df.columns:
                raise HTTPException(status_code=400, detail=f"Missing column: {col}")

        # Convert to WellData
        wells = []
        for _, row in df.iterrows():
            well = WellLog(
                Well_ID=row['Well_ID'],
                X_Coordinate=row['X_Coordinate'],
                Y_Coordinate=row['Y_Coordinate'],
                Elevation_m=row['Elevation_m'],
                Depth_Start_m=row['Depth_Start_m'],
                Depth_End_m=row['Depth_End_m'],
                Raw_Lithology_Description=row['Raw_Lithology_Description']
            )
            wells.append(well)

        well_data = WellData(wells=wells)

        # Process
        standardized = await standardize_wells(well_data)
        model_3d = await generate_3d_model(well_data)
        cross_section = await generate_cross_section_endpoint(well_data)

        return JSONResponse(content={
            "standardized": standardized,
            "model_3d": model_3d,
            "cross_section": cross_section
        })

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
