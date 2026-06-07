# 🌋 VolcanoStrat AI - Causal Subsurface Intelligence Engine (CSIE)

**VolcanoStrat AI is an explainable AI platform that transforms heterogeneous volcanic well logs into uncertainty-aware hydrostratigraphic knowledge models and groundwater decision-support systems.**

This is **NOT** just another geological modeling tool. VolcanoStrat AI answers a fundamentally different question:

- **Traditional Tools:** *"What is underground?"* (description)
- **VolcanoStrat AI:** *"Why is it like this, and what caused it?"* (causal understanding)

## 🚀 Key Innovation: Causal Stratigraphy

Instead of treating geology as static layers, every subsurface feature becomes a **cause-effect chain**:

```
Basalt Eruption → Rapid Cooling → High Fracture Density → Increased Permeability → Aquifer Formation
```

Each well log is transformed from a static description to a **Causal Earth Process Record (CEPR)** that encodes the geological processes that created the subsurface.

## 🌍 Platform Capabilities

### ✅ Core Features Implemented

1. **Causal Subsurface Intelligence Engine (CSIE)**
   - Causal Knowledge Graph with volcanic process relationships
   - CEPR transformation: Static descriptions → Causal records
   - Explainable correlations with reasoning chains
   - What-If Geology Simulator
   - Causal Similarity between wells (process history, not just lithology)
   - Predictive Aquifer Discovery Engine

2. **Multi-Format Support**
   - **Import:** CSV, Excel (.xlsx, .xls), LAS, GeoJSON, Shapefile (.shp, .zip)
   - **Export:** CSV, JSON, PDF Reports, Shapefile, VTK, KML, PNG

3. **Global Volcanic Hydrostratigraphy**
   - Comprehensive volcanic ontology (basalt, andesite, rhyolite, pyroclastic, sedimentary)
   - Global coordinate system support (WGS84)
   - Layer correlation across multiple wells with confidence scores

4. **Advanced Metrics**
   - **Causal Connectivity Index (CCI):** Measures process network connectivity
   - **Formation Energy Proxy (FEP):** Estimates geological energy of formation
   - **Hydro-Causal Stability Score (HCSS):** Assesses aquifer formation stability
   - **Complexity Reduction Index:** Quantifies data simplification

5. **3D Modeling & Visualization**
   - 3D voxel geological models
   - 2D cross-section generation
   - Interactive visualization with Cesium/Google Earth

6. **AI Geologist**
   - Natural language queries
   - Step-by-step guidance
   - Aquifer discovery recommendations
   - Uncertainty analysis

7. **Comprehensive Dashboard**
   - Real-time metrics display
   - Contact information: wagari.mosisa@ju.edu.et, wagarimosisa@gmail.com
   - Developer: Wagari Mosisa Kitessa
   - Attractive UI with modern icons

8. **Database Integration**
   - SQLite (default) and PostgreSQL support
   - Persistent storage of well data and analysis results
   - Audit logging for uploads and exports

9. **Security & Production Ready**
   - CORS configured for development
   - HTTPS recommended for production
   - Input validation on all endpoints
   - Comprehensive error handling

## 🎯 Mission Statement

**VolcanoStrat AI transforms heterogeneous volcanic well logs into standardized, explainable hydrostratigraphic knowledge models and groundwater decision-support systems.**

This enables hydrogeologists, researchers, consultants, water agencies, and academic institutions worldwide to:
- Build consistent, explainable, and reproducible subsurface models
- Reduce geological complexity and uncertainty
- Make data-driven groundwater management decisions
- Understand the geological processes that created aquifer systems

## 📦 Installation

### Prerequisites

- Python 3.9+
- Node.js 16+
- pip (Python package manager)
- npm (Node package manager)

### Backend Setup

```bash
cd volcanostrat-ai/backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### Frontend Setup

```bash
cd volcanostrat-ai/frontend

# Install dependencies
npm install
```

## 🚀 Running the Application (TWO TERMINAL METHOD)

### Terminal 1: Start Backend

**Windows (using start_backend.bat):**
```bash
start_backend.bat
```

**Manual command:**
```bash
cd volcanostrat-ai/backend
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Mac/Linux
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend will be available at: `http://localhost:8000`
API Docs: `http://localhost:8000/api/docs`

### Terminal 2: Start Frontend

**Windows (using start_frontend.bat):**
```bash
start_frontend.bat
```

**Manual command:**
```bash
cd volcanostrat-ai/frontend
npm start
```

Frontend will be available at: `http://localhost:3000`

## 📚 Usage Guide

### Uploading Data

1. Navigate to the "Upload Data" tab
2. Drag & drop files or click to select
3. Supported formats:
   - **CSV:** Standard comma-separated format
   - **Excel:** .xlsx, .xls files with well data
   - **LAS:** Log ASCII Standard format
   - **GeoJSON:** Geospatial JSON with well locations
   - **Shapefile:** .shp files or ZIP archives

4. View preview of CSV data
5. Data is automatically processed and standardized

