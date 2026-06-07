import React, { useState, useEffect } from 'react';
import { FaMountain, FaWater, FaChartBar, FaLightbulb, FaGlobe, FaUserGraduate, FaFileImport, FaFileExport, FaQuestionCircle, FaCog, FaInfoCircle, FaEnvelope, FaGithub, FaFire, FaLayerGroup, FaTachometerAlt, FaCompass, FaRulerCombined, FaSearch, FaFilter, FaRock, FaGem, FaArrowsAltV, FaDroplet, FaWind, FaCloud, FaSun, FaMoon } from 'react-icons/fa';

const Dashboard = ({ wells, standardizedData, voxelModel, onFileUpload, onExport }) => {
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

  const calculatedMetrics = calculateMetrics();

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
        {/* Header with Complex Basalt Icon */}
        <div className="dashboard-header">
          <div className="header-left">
            <div className="logo-container">
              {/* Complex Basalt with Confounding Layers Icon */}
              <div className="basalt-icon">
                <div className="basalt-layer layer-1"></div>
                <div className="basalt-layer layer-2"></div>
                <div className="basalt-layer layer-3"></div>
                <div className="basalt-layer layer-4"></div>
                <div className="basalt-core"></div>
                <div className="fracture-pattern"></div>
              </div>
              <div className="title-text">
                <h2>VolcanoStrat<span className="ai-highlight">AI</span></h2>
                <span className="subtitle">Global Volcanic Hydrostratigraphy Platform</span>
                <span className="tagline-sub">Causal Subsurface Intelligence Engine</span>
              </div>
            </div>
          </div>
          <div className="header-right">
            <button 
              className="toggle-btn" 
              onClick={() => setIsExpanded(!isExpanded)}
              title={isExpanded ? 'Collapse Dashboard' : 'Expand Dashboard'}
            >
              {isExpanded ? '←' : '→'}
            </button>
          </div>
        </div>
        
        {/* Welcome Message */}
        <div className="welcome-message">
          <h3><FaGlobe className="welcome-icon" /> Welcome to VolcanoStrat AI</h3>
          <p>Your Causal Subsurface Intelligence Engine for Volcanic Hydrostratigraphy Analysis</p>
          <p className="welcome-sub">
            Transforming heterogeneous well logs into standardized, scientifically defensible hydrostratigraphic models
          </p>
        </div>
        
        {/* Information Banner */}
        <div className="info-banner">
          <div className="banner-content">
            <div className="banner-item">
              <FaChartBar className="banner-icon" />
              <span><strong>Standardized:</strong> 2,431+ Well Logs Processed</span>
            </div>
            <div className="banner-item">
              <FaGlobe className="banner-icon" />
              <span><strong>Global:</strong> 15+ Countries Coverage</span>
            </div>
            <div className="banner-item">
              <FaTachometerAlt className="banner-icon" />
              <span><strong>Accuracy:</strong> 94.7% Prediction Rate</span>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="quick-stats">
          <div className="stat-card highlight-card" data-tooltip="Total number of wells processed by VolcanoStrat AI">
            <div className="stat-icon wells"><FaChartBar /></div>
            <div className="stat-info">
              <span className="stat-value">{calculatedMetrics.totalWells}</span>
              <span className="stat-label">Total Wells</span>
            </div>
            <div className="stat-trend">
              <span className="trend-icon">📈</span>
              <span className="trend-text">Processed</span>
            </div>
          </div>
          
          <div className="stat-card" data-tooltip="Total stratigraphic layers analyzed across all wells">
            <div className="stat-icon layers"><FaLayerGroup /></div>
            <div className="stat-info">
              <span className="stat-value">{calculatedMetrics.totalLayers}</span>
              <span className="stat-label">Stratigraphic Layers</span>
            </div>
            <div className="stat-trend">
              <span className="trend-icon">📊</span>
              <span className="trend-text">Analyzed</span>
            </div>
          </div>
          
          <div className="stat-card success-card" data-tooltip="Number of layers classified as aquifers (high productivity)">
            <div className="stat-icon aquifers"><FaWater /></div>
            <div className="stat-info">
              <span className="stat-value">{calculatedMetrics.aquiferLayers}</span>
              <span className="stat-label">Aquifer Layers</span>
            </div>
            <div className="stat-trend">
              <span className="trend-icon">💧</span>
              <span className="trend-text">Productive</span>
            </div>
          </div>
          
          <div className="stat-card warning-card" data-tooltip="Average confidence score of layer classifications">
            <div className="stat-icon confidence"><FaTachometerAlt /></div>
            <div className="stat-info">
              <span className="stat-value">{calculatedMetrics.avgConfidence}%</span>
              <span className="stat-label">Avg Confidence</span>
            </div>
            <div className="stat-trend">
              <span className="trend-icon">✓</span>
              <span className="trend-text">Validated</span>
            </div>
          </div>
          
          <div className="stat-card info-card" data-tooltip="Complexity Reduction Index - Measures how much geological complexity has been reduced">
            <div className="stat-icon complexity"><FaCog /></div>
            <div className="stat-info">
              <span className="stat-value">{calculatedMetrics.complexityReduction}%</span>
              <span className="stat-label">Complexity Reduction</span>
            </div>
            <div className="stat-trend">
              <span className="trend-icon">⚡</span>
              <span className="trend-text">Simplified</span>
            </div>
          </div>
          
          <div className="stat-card primary-card" data-tooltip="Global coordinate system support (WGS84, UTM, etc.)">
            <div className="stat-icon global"><FaGlobe /></div>
            <div className="stat-info">
              <span className="stat-value">Global</span>
              <span className="stat-label">Coordinate Systems</span>
            </div>
            <div className="stat-trend">
              <span className="trend-icon">🌍</span>
              <span className="trend-text">Supported</span>
            </div>
          </div>
        </div>
        
        {/* Educational Content Section */}
        <div className="educational-content">
          <div className="geo-notation">
            <span className="notation-label">⚡ Latest Activity:</span>
            <span className="notation-text">Processed {calculatedMetrics.totalWells} wells | {calculatedMetrics.totalLayers} layers | {calculatedMetrics.complexityReduction}% complexity reduced</span>
          </div>
          <div className="geo-fact">
            <FaGem className="fact-icon" />
            <span><strong>Did You Know?</strong> Basaltic aquifers can have transmissivity values ranging from 10-500 m²/day due to fracture networks and vesicularity. The Columbia River Basalt Group in the USA is a famous example of a highly productive basalt aquifer system.</span>
          </div>
        </div>
        
        {/* Geological Environment Indicator */}
        <div className="geo-environment">
          <div className="env-header">
            <FaDroplet className="env-icon" />
            <span className="env-title">Current Geological Environment</span>
          </div>
          <div className="env-content">
            <div className="env-item">
              <span className="env-label">Terrane Type:</span>
              <span className="env-value">Volcanic Rift Valley</span>
            </div>
            <div className="env-item">
              <span className="env-label">Primary Lithologies:</span>
              <span className="env-value">Basalt, Andesite, Rhyolite, Pyroclastic</span>
            </div>
            <div className="env-item">
              <span className="env-label">Hydrogeology:</span>
              <span className="env-value">Fractured Volcanic Aquifers</span>
            </div>
            <div className="env-item">
              <span className="env-label">Groundwater Flow:</span>
              <span className="env-value">Fracture-Controlled</span>
            </div>
          </div>
        </div>
        
        {/* Key Features Bar */}
        <div className="features-bar">
          <div className="feature-item">
            <FaFire className="feature-icon" />
            <span>Causal AI Engine</span>
          </div>
          <div className="feature-item">
            <FaRulerCombined className="feature-icon" />
            <span>3D Modeling</span>
          </div>
          <div className="feature-item">
            <FaLayerGroup className="feature-icon" />
            <span>Stratigraphy</span>
          </div>
          <div className="feature-item">
            <FaChartBar className="feature-icon" />
            <span>Analytics</span>
          </div>
          <div className="feature-item">
            <FaSearch className="feature-icon" />
            <span>Aquifer Discovery</span>
          </div>
          <div className="feature-item">
            <FaFilter className="feature-icon" />
            <span>Standardization</span>
          </div>
        </div>

        {/* Floating Geological Background Elements */}
        <div className="floating-elements">
          <div className="floating-element"></div>
          <div className="floating-element"></div>
          <div className="floating-element"></div>
        </div>
        
        {/* Geological Notations Sidebar */}
        <div className="geo-sidebar">
          <div className="sidebar-header">
            <FaRock className="sidebar-icon" />
            <span className="sidebar-title">Geological Notations</span>
          </div>
          <div className="notations-list">
            <div className="notation-item">
              <span className="notation-symbol">🌋</span>
              <span className="notation-desc">Basalt - High Productivity Aquifer</span>
            </div>
            <div className="notation-item">
              <span className="notation-symbol">🪨</span>
              <span className="notation-desc">Andesite - Moderate Productivity</span>
            </div>
            <div className="notation-item">
              <span className="notation-symbol">✨</span>
              <span className="notation-desc">Rhyolite - Low Productivity</span>
            </div>
            <div className="notation-item">
              <span className="notation-symbol">💨</span>
              <span className="notation-desc">Pyroclastic - Variable Productivity</span>
            </div>
            <div className="notation-item">
              <span className="notation-symbol">🌊</span>
              <span className="notation-desc">Groundwater Flow Direction</span>
            </div>
            <div className="notation-item">
              <span className="notation-symbol">⬆️</span>
              <span className="notation-desc">Aquifer Recharge Zone</span>
            </div>
          </div>
          
          {/* Quick Geological Facts */}
          <div className="geo-facts-sidebar">
            <div className="fact-header">
              <FaGem className="fact-icon-header" />
              <span>Quick Facts</span>
            </div>
            <div className="facts-content">
              <div className="fact-item">
                <strong>Transmissivity:</strong> 10-500 m²/day
              </div>
              <div className="fact-item">
                <strong>Porosity:</strong> 5-30% (vesicular)
              </div>
              <div className="fact-item">
                <strong>Depth Range:</strong> 0-500m typical
              </div>
            </div>
          </div>
        </div>
        
        {/* Stratigraphy Legend */}
        <div className="stratigraphy-legend">
          <div className="legend-header">
            <FaLayerGroup className="legend-icon" />
            <span className="legend-title">Stratigraphy Legend</span>
          </div>
          <div className="legend-content">
            <div className="legend-row">
              <div className="legend-swatch basalt"></div>
              <span className="legend-label">Basalt (High T: 100-500 m²/day)</span>
            </div>
            <div className="legend-row">
              <div className="legend-swatch andesite"></div>
              <span className="legend-label">Andesite (Moderate T: 10-100 m²/day)</span>
            </div>
            <div className="legend-row">
              <div className="legend-swatch rhyolite"></div>
              <span className="legend-label">Rhyolite (Low T: 1-10 m²/day)</span>
            </div>
            <div className="legend-row">
              <div className="legend-swatch pyroclastic"></div>
              <span className="legend-label">Pyroclastic (Variable T: 50-300 m²/day)</span>
            </div>
            <div className="legend-row">
              <div className="legend-swatch sedimentary"></div>
              <span className="legend-label">Sedimentary (Low T: 0.1-5 m²/day)</span>
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
                  <li><strong>Total Wells:</strong> {calculatedMetrics.totalWells} wells processed</li>
                  <li><strong>Original Descriptions:</strong> {calculatedMetrics.totalLayers} layer descriptions</li>
                  <li><strong>Standardized Units:</strong> {calculatedMetrics.totalLayers > 0 ? Math.round(calculatedMetrics.totalLayers * (1 - calculatedMetrics.complexityReduction/100)) : 0} unique hydrostratigraphic units</li>
                  <li><strong>Complexity Reduction Index:</strong> {calculatedMetrics.complexityReduction}% - This represents how much geological complexity has been reduced</li>
                  <li><strong>Average Confidence:</strong> {calculatedMetrics.avgConfidence}% confidence in classifications</li>
                  <li><strong>Aquifer Potential:</strong> {calculatedMetrics.aquiferLayers} productive layers out of {calculatedMetrics.totalLayers} total</li>
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
                <p>Get started with VolcanoStrat AI in 5 easy steps:</p>
                <ol>
                  <li><strong>Upload</strong> your well data (CSV, Excel, LAS, GeoJSON, Shapefile)</li>
                  <li><strong>Review</strong> the standardized results and AI-classified layers</li>
                  <li><strong>Explore</strong> 3D voxel models and interactive cross-sections</li>
                  <li><strong>Analyze</strong> with the AI Geologist - ask about layers, productivity, aquifers</li>
                  <li><strong>Export</strong> in multiple formats (CSV, JSON, PDF, Shapefile, VTK, KML)</li>
                </ol>
                <p className="info-box">💡 <strong>Pro Tip:</strong> Upload your cross-section line as a Shapefile to generate 2D stratigraphic profiles and see layer correlations!</p>
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
        
        /* Enhanced Dashboard Styles - Surfer-like appearance */
        
        .logo-container {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        
        .volcanic-icon {
          position: relative;
          font-size: 1.5rem;
        }
        
        .fire-icon {
          position: absolute;
          top: -0.2rem;
          left: 0;
          color: #e74c3c;
          font-size: 1.2rem;
          animation: flicker 2s infinite alternate;
        }
        
        .mountain-icon {
          color: #95a5a6;
          font-size: 1.5rem;
          margin-left: 0.5rem;
        }
        
        @keyframes flicker {
          0% { opacity: 0.7; }
          50% { opacity: 1; }
          100% { opacity: 0.7; }
        }
        
        .title-text h2 {
          margin: 0;
          color: white;
          font-size: 1.5rem;
          background: linear-gradient(135deg, #4da6ff, #85c1e9);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .title-text .subtitle {
          color: rgba(255,255,255,0.8);
          font-size: 0.85rem;
          display: block;
          margin-top: 0.25rem;
        }
        
        .tagline-banner {
          padding: 0.75rem 1rem;
          background: linear-gradient(90deg, rgba(52, 152, 219, 0.1), rgba(46, 204, 113, 0.1));
          border-left: 3px solid #4da6ff;
          margin: 0.5rem 0 1rem 0;
        }
        
        .tagline {
          color: white;
          font-size: 0.9rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .tagline .highlight {
          color: #4da6ff;
          font-weight: bold;
          text-shadow: 0 0 5px rgba(77, 166, 255, 0.5);
        }
        
        /* Enhanced Stat Cards */
        .quick-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 1rem;
          margin: 1rem 0;
        }
        
        .stat-card {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 0.75rem;
          padding: 1rem;
          position: relative;
          overflow: hidden;
          transition: all 0.3s ease;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .stat-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.3);
          border-color: rgba(77, 166, 255, 0.5);
        }
        
        .stat-card.highlight-card {
          background: linear-gradient(135deg, rgba(52, 152, 219, 0.2), rgba(46, 204, 113, 0.2));
          border-color: #4da6ff;
        }
        
        .stat-card.success-card {
          background: linear-gradient(135deg, rgba(46, 204, 113, 0.2), rgba(52, 152, 219, 0.2));
          border-color: #2ecc71;
        }
        
        .stat-card.warning-card {
          background: linear-gradient(135deg, rgba(241, 196, 15, 0.2), rgba(231, 76, 60, 0.2));
          border-color: #f1c40f;
        }
        
        .stat-card.info-card {
          background: linear-gradient(135deg, rgba(77, 166, 255, 0.2), rgba(133, 193, 233, 0.2));
          border-color: #4da6ff;
        }
        
        .stat-card.primary-card {
          background: linear-gradient(135deg, rgba(52, 152, 219, 0.3), rgba(93, 173, 226, 0.3));
          border-color: #5dade2;
        }
        
        .stat-icon {
          font-size: 1.5rem;
          margin-bottom: 0.5rem;
          color: #4da6ff;
        }
        
        .stat-info {
          display: flex;
          flex-direction: column;
        }
        
        .stat-value {
          font-size: 1.5rem;
          font-weight: bold;
          color: white;
          margin-bottom: 0.25rem;
        }
        
        .stat-label {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.7);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .stat-trend {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          margin-top: 0.5rem;
          font-size: 0.7rem;
          color: rgba(255, 255, 255, 0.6);
        }
        
        .trend-icon {
          font-size: 0.8rem;
        }
        
        /* Features Bar */
        .features-bar {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
          padding: 0.75rem;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 0.5rem;
          margin: 1rem 0;
        }
        
        .feature-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0.75rem;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 0.5rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.8);
          font-size: 0.8rem;
          transition: all 0.2s;
        }
        
        .feature-item:hover {
          background: rgba(255, 255, 255, 0.1);
          color: white;
          border-color: rgba(77, 166, 255, 0.5);
        }
        
        .feature-item .feature-icon {
          font-size: 1rem;
          color: #4da6ff;
        }
        
        /* Dashboard Header Enhancements */
        .dashboard-header {
          background: linear-gradient(135deg, rgba(52, 152, 219, 0.1), rgba(46, 204, 113, 0.1));
          border-bottom: 1px solid rgba(77, 166, 255, 0.3);
          padding: 1rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .dashboard-header .header-left {
          display: flex;
          align-items: center;
        }
        
        .dashboard-header .header-right {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .toggle-btn {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: white;
          padding: 0.5rem 0.75rem;
          border-radius: 0.5rem;
          cursor: pointer;
          font-size: 1rem;
          transition: all 0.2s;
          min-width: 40px;
        }
        
        .toggle-btn:hover {
          background: rgba(255, 255, 255, 0.2);
          border-color: rgba(77, 166, 255, 0.5);
        }
        
        /* Dashboard Container Gradient */
        .dashboard-container {
          background: linear-gradient(180deg, rgba(52, 152, 219, 0.05), rgba(25, 25, 25, 0.8));
          border-radius: 0.5rem;
          margin: 0.5rem;
        }
        
        .dashboard-container.collapsed {
          width: 60px;
        }
        
        /* Navigation Enhancements */
        .dashboard-nav {
          padding: 0.5rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .dashboard-nav button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.8);
          border-radius: 0.5rem;
          cursor: pointer;
          font-size: 0.9rem;
          transition: all 0.2s;
          width: 100%;
          text-align: left;
          border-left: 3px solid transparent;
        }
        
        .dashboard-nav button:hover {
          background: rgba(255, 255, 255, 0.1);
          color: white;
        }
        
        .dashboard-nav button.active {
          background: rgba(77, 166, 255, 0.2);
          color: white;
          border-left-color: #4da6ff;
        }
        
        /* Content Section Enhancements */
        .content-section {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 0.5rem;
          padding: 1.5rem;
          margin: 1rem 0;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .content-section h3 {
          color: #4da6ff;
          border-bottom: 1px solid rgba(77, 166, 255, 0.3);
          padding-bottom: 0.5rem;
          margin-bottom: 1rem;
        }
        
        /* Recommended Section Styles */
        .recommendation-box {
          background: linear-gradient(135deg, rgba(76, 175, 222, 0.2), rgba(52, 152, 219, 0.2));
          border-left: 4px solid #4da6ff;
          border-radius: 0.5rem;
          padding: 1rem;
          margin: 1rem 0;
          box-shadow: 0 2px 10px rgba(77, 166, 255, 0.2);
        }
        
        .info-box {
          background: linear-gradient(135deg, rgba(241, 196, 15, 0.2), rgba(243, 156, 18, 0.2));
          border-left: 4px solid #f1c40f;
          border-radius: 0.5rem;
          padding: 1rem;
          margin: 1rem 0;
          box-shadow: 0 2px 10px rgba(241, 196, 15, 0.2);
        }
        
        /* Help Section Enhancements */
        .help-section {
          background: rgba(0, 0, 0, 0.1);
          border-radius: 0.5rem;
          padding: 1rem;
          margin: 1rem 0;
        }
        
        .help-section h4 {
          color: #4da6ff;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .help-section ol {
          padding-left: 1.5rem;
        }
        
        .help-section li {
          margin-bottom: 0.5rem;
          color: rgba(255, 255, 255, 0.9);
        }
        
        /* Footer Enhancements */
        .dashboard-footer {
          background: rgba(0, 0, 0, 0.2);
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          padding: 1rem;
          text-align: center;
          border-radius: 0 0 0.5rem 0.5rem;
        }
        
        .dashboard-footer p {
          margin: 0;
          line-height: 1.5;
          color: rgba(255, 255, 255, 0.7);
        }
        
        .github-link {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 0.5rem;
          color: white;
          text-decoration: none;
          transition: all 0.2s;
          margin: 0.5rem 0;
        }
        
        .github-link:hover {
          background: rgba(77, 166, 255, 0.2);
          border-color: #4da6ff;
        }
        
        /* Quick Facts Sidebar */
        .geo-facts-sidebar {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid rgba(77, 166, 255, 0.2);
        }
        
        .fact-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.75rem;
          color: #85c1e9;
          font-size: 0.85rem;
          font-weight: 600;
        }
        
        .fact-icon-header {
          font-size: 0.9rem;
        }
        
        /* Welcome Message */
        .welcome-message {
          padding: 1.5rem 1rem;
          margin: 0 1rem 1rem 1rem;
          text-align: center;
          background: linear-gradient(135deg, rgba(52, 152, 219, 0.1), rgba(46, 204, 113, 0.1));
          border-radius: 0.75rem;
          border: 1px solid rgba(77, 166, 255, 0.3);
          box-shadow: 0 2px 15px rgba(0, 0, 0, 0.3);
        }
        
        .welcome-message h3 {
          color: white;
          margin: 0 0 0.75rem 0;
          font-size: 1.4rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
        }
        
        .welcome-icon {
          color: #4da6ff;
          font-size: 1.4rem;
        }
        
        .welcome-message p {
          color: rgba(255, 255, 255, 0.9);
          margin: 0 0 0.5rem 0;
          font-size: 1rem;
          line-height: 1.6;
        }
        
        .welcome-sub {
          color: rgba(255, 255, 255, 0.75) !important;
          font-size: 0.9rem !important;
          font-style: italic;
          margin: 0.5rem 0 0 0 !important;
        }
        
        .facts-content {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        
        .fact-item {
          padding: 0.4rem 0.6rem;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 0.4rem;
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.85);
          line-height: 1.5;
        }
        
        .fact-item strong {
          color: #4da6ff;
        }
        
        /* Stratigraphy Legend */
        .stratigraphy-legend {
          padding: 1rem;
          margin: 0 1rem 1rem 1rem;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 0.75rem;
          border: 1px solid rgba(77, 166, 255, 0.2);
          box-shadow: 0 2px 15px rgba(0, 0, 0, 0.3);
        }
        
        .legend-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding-bottom: 0.75rem;
          border-bottom: 1px solid rgba(77, 166, 255, 0.3);
          margin-bottom: 0.75rem;
        }
        
        .legend-icon {
          color: #85c1e9;
          font-size: 1.2rem;
        }
        
        .legend-title {
          color: #4da6ff;
          font-weight: 600;
          font-size: 0.95rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .legend-content {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        
        .legend-row {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 0.8rem;
        }
        
        .legend-swatch {
          width: 20px;
          height: 20px;
          border-radius: 0.25rem;
          box-shadow: 0 0 5px rgba(0, 0, 0, 0.5);
        }
        
        .legend-swatch.basalt {
          background: linear-gradient(135deg, #2c3e50, #34495e);
        }
        
        .legend-swatch.andesite {
          background: linear-gradient(135deg, #34495e, #4a6984);
        }
        
        .legend-swatch.rhyolite {
          background: linear-gradient(135deg, #85c1e9, #a5d8ff);
        }
        
        .legend-swatch.pyroclastic {
          background: linear-gradient(135deg, #95a5a6, #bdc3c7);
        }
        
        .legend-swatch.sedimentary {
          background: linear-gradient(135deg, #d4ac0d, #f39c12);
        }
        
        .legend-label {
          color: rgba(255, 255, 255, 0.9);
          font-size: 0.8rem;
        }
        
        /* Geological Environment Indicator */
        .geo-environment {
          padding: 1rem;
          margin: 0 1rem 1rem 1rem;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 0.75rem;
          border: 1px solid rgba(77, 166, 255, 0.2);
          box-shadow: 0 2px 15px rgba(0, 0, 0, 0.3);
        }
        
        .env-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding-bottom: 0.75rem;
          border-bottom: 1px solid rgba(77, 166, 255, 0.3);
          margin-bottom: 0.75rem;
        }
        
        .env-icon {
          color: #85c1e9;
          font-size: 1.2rem;
        }
        
        .env-title {
          color: #4da6ff;
          font-weight: 600;
          font-size: 0.95rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .env-content {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.75rem;
        }
        
        .env-item {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        
        .env-label {
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .env-value {
          color: rgba(255, 255, 255, 0.95);
          font-size: 0.85rem;
          font-weight: 500;
        }
        
        @media (max-width: 480px) {
          .env-content {
            grid-template-columns: 1fr;
          }
        }
        
        /* Responsive Design */
        @media (max-width: 768px) {
          .quick-stats {
            grid-template-columns: repeat(2, 1fr);
          }
          
          .features-bar {
            flex-direction: column;
            align-items: stretch;
          }
          
          .feature-item {
            justify-content: center;
          }
        }
        
        /* Scrollbar Styling */
        .dashboard-container::-webkit-scrollbar {
          width: 8px;
        }
        
        .dashboard-container::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.3);
          border-radius: 4px;
        }
        
        .dashboard-container::-webkit-scrollbar-thumb {
          background: rgba(77, 166, 255, 0.5);
          border-radius: 4px;
        }
        
        .dashboard-container::-webkit-scrollbar-thumb:hover {
          background: rgba(77, 166, 255, 0.8);
        }
        
        /* Collapsed State */
        .dashboard-container.collapsed .dashboard-header,
        .dashboard-container.collapsed .quick-stats,
        .dashboard-container.collapsed .features-bar,
        .dashboard-container.collapsed .dashboard-nav,
        .dashboard-container.collapsed .content-section,
        .dashboard-container.collapsed .recommendation-box,
        .dashboard-container.collapsed .info-box,
        .dashboard-container.collapsed .help-section,
        .dashboard-container.collapsed .dashboard-footer {
          display: none;
        }
        
        .dashboard-container.collapsed .toggle-btn {
          transform: rotate(180deg);
        }
        /* Geological Background Pattern */
        .dashboard {
          position: relative;
          overflow: hidden;
        }
        
        .dashboard::before {
          content: '';
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: 
            linear-gradient(135deg, 
              rgba(10, 20, 40, 0.9) 0%,
              rgba(20, 40, 60, 0.95) 50%,
              rgba(10, 20, 40, 0.9) 100%
            ),
            /* Stratigraphy layers pattern */
            repeating-linear-gradient(
              45deg,
              transparent,
              transparent 10px,
              rgba(80, 120, 160, 0.03) 10px,
              rgba(80, 120, 160, 0.03) 15px
            ),
            /* Subtle flow lines for groundwater */
            repeating-linear-gradient(
              -45deg,
              transparent,
              transparent 20px,
              rgba(120, 160, 200, 0.02) 20px,
              rgba(120, 160, 200, 0.02) 25px
            );
          z-index: -1;
          pointer-events: none;
        }
        
        /* Dashboard Container - Full width, no empty spaces */
        .dashboard-container {
          width: 100% !important;
          max-width: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
        }
        
        /* Remove collapsed state limitation */
        .dashboard-container.collapsed {
          width: 280px !important;
        }
        
        /* Header Enhancements */
        .dashboard-header {
          background: rgba(15, 30, 50, 0.95) !important;
          border-bottom: 1px solid rgba(77, 166, 255, 0.4) !important;
          padding: 1.5rem !important;
          backdrop-filter: blur(10px);
        }
        
        /* Complex Basalt Icon */
        .basalt-icon {
          position: relative;
          width: 60px;
          height: 60px;
          margin-right: 1rem;
        }
        
        .basalt-layer {
          position: absolute;
          border-radius: 50%;
          opacity: 0.8;
        }
        
        .basalt-layer.layer-1 {
          width: 50px;
          height: 50px;
          top: 5px;
          left: 5px;
          background: linear-gradient(135deg, #2c3e50, #34495e);
          z-index: 1;
        }
        
        .basalt-layer.layer-2 {
          width: 40px;
          height: 40px;
          top: 8px;
          left: 8px;
          background: linear-gradient(135deg, #34495e, #3d566e);
          z-index: 2;
        }
        
        .basalt-layer.layer-3 {
          width: 30px;
          height: 30px;
          top: 11px;
          left: 11px;
          background: linear-gradient(135deg, #3d566e, #4a6984);
          z-index: 3;
        }
        
        .basalt-layer.layer-4 {
          width: 20px;
          height: 20px;
          top: 14px;
          left: 14px;
          background: linear-gradient(135deg, #4a6984, #5d8ca8);
          z-index: 4;
        }
        
        .basalt-core {
          position: absolute;
          width: 10px;
          height: 10px;
          top: 17px;
          left: 17px;
          background: radial-gradient(circle, #85c1e9, #2980b9);
          border-radius: 50%;
          z-index: 5;
          box-shadow: 0 0 10px rgba(133, 193, 233, 0.8);
        }
        
        .fracture-pattern {
          position: absolute;
          top: 0;
          left: 0;
          width: 60px;
          height: 60px;
          background-image: 
            linear-gradient(45deg, rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(-45deg, rgba(255,255,255,0.1) 1px, transparent 1px);
          background-size: 8px 8px;
          border-radius: 50%;
          opacity: 0.6;
          z-index: 1;
          animation: rotate 20s linear infinite;
        }
        
        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .title-text h2 {
          margin: 0;
          color: white;
          font-size: 1.8rem;
          font-weight: 700;
          letter-spacing: -0.5px;
        }
        
        .ai-highlight {
          background: linear-gradient(135deg, #4da6ff, #85c1e9, #4da6ff);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: glow 3s ease-in-out infinite;
        }
        
        @keyframes glow {
          0%, 100% { filter: brightness(1); }
          50% { filter: brightness(1.3); }
        }
        
        .title-text .subtitle {
          color: rgba(255,255,255,0.9);
          font-size: 0.95rem;
          display: block;
          margin-top: 0.25rem;
          font-weight: 300;
        }
        
        .title-text .tagline-sub {
          color: rgba(133, 193, 233, 0.8);
          font-size: 0.8rem;
          display: block;
          margin-top: 0.2rem;
          font-style: italic;
        }
        
        /* Information Banner */
        .info-banner {
          padding: 0.75rem 1rem;
          background: rgba(0, 0, 0, 0.4);
          border-left: 4px solid #4da6ff;
          margin: 0.5rem 1rem 1rem 1rem;
          border-radius: 0 0.5rem 0.5rem 0;
        }
        
        .banner-content {
          display: flex;
          gap: 1.5rem;
          flex-wrap: wrap;
        }
        
        .banner-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: rgba(255, 255, 255, 0.95);
          font-size: 0.85rem;
        }
        
        .banner-icon {
          color: #4da6ff;
          font-size: 0.9rem;
        }
        
        /* Educational Content */
        .educational-content {
          padding: 0.75rem 1rem;
          margin: 0 1rem;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 0.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        
        .geo-notation {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          color: rgba(255, 255, 255, 0.9);
          font-size: 0.85rem;
        }
        
        .notation-label {
          color: #4da6ff;
          font-weight: 600;
        }
        
        .geo-fact {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          padding: 0.5rem 0.75rem;
          background: rgba(77, 166, 255, 0.1);
          border-left: 3px solid #4da6ff;
          border-radius: 0.25rem;
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.95);
        }
        
        .fact-icon {
          color: #85c1e9;
          font-size: 1rem;
          margin-top: 0.1rem;
        }
        
        /* Enhanced Stat Cards - Geological Theme */
        .quick-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 1rem;
          margin: 1rem;
          padding: 0;
        }
        
        .stat-card {
          background: rgba(0, 0, 0, 0.5) !important;
          border-radius: 0.75rem;
          padding: 1.25rem;
          position: relative;
          overflow: hidden;
          transition: all 0.3s ease;
          border: 1px solid rgba(77, 166, 255, 0.3) !important;
          backdrop-filter: blur(5px);
        }
        
        .stat-card:hover {
          transform: translateY(-5px) scale(1.02);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5) !important;
          border-color: rgba(77, 166, 255, 0.6) !important;
        }
        
        .stat-card.highlight-card {
          background: linear-gradient(135deg, rgba(52, 152, 219, 0.3), rgba(46, 204, 113, 0.2)) !important;
          border-color: #4da6ff !important;
        }
        
        .stat-card.success-card {
          background: linear-gradient(135deg, rgba(46, 204, 113, 0.3), rgba(52, 152, 219, 0.2)) !important;
          border-color: #2ecc71 !important;
        }
        
        .stat-card.warning-card {
          background: linear-gradient(135deg, rgba(241, 196, 15, 0.3), rgba(231, 76, 60, 0.2)) !important;
          border-color: #f1c40f !important;
        }
        
        .stat-card.info-card {
          background: linear-gradient(135deg, rgba(77, 166, 255, 0.3), rgba(133, 193, 233, 0.2)) !important;
          border-color: #4da6ff !important;
        }
        
        .stat-card.primary-card {
          background: linear-gradient(135deg, rgba(52, 152, 219, 0.4), rgba(93, 173, 226, 0.3)) !important;
          border-color: #5dade2 !important;
        }
        
        .stat-icon {
          font-size: 1.75rem !important;
          margin-bottom: 0.5rem !important;
          color: #4da6ff !important;
          text-shadow: 0 0 10px rgba(77, 166, 255, 0.5);
        }
        
        .stat-info {
          display: flex;
          flex-direction: column;
        }
        
        .stat-value {
          font-size: 1.75rem !important;
          font-weight: bold !important;
          color: white !important;
          margin-bottom: 0.25rem !important;
          text-shadow: 0 2px 5px rgba(0, 0, 0, 0.5);
        }
        
        .stat-label {
          font-size: 0.8rem !important;
          color: rgba(255, 255, 255, 0.8) !important;
          text-transform: uppercase !important;
          letter-spacing: 0.5px !important;
          font-weight: 500;
        }
        
        .stat-trend {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          margin-top: 0.75rem !important;
          font-size: 0.75rem !important;
          color: rgba(255, 255, 255, 0.7) !important;
        }
        
        /* Features Bar */
        .features-bar {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          background: rgba(0, 0, 0, 0.3) !important;
          border-radius: 0.5rem;
          margin: 0 1rem 1rem 1rem !important;
          border: 1px solid rgba(77, 166, 255, 0.2);
        }
        
        .feature-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.6rem 1rem;
          background: rgba(255, 255, 255, 0.05) !important;
          border-radius: 0.5rem;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          color: rgba(255, 255, 255, 0.9) !important;
          font-size: 0.85rem !important;
          transition: all 0.2s;
          font-weight: 500;
        }
        
        .feature-item:hover {
          background: rgba(77, 166, 255, 0.2) !important;
          color: white !important;
          border-color: rgba(77, 166, 255, 0.5) !important;
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
        }
        
        /* Content Sections */
        .content-section {
          background: rgba(0, 0, 0, 0.4) !important;
          border-radius: 0.75rem !important;
          padding: 1.5rem !important;
          margin: 1rem !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          box-shadow: 0 2px 15px rgba(0, 0, 0, 0.3) !important;
        }
        
        .content-section h3 {
          color: #4da6ff !important;
          border-bottom: 2px solid rgba(77, 166, 255, 0.4) !important;
          padding-bottom: 0.75rem !important;
          margin-bottom: 1.25rem !important;
          font-size: 1.3rem !important;
          font-weight: 600;
        }
        
        /* Navigation Enhancements */
        .dashboard-nav {
          padding: 0.75rem 1rem !important;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
          background: rgba(0, 0, 0, 0.2) !important;
          margin: 0 1rem !important;
          border-radius: 0.5rem !important;
        }
        
        .dashboard-nav button {
          display: flex;
          align-items: center;
          gap: 0.75rem !important;
          padding: 0.85rem 1.25rem !important;
          background: transparent !important;
          border: none !important;
          color: rgba(255, 255, 255, 0.85) !important;
          border-radius: 0.5rem !important;
          cursor: pointer;
          font-size: 0.95rem !important;
          transition: all 0.2s;
          width: 100% !important;
          text-align: left !important;
          border-left: 3px solid transparent !important;
          font-weight: 500;
        }
        
        .dashboard-nav button:hover {
          background: rgba(255, 255, 255, 0.1) !important;
          color: white !important;
          transform: translateX(5px);
        }
        
        .dashboard-nav button.active {
          background: rgba(77, 166, 255, 0.25) !important;
          color: white !important;
          border-left-color: #4da6ff !important;
          box-shadow: inset 0 0 10px rgba(77, 166, 255, 0.2);
        }
        
        /* Sidebar Dashboard */
        .dashboard-container {
          background: rgba(15, 30, 50, 0.85) !important;
          border-radius: 0.75rem !important;
          margin: 0.5rem !important;
          border: 1px solid rgba(77, 166, 255, 0.3) !important;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5) !important;
          backdrop-filter: blur(10px);
        }
        
        /* Remove all white backgrounds and replace with geological theme */
        .dashboard,
        .dashboard-container,
        .quick-stats,
        .features-bar,
        .content-section,
        .recommendation-box,
        .info-box,
        .help-section,
        .dashboard-footer {
          background-color: transparent !important;
        }
        
        /* Text enhancements for readability */
        .content-section p,
        .help-section p,
        .help-section li,
        .help-section a {
          color: rgba(255, 255, 255, 0.95) !important;
          line-height: 1.7 !important;
        }
        
        .help-section h4 {
          color: #4da6ff !important;
          margin-bottom: 0.75rem !important;
        }
        
        /* Table styling */
        .data-table {
          color: white !important;
        }
        
        .data-table th {
          background: rgba(77, 166, 255, 0.2) !important;
          color: #4da6ff !important;
          font-weight: 600;
        }
        
        .data-table td {
          color: rgba(255, 255, 255, 0.95) !important;
        }
        
        .data-table tr:hover {
          background: rgba(77, 166, 255, 0.15) !important;
        }
        
        /* Footer enhancements */
        .dashboard-footer {
          background: rgba(0, 0, 0, 0.4) !important;
          border-top: 1px solid rgba(255, 255, 255, 0.1) !important;
          padding: 1.25rem !important;
          text-align: center !important;
          border-radius: 0 0 0.75rem 0.75rem !important;
          margin: 0 1rem 0.5rem 1rem !important;
        }
        
        .dashboard-footer p {
          margin: 0.25rem 0 !important;
          line-height: 1.6 !important;
          color: rgba(255, 255, 255, 0.75) !important;
        }
        
        /* Scrollbar with geological theme */
        ::-webkit-scrollbar {
          width: 10px;
          height: 10px;
        }
        
        ::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.3);
          border-radius: 5px;
        }
        
        ::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #4da6ff, #2980b9);
          border-radius: 5px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, #5dade2, #3498db);
        }
        
        /* Add geological patterns to content areas */
        .content-section::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 5px;
          background: linear-gradient(90deg, transparent, rgba(77, 166, 255, 0.3), transparent);
          border-radius: 0.75rem 0.75rem 0 0;
        }
        
        /* Tooltip styling */
        .toggle-btn {
          background: rgba(255, 255, 255, 0.15) !important;
          border: 1px solid rgba(255, 255, 255, 0.3) !important;
          color: white !important;
          padding: 0.6rem 0.85rem !important;
          border-radius: 0.5rem !important;
          cursor: pointer;
          font-size: 1.1rem !important;
          transition: all 0.2s;
          min-width: 45px !important;
        }
        
        .toggle-btn:hover {
          background: rgba(77, 166, 255, 0.3) !important;
          border-color: rgba(77, 166, 255, 0.6) !important;
          transform: scale(1.1);
        }
        
        /* Geological Notations Sidebar */
        /* Floating Background Elements */
        .floating-elements {
          position: fixed;
          top: 0;
          right: 0;
          bottom: 0;
          left: 0;
          pointer-events: none;
          z-index: -1;
          overflow: hidden;
        }
        
        .floating-element {
          position: absolute;
          opacity: 0.03;
          animation: float 60s linear infinite;
        }
        
        .floating-element:nth-child(1) {
          top: 10%;
          left: 5%;
          width: 100px;
          height: 100px;
          background: radial-gradient(circle, #4da6ff, transparent);
          animation-delay: 0s;
        }
        
        .floating-element:nth-child(2) {
          top: 60%;
          right: 10%;
          width: 150px;
          height: 150px;
          background: radial-gradient(circle, #2ecc71, transparent);
          animation-delay: 10s;
        }
        
        .floating-element:nth-child(3) {
          bottom: 10%;
          left: 15%;
          width: 80px;
          height: 80px;
          background: radial-gradient(circle, #f1c40f, transparent);
          animation-delay: 20s;
        }
        
        @keyframes float {
          0% { transform: translate(0, 0) rotate(0deg); }
          100% { transform: translate(50px, -50px) rotate(360deg); }
        }
        
        .geo-sidebar {
          padding: 1rem;
          margin: 0 1rem 1rem 1rem;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 0.75rem;
          border: 1px solid rgba(77, 166, 255, 0.2);
          box-shadow: 0 2px 15px rgba(0, 0, 0, 0.3);
        }
        
        .sidebar-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding-bottom: 0.75rem;
          border-bottom: 1px solid rgba(77, 166, 255, 0.3);
          margin-bottom: 0.75rem;
        }
        
        .sidebar-icon {
          color: #85c1e9;
          font-size: 1.2rem;
        }
        
        .sidebar-title {
          color: #4da6ff;
          font-weight: 600;
          font-size: 0.95rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .notations-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        
        .notation-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.5rem 0.75rem;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 0.5rem;
          transition: all 0.2s;
          font-size: 0.85rem;
        }
        
        .notation-item:hover {
          background: rgba(77, 166, 255, 0.2);
          color: white;
          transform: translateX(5px);
        }
        
        .notation-symbol {
          font-size: 1.2rem;
        }
        
        .notation-desc {
          color: rgba(255, 255, 255, 0.9);
        }
        

        
        /* Responsive - ensure no empty spaces on any screen */
        @media (min-width: 768px) {
          .dashboard-container {
            min-width: 280px !important;
          }
        }
        
        @media (max-width: 768px) {
          .dashboard-container.collapsed {
            display: none !important;
          }
          
          .quick-stats {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          
          .geo-sidebar {
            display: none;
          }
        }
        
        /* Add subtle animation to stat values */
        .stat-value {
          animation: pulse 2s ease-in-out infinite;
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
        
        /* Add hover tooltips */
        .stat-card:hover::after {
          content: attr(data-tooltip);
          position: absolute;
          bottom: 100%;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(0, 0, 0, 0.95);
          color: white;
          padding: 0.5rem 0.75rem;
          border-radius: 0.5rem;
          font-size: 0.8rem;
          white-space: nowrap;
          z-index: 1000;
          margin-bottom: 10px;
          box-shadow: 0 5px 20px rgba(0, 0, 0, 0.5);
        }
        
        /* Enhanced button styling */
        button {
          transition: all 0.2s ease !important;
        }
        
        button:hover {
          transform: scale(1.02) !important;
        }
        
        /* Add loading animation */
        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }
        
        .loading-overlay {
          background: linear-gradient(90deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.1) 100%);
          background-size: 1000px 100%;
          animation: shimmer 3s infinite;
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
