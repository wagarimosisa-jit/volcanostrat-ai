import React, { useState } from 'react';
import axios from 'axios';
import { FaFileAlt, FaCube, FaRulerCombined, FaGlobe, FaComments } from 'react-icons/fa';
import WellLogUploader from './components/WellLogUploader';
import Model3DViewer from './components/Model3DViewer';
import CrossSectionTool from './components/CrossSectionTool';
import ExportPanel from './components/ExportPanel';
import AIChat from './components/AIChat';
import GoogleEarthViewer from './components/GoogleEarthViewer';
import Dashboard from './components/Dashboard';
import './App.css';

function App() {
  const [wells, setWells] = useState([]);
  const [standardizedData, setStandardizedData] = useState(null);
  const [voxelModel, setVoxelModel] = useState(null);
  const [crossSection, setCrossSection] = useState(null);
  const [activeTab, setActiveTab] = useState('upload');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [linePoints, setLinePoints] = useState([
    { x: 0, y: 0 },
    { x: 100, y: 100 }
  ]);
  const [isDashboardExpanded, setIsDashboardExpanded] = useState(false);

  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';

  const handleFileUpload = async (file) => {
    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Use the universal upload endpoint that handles all formats
      const response = await axios.post(`${API_BASE}/api/upload-all-formats`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      // Handle different response types
      if (response.data.standardized) {
        setWells(response.data.standardized.wells);
        setStandardizedData(response.data.standardized);
        if (response.data.model_3d) {
          setVoxelModel(response.data.model_3d.voxel_model);
        }
        if (response.data.cross_section) {
          setCrossSection(response.data.cross_section);
        }
      } else if (response.data.type === 'cross_section_line') {
        // Cross-section line uploaded
        setLinePoints(response.data.line_points || []);
        setActiveTab('cross-section');
      } else if (response.data.type === 'study_area') {
        // Study area uploaded
        console.log('Study area uploaded:', response.data);
        setError('Study area uploaded successfully! Use it for cross-sections.');
      }

    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to process file');
      console.error('Upload error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const generateCrossSection = async () => {
    if (!standardizedData) return;

    setIsLoading(true);
    try {
      const response = await axios.post(`${API_BASE}/api/cross-section`, {
        wells: { wells: wells.map(w => ({
          Well_ID: w.Well_ID,
          X_Coordinate: w.Coordinates.X,
          Y_Coordinate: w.Coordinates.Y,
          Elevation_m: w.Coordinates.Elevation,
          Depth_Start_m: 0,
          Depth_End_m: Math.max(...w.Layers.map(l => l.Depth_End)),
          Raw_Lithology_Description: w.Layers.map(l => l.Modifiers.join(', ')).join('; ')
        }))},
        line_points: linePoints
      });

      setCrossSection(response.data.cross_section);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to generate cross-section');
    } finally {
      setIsLoading(false);
    }
  };

  const exportData = async (exportType, exportFormat) => {
    if (!standardizedData && exportType !== 'pdf') return;

    setIsLoading(true);
    try {
      let response;
      
      // Handle PDF exports separately
      if (exportType === 'pdf') {
        response = await axios.post(`${API_BASE}/api/export/pdf`, {
          wells: { wells: wells.map(w => ({
            Well_ID: w.Well_ID,
            X_Coordinate: w.Coordinates.X,
            Y_Coordinate: w.Coordinates.Y,
            Elevation_m: w.Coordinates.Elevation,
            Depth_Start_m: 0,
            Depth_End_m: Math.max(...w.Layers.map(l => l.Depth_End)),
            Raw_Lithology_Description: w.Layers.map(l => l.Modifiers.join(', ')).join('; ')
          }))},
          export_type: exportFormat,
          project_name: 'VolcanoStrat AI Export'
        });
      } else if (exportType === 'cepr') {
        // Export CEPR data
        response = await axios.post(`${API_BASE}/api/export/cepr`, {
          wells: { wells: wells.map(w => ({
            Well_ID: w.Well_ID,
            X_Coordinate: w.Coordinates.X,
            Y_Coordinate: w.Coordinates.Y,
            Elevation_m: w.Coordinates.Elevation,
            Depth_Start_m: 0,
            Depth_End_m: Math.max(...w.Layers.map(l => l.Depth_End)),
            Raw_Lithology_Description: w.Layers.map(l => l.Modifiers.join(', ')).join('; ')
          }))}
        });
      } else {
        // Standard export
        response = await axios.post(`${API_BASE}/api/export`, {
          wells: { wells: wells.map(w => ({
            Well_ID: w.Well_ID,
            X_Coordinate: w.Coordinates.X,
            Y_Coordinate: w.Coordinates.Y,
            Elevation_m: w.Coordinates.Elevation,
            Depth_Start_m: 0,
            Depth_End_m: Math.max(...w.Layers.map(l => l.Depth_End)),
            Raw_Lithology_Description: w.Layers.map(l => l.Modifiers.join(', ')).join('; ')
          }))},
          export_type: exportType,
          export_format: exportFormat,
          line_points: linePoints
        });
      }

      const { data, filename, format, mime_type } = response.data;
      
      // Decode base64 data if needed
      let blobData = data;
      if (typeof data === 'string' && data.startsWith('data:')) {
        // Base64 encoded
        const base64Data = data.split(',')[1];
        blobData = atob(base64Data);
      } else if ((typeof data === 'string' && format === 'pdf') || mime_type === 'application/pdf') {
        // It's base64 encoded PDF data
        blobData = atob(data);
      }

      // Determine content type
      let contentType = mime_type || 
        (format === 'csv' ? 'text/csv' :
         format === 'png' ? 'image/png' :
         format === 'json' ? 'application/json' :
         format === 'pdf' ? 'application/pdf' :
         format === 'zip' ? 'application/zip' :
         'application/octet-stream');

      // For base64 data, convert to binary
      if (typeof blobData === 'string' && !blobData.startsWith('data:')) {
        const binaryString = atob(blobData);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        blobData = bytes;
      }

      const blob = new Blob([blobData], { type: contentType });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || `export.${format || 'dat'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to export');
      console.error('Export error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = (exportType, exportFormat) => {
    exportData(exportType, exportFormat);
  };

  return (
    <div className="app">
      {/* Dashboard at top */}
      <Dashboard
        wells={wells}
        standardizedData={standardizedData}
        voxelModel={voxelModel}
        onFileUpload={handleFileUpload}
        onExport={handleExport}
        isExpanded={true}
        onToggleExpand={() => setIsDashboardExpanded(!isDashboardExpanded)}
      />

      <div className={`main-content`}>
        <div className="tabs">
          <button
            className={activeTab === 'upload' ? 'active' : ''}
            onClick={() => setActiveTab('upload')}
          >
            <FaFileAlt /> Upload Data
          </button>
          <button
            className={activeTab === '3d' ? 'active' : ''}
            onClick={() => setActiveTab('3d')}
            disabled={!voxelModel}
          >
            <FaCube /> 3D Model
          </button>
          <button
            className={activeTab === 'cross-section' ? 'active' : ''}
            onClick={() => setActiveTab('cross-section')}
            disabled={!standardizedData}
          >
            <FaRulerCombined /> Cross-Section
          </button>
          <button
            className={activeTab === 'google-earth' ? 'active' : ''}
            onClick={() => setActiveTab('google-earth')}
            disabled={!standardizedData}
          >
            <FaGlobe /> Google Earth
          </button>
          <button
            className={activeTab === 'chat' ? 'active' : ''}
            onClick={() => setActiveTab('chat')}
          >
            <FaComments /> AI Geologist
          </button>
        </div>

        <main className="app-main">
        {error && <div className="error-message">{error}</div>}

        {isLoading && (
          <div className="loading-overlay">
            <div className="spinner"></div>
            <p>Processing with AI...</p>
          </div>
        )}

        {activeTab === 'upload' && (
          <WellLogUploader
            onFileUpload={handleFileUpload}
            sampleData={[
              {
                Well_ID: 'JU5',
                X_Coordinate: 36.8155,
                Y_Coordinate: 7.6725,
                Elevation_m: 1780.5,
                Depth_Start_m: 0,
                Depth_End_m: 1.15,
                Raw_Lithology_Description: 'Topsoil'
              },
              {
                Well_ID: 'JU5',
                X_Coordinate: 36.8155,
                Y_Coordinate: 7.6725,
                Elevation_m: 1780.5,
                Depth_Start_m: 1.15,
                Depth_End_m: 30.25,
                Raw_Lithology_Description: 'Slightly fractured basalt with minor clay interbeds'
              }
            ]}
          />
        )}

        {activeTab === '3d' && standardizedData && (
          <div className="model-container">
            <Model3DViewer
              wells={standardizedData.wells}
              voxelModel={voxelModel}
              onLinePointsChange={setLinePoints}
            />
            <ExportPanel
              onExport={exportData}
              availableExports={[
                { type: 'wells', formats: ['csv', 'json', 'shp'] },
                { type: 'layers', formats: ['csv', 'json', 'shp'] },
                { type: 'combined_2d', formats: ['png', 'shp'] },
                { type: 'combined_3d', formats: ['vtk', 'kml', 'shp'] }
              ]}
              wells={wells}
              standardizedData={standardizedData}
            />
          </div>
        )}

        {activeTab === 'cross-section' && standardizedData && (
          <div className="cross-section-container">
            <CrossSectionTool
              crossSection={crossSection}
              onGenerate={generateCrossSection}
              linePoints={linePoints}
              onLinePointsChange={setLinePoints}
              wells={standardizedData.wells}
            />
            <ExportPanel
              onExport={exportData}
              availableExports={[
                { type: 'combined_2d', formats: ['png', 'shp'] },
                { type: 'pdf', formats: ['well_report', 'project_report'] }
              ]}
              wells={wells}
              standardizedData={standardizedData}
            />
          </div>
        )}

        {activeTab === 'google-earth' && standardizedData && (
          <div className="google-earth-container">
            <GoogleEarthViewer wells={standardizedData.wells} />
            <ExportPanel
              onExport={exportData}
              availableExports={[
                { type: 'combined_3d', formats: ['kml', 'shp'] },
                { type: 'wells', formats: ['kml'] },
                { type: 'pdf', formats: ['project_report'] }
              ]}
              wells={wells}
              standardizedData={standardizedData}
            />
          </div>
        )}

        {activeTab === 'chat' && (
          <AIChat
            wells={standardizedData?.wells || []}
            voxelModel={voxelModel}
          />
        )}
      </main>

      <footer className="app-footer">
        <p>© 2026 GVAS - Global Volcanic Aquifer Solutions | Built for you!</p>
        <p className="footer-version">Version 2.0.0 | Developed by: WMK</p>
      </footer>
      </div>
    </div>
  );
}

export default App;
