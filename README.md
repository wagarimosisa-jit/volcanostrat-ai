# 🌋 VolcanoStrat AI

**AI-Powered Volcanic Aquifer Stratigraphy Platform**

VolcanoStrat AI automatically converts raw well lithology logs into **standardized stratigraphic layers**, **3D voxel models**, and **hydrogeological insights** for volcanic aquifers worldwide.

## ✨ Features

- **📄 Automatic Lithology Standardization**: Converts raw descriptions to global volcanic ontology
- **🎯 Layer-Based Stratigraphy**: Numbered layers (1, 2, 3...) with modifiers-only output
- **🖥️ 3D Voxel Modeling**: GPU-accelerated 3D visualization of aquifer systems
- **📏 Cross-Section Generation**: Instant 2D slices along any line
- **🌍 Google Earth Integration**: View wells and models on satellite imagery
- **💬 AI Geologist Chat**: Natural language queries about your aquifer
- **📥 Multi-Format Export**: CSV, JSON, VTK, KML, PNG
- **🌐 Cloud-Ready**: Deploy to AWS, Google Cloud, or run locally

## 🚀 Quick Start

### Local Development with Docker

```bash
git clone https://github.com/wagarimosisa-jit/volcanostrat-ai.git
cd volcanostrat-ai
docker-compose up
```

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/api/docs

### Manual Setup

**Backend:**
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

**Frontend:**
```bash
cd frontend
npm install
npm start
```

## 📊 API Endpoints

- `POST /api/upload` - Upload CSV well log file
- `POST /api/standardize` - Standardize well data
- `POST /api/3d-model` - Generate 3D voxel model
- `POST /api/cross-section` - Generate 2D cross-section
- `POST /api/export` - Export data in multiple formats
- `GET /api/health` - Health check

## 📝 Input Format (CSV)

Required columns:
- `Well_ID` - Unique well identifier
- `X_Coordinate` - Longitude (decimal degrees)
- `Y_Coordinate` - Latitude (decimal degrees)
- `Elevation_m` - Elevation in meters
- `Depth_Start_m` - Start depth below ground
- `Depth_End_m` - End depth below ground
- `Raw_Lithology_Description` - Raw lithology text

## 🗂️ Project Structure

```
volcanostrat-ai/
├── backend/              # FastAPI backend
│   ├── app/
│   │   ├── main.py
│   │   ├── models/
│   │   ├── services/
│   │   ├── engines/
│   │   └── data/
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/             # React frontend
│   ├── src/
│   │   ├── components/
│   │   ├── App.js
│   │   └── index.js
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
├── .env.example
└── README.md
```

## 📚 Technologies

**Backend:**
- FastAPI - Modern Python web framework
- Pandas - Data processing
- NumPy & SciPy - Scientific computing
- VTK - 3D visualization
- Pydantic - Data validation

**Frontend:**
- React 18 - UI framework
- Three.js - 3D graphics
- Cesium - Maps and Earth visualization
- Axios - HTTP client

## 🔬 References

- Jimma Dissertation (2025) - Volcanic Aquifers
- Upper Awash Basin Study (2025) - Ethiopia
- Canary Islands Study (2021) - Basalt Aquifers
- Hawaii Shield Volcanoes (2005) - Volcanic Hydrology

## 📄 License

MIT License - Feel free to use this project for research and development.

## 👨‍💻 Author

Created for hydrogeological analysis of volcanic aquifers.