### Viewing 3D Models

1. Upload well data
2. Click on the "3D Model" tab
3. Explore the interactive 3D visualization
4. Export as VTK, KML, or Shapefile

### Generating Cross-Sections

1. Upload well data
2. Click on the "Cross-Section" tab
3. Define cross-section line by clicking on the map
4. Generate 2D cross-section
5. Export as PNG or Shapefile

### Using the AI Geologist

1. Click on the "AI Geologist" tab
2. Ask questions like:
   - "What are the most productive layers?"
   - "Show me Layer 2 details"
   - "Why is Layer 3 an aquitard?"
   - "Explain how this aquifer formed"
   - "What would happen if cooling was faster?"

### Causal Analysis

Access advanced causal analysis through API endpoints:

```bash
# Transform to Causal Earth Process Records
POST /api/causal/analyze

# Run What-If scenarios
POST /api/causal/what-if?scenario="What if eruption rate was lower?"

# Compare wells causally
POST /api/causal/compare?well_id1=JU5&well_id2=JU7

# Predict aquifer targets
POST /api/causal/predict

# Visualize causal relationships
GET /api/causal/visualization?well_id=JU5
```

### Exporting Data

1. Click on the export panel in any visualization tab
2. Select export format:
   - **CSV:** Tabular data
   - **JSON:** Structured data
   - **Shapefile:** GIS vector data
   - **PDF:** Comprehensive reports
   - **VTK:** 3D visualization format
   - **KML:** Google Earth format
   - **PNG:** Images

## 🌐 API Endpoints

### Standardization & Modeling
- `POST /api/standardize` - Standardize well logs
- `POST /api/3d-model` - Generate 3D voxel model
- `POST /api/cross-section` - Generate 2D cross-section
- `GET /api/health` - Health check
- `GET /api/info` - API information

### File Upload
- `POST /api/upload` - Universal upload (all formats)
- `POST /api/upload-all-formats` - Enhanced universal upload
- `POST /api/upload-shapefile` - Shapefile upload
- `POST /api/upload-cross-section-shapefile` - Cross-section line upload
- `POST /api/upload-study-area` - Study area polygon upload
- `POST /api/upload/excel` - Excel file upload
- `POST /api/upload/las` - LAS file upload
- `POST /api/upload/geojson` - GeoJSON file upload

### Data Export
- `POST /api/export` - Export data (CSV, JSON, Shapefile)
- `POST /api/export-shapefile` - Shapefile export
- `POST /api/export/pdf` - PDF report export
- `POST /api/export/cepr` - CEPR JSON export

### CSIE Endpoints
- `POST /api/causal/analyze` - Causal analysis (CEPR transformation)
- `POST /api/causal/what-if` - What-If scenario simulation
- `POST /api/causal/compare` - Causal similarity comparison
- `POST /api/causal/predict` - Predictive aquifer targets
- `GET /api/causal/visualization` - Causal graph visualization

## 📊 Dashboard Features

The dashboard provides:
- **Overview:** Platform description, key features, current metrics
- **Real-time Metrics:**
  - Total wells
  - Total stratigraphic layers
  - Aquifer layers count
  - Average confidence percentage
  - Complexity reduction index
  - Global coverage indicator
- **Top Aquifer Targets:** Ranked list with productivity levels
- **AI Recommendations:** Automated suggestions and insights
- **Quick Upload:** Drag & drop interface for all formats
- **Export Options:** All supported export formats
- **Help Section:** Quick start guide, contact info, developer credits

## 🎨 UI Features

- **Modern Design:** Attractive, intuitive interface
- **Icons:** Font Awesome icons via react-icons
- **Responsive:** Works on desktop, tablet, and mobile
- **Interactive:** Drag & drop uploads, clickable visualizations
- **Real-time:** Live metrics and updates

## 🔬 Scientific Methodology

### Causal Knowledge Graph

The system uses a knowledge graph of cause-effect relationships:

```
Volcanic Eruption → Cooling & Solidification → Fracturing & Jointing → Water Storage → Aquifer Formation
          ↓
    Pyroclastic Deposition → Permeability Increase
          ↓
    Sedimentation → Compaction → Porosity Decrease
          ↓
    Hydrothermal Activity → Clay Alteration → Aquitard Formation
```

### New Metrics

1. **Causal Connectivity Index (CCI):** 0-1 scale measuring how strongly geological processes connect
2. **Formation Energy Proxy (FEP):** 0-100 scale estimating geological formation energy
3. **Hydro-Causal Stability Score (HCSS):** 0-1 scale assessing aquifer formation stability

### Complexity Reduction

```
Original descriptions: 2,431
Standardized lithologies: 183
Hydrostratigraphic units: 27
Complexity Reduction Index = 98.9%
```

## 🌍 Global Coverage

### Supported Lithologies
- Basalt (mafic lava)
- Andesite (intermediate lava)
- Rhyolite (felsic lava)
- Ignimbrite (pyroclastic flow)
- Tuff (pyroclastic fall)
- Clay (sedimentary)
- Alluvium (sedimentary)

