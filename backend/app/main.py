from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
import pandas as pd
import json
import os
from typing import List, Optional, Dict
from pathlib import Path
import base64
import io
import zipfile
import tempfile
from datetime import datetime
from dotenv import load_dotenv

_env_root = Path(__file__).resolve().parent.parent.parent
load_dotenv(_env_root / ".env")
load_dotenv(_env_root / "backend" / ".env")

# Import local modules
from .models.well_log import WellData, WellLog
from .models.chat import ChatRequest, ChatResponse
from .models.response import VoxelModel, CrossSection, ExportResponse
from .services.standardizer import prepare_well_data, standardize_lithology
from .services.classifier import predict_hydraulic_properties
from .services.shapefile_importer import shapefile_importer
from .services.causal_engine import causal_engine
from .services.file_importers import FileImporterFactory, ExcelImporter, LASImporter, GeoJSONImporter
from .engines.voxel_engine import create_voxel_model, extract_layers
from .engines.cross_section import generate_cross_section
from .engines.exporter import export_to_csv, export_to_vtk, export_to_kml
from .engines.shapefile_exporter import shapefile_exporter
from .engines.pdf_exporter import pdf_exporter
from .engines.pdf_exporter_enhanced import pdf_exporter_enhanced
from .services.chat_service import handle_chat
from .services.llm_service import llm_service

