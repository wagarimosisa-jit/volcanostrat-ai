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
import zipfile
import tempfile

# Import local modules
from .models.well_log import WellData, WellLog
from .models.response import VoxelModel, CrossSection, ExportResponse
from .services.standardizer import prepare_well_data, standardize_lithology
from .services.classifier import predict_hydraulic_properties
from .services.shapefile_importer import shapefile_importer
from .engines.voxel_engine import create_voxel_model, extract_layers
from .engines.cross_section import generate_cross_section
from .engines.exporter import export_to_csv, export_to_vtk, export_to_kml
from .engines.shapefile_exporter import shapefile_exporter

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
    export_type: "layers", "combined_2d", "combined_3d", "wells"
    export_format: "csv", "json", "vtk", "png", "kml", "shp", "shapefile"
    """
    try:
        # First standardize the well data
        standardized = await standardize_wells(well_data)
        wells = standardized['wells']
        
        if export_type == "layers":
            if export_format == "csv":
                csv_data = export_to_csv(wells)
                return JSONResponse(content={
                    "format": "csv",
                    "data": csv_data,
                    "filename": "volcanostrat_layers.csv"
                })
            elif export_format == "json":
                return JSONResponse(content={
                    "format": "json",
                    "data": wells,
                    "filename": "volcanostrat_layers.json"
                })
            elif export_format in ["shp", "shapefile"]:
                # Export layers as shapefile
                shapefile_result = shapefile_exporter.export_stratigraphy_layers_to_shapefile(
                    {}, wells, 'zip'
                )
                if 'error' in shapefile_result:
                    raise HTTPException(status_code=500, detail=shapefile_result['error'])
                return JSONResponse(content={
                    "format": "shapefile_zip",
                    "data": base64.b64encode(shapefile_result['data']).decode('utf-8'),
                    "filename": shapefile_result['filename'],
                    "mime_type": shapefile_result.get('mime_type', 'application/zip')
                })

        elif export_type == "combined_2d":
            if line_points is None:
                line_points = [{"x": 0, "y": 0}, {"x": 100, "y": 100}]
            cross_section = await generate_cross_section_endpoint(well_data, line_points, resolution)
            
            if export_format == "png":
                return JSONResponse(content={
                    "format": "png",
                    "data": cross_section.get('image', ''),
                    "filename": "cross_section.png"
                })
            elif export_format in ["shp", "shapefile"]:
                # Export 2D cross-section as shapefile
                shapefile_result = shapefile_exporter.export_2d_stratigraphy_to_shapefile(
                    cross_section, line_points, resolution
                )
                if 'error' in shapefile_result:
                    raise HTTPException(status_code=500, detail=shapefile_result['error'])
                return JSONResponse(content={
                    "format": "shapefile_zip",
                    "data": base64.b64encode(shapefile_result['data']).decode('utf-8'),
                    "filename": shapefile_result['filename'],
                    "mime_type": shapefile_result.get('mime_type', 'application/zip')
                })

        elif export_type == "combined_3d":
            model_data = await generate_3d_model(well_data, resolution)
            voxel_model = model_data['voxel_model']
            
            if export_format == "vtk":
                vtk_data = export_to_vtk(voxel_model)
                return JSONResponse(content={
                    "format": "vtk",
                    "data": vtk_data,
                    "filename": "3d_model.vti"
                })
            elif export_format == "kml":
                kml_data = export_to_kml(wells)
                return JSONResponse(content={
                    "format": "kml",
                    "data": kml_data,
                    "filename": "wells.kml"
                })
            elif export_format in ["shp", "shapefile"]:
                # Export 3D model as shapefile (2D representation)
                shapefile_result = shapefile_exporter.export_3d_model_to_shapefile(
                    voxel_model, resolution
                )
                if 'error' in shapefile_result:
                    raise HTTPException(status_code=500, detail=shapefile_result['error'])
                return JSONResponse(content={
                    "format": "shapefile_zip",
                    "data": base64.b64encode(shapefile_result['data']).decode('utf-8'),
                    "filename": shapefile_result['filename'],
                    "mime_type": shapefile_result.get('mime_type', 'application/zip')
                })
        
        elif export_type == "wells":
            # Export well locations
            if export_format == "csv":
                # Create a simplified CSV with well locations
                csv_data = "Well_ID,X_Coordinate,Y_Coordinate,Elevation_m\n"
                for well in wells:
                    csv_data += f"{well['Well_ID']},{well['Coordinates']['X']},{well['Coordinates']['Y']},{well['Coordinates']['Elevation']}\n"
                return JSONResponse(content={
                    "format": "csv",
                    "data": csv_data,
                    "filename": "wells.csv"
                })
            elif export_format == "json":
                # Create simplified well data
                simple_wells = [{
                    'Well_ID': w['Well_ID'],
                    'X_Coordinate': w['Coordinates']['X'],
                    'Y_Coordinate': w['Coordinates']['Y'],
                    'Elevation_m': w['Coordinates']['Elevation'],
                    'Layer_Count': len(w['Layers'])
                } for w in wells]
                return JSONResponse(content={
                    "format": "json",
                    "data": simple_wells,
                    "filename": "wells.json"
                })
            elif export_format in ["shp", "shapefile"]:
                # Export wells as shapefile
                shapefile_result = shapefile_exporter.export_wells_to_shapefile(wells)
                if 'error' in shapefile_result:
                    raise HTTPException(status_code=500, detail=shapefile_result['error'])
                return JSONResponse(content={
                    "format": "shapefile_zip",
                    "data": base64.b64encode(shapefile_result['data']).decode('utf-8'),
                    "filename": shapefile_result['filename'],
                    "mime_type": shapefile_result.get('mime_type', 'application/zip')
                })

        raise HTTPException(status_code=400, detail="Invalid export parameters")

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/export-shapefile")
async def export_shapefile(
    well_data: Optional[WellData] = None,
    voxel_model: Optional[Dict] = None,
    cross_section: Optional[Dict] = None,
    export_type: str = "wells",
    line_points: Optional[List[dict]] = None,
    resolution: float = 10.0
):
    """
    Export data as shapefile with more control.
    export_type: "wells", "layers", "combined_2d", "combined_3d", "cross_section"
    """
    try:
        if export_type == "wells":
            if not well_data:
                raise HTTPException(status_code=400, detail="well_data required for wells export")
            standardized = await standardize_wells(well_data)
            result = shapefile_exporter.export_wells_to_shapefile(standardized['wells'])
        elif export_type == "layers":
            if not well_data:
                raise HTTPException(status_code=400, detail="well_data required for layers export")
            standardized = await standardize_wells(well_data)
            result = shapefile_exporter.export_stratigraphy_layers_to_shapefile(
                voxel_model or {}, standardized['wells']
            )
        elif export_type == "combined_2d":
            if not cross_section:
                if not well_data:
                    raise HTTPException(status_code=400, detail="well_data or cross_section required")
                if line_points is None:
                    line_points = [{"x": 0, "y": 0}, {"x": 100, "y": 100}]
                cross_section = await generate_cross_section_endpoint(well_data, line_points, resolution)
            result = shapefile_exporter.export_2d_stratigraphy_to_shapefile(
                cross_section, line_points or [], resolution
            )
        elif export_type == "combined_3d":
            if not voxel_model:
                if not well_data:
                    raise HTTPException(status_code=400, detail="well_data or voxel_model required")
                model_data = await generate_3d_model(well_data, resolution)
                voxel_model = model_data['voxel_model']
            result = shapefile_exporter.export_3d_model_to_shapefile(voxel_model, resolution)
        elif export_type == "cross_section":
            if not cross_section:
                raise HTTPException(status_code=400, detail="cross_section required")
            result = shapefile_exporter.export_cross_section_to_shapefile(cross_section)
        else:
            raise HTTPException(status_code=400, detail=f"Unknown export type: {export_type}")
        
        if 'error' in result:
            raise HTTPException(status_code=500, detail=result['error'])
        
        return JSONResponse(content={
            "format": result.get('format', 'shapefile_zip'),
            "data": base64.b64encode(result['data']).decode('utf-8'),
            "filename": result['filename'],
            "feature_count": result.get('feature_count', 0),
            "mime_type": result.get('mime_type', 'application/zip')
        })
        
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
        
        # Check file type
        if file.filename.endswith('.zip') or file.filename.endswith('.shp'):
            # Process as shapefile
            shapefile_result = shapefile_importer.process_uploaded_shapefile(contents, file.filename)
            
            if shapefile_result['data_type'] == 'wells':
                well_data = shapefile_importer.convert_to_well_data(shapefile_result)
                
                # Convert to WellData format for processing
                wells = []
                for well in well_data['wells']:
                    # Use first depth interval for main fields
                    intervals = well.get('Depth_Intervals', [])
                    if intervals:
                        first_interval = intervals[0]
                    else:
                        first_interval = {'depth_start': 0, 'depth_end': 100, 'raw_lithology': 'Unknown'}
                    
                    w = WellLog(
                        Well_ID=well['Well_ID'],
                        X_Coordinate=well['X_Coordinate'],
                        Y_Coordinate=well['Y_Coordinate'],
                        Elevation_m=well['Elevation_m'],
                        Depth_Start_m=first_interval['depth_start'],
                        Depth_End_m=first_interval['depth_end'],
                        Raw_Lithology_Description=first_interval['raw_lithology']
                    )
                    wells.append(w)
                
                well_data = WellData(wells=wells)
                
                # Process
                standardized = await standardize_wells(well_data)
                model_3d = await generate_3d_model(well_data)
                cross_section = await generate_cross_section_endpoint(well_data)
                
                return JSONResponse(content={
                    "standardized": standardized,
                    "model_3d": model_3d,
                    "cross_section": cross_section,
                    "shapefile_metadata": {
                        "type": shapefile_result['data_type'],
                        "source": shapefile_result.get('source', file.filename),
                        "crs": shapefile_result.get('crs', 'EPSG:4326'),
                        "feature_count": shapefile_result.get('feature_count', 0)
                    }
                })
            elif shapefile_result['data_type'] == 'cross_section_line':
                # Process cross-section line
                line_data = shapefile_importer.process_cross_section_line(shapefile_result)
                return JSONResponse(content={
                    "cross_section_line": line_data,
                    "shapefile_metadata": {
                        "type": shapefile_result['data_type'],
                        "source": shapefile_result.get('source', file.filename),
                        "crs": shapefile_result.get('crs', 'EPSG:4326')
                    }
                })
            elif shapefile_result['data_type'] == 'study_area':
                # Process study area
                study_area = shapefile_importer.process_study_area(shapefile_result)
                return JSONResponse(content={
                    "study_area": study_area,
                    "shapefile_metadata": {
                        "type": shapefile_result['data_type'],
                        "source": shapefile_result.get('source', file.filename),
                        "crs": shapefile_result.get('crs', 'EPSG:4326')
                    }
                })
            else:
                raise HTTPException(status_code=400, detail=f"Unsupported shapefile type: {shapefile_result['data_type']}")
        
        # Process as CSV
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


@app.post("/api/upload-shapefile")
async def upload_shapefile(file: UploadFile = File(...)):
    """
    Uploads a shapefile (zip or .shp) and processes it based on type.
    Returns appropriate data structure based on shapefile content.
    """
    try:
        contents = await file.read()
        result = shapefile_importer.process_uploaded_shapefile(contents, file.filename)
        
        if result['data_type'] == 'wells':
            well_data = shapefile_importer.convert_to_well_data(result)
            return JSONResponse(content={
                "type": "wells",
                "wells": well_data['wells'],
                "count": well_data['count'],
                "crs": well_data['crs'],
                "source": well_data.get('source', file.filename)
            })
        elif result['data_type'] == 'cross_section_line':
            line_data = shapefile_importer.process_cross_section_line(result)
            return JSONResponse(content={
                "type": "cross_section_line",
                "line_points": line_data['line_points'],
                "length_m": line_data['length_m'],
                "crs": line_data['crs']
            })
        elif result['data_type'] == 'study_area':
            study_area = shapefile_importer.process_study_area(result)
            return JSONResponse(content={
                "type": "study_area",
                "polygons": study_area['polygons'],
                "area_km2": study_area['area_km2'],
                "crs": study_area['crs']
            })
        elif result['data_type'] == 'stratigraphy_layers':
            # Process as stratigraphy layers
            return JSONResponse(content={
                "type": "stratigraphy_layers",
                "data": result
            })
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported shapefile type: {result['data_type']}")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/upload-cross-section-shapefile")
async def upload_cross_section_shapefile(file: UploadFile = File(...)):
    """
    Uploads a shapefile containing a cross-section line.
    """
    try:
        contents = await file.read()
        result = shapefile_importer.process_uploaded_shapefile(contents, file.filename)
        
        if result['data_type'] != 'cross_section_line':
            raise HTTPException(
                status_code=400, 
                detail=f"Expected cross-section line shapefile, got {result['data_type']}"
            )
        
        line_data = shapefile_importer.process_cross_section_line(result)
        
        return JSONResponse(content={
            "line_points": line_data['line_points'],
            "length_m": line_data['length_m'],
            "crs": line_data['crs'],
            "source": line_data.get('source', file.filename)
        })
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/upload-study-area")
async def upload_study_area(file: UploadFile = File(...)):
    """
    Uploads a shapefile containing a study area polygon.
    """
    try:
        contents = await file.read()
        result = shapefile_importer.process_uploaded_shapefile(contents, file.filename)
        
        if result['data_type'] not in ['study_area', 'stratigraphy_layers']:
            raise HTTPException(
                status_code=400, 
                detail=f"Expected study area or stratigraphy polygon shapefile, got {result['data_type']}"
            )
        
        if result['data_type'] == 'study_area':
            study_area = shapefile_importer.process_study_area(result)
        else:
            # For stratigraphy layers, just return the raw data
            study_area = {
                'polygons': [],
                'crs': result.get('crs', 'EPSG:4326'),
                'source': result.get('source', file.filename)
            }
        
        return JSONResponse(content={
            "polygons": study_area.get('polygons', []),
            "area_km2": study_area.get('area_km2', 0),
            "crs": study_area.get('crs', 'EPSG:4326'),
            "source": study_area.get('source', file.filename)
        })
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