### Global Studies Integrated
- Jimma Dissertation (2025) - Ethiopia
- Upper Awash Basin Study (2025) - Ethiopia
- Canary Islands Study (2021) - Spain
- Hawaii Shield Volcanoes (2005) - USA

### Coordinate Systems
- WGS84 (default)
- Auto-detection from input files
- Full projection support

## 🛠️ Development

### Project Structure

```
volcanostrat-ai/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI endpoints
│   │   ├── services/
│   │   │   ├── causal_engine.py     # CSIE engine
│   │   │   ├── file_importers.py   # Multi-format importers
│   │   │   ├── ai_geologist_base.py # AI analysis
│   │   │   └── shapefile_importer.py # Shapefile support
│   │   ├── engines/
│   │   │   ├── pdf_exporter.py      # PDF report generation
│   │   │   └── shapefile_exporter.py # Shapefile export
│   │   └── models/
│   │       ├── database.py       # SQLAlchemy models
│   │       ├── well_log.py        # Pydantic well models
│   │       └── response.py        # API response models
│   ├── requirements.txt         # Python dependencies
│   └── venv/                    # Virtual environment
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Dashboard.jsx      # Main dashboard
│   │   │   ├── WellLogUploader.jsx # Multi-format uploader
│   │   │   ├── ExportPanel.jsx     # Enhanced export panel
│   │   │   ├── AIChat.jsx         # AI geologist interface
│   │   │   └── ...                # Other components
│   │   ├── App.js               # Main app
│   │   └── App.css              # Styles
│   └── package.json            # Node dependencies
├── tests/
│   ├── test_causal_engine.py    # CSIE tests
│   └── test_file_importers.py  # Importer tests
├── start_backend.bat           # Backend start script
├── start_frontend.bat          # Frontend start script
└── README.md                   # This file
```

### Testing

Run all tests:
```bash
cd backend
python -m pytest tests/ -v
```

Run with coverage:
```bash
cd backend
python -m pytest tests/ --cov=app --cov-report=html
```

### Database Configuration

By default, SQLite is used (`sqlite:///./volcanostrat.db`).

To use PostgreSQL, set the `DATABASE_URL` environment variable:
```bash
export DATABASE_URL=postgresql://username:password@localhost/dbname
```

### Environment Variables

- `DATABASE_URL`: Database connection URL (default: SQLite)
- `DEBUG`: Enable debug mode (default: False)

## 📦 Dependencies

### Backend (Python)
- fastapi: Web framework
- uvicorn: ASGI server
- pandas: Data manipulation
- numpy: Numerical computing
- geopandas: Geospatial operations
- shapely: Geometry operations
- networkx: Graph operations
- lasio: LAS file reading
- reportlab: PDF generation
- sqlalchemy: Database ORM
- pytest: Testing framework

### Frontend (JavaScript)
- react: UI framework
- react-dom: React DOM
- react-icons: Icon library
- axios: HTTP client
- react-dropzone: Drag & drop uploads
- papaparse: CSV parsing
- file-saver: File downloads
- cesium: 3D visualization
- three: 3D graphics

## 🌟 Key Innovations

1. **Causal Stratigraphy:** Transforms static descriptions to causal process records
2. **Explainable AI:** Provides reasoning chains for all correlations and predictions
3. **What-If Simulator:** Predicts outcomes of different geological scenarios
4. **Causal Similarity:** Compares wells based on process history, not just lithology
5. **Predictive Discovery:** Finds missing aquifer patterns
6. **Complexity Reduction:** Quantifies and reduces geological complexity
7. **Global Ontology:** Comprehensive volcanic lithology classification

## 📞 Contact & Support

**For questions, support, or feedback:**

- **Primary:** [wagari.mosisa@ju.edu.et](mailto:wagari.mosisa@ju.edu.et)
- **Alternate:** [wagarimosisa@gmail.com](mailto:wagarimosisa@gmail.com)

**Developer:**
- **Wagari Mosisa Kitessa** - Lead Developer & Geologist

**Repository:**
- [GitHub: wagarimosisa-jit/volcanostrat-ai](https://github.com/wagarimosisa-jit/volcanostrat-ai)

## 🎓 Academic References

- Jimma Dissertation (2025) - Ethiopia volcanic aquifer studies
- Upper Awash Basin Study (2025) - Regional hydrogeology
- Canary Islands Study (2021) - Oceanic island volcanism
- Hawaii Shield Volcanoes (2005) - Basaltic aquifer characterization

## 📜 License

This project is proprietary software developed by Wagari Mosisa Kitessa for hydrogeological research and application.

## 🙏 Acknowledgments

- Built with ❤️ for Hydrogeologists worldwide
- Powered by FastAPI, React, and modern AI/ML technologies
- Special thanks to the open-source community

---

**© 2026 VolcanoStrat AI | Wagari Mosisa Kitessa**