# Initialize FastAPI
app = FastAPI(
    title="GVAS",
    description="Global Volcanic Aquifer Solutions - AI-Powered Hydrostratigraphy Platform",
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

def _standardize_wells_data(well_data: WellData) -> Dict:
    """Standardizes well logs and extracts modifiers. Returns dict."""
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

    return {"wells": standardized_wells}


@app.post("/api/standardize")
async def standardize_wells(well_data: WellData):
    """
    Standardizes well logs and extracts modifiers.
    Returns wells with layers containing ONLY modifiers.
    """
    try:
        result = _standardize_wells_data(well_data)
        return JSONResponse(content=result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def _generate_3d_model_data(well_data: WellData, resolution: float = 10.0) -> Dict:
    """Generates 3D voxel model data. Returns dict."""
    # First standardize
    standardized = _standardize_wells_data(well_data)

    # Create voxel model
    voxel_model = create_voxel_model(standardized['wells'], resolution)

    # Extract layers
    layers = extract_layers(voxel_model)

    return {
        "voxel_model": voxel_model,
        "layers": layers,
        "wells": standardized['wells']
    }


@app.post("/api/3d-model")
async def generate_3d_model(well_data: WellData, resolution: float = 10.0):
    """
    Generates a 3D voxel model from well data.
    Returns voxel model and extracted layers.
    """
    try:
        result = _generate_3d_model_data(well_data, resolution)
        return JSONResponse(content=result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def _generate_cross_section_data(
    well_data: WellData,
    line_points: List[dict] = [
        {"x": 0, "y": 0},
        {"x": 100, "y": 100}
    ],
    resolution: float = 10.0
) -> Dict:
    """Generates 2D cross-section data. Returns dict."""
    # Generate 3D model first
    model_data = _generate_3d_model_data(well_data, resolution)

    # Generate cross-section
    cross_section = generate_cross_section(model_data['voxel_model'], line_points)

    return {
        "cross_section": cross_section,
        "wells": model_data['wells']
    }


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
        result = _generate_cross_section_data(well_data, line_points, resolution)
        return JSONResponse(content=result)
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
        standardized = _standardize_wells_data(well_data)
        wells = standardized['wells']
        
        if export_type == "layers":
            if export_format == "csv":
                csv_data = export_to_csv(wells)
                return JSONResponse(content={
                    "format": "csv",
                    "data": csv_data,
                    "filename": "gvas_layers.csv"
                })
            elif export_format == "json":
                return JSONResponse(content={
                    "format": "json",
                    "data": wells,
                    "filename": "gvas_layers.json"
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
            cross_section = _generate_cross_section_data(well_data, line_points, resolution)
            
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
            model_data = _generate_3d_model_data(well_data, resolution)
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
            standardized = _standardize_wells_data(well_data)
            result = shapefile_exporter.export_wells_to_shapefile(standardized['wells'])
        elif export_type == "layers":
            if not well_data:
                raise HTTPException(status_code=400, detail="well_data required for layers export")
            standardized = _standardize_wells_data(well_data)
            result = shapefile_exporter.export_stratigraphy_layers_to_shapefile(
                voxel_model or {}, standardized['wells']
            )
        elif export_type == "combined_2d":
            if not cross_section:
                if not well_data:
                    raise HTTPException(status_code=400, detail="well_data or cross_section required")
                if line_points is None:
                    line_points = [{"x": 0, "y": 0}, {"x": 100, "y": 100}]
                cross_section = _generate_cross_section_data(well_data, line_points, resolution)
            result = shapefile_exporter.export_2d_stratigraphy_to_shapefile(
                cross_section, line_points or [], resolution
            )
        elif export_type == "combined_3d":
            if not voxel_model:
                if not well_data:
                    raise HTTPException(status_code=400, detail="well_data or voxel_model required")
                model_data = _generate_3d_model_data(well_data, resolution)
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
                standardized = _standardize_wells_data(well_data)
                model_3d = _generate_3d_model_data(well_data)
                cross_section = _generate_cross_section_data(well_data)
                
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
        standardized = _standardize_wells_data(well_data)
        model_3d = _generate_3d_model_data(well_data)
        cross_section = _generate_cross_section_data(well_data)

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


# ============================================================================
# AI Geologist Chat (Hybrid: CSIE + Geology KB + Multi-LLM)
# ============================================================================

@app.get("/api/chat/providers")
async def get_chat_providers():
    """List configured LLM providers and chat modes."""
    return JSONResponse(content={
        "providers": llm_service.list_providers(),
        "default_provider": os.getenv("LLM_PROVIDER", "auto"),
        "llm_enabled": llm_service.enabled,
        "modes": ["hybrid", "geology_only", "general"],
        "mode_descriptions": {
            "hybrid": "Causal engine + geology KB first, then LLM for open questions",
            "geology_only": "Well data, causal analysis, and built-in geology only (no LLM)",
            "general": "General-purpose LLM with GVAS project context",
        },
    })


@app.post("/api/chat", response_model=ChatResponse)
async def chat_with_geologist(request: ChatRequest):
    """
    Hybrid AI Geologist chat endpoint.

    Routes to causal CSIE, structured well analysis, geology knowledge base,
    or external LLM (OpenAI, Anthropic, Gemini, Ollama) based on question and mode.
    """
    try:
        history = [{"role": m.role, "content": m.content} for m in (request.history or [])]
        result = await handle_chat(
            message=request.message,
            history=history,
            wells=request.wells,
            voxel_model=request.voxel_model,
            provider=request.provider,
            mode=request.mode or "hybrid",
        )
        provider = None
        if result["source"].startswith("llm:"):
            provider = result["source"].split(":", 1)[1]
        return ChatResponse(
            response=result["response"],
            source=result["source"],
            mode=result["mode"],
            provider=provider,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# CSIE (Causal Subsurface Intelligence Engine) Endpoints
# ============================================================================

@app.post("/api/causal/analyze")
async def analyze_causal(well_data: WellData):
    """
    Transform well logs into Causal Earth Process Records (CEPR).
    
    This is the core CSIE endpoint: instead of asking "What is underground?",
    we answer "Why is it like this, and what caused it?"
    
    Returns CEPRs with:
    - Causal processes identified
    - Causal chains
    - Aquifer formation explanations
    - CCI, FEP, HCSS metrics
    """
    try:
        # Standardize the well data first
        standardized = _standardize_wells_data(well_data)
        
        # Transform to CEPR
        ceprs = []
        for well in standardized['wells']:
            cepr = causal_engine.transform_to_cepr(well)
            ceprs.append(cepr.to_dict())
        
        return JSONResponse(content={
            "ceprs": ceprs,
            "count": len(ceprs),
            "analysis_type": "causal_earth_process_records"
        })
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/causal/what-if")
async def what_if_analysis(well_data: WellData, scenario: str = "What if eruption rate was lower?"):
    """
    Run a "What-If" geological scenario simulation.
    
    Example scenarios:
    - "What if eruption rate was lower?"
    - "What if cooling was faster?"
    - "What if there was more tectonic stress?"
    
    Returns the original and modified CEPR with predicted changes.
    """
    try:
        # Standardize the well data first
        standardized = _standardize_wells_data(well_data)
        
        if not standardized['wells']:
            raise HTTPException(status_code=400, detail="No wells to analyze")
        
        # Use first well for what-if analysis
        well = standardized['wells'][0]
        cepr = causal_engine.transform_to_cepr(well)
        
        # Run what-if scenario
        result = causal_engine.get_what_if_scenario(cepr, scenario)
        
        return JSONResponse(content=result)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/causal/compare")
async def compare_causal(well_data: WellData, well_id1: str, well_id2: str):
    """
    Compare two wells based on causal process similarity, not just lithology.
    
    This is extremely different from current systems which only compare rock types.
    We compare the geological process history that created the rocks.
    
    Returns:
    - Process similarity
    - Chain similarity
    - Depth similarity
    - Overall similarity with type classification
    """
    try:
        # Standardize the well data first
        standardized = _standardize_wells_data(well_data)
        
        wells = {w['Well_ID']: w for w in standardized['wells']}
        
        if well_id1 not in wells or well_id2 not in wells:
            raise HTTPException(status_code=404, detail=f"One or both wells not found: {well_id1}, {well_id2}")
        
        # Transform to CEPR
        cepr1 = causal_engine.transform_to_cepr(wells[well_id1])
        cepr2 = causal_engine.transform_to_cepr(wells[well_id2])
        
        # Compare
        result = causal_engine.compare_causal_similarity(cepr1, cepr2)
        
        return JSONResponse(content=result)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/causal/predict")
async def predict_aquifer_targets(well_data: WellData):
    """
    Predict new aquifer targets based on missing causal patterns.
    
    Instead of modeling existing data only, the system predicts:
    "New productive aquifer likely between 180–220 m based on missing causal pattern continuation."
    
    Returns ranked list of potential aquifer targets with:
    - Depth range
    - Process chain
    - Confidence
    - Reason
    """
    try:
        # Standardize the well data first
        standardized = _standardize_wells_data(well_data)
        
        if not standardized['wells']:
            raise HTTPException(status_code=400, detail="No wells to analyze")
        
        # Transform to CEPR
        ceprs = [causal_engine.transform_to_cepr(well) for well in standardized['wells']]
        
        # Predict targets
        targets = causal_engine.predict_aquifer_targets(ceprs)
        
        return JSONResponse(content={
            "targets": targets,
            "count": len(targets),
            "analysis_type": "predictive_aquifer_discovery"
        })
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/causal/visualization")
async def get_causal_visualization(well_id: str):
    """
    Generate a visualization of the causal relationships for a well.
    
    Returns a base64-encoded PNG image of the causal graph.
    """
    try:
        # This would need access to the well data
        # For now, return a placeholder
        if well_id not in causal_engine.well_ceprs:
            raise HTTPException(status_code=404, detail=f"Well {well_id} not found in CEPR cache")
        
        cepr = causal_engine.well_ceprs[well_id]
        visualization = causal_engine.get_causal_visualization(cepr)
        
        return JSONResponse(content=visualization)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Multi-Format File Upload Endpoints
# ============================================================================

@app.post("/api/upload/excel")
async def upload_excel(file: UploadFile = File(...)):
    """
    Upload and process an Excel well log file (.xlsx, .xls).
    """
    try:
        contents = await file.read()
        result = ExcelImporter.import_file(contents, file.filename)
        
        # Convert to WellData format for processing
        wells = []
        for well in result['wells']:
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
        standardized = _standardize_wells_data(well_data)
        model_3d = _generate_3d_model_data(well_data)
        cross_section = _generate_cross_section_data(well_data)
        
        return JSONResponse(content={
            "standardized": standardized,
            "model_3d": model_3d,
            "cross_section": cross_section,
            "import_metadata": {
                "format": result['format'],
                "count": result['count'],
                "source": result.get('source', file.filename)
            }
        })
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/upload/las")
async def upload_las(file: UploadFile = File(...)):
    """
    Upload and process a LAS (Log ASCII Standard) well log file (.las).
    """
    try:
        contents = await file.read()
        result = LASImporter.import_file(contents, file.filename)
        
        # Convert to WellData format
        wells = []
        for well in result['wells']:
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
        standardized = _standardize_wells_data(well_data)
        model_3d = _generate_3d_model_data(well_data)
        cross_section = _generate_cross_section_data(well_data)
        
        return JSONResponse(content={
            "standardized": standardized,
            "model_3d": model_3d,
            "cross_section": cross_section,
            "import_metadata": {
                "format": result['format'],
                "count": result['count'],
                "source": result.get('source', file.filename),
                "metadata": result.get('metadata', {})
            }
        })
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/upload/geojson")
async def upload_geojson(file: UploadFile = File(...)):
    """
    Upload and process a GeoJSON file.
    """
    try:
        contents = await file.read()
        result = GeoJSONImporter.import_file(contents, file.filename)
        
        # Convert to WellData format
        wells = []
        for well in result['wells']:
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
        standardized = _standardize_wells_data(well_data)
        model_3d = _generate_3d_model_data(well_data)
        cross_section = _generate_cross_section_data(well_data)
        
        return JSONResponse(content={
            "standardized": standardized,
            "model_3d": model_3d,
            "cross_section": cross_section,
            "import_metadata": {
                "format": result['format'],
                "count": result['count'],
                "source": result.get('source', file.filename),
                "crs": result.get('crs', 'EPSG:4326')
            }
        })
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# PDF Export Endpoint
# ============================================================================

@app.post("/api/export/pdf")
async def export_pdf(
    well_data: Optional[WellData] = None,
    export_type: str = "well_report",
    well_id: Optional[str] = None,
    project_name: str = "GVAS Analysis"
):
    """
    Export data to PDF format.
    
    export_type options:
    - "well_report": Single well report
    - "project_report": Multi-well project report
    - "causal_report": Causal analysis report (requires well_data)
    """
    try:
        if export_type == "well_report":
            if not well_data:
                raise HTTPException(status_code=400, detail="well_data required for well report")
            
            # Standardize first
            standardized = _standardize_wells_data(well_data)
            
            if not standardized['wells']:
                raise HTTPException(status_code=400, detail="No wells to export")
            
            # Use first well
            well = standardized['wells'][0]
            result = pdf_exporter.export_well_report(well, 'base64')
            
        elif export_type == "project_report":
            if not well_data:
                raise HTTPException(status_code=400, detail="well_data required for project report")
            
            # Standardize first
            standardized = _standardize_wells_data(well_data)
            
            if not standardized['wells']:
                raise HTTPException(status_code=400, detail="No wells to export")
            
            result = pdf_exporter.export_project_report(standardized['wells'], project_name, 'base64')
            
        elif export_type == "causal_report":
            if not well_data:
                raise HTTPException(status_code=400, detail="well_data required for causal report")
            
            # Standardize and transform to CEPR
            standardized = _standardize_wells_data(well_data)
            ceprs = [causal_engine.transform_to_cepr(well).to_dict() for well in standardized['wells']]
            
            result = pdf_exporter.export_causal_report(ceprs, project_name, 'base64')
        else:
            raise HTTPException(status_code=400, detail=f"Unknown export type: {export_type}")
        
        if 'error' in result:
            raise HTTPException(status_code=500, detail=result['error'])
        
        return JSONResponse(content=result)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/export/cepr")
async def export_cepr(well_data: WellData):
    """
    Export well data as Causal Earth Process Records (CEPR) in JSON format.
    
    This exports the causal analysis results for further processing or visualization.
    """
    try:
        # Standardize the well data first
        standardized = _standardize_wells_data(well_data)
        
        # Transform to CEPR
        ceprs = []
        for well in standardized['wells']:
            cepr = causal_engine.transform_to_cepr(well)
            ceprs.append(cepr.to_dict())
        
        return JSONResponse(content={
            "ceprs": ceprs,
            "count": len(ceprs),
            "format": "cepr_json",
            "export_date": datetime.now().isoformat()
        })
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Enhanced Upload Endpoint (Handles all formats)
# ============================================================================

@app.post("/api/upload-all-formats")
async def upload_all_formats(file: UploadFile = File(...)):
    """
    Universal upload endpoint that handles CSV, Excel, LAS, GeoJSON, and Shapefile.
    
    Automatically detects file type and processes accordingly.
    """
    try:
        contents = await file.read()
        filename = file.filename
        
        # Try shapefile first
        if filename.lower().endswith(('.shp', '.zip')):
            shapefile_result = shapefile_importer.process_uploaded_shapefile(contents, filename)
            
            if shapefile_result['data_type'] == 'wells':
                well_data_dict = shapefile_importer.convert_to_well_data(shapefile_result)
                
                wells = []
                for well in well_data_dict['wells']:
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
                standardized = _standardize_wells_data(well_data)
                model_3d = _generate_3d_model_data(well_data)
                cross_section = _generate_cross_section_data(well_data)
                
                return JSONResponse(content={
                    "standardized": standardized,
                    "model_3d": model_3d,
                    "cross_section": cross_section,
                    "import_metadata": {
                        "format": "shapefile",
                        "type": shapefile_result['data_type'],
                        "crs": shapefile_result.get('crs', 'EPSG:4326'),
                        "feature_count": shapefile_result.get('feature_count', 0)
                    }
                })
            else:
                return JSONResponse(content={
                    "type": shapefile_result['data_type'],
                    "data": shapefile_result,
                    "import_metadata": {
                        "format": "shapefile",
                        "source": filename
                    }
                })
        
        # Try other formats
        importer = FileImporterFactory.get_importer(filename)
        if importer:
            result = importer.import_file(contents, filename)
            
            # Convert to WellData format
            wells = []
            for well in result['wells']:
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
            standardized = _standardize_wells_data(well_data)
            model_3d = _generate_3d_model_data(well_data)
            cross_section = _generate_cross_section_data(well_data)
            
            return JSONResponse(content={
                "standardized": standardized,
                "model_3d": model_3d,
                "cross_section": cross_section,
                "import_metadata": {
                    "format": result['format'],
                    "count": result['count'],
                    "source": result.get('source', filename)
                }
            })
        
        # Default to CSV
        if filename.lower().endswith('.csv'):
            df = pd.read_csv(io.BytesIO(contents))
            
            # Validate required columns
            required_columns = ['Well_ID', 'X_Coordinate', 'Y_Coordinate', 'Elevation_m',
                               'Depth_Start_m', 'Depth_End_m', 'Raw_Lithology_Description']
            for col in required_columns:
                if col not in df.columns:
                    raise HTTPException(status_code=400, detail=f"Missing column: {col}")
            
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
            standardized = _standardize_wells_data(well_data)
            model_3d = _generate_3d_model_data(well_data)
            cross_section = _generate_cross_section_data(well_data)
            
            return JSONResponse(content={
                "standardized": standardized,
                "model_3d": model_3d,
                "cross_section": cross_section,
                "import_metadata": {
                    "format": "csv",
                    "count": len(wells),
                    "source": filename
                }
            })
        
        raise HTTPException(status_code=400, detail=f"Unsupported file format: {filename}")
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Health and Info Endpoints
# ============================================================================

@app.get("/api/info")
async def get_api_info():
    """
    Get API information and supported formats.
    """
    return JSONResponse(content={
        "name": "GVAS - Global Volcanic Aquifer Solutions",
        "version": "1.0.0",
        "description": "Transforms heterogeneous volcanic well logs into uncertainty-aware hydrostratigraphic knowledge models and groundwater decision-support systems.",
        "developer": "Wagari Mosisa Kitessa",
        "contact": {
            "email": ["wagari.mosisa@ju.edu.et", "wagarimosisa@gmail.com"],
            "github": "https://github.com/wagarimosisa-jit/volcanostrat-ai"
        },
        "supported_formats": {
            "import": ["CSV", "Excel (.xlsx, .xls)", "LAS", "GeoJSON", "Shapefile (.shp, .zip)"],
            "export": ["CSV", "JSON", "PDF", "Shapefile (.zip)", "VTK (.vti)", "KML (.kml)", "PNG"]
        },
        "features": {
            "causal_analysis": "Causal Earth Process Records (CEPR) transformation",
            "what_if_simulator": "Geological scenario simulation",
            "causal_similarity": "Well comparison based on process history",
            "aquifer_prediction": "Predictive aquifer discovery engine",
            "complexity_reduction": "Complexity Reduction Index (CRI) calculation",
            "uncertainty_modeling": "Uncertainty-aware geological modeling",
            "multi_format_support": "CSV, Excel, LAS, GeoJSON, Shapefile I/O",
            "3d_modeling": "3D voxel geological models",
            "cross_sections": "2D cross-section generation",
            "pdf_reports": "Comprehensive PDF report generation"
        },
        "endpoints": {
            "standardize": "/api/standardize",
            "3d_model": "/api/3d-model",
            "cross_section": "/api/cross-section",
            "export": "/api/export",
            "upload": "/api/upload",
            "upload_shapefile": "/api/upload-shapefile",
            "upload_cross_section": "/api/upload-cross-section-shapefile",
            "upload_study_area": "/api/upload-study-area",
            "causal_analyze": "/api/causal/analyze",
            "causal_what_if": "/api/causal/what-if",
            "causal_compare": "/api/causal/compare",
            "causal_predict": "/api/causal/predict",
            "chat": "/api/chat",
            "chat_providers": "/api/chat/providers",
            "upload_excel": "/api/upload/excel",
            "upload_las": "/api/upload/las",
            "upload_geojson": "/api/upload/geojson",
            "export_pdf": "/api/export/pdf",
            "export_cepr": "/api/export/cepr",
            "export_enhanced_pdf": "/api/export/enhanced-pdf",
            "upload_all": "/api/upload-all-formats"
        }
    })


@app.post("/api/export/enhanced-pdf")
async def export_enhanced_pdf(well_data: Dict):
    """
    Generate comprehensive PDF report with interpretations, evidence, and academic references.
    
    This endpoint creates a detailed geological report that includes:
    - Executive summary with key findings
    - Well summary tables
    - Layer-by-layer analysis
    - Geological interpretation
    - Complexity reduction analysis
    - Supporting evidence
    - Academic references (87+ citations)
    - Developer information
    """
    try:
        result = pdf_exporter_enhanced.export_comprehensive_report(well_data)
        if 'error' in result:
            raise HTTPException(status_code=500, detail=result['error'])
        return JSONResponse(content=result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate enhanced PDF: {str(e)}")
