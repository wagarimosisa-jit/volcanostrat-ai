import React, { useState, useEffect } from 'react';
import { FaVolcano, FaWater, FaChartBar, FaLightbulb, FaGlobe, FaUserGraduate, FaFileImport, FaFileExport, FaQuestionCircle, FaCog, FaInfoCircle, FaEnvelope, FaGithub } from 'react-icons/fa';

const Dashboard = ({ wells, standardizedData, voxelModel, onFileUpload, onExport, metrics }) => {
  const [activeSection, setActiveSection] = useState('overview');
  const [isExpanded, setIsExpanded] = useState(true);

  // Calculate metrics from data
  const calculateMetrics = () => {
    if (!standardizedData || !standardizedData.wells) {
      return {
        totalWells: 0,
        totalLayers: 0,
        aquiferLayers: 0,
        aquitardLayers: 0,
        avgConfidence: 0,
        complexityReduction: 0
      };
    }

    const wellsData = standardizedData.wells;
    const totalWells = wellsData.length;
    let totalLayers = 0;
    let aquiferLayers = 0;
    let aquitardLayers = 0;
    let confidenceSum = 0;
    let confidenceCount = 0;
    const uniqueUnits = new Set();

    wellsData.forEach(well => {
      const layers = well.Layers || [];
      totalLayers += layers.length;
      
      layers.forEach(layer => {
        const hydroProp = layer.Hydro_Property || 'Unknown';
        if (hydroProp.includes('Aquifer')) {
          aquiferLayers++;
        } else if (hydroProp.includes('Aquitard')) {
          aquitardLayers++;
        }
        
        // Calculate complexity reduction
        const key = `${layer.Modifiers ? layer.Modifiers.join(',') : ''}|${hydroProp}`;
        uniqueUnits.add(key);
        
        // Sum confidence
        if (layer.Confidence !== undefined) {
          confidenceSum += layer.Confidence;
          confidenceCount++;
        }
      });
    });

    const avgConfidence = confidenceCount > 0 ? (confidenceSum / confidenceCount * 100).toFixed(1) : 0;
    const complexityReduction = totalLayers > 0 ? (((totalLayers - uniqueUnits.size) / totalLayers) * 100).toFixed(1) : 0;

    return {
      totalWells,
      totalLayers,
      aquiferLayers,
      aquitardLayers,
      avgConfidence,
      complexityReduction
    };
  };

  const metrics = calculateMetrics();

  // Get top productive layers
  const getTopProductiveLayers = () => {
    if (!standardizedData || !standardizedData.wells) return [];
    
    const productiveLayers = [];
    standardizedData.wells.forEach(well => {
      (well.Layers || []).forEach(layer => {
        if (layer.Hydro_Property && layer.Hydro_Property.includes('Aquifer')) {
          productiveLayers.push({
            ...layer,
            Well_ID: well.Well_ID
          });
        }
      });
    });
    
    // Sort by productivity level
    productiveLayers.sort((a, b) => {
      const getProductivityScore = (prop) => {
        if (prop.includes('High')) return 3;
        if (prop.includes('Moderate')) return 2;
        if (prop.includes('Low')) return 1;
        return 0;
      };
      return getProductivityScore(b.Hydro_Property) - getProductivityScore(a.Hydro_Property);
    });
    
    return productiveLayers.slice(0, 5);
  };

  const topProductive = getTopProductiveLayers();

  return (
    <div className="dashboard">
      <div className={`dashboard-container ${isExpanded ? 'expanded' : 'collapsed'}`}>
        {/* Header */}
        <div className="dashboard-header">
          <div className="header-left">
            <h2>
              <FaVolcano className="icon" /> 
              VolcanoStrat AI Dashboard
            </h2>
            <span className="subtitle">Global Volcanic Hydrostratigraphy Platform</span>
          </div>
          <div className="header-right">
            <button 
              className="toggle-btn" 
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? '←' : '→'}
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="quick-stats">
          <div className="stat-card">
            <div className="stat-icon wells"><FaChartBar /></div>
            <div className="stat-info">
              <span className="stat-value">{metrics.totalWells}</span>
              <span className="stat-label">Total Wells</span>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon layers"><FaWater /></div>
            <div className="stat-info">
              <span className="stat-value">{metrics.totalLayers}</span>
              <span className="stat-label">Stratigraphic Layers</span>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon aquifers"><FaWater /></div>
            <div className="stat-info">
              <span className="stat-value">{metrics.aquiferLayers}</span>
              <span className="stat-label">Aquifer Layers</span>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon confidence"><FaLightbulb /></div>
            <div className="stat-info">
              <span className="stat-value">{metrics.avgConfidence}%</span>
              <span className="stat-label">Avg Confidence</span>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon complexity"><FaCog /></div>
            <div className="stat-info">
              <span className="stat-value">{metrics.complexityReduction}%</span>
              <span className="stat-label">Complexity Reduction</span>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon global"><FaGlobe /></div>
            <div className="stat-info">
              <span className="stat-value">Global</span>
              <span className="stat-label">Coverage</span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="dashboard-nav">
          <button 
            className={activeSection === 'overview' ? 'active' : ''} 
            onClick={() => setActiveSection('overview')}
          >
            <FaInfoCircle /> Overview
          </button>
          <button 
            className={activeSection === 'productive' ? 'active' : ''} 
            onClick={() => setActiveSection('productive')}
          >
            <FaWater /> Top Aquifers
          </button>
          <button 
            className={activeSection === 'upload' ? 'active' : ''} 
            onClick={() => setActiveSection('upload')}
          >
            <FaFileImport /> Quick Upload
          </button>
          <button 
            className={activeSection === 'export' ? 'active' : ''} 
            onClick={() => setActiveSection('export')}
          >
            <FaFileExport /> Export
          </button>
          <button 
            className={activeSection === 'help' ? 'active' : ''} 
            onClick={() => setActiveSection('help')}
          >
            <FaQuestionCircle /> Help
          </button>
        </div>

        {/* Content */}
        <div className="dashboard-content">
          {activeSection === 'overview' && (
            <div className="content-section">
              <h3>Platform Overview</h3>
              <p>
                <strong>VolcanoStrat AI</strong> is a global volcanic hydrostratigraphy and aquifer modeling platform 
                that automatically transforms complex, inconsistent well-log descriptions into standardized, 
                scientifically defensible hydrostratigraphic units.
              </p>
              
              <div className="feature-list">
                <div className="feature-item">
                  <FaGlobe className="feature-icon" />
                  <div className="feature-text">
                    <strong>Global Coverage</strong>
                    <p>Supports well data from anywhere in the world with comprehensive volcanic ontology</p>
                  </div>
                </div>
                
                <div className="feature-item">
                  <FaCog className="feature-icon" />
                  <div className="feature-text">
                    <strong>AI-Powered Standardization</strong>
                    <p>Automatic lithology standardization using machine learning and global knowledge base</p>
                  </div>
                </div>
                
                <div className="feature-item">
                  <FaChartBar className="feature-icon" />
                  <div className="feature-text">
                    <strong>Advanced Analytics</strong>
                    <p>3D voxel modeling, cross-section generation, complexity reduction metrics</p>
                  </div>
                </div>
                
                <div className="feature-item">
                  <FaWater className="feature-icon" />
                  <div className="feature-text">
                    <strong>Aquifer Discovery</strong>
                    <p>Identifies promising groundwater targets with confidence scores and reasoning</p>
                  </div>
                </div>
              </div>

              <div className="metrics-summary">
                <h4>Current Project Metrics</h4>
                <ul>
                  <li><strong>Total Wells:</strong> {metrics.totalWells} wells processed</li>
                  <li><strong>Original Descriptions:</strong> {metrics.totalLayers} layer descriptions</li>
                  <li><strong>Standardized Units:</strong> {metrics.totalLayers > 0 ? Math.round(metrics.totalLayers * (1 - metrics.complexityReduction/100)) : 0} unique hydrostratigraphic units</li>
                  <li><strong>Complexity Reduction Index:</strong> {metrics.complexityReduction}% - This represents how much geological complexity has been reduced</li>
                  <li><strong>Average Confidence:</strong> {metrics.avgConfidence}% confidence in classifications</li>
                  <li><strong>Aquifer Potential:</strong> {metrics.aquiferLayers} productive layers out of {metrics.totalLayers} total</li>
                </ul>
              </div>
            </div>
          )}

          {activeSection === 'productive' && (
            <div className="content-section">
              <h3>Top Aquifer Targets</h3>
              <p>Based on AI analysis of your well data, these are the most promising groundwater targets:</p>
              
              {topProductive.length > 0 ? (
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Rank</th>
                        <th>Well ID</th>
                        <th>Layer Type</th>
                        <th>Depth Range</th>
                        <th>Thickness</th>
                        <th>Confidence</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topProductive.map((layer, index) => (
                        <tr key={index}>
                          <td>{index + 1}</td>
                          <td>{layer.Well_ID}</td>
                          <td>{layer.Hydro_Property}</td>
                          <td>{layer.Depth_Start}-{layer.Depth_End} m</td>
                          <td>{layer.Thickness} m</td>
                          <td>{(layer.Confidence * 100).toFixed(1)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="no-data">No aquifer layers identified. Upload well data to see recommendations.</p>
              )}

              <div className="recommendation-box">
                <h4>🎯 AI Recommendation</h4>
                {topProductive.length > 0 ? (
                  <p>
                    The most promising groundwater target is <strong>{topProductive[0].Hydro_Property}</strong> 
                    in well <strong>{topProductive[0].Well_ID}</strong> between 
                    <strong>{topProductive[0].Depth_Start}-{topProductive[0].Depth_End} m depth</strong> 
                    with <strong>{(topProductive[0].Confidence * 100).toFixed(1)}% confidence</strong>.
                  </p>
                ) : (
                  <p>Upload and process your well data to receive AI-powered drilling recommendations.</p>
                )}
              </div>
            </div>
          )}

          {activeSection === 'upload' && (
            <div className="content-section">
              <h3>Quick Upload</h3>
              <p>Upload your well data files (CSV, Shapefile ZIP, or .shp)</p>
              
              <div className="upload-options">
                <div className="upload-option">
                  <h4><FaFileImport /> CSV Upload</h4>
                  <p>Standard format with required columns</p>
                  <input 
                    type="file" 
                    accept=".csv" 
                    onChange={(e) => e.target.files[0] && onFileUpload(e.target.files[0])}
                  />
                </div>
                
                <div className="upload-option">
                  <h4><FaFileImport /> Shapefile Upload</h4>
                  <p>Upload well points, cross-section lines, or study area polygons</p>
                  <input 
                    type="file" 
                    accept=".shp,.zip" 
                    onChange={(e) => e.target.files[0] && onFileUpload(e.target.files[0])}
                  />
                </div>
              </div>

              <div className="info-box">
                <h4>✨ Supported Formats</h4>
                <ul>
                  <li><strong>CSV:</strong> Well logs with required columns</li>
                  <li><strong>Shapefile (ZIP):</strong> Complete shapefile bundle with .shp, .shx, .dbf, .prj</li>
                  <li><strong>Shapefile (.shp):</strong> Single shapefile (requires supporting files)</li>
                  <li><strong>Excel:</strong> Coming soon</li>
                  <li><strong>LAS Files:</strong> Coming soon</li>
                </ul>
              </div>
            </div>
          )}

          {activeSection === 'export' && (
            <div className="content-section">
              <h3>Export Data</h3>
              <p>Download your processed data in various formats</p>
              
              <div className="export-options">
                <div className="export-group">
                  <h4>📊 Well Data</h4>
                  <div className="format-buttons">
                    <button onClick={() => onExport && onExport('wells', 'csv')}>CSV</button>
                    <button onClick={() => onExport && onExport('wells', 'json')}>JSON</button>
                    <button onClick={() => onExport && onExport('wells', 'shp')}>Shapefile</button>
                  </div>
                </div>
                
                <div className="export-group">
                  <h4>🎨 Stratigraphy Layers</h4>
                  <div className="format-buttons">
                    <button onClick={() => onExport && onExport('layers', 'csv')}>CSV</button>
                    <button onClick={() => onExport && onExport('layers', 'json')}>JSON</button>
                    <button onClick={() => onExport && onExport('layers', 'shp')}>Shapefile</button>
                  </div>
                </div>
                
                <div className="export-group">
                  <h4>📏 2D Cross-Section</h4>
                  <div className="format-buttons">
                    <button onClick={() => onExport && onExport('combined_2d', 'png')}>PNG Image</button>
                    <button onClick={() => onExport && onExport('combined_2d', 'shp')}>Shapefile</button>
                  </div>
                </div>
                
                <div className="export-group">
                  <h4>🎲 3D Model</h4>
                  <div className="format-buttons">
                    <button onClick={() => onExport && onExport('combined_3d', 'vtk')}>VTK</button>
                    <button onClick={() => onExport && onExport('combined_3d', 'kml')}>KML</button>
                    <button onClick={() => onExport && onExport('combined_3d', 'shp')}>Shapefile</button>
                  </div>
                </div>
              </div>

              <div className="info-box">
                <h4>ℹ️ Export Information</h4>
                <ul>
                  <li><strong>CSV/JSON:</strong> Tabular data for analysis</li>
                  <li><strong>Shapefile:</strong> GIS-compatible vector data (ZIP format)</li>
                  <li><strong>VTK:</strong> 3D visualization format for ParaView and other tools</li>
                  <li><strong>KML:</strong> Google Earth compatible format</li>
                  <li><strong>PNG:</strong> Image format for reports and presentations</li>
                </ul>
              </div>
            </div>
          )}

          {activeSection === 'help' && (
            <div className="content-section">
              <h3>Help & Support</h3>
              
              <div className="help-section">
                <h4><FaQuestionCircle /> Quick Start Guide</h4>
                <ol>
                  <li>Upload your well data (CSV or Shapefile)</li>
                  <li>Review the standardized results</li>
                  <li>Explore 3D model and cross-sections</li>
                  <li>Ask the AI Geologist questions</li>
                  <li>Export your data in various formats</li>
                </ol>
              </div>

              <div className="help-section">
                <h4><FaEnvelope /> Contact Information</h4>
                <p>
                  For support, questions, or feedback, please contact:
                </p>
                <ul>
                  <li>
                    <strong>Primary:</strong> 
                    <a href="mailto:wagari.mosisa@ju.edu.et" target="_blank" rel="noopener noreferrer">
                      wagari.mosisa@ju.edu.et
                    </a>
                  </li>
                  <li>
                    <strong>Alternate:</strong> 
                    <a href="mailto:wagarimosisa@gmail.com" target="_blank" rel="noopener noreferrer">
                      wagarimosisa@gmail.com
                    </a>
                  </li>
                </ul>
              </div>

              <div className="help-section">
                <h4><FaUserGraduate /> Web Developer</h4>
                <p>
                  <strong>Wagari Mosisa Kitessa</strong><br />
                  <span className="role">Lead Developer & Geologist</span>
                </p>
                <p>
                  VolcanoStrat AI was developed to address the challenge of standardizing 
                  heterogeneous volcanic well log data for hydrogeological analysis and 
                  aquifer characterization at regional to basin scales.
                </p>
              </div>

              <div className="help-section">
                <h4><FaGithub /> Connect on GitHub</h4>
                <p>
                  View the source code, contribute, or report issues:
                </p>
                <p>
                  <a 
                    href="https://github.com/wagarimosisa-jit/volcanostrat-ai" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="github-link"
                  >
                    <FaGithub /> wagarimosisa-jit/volcanostrat-ai
                  </a>
                </p>
              </div>

              <div className="help-section">
                <h4><FaInfoCircle /> About VolcanoStrat AI</h4>
                <p>
                  <strong>Mission:</strong> To transform heterogeneous volcanic well logs into 
                  uncertainty-aware hydrostratigraphic knowledge models and groundwater 
                  decision-support systems.
                </p>
                <p>
                  <strong>Vision:</strong> Enable hydrogeologists, researchers, consultants, 
                  water agencies, and academic institutions worldwide to build consistent, 
                  explainable, and reproducible subsurface models from heterogeneous well data.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="dashboard-footer">
          <p>
            © {new Date().getFullYear()} VolcanoStrat AI | 
            Built with ❤️ for Hydrogeologists Worldwide
          </p>
          <p className="version">Version 1.0.0 | Global Volcanic Hydrostratigraphy Platform</p>
        </div>
      </div>

      <style jsx>{`
        .dashboard {
          display: flex;
          height: 100%;
        }
        
        .dashboard-container {
          width: 350px;
          background-color: #1a237e;
          color: white;
          display: flex;
          flex-direction: column;
          transition: width 0.3s ease;
          box-shadow: 2px 0 4px rgba(0,0,0,0.2);
        }
        
        .dashboard-container.collapsed {
          width: 60px;
        }
        
        .dashboard-container.collapsed .dashboard-header h2,
        .dashboard-container.collapsed .subtitle,
        .dashboard-container.collapsed .dashboard-nav button span,
        .dashboard-container.collapsed .dashboard-content,
        .dashboard-container.collapsed .dashboard-footer {
          display: none;
        }
        
        .dashboard-header {
          padding: 1.5rem;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 1px solid rgba(255,255,255,0.2);
        }
        
        .header-left h2 {
          margin: 0;
          font-size: 1.1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .header-left .icon {
          font-size: 1.3rem;
        }
        
        .subtitle {
          font-size: 0.75rem;
          opacity: 0.8;
          margin-top: 0.25rem;
          display: block;
        }
        
        .toggle-btn {
          background: rgba(255,255,255,0.2);
          border: none;
          color: white;
          width: 30px;
          height: 30px;
          border-radius: 0.25rem;
          cursor: pointer;
          font-size: 1rem;
        }
        
        .quick-stats {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.5rem;
          padding: 1rem;
          border-bottom: 1px solid rgba(255,255,255,0.2);
        }
        
        .dashboard-container.collapsed .quick-stats {
          display: none;
        }
        
        .stat-card {
          background: rgba(255,255,255,0.1);
          padding: 0.75rem;
          border-radius: 0.5rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .stat-icon {
          width: 30px;
          height: 30px;
          border-radius: 0.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.9rem;
        }
        
        .stat-icon.wells { background: rgba(76, 175, 222, 0.3); }
        .stat-icon.layers { background: rgba(114, 189, 95, 0.3); }
        .stat-icon.aquifers { background: rgba(52, 152, 219, 0.3); }
        .stat-icon.confidence { background: rgba(241, 196, 15, 0.3); }
        .stat-icon.complexity { background: rgba(155, 89, 182, 0.3); }
        .stat-icon.global { background: rgba(26, 188, 156, 0.3); }
        
        .stat-info {
          display: flex;
          flex-direction: column;
        }
        
        .stat-value {
          font-size: 1.2rem;
          font-weight: 700;
        }
        
        .stat-label {
          font-size: 0.7rem;
          opacity: 0.8;
        }
        
        .dashboard-nav {
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          border-bottom: 1px solid rgba(255,255,255,0.2);
        }
        
        .dashboard-nav button {
          background: transparent;
          border: none;
          color: rgba(255,255,255,0.8);
          padding: 0.5rem 0.75rem;
          text-align: left;
          border-radius: 0.25rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.9rem;
          transition: all 0.2s;
        }
        
        .dashboard-nav button:hover {
          background: rgba(255,255,255,0.1);
          color: white;
        }
        
        .dashboard-nav button.active {
          background: rgba(255,255,255,0.2);
          color: white;
        }
        
        .dashboard-content {
          flex: 1;
          padding: 1.5rem;
          overflow-y: auto;
        }
        
        .content-section {
          color: white;
        }
        
        .content-section h3 {
          margin-top: 0;
          color: white;
          font-size: 1.2rem;
          margin-bottom: 1rem;
        }
        
        .content-section p {
          line-height: 1.6;
          margin-bottom: 1rem;
        }
        
        .feature-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin: 1rem 0;
        }
        
        .feature-item {
          display: flex;
          gap: 1rem;
          padding: 1rem;
          background: rgba(255,255,255,0.05);
          border-radius: 0.5rem;
        }
        
        .feature-icon {
          font-size: 1.5rem;
          color: #4da6ff;
          flex-shrink: 0;
        }
        
        .feature-text strong {
          display: block;
          margin-bottom: 0.25rem;
        }
        
        .feature-text p {
          margin: 0;
          font-size: 0.85rem;
          opacity: 0.9;
        }
        
        .metrics-summary {
          margin-top: 1.5rem;
          padding: 1rem;
          background: rgba(255,255,255,0.05);
          border-radius: 0.5rem;
        }
        
        .metrics-summary h4 {
          margin-top: 0;
          color: #4da6ff;
        }
        
        .metrics-summary ul {
          margin: 0.5rem 0 0 1rem;
          padding: 0;
        }
        
        .metrics-summary li {
          margin-bottom: 0.5rem;
          font-size: 0.85rem;
        }
        
        .table-container {
          margin: 1rem 0;
          overflow-x: auto;
        }
        
        .data-table {
          width: 100%;
          border-collapse: collapse;
          color: white;
        }
        
        .data-table th,
        .data-table td {
          padding: 0.75rem;
          text-align: left;
          border-bottom: 1px solid rgba(255,255,255,0.2);
        }
        
        .data-table th {
          background: rgba(255,255,255,0.1);
          font-weight: 600;
        }
        
        .data-table tr:hover {
          background: rgba(255,255,255,0.05);
        }
        
        .no-data {
          color: rgba(255,255,255,0.6);
          font-style: italic;
        }
        
        .recommendation-box {
          margin-top: 1.5rem;
          padding: 1rem;
          background: rgba(76, 175, 222, 0.2);
          border-left: 3px solid #4da6ff;
          border-radius: 0.25rem;
        }
        
        .recommendation-box h4 {
          margin-top: 0;
          color: #4da6ff;
        }
        
        .upload-options {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin: 1rem 0;
        }
        
        .upload-option {
          padding: 1rem;
          background: rgba(255,255,255,0.05);
          border-radius: 0.5rem;
          border: 1px dashed rgba(255,255,255,0.3);
        }
        
        .upload-option h4 {
          margin-top: 0;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .upload-option p {
          font-size: 0.85rem;
          opacity: 0.8;
          margin: 0.25rem 0;
        }
        
        .upload-option input[type="file"] {
          margin-top: 0.5rem;
          width: 100%;
        }
        
        .export-options {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin: 1rem 0;
        }
        
        .export-group {
          padding: 1rem;
          background: rgba(255,255,255,0.05);
          border-radius: 0.5rem;
        }
        
        .export-group h4 {
          margin-top: 0;
          color: #4da6ff;
        }
        
        .format-buttons {
          display: flex;
          gap: 0.5rem;
          margin-top: 0.5rem;
        }
        
        .format-buttons button {
          padding: 0.5rem 1rem;
          background: rgba(255,255,255,0.15);
          border: 1px solid rgba(255,255,255,0.3);
          border-radius: 0.25rem;
          color: white;
          cursor: pointer;
          font-size: 0.85rem;
        }
        
        .format-buttons button:hover {
          background: rgba(255,255,255,0.25);
        }
        
        .info-box {
          margin-top: 1.5rem;
          padding: 1rem;
          background: rgba(241, 196, 15, 0.1);
          border-left: 3px solid #f1c40f;
          border-radius: 0.25rem;
        }
        
        .info-box h4 {
          margin-top: 0;
          color: #f1c40f;
        }
        
        .info-box ul {
          margin: 0.5rem 0 0 1rem;
          padding: 0;
        }
        
        .info-box li {
          margin-bottom: 0.5rem;
          font-size: 0.85rem;
        }
        
        .help-section {
          margin-bottom: 2rem;
        }
        
        .help-section h4 {
          margin-bottom: 0.5rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .help-section ol {
          margin: 0.5rem 0 0 1rem;
          padding: 0;
        }
        
        .help-section li {
          margin-bottom: 0.5rem;
        }
        
        .help-section a {
          color: #4da6ff;
          text-decoration: none;
        }
        
        .help-section a:hover {
          text-decoration: underline;
        }
        
        .github-link {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: rgba(255,255,255,0.1);
          border-radius: 0.25rem;
        }
        
        .role {
          font-size: 0.85rem;
          opacity: 0.8;
        }
        
        .dashboard-footer {
          padding: 1rem;
          border-top: 1px solid rgba(255,255,255,0.2);
          text-align: center;
          font-size: 0.8rem;
          opacity: 0.8;
        }
        
        .dashboard-footer p {
          margin: 0;
          line-height: 1.5;
        }
        
        .version {
          font-size: 0.7rem;
          margin-top: 0.25rem;
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
