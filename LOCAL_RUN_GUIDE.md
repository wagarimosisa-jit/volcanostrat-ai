# 🚀 VolcanoStrat AI - Local Run & Test Guide

## Complete Step-by-Step Guide to Run VolcanoStrat AI Locally

---

## 📋 Prerequisites

### 1. System Requirements
- **Operating System**: Windows 10/11, macOS, or Linux
- **Python**: 3.9 or higher (Python 3.11 recommended)
- **Node.js**: 16.x or higher (LTS version recommended)
- **Memory**: Minimum 8GB RAM (16GB recommended for large datasets)
- **Disk Space**: 5GB free space

### 2. Required Dependencies
- **Backend**: Python packages (FastAPI, pandas, numpy, VTK, etc.)
- **Frontend**: Node.js packages (React, axios, react-icons, etc.)
- **Database**: SQLite (included with Python)

---

## 🛠️ Installation & Setup

### Step 1: Clone the Repository

```bash
# Navigate to your projects directory
cd C:\Users\Hayyuu\volcanostrat-ai

# Initialize git if not already done
git init
git remote add origin https://github.com/wagarimosisa-jit/volcanostrat-ai.git
git fetch
git pull origin main
```

### Step 2: Set Up Virtual Environment (Backend)

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment (Windows)
venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt
```

**Note**: VTK installation might take a few minutes. If you encounter issues:
```bash
# For VTK installation issues
pip install vtk==9.2.6 --pre
```

### Step 3: Set Up Frontend

**In a NEW terminal window:**

```bash
# Navigate to frontend directory
cd C:\Users\Hayyuu\volcanostrat-ai\frontend

# Install Node.js dependencies
npm install

# If you get permission errors, try:
npm install --legacy-peer-deps
```

---

## 🏃 Running the Application

### Step 4: Start the Backend Server

**In Terminal Window 1 (Backend):**

```bash
# Navigate to backend directory
cd C:\Users\Hayyuu\volcanostrat-ai\backend

# Activate virtual environment
venv\Scripts\activate

# Start FastAPI server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Expected Output:**
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process [PID] using StatReload
```

✅ **Backend running at:** `http://localhost:8000`

### Step 5: Start the Frontend Server

**In Terminal Window 2 (Frontend):**

```bash
# Navigate to frontend directory
cd C:\Users\Hayyuu\volcanostrat-ai\frontend

# Start React development server
npm start
```

**Expected Output:**
```
Starting the development server...
Compiled successfully!

You can now view volcanostrat-frontend in the browser.

  Local:            http://localhost:3000
  On Your Network:  http://192.168.x.x:3000
```

✅ **Frontend running at:** `http://localhost:3000`

---

## 🧪 Testing the Application

### Step 6: Verify Connection

1. Open your web browser
2. Navigate to: `http://localhost:3000`
3. Wait for the application to load completely
4. You should see the **VolcanoStrat AI Dashboard** with:
   - Animated volcanic icon (fire + mountain)
   - 6 stat cards showing metrics
   - Feature bar with icons
   - Navigation menu

### Step 7: Test Backend Health Check

1. Open a new browser tab
2. Navigate to: `http://localhost:8000/api/health`
3. You should see:
```json
{
  "status": "healthy",
  "version": "1.0.0"
}
```

### Step 8: Test API Documentation

1. Navigate to: `http://localhost:8000/api/docs`
2. You should see the **Swagger UI** with all API endpoints
3. Test any endpoint directly from the UI

---

## 📤 Uploading and Testing Data

### Step 9: Prepare Test Data

Create a sample CSV file named `test_wells.csv` with the following content:

```csv
Well_ID,X_Coordinate,Y_Coordinate,Elevation_m,Depth_Start_m,Depth_End_m,Raw_Lithology_Description
WELL-01,1000,2000,1500,0,50,Basalt with fractures, vesicular
WELL-01,1000,2000,1500,50,100,Andesite, weathered
WELL-01,1000,2000,1500,100,150,Pyroclastic tuff, highly fractured
WELL-02,1200,2200,1550,0,40,Rhyolite, massive
WELL-02,1200,2200,1550,40,80,Basalt, columnar jointed
WELL-02,1200,2200,1550,80,120,Sedimentary interbed, clayey
```

### Step 10: Upload and Process Data

1. In the VolcanoStrat AI web interface (`http://localhost:3000`)
2. Click on the **Upload** tab
3. Click **Choose File** and select your `test_wells.csv`
4. Click **Upload & Process**
5. Wait for the AI processing to complete

**Expected Results:**
- ✅ Well data appears in the interface
- ✅ Layers are standardized and classified
- ✅ Hydro properties (Aquifer/Aquitard) are predicted
- ✅ Confidence scores are displayed
- ✅ Complexity Reduction Index is calculated

### Step 11: Test AI Geologist

1. Click on the **AI Geologist** tab
2. Try these questions:
   - "What is Ethiopian geology?"
   - "Explain basalt aquifers"
   - "Show me Layer 1 details"
   - "What are the most productive layers?"
   - "What is the East African Rift?"

**Expected Results:**
- ✅ AI responds with detailed geological information
- ✅ References to academic papers are included
- ✅ Global examples are provided

### Step 12: Generate 3D Model

1. Click on the **3D Model** tab
2. Your well data should be visualized in 3D
3. You can rotate, zoom, and pan the model

**Expected Results:**
- ✅ 3D voxel model is displayed
- ✅ Color-coded by lithology or hydro properties
- ✅ Interactive controls work

### Step 13: Generate Cross-Section

1. Click on the **Cross-Section** tab
2. Draw a line on the map or upload a cross-section line Shapefile
3. Generate the 2D profile

**Expected Results:**
- ✅ 2D stratigraphic profile is displayed
- ✅ Layers are shown with their properties
- ✅ Correlations between wells are visible

### Step 14: Export Data

1. Click on the **Export** tab
2. Select export format: CSV, JSON, PDF, Shapefile, VTK, KML
3. Click **Export**
4. Download the file

**Special: Enhanced PDF Export**
1. Use the endpoint: `POST /api/export/enhanced-pdf`
2. Or through the UI, select **Enhanced PDF Report**
3. The PDF will include:
   - Executive summary
   - Well summary tables
   - Layer-by-layer analysis
   - Geological interpretation
   - Complexity reduction analysis
   - Supporting evidence
   - 87+ academic references
   - Developer information

---

## 🔧 Troubleshooting

### Common Issues and Solutions

#### Issue 1: Port Already in Use

**Symptom:** `Address already in use` error

**Solution:**
```bash
# Find and kill the process using port 8000 (Backend)
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Find and kill the process using port 3000 (Frontend)
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

#### Issue 2: Module Not Found Errors

**Symptom:** Python import errors

**Solution:**
```bash
# Activate virtual environment
venv\Scripts\activate

# Reinstall requirements
pip install -r requirements.txt
```

#### Issue 3: VTK Installation Issues

**Symptom:** VTK fails to install

**Solution:**
```bash
# Try with pre-release version
pip install vtk==9.2.6 --pre

# Or install from conda (if you have Anaconda)
conda install -c conda-forge vtk
```

#### Issue 4: CORS Errors

**Symptom:** Frontend can't connect to backend

**Solution:**
1. Ensure backend is running
2. Check that CORS middleware is enabled (it should be by default)
3. Try accessing backend directly: `http://localhost:8000/api/health`

#### Issue 5: Frontend Compilation Errors

**Symptom:** React compilation fails

**Solution:**
```bash
# Delete node_modules and reinstall
rm -rf node_modules
npm cache clean --force
npm install
```

#### Issue 6: Memory Errors with Large Datasets

**Symptom:** Out of memory errors

**Solution:**
- Reduce dataset size
- Increase system memory
- Use smaller test datasets first
- Close other memory-intensive applications

---

## 📊 Verification Checklist

- [ ] Backend server starts without errors
- [ ] Frontend compiles and runs without errors
- [ ] Health check endpoint responds: `http://localhost:8000/api/health`
- [ ] Web interface loads: `http://localhost:3000`
- [ ] CSV file upload works
- [ ] AI Geologist responds to questions
- [ ] 3D model generates
- [ ] Cross-section generates
- [ ] PDF export works (basic and enhanced)
- [ ] All stat cards show correct values
- [ ] Dashboard is visually attractive (Surfer-like)
- [ ] Contact information is displayed

---

## 🌟 Advanced Features to Test

### Shapefile Upload
1. Create a Shapefile with well locations
2. Upload via **Shapefile** tab
3. Verify wells appear on map

### Cross-Section Line Upload
1. Create a polyline Shapefile for cross-section
2. Upload via **Cross-Section** tab
3. Generate 2D profile

### Study Area Upload
1. Create a polygon Shapefile for study area
2. Upload via **Study Area** tab
3. Verify area is displayed

### Multi-Format Export
1. Upload data
2. Export as:
   - CSV
   - JSON
   - Shapefile (.zip)
   - VTK (.vti)
   - KML (.kml)
   - Enhanced PDF
3. Verify all files are valid

---

## 📞 Support

### Contact Information
- **Primary Email**: wagari.mosisa@ju.edu.et
- **Alternate Email**: wagarimosisa@gmail.com
- **GitHub**: https://github.com/wagarimosisa-jit/volcanostrat-ai
- **Developer**: Wagari Mosisa Kitessa

### Getting Help
1. Check this guide for common issues
2. Review the **Help & Support** section in the Dashboard
3. Contact via email for specific problems
4. Open an issue on GitHub for bugs

---

## 🎯 Next Steps

### After Successful Local Testing:

1. **Deploy to Cloud**:
   - Set up Docker containers
   - Deploy to AWS ECS, Google Cloud Run, or Azure
   - Configure custom domain
   - Set up monitoring

2. **Add More Data**:
   - Upload real well log data
   - Test with different volcanic terranes
   - Validate AI predictions with known geology

3. **Customize**:
   - Modify geological ontology
   - Add custom lithology classifications
   - Adjust AI parameters

4. **Contribute**:
   - Report issues on GitHub
   - Submit pull requests
   - Add new features

---

## 📝 Version Information

- **Application Version**: 1.0.0
- **Last Updated**: June 7, 2026
- **Git Commit**: 29f6054
- **Developer**: Wagari Mosisa Kitessa

---

## ✅ Success!

You have successfully:
- ✅ Set up VolcanoStrat AI locally
- ✅ Run both backend and frontend servers
- ✅ Tested all major features
- ✅ Uploaded and processed geological data
- ✅ Generated visualizations and reports

**VolcanoStrat AI is now ready for production use!** 🎉

---

*This guide was generated as part of the VolcanoStrat AI platform enhancement project.*
*For the latest updates, visit: https://github.com/wagarimosisa-jit/volcanostrat-ai*
