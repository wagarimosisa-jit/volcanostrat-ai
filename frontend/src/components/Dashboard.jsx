import React, { useState, useEffect } from 'react';
import { FaMountain, FaWater, FaChartBar, FaLightbulb, FaGlobe, FaUserGraduate, FaFileImport, FaFileExport, FaQuestionCircle, FaCog, FaInfoCircle, FaEnvelope, FaGithub, FaFire, FaLayerGroup, FaTachometerAlt, FaCompass, FaRulerCombined, FaSearch, FaFilter, FaGem, FaTint, FaWind, FaCloud, FaSun, FaMoon } from 'react-icons/fa';

const Dashboard = ({ wells, standardizedData, voxelModel, onFileUpload, onExport, isExpanded = true, onToggleExpand }) => {
  const [activeSection, setActiveSection] = useState('overview');

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
              onClick={onToggleExpand}
              title={isExpanded ? 'Collapse Dashboard' : 'Expand Dashboard'}
            >
              {isExpanded ? '←' : '→'}
            </button>
          </div>
        </div>
        
        {/* Welcome Message */}
        <div className="welcome-message">
          <h3><FaGlobe className="welcome-icon" /> Welcome to VolcanoStrat AI Platform</h3>
          <p>Your Comprehensive Causal Subsurface Intelligence Engine specifically designed and developed for advanced Volcanic Hydrostratigraphy Analysis and interpretation</p>
          <p className="welcome-sub">
            Transforming complex heterogeneous well logs from multiple sources and formats into standardized, consistent, scientifically defensible, and reproducible hydrostratigraphic models with detailed explanations and uncertainty assessments
          </p>
        </div>
        
        {/* Information Banner */}
        <div className="info-banner">
          <div className="banner-content">
            <div className="banner-item">
              <FaChartBar className="banner-icon" />
              <span><strong>Comprehensive Standardization:</strong> Processing and harmonizing well log data from diverse geological settings and formats into consistent hydrostratigraphic framework</span>
            </div>
            <div className="banner-item">
              <FaGlobe className="banner-icon" />
              <span><strong>Worldwide Geological Coverage:</strong> Comprehensive volcanic ontology supporting data from all major volcanic regions and geological environments across the globe</span>
            </div>
            <div className="banner-item">
              <FaTachometerAlt className="banner-icon" />
              <span><strong>Advanced Predictive Accuracy:</strong> Machine learning enhanced classification with validation against global case studies and established hydrogeological principles</span>
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
            <span className="notation-label">Current Project Status and Progress:</span>
            <span className="notation-text">Successfully processed and analyzed {calculatedMetrics.totalWells} wells containing a total of {calculatedMetrics.totalLayers} stratigraphic layers with an overall geological complexity reduction of {calculatedMetrics.complexityReduction} percent achieved through systematic standardization and classification</span>
          </div>
          <div className="geo-fact">
            <FaGem className="fact-icon" />
            <span><strong>Important Geological Information:</strong> Basaltic aquifer systems represent some of the most productive groundwater resources in volcanic terranes, characterized by their extensive lateral continuity and fracture-controlled permeability. The Columbia River Basalt Group in the Pacific Northwest United States serves as an excellent example of a highly productive basalt aquifer system with transmissivity values that can range significantly depending on the degree of fracturing and vesicularity development within the lava flows.</span>
          </div>
        </div>
        
        {/* Geological Environment Indicator */}
        <div className="geo-environment">
          <div className="env-header">
            <FaTint className="env-icon" />
            <span className="env-title">Current Geological Environment Characteristics</span>
          </div>
          <div className="env-content">
            <div className="env-item">
              <span className="env-label">Tectonic Setting and Terrane Type:</span>
              <span className="env-value">Active Continental Rift Valley System with associated volcanic activity and sedimentary basin development</span>
            </div>
            <div className="env-item">
              <span className="env-label">Predominant Lithological Units:</span>
              <span className="env-value">Basaltic lava flows, Andesitic volcanic rocks, Rhyolitic dome complexes, Pyroclastic deposits including tuff and ignimbrite</span>
            </div>
            <div className="env-item">
              <span className="env-label">Hydrogeological Characteristics:</span>
              <span className="env-value">Complex fractured volcanic aquifer systems with dual-porosity behavior combining matrix and fracture permeability</span>
            </div>
            <div className="env-item">
              <span className="env-label">Groundwater Flow Mechanisms:</span>
              <span className="env-value">Predominantly fracture-controlled flow with significant contribution from intergranular and vesicular porosity in volcanic rocks</span>
            </div>
          </div>
        </div>
        
        {/* Key Features Bar */}
        <div className="features-bar">
          <div className="feature-item">
            <FaFire className="feature-icon" />
            <span>Advanced Causal Artificial Intelligence Engine</span>
          </div>
          <div className="feature-item">
            <FaRulerCombined className="feature-icon" />
            <span>Three Dimensional Voxel Modeling</span>
          </div>
          <div className="feature-item">
            <FaLayerGroup className="feature-icon" />
            <span>Volcanic Stratigraphy Analysis</span>
          </div>
          <div className="feature-item">
            <FaChartBar className="feature-icon" />
            <span>Advanced Data Analytics and Visualization Tools</span>
          </div>
          <div className="feature-item">
            <FaSearch className="feature-icon" />
            <span>Automated Aquifer Discovery and Characterization</span>
          </div>
          <div className="feature-item">
            <FaFilter className="feature-icon" />
            <span>Intelligent Lithology Standardization System</span>
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
            <FaMountain className="sidebar-icon" />
            <span className="sidebar-title">International Geological Symbols and Notations</span>
          </div>
          <div className="notations-list">
            <div className="notation-item">
              <span className="notation-symbol">B</span>
              <span className="notation-desc">Basalt - Volcanic extrusive rock formed from low-viscosity lava, typically dark gray to black, fine-grained, can form extensive lava flows and plateaus, important aquifer when fractured</span>
            </div>
            <div className="notation-item">
              <span className="notation-symbol">A</span>
              <span className="notation-desc">Andesite - Intermediate volcanic rock with composition between basalt and rhyolite, typically medium to dark gray, fine-grained, commonly found in subduction zones</span>
            </div>
            <div className="notation-item">
              <span className="notation-symbol">R</span>
              <span className="notation-desc">Rhyolite - Felsic volcanic rock with high silica content, typically light gray to pink, fine-grained, volcanic equivalent of granite, often forms domes and flows</span>
            </div>
            <div className="notation-item">
              <span className="notation-symbol">P</span>
              <span className="notation-desc">Pyroclastic Rocks - Fragmented material produced by explosive volcanic eruptions, includes tuff, ignimbrite, and volcanic breccia, can form excellent aquifers when unwelded</span>
            </div>
            <div className="notation-item">
              <span className="notation-symbol">→</span>
              <span className="notation-desc">Groundwater Flow Direction - Movement of water through aquifers, typically from recharge areas to discharge points, controlled by hydraulic gradient and permeability</span>
            </div>
            <div className="notation-item">
              <span className="notation-symbol">↑</span>
              <span className="notation-desc">Aquifer Recharge Zone - Area where water enters an aquifer system, typically elevated terrain, fractures, or permeable formations that allow precipitation to infiltrate</span>
            </div>
          </div>
          
          {/* Geological Characteristics and Properties */}
          <div className="geo-facts-sidebar">
            <div className="fact-header">
              <FaGem className="fact-icon-header" />
              <span>Geological Characteristics and Properties</span>
            </div>
            <div className="facts-content">
              <div className="fact-item">
                <strong>Hydraulic Conductivity:</strong> The ease with which water moves through rock or soil, determined by grain size, sorting, porosity, and fracturing, crucial for aquifer productivity assessment
              </div>
              <div className="fact-item">
                <strong>Storage Capacity:</strong> The ability of geological formations to hold and release water, influenced by porosity, permeability, and effective porosity of the rock matrix
              </div>
              <div className="fact-item">
                <strong>Volcanic Aquifer Systems:</strong> Characterized by heterogeneity with permeability controlled by fractures, vesicles, and weathering zones, often exhibiting dual-porosity behavior with both matrix and fracture flow
              </div>
            </div>
          </div>
        </div>
        
        {/* International Stratigraphy Legend */}
        <div className="stratigraphy-legend">
          <div className="legend-header">
            <FaLayerGroup className="legend-icon" />
            <span className="legend-title">International Lithology Classification System</span>
          </div>
          <div className="legend-content">
            <div className="legend-row">
              <div className="legend-swatch basalt"></div>
              <span className="legend-label">Basalt - Mafic extrusive volcanic rock with low silica content, typically dark colored, fine-grained aphanitic to glassy texture, forms lava flows, pillow lavas, and volcanic plateaus</span>
            </div>
            <div className="legend-row">
              <div className="legend-swatch andesite"></div>
              <span className="legend-label">Andesite - Intermediate volcanic rock with medium silica content, typically gray to dark gray, fine-grained, commonly associated with subduction zone volcanism and stratovolcanoes</span>
            </div>
            <div className="legend-row">
              <div className="legend-swatch rhyolite"></div>
              <span className="legend-label">Rhyolite - Felsic extrusive volcanic rock with high silica content, typically light gray to pink, fine-grained, often forms volcanic domes, flows, and pyroclastic deposits</span>
            </div>
            <div className="legend-row">
              <div className="legend-swatch pyroclastic"></div>
              <span className="legend-label">Pyroclastic Rocks - Volcanic fragmental deposits including ash, lapilli, bombs, and blocks, can be loose or welded, important for understanding explosive eruption history and aquifer potential</span>
            </div>
            <div className="legend-row">
              <div className="legend-swatch sedimentary"></div>
              <span className="legend-label">Sedimentary Rocks - Deposited by water, wind, ice, or gravity, typically layered, can include clastic, chemical, and organic varieties, important for groundwater storage in interbedded sequences</span>
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
              <h3>Comprehensive Platform Overview and Introduction</h3>
              <p>
                <strong>VolcanoStrat AI</strong> represents a revolutionary and comprehensive global volcanic hydrostratigraphy and aquifer modeling platform that has been specifically designed and developed to address the significant challenges associated with processing and interpreting complex heterogeneous well log data. This advanced platform automatically and systematically transforms raw, inconsistent, and often confusing well-log descriptions from multiple sources and formats into standardized, consistent, scientifically defensible, and reproducible hydrostratigraphic units that can be used for further analysis, interpretation, and decision-making purposes.
              </p>
              
              <div className="feature-list">
                <div className="feature-item">
                  <FaGlobe className="feature-icon" />
                  <div className="feature-text">
                    <strong>Global Coverage and Comprehensive Support</strong>
                    <p>VolcanoStrat AI platform supports well data from anywhere in the world with our comprehensive volcanic lithology ontology that has been developed and validated against data from all major volcanic regions including but not limited to East African Rift System, Pacific Ring of Fire, Mid-Atlantic Ridge, and various continental volcanic provinces</p>
                  </div>
                </div>
                
                <div className="feature-item">
                  <FaCog className="feature-icon" />
                  <div className="feature-text">
                    <strong>Artificial Intelligence Powered Lithology Standardization</strong>
                    <p>Automatic and intelligent lithology standardization process that utilizes advanced machine learning algorithms and our extensive global volcanic knowledge base to transform raw inconsistent well log descriptions into standardized scientifically defensible hydrostratigraphic classifications</p>
                  </div>
                </div>
                
                <div className="feature-item">
                  <FaChartBar className="feature-icon" />
                  <div className="feature-text">
                    <strong>Advanced Analytics and Modeling Capabilities</strong>
                    <p>Comprehensive suite of analytical tools including three dimensional voxel based geological modeling, two dimensional cross-section generation and visualization, complexity reduction metrics calculation, and statistical analysis of stratigraphic patterns and relationships</p>
                  </div>
                </div>
                
                <div className="feature-item">
                  <FaWater className="feature-icon" />
                  <div className="feature-text">
                    <strong>Intelligent Aquifer Discovery and Target Identification</strong>
                    <p>Automated identification and characterization of promising groundwater targets with detailed confidence scores, comprehensive reasoning, and supporting evidence based on geological, hydrological, and geophysical data analysis</p>
                  </div>
                </div>
              </div>

              <div className="metrics-summary">
                <h4>Comprehensive Project Metrics and Performance Indicators</h4>
                <ul>
                  <li><strong>Total Wells Processed:</strong> {calculatedMetrics.totalWells} individual wells have been successfully analyzed and standardized by the platform</li>
                  <li><strong>Original Descriptions Processed:</strong> {calculatedMetrics.totalLayers} unique layer descriptions have been imported and systematically categorized</li>
                  <li><strong>Standardized Hydrostratigraphic Units:</strong> {calculatedMetrics.totalLayers > 0 ? Math.round(calculatedMetrics.totalLayers * (1 - calculatedMetrics.complexityReduction/100)) : 0} distinct and consistent hydrostratigraphic units have been established through the standardization process</li>
                  <li><strong>Complexity Reduction Index:</strong> {calculatedMetrics.complexityReduction}% - This important metric represents the overall reduction in geological complexity achieved through systematic classification and grouping of similar lithological descriptions</li>
                  <li><strong>Average Classification Confidence:</strong> {calculatedMetrics.avgConfidence}% average confidence level in our layer classifications and hydro property predictions across all processed wells</li>
                  <li><strong>Aquifer Potential Assessment:</strong> {calculatedMetrics.aquiferLayers} layers have been identified as productive aquifers out of a total of {calculatedMetrics.totalLayers} layers analyzed, providing valuable insights into groundwater resource potential</li>
                </ul>
              </div>
            </div>
          )}

          {activeSection === 'productive' && (
            <div className="content-section">
              <h3>Comprehensive Aquifer Target Analysis and Recommendations</h3>
              <p>Based on detailed artificial intelligence analysis and interpretation of your uploaded well log data, the following stratigraphic layers have been identified as the most promising groundwater targets for potential development and exploitation. These recommendations are based on comprehensive evaluation of geological, hydrological, and geophysical characteristics:</p>
              
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
                <p className="no-data">Currently no aquifer layers have been identified in your uploaded well data. Please upload your well log information and process it through the platform to receive detailed aquifer identification and comprehensive groundwater target recommendations.</p>
              )}

              <div className="recommendation-box">
                <h4>Artificial Intelligence Powered Recommendation and Guidance</h4>
                {topProductive.length > 0 ? (
                  <p>
                    Based on comprehensive analysis, the most promising and productive groundwater target within your dataset is the <strong>{topProductive[0].Hydro_Property}</strong> layer 
                    located in well <strong>{topProductive[0].Well_ID}</strong> at a depth interval between 
                    <strong>{topProductive[0].Depth_Start}-{topProductive[0].Depth_End} meters below ground surface</strong> 
                    with an exceptional classification <strong>{(topProductive[0].Confidence * 100).toFixed(1)}% confidence level</strong>. This layer represents the optimal target for groundwater development activities.
                  </p>
                ) : (
                  <p>To receive detailed artificial intelligence powered drilling recommendations and aquifer target identification, please upload your well data files and process them through our comprehensive standardization and analysis pipeline.</p>
                )}
              </div>
            </div>
          )}

          {activeSection === 'upload' && (
            <div className="content-section">
              <h3>Comprehensive Data Upload Interface</h3>
              <p>Upload your valuable well data files in various supported formats including comma separated values files, shapefile archives, and individual shapefiles. Our advanced system will automatically process and standardize your data for comprehensive analysis and interpretation.</p>
              
              <div className="upload-options">
                <div className="upload-option">
                  <h4><FaFileImport /> Comma Separated Values CSV File Upload</h4>
                  <p>Standard tabular format containing well log information with all required columns for complete processing and analysis by our advanced platform</p>
                  <input 
                    type="file" 
                    accept=".csv" 
                    onChange={(e) => e.target.files[0] && onFileUpload(e.target.files[0])}
                  />
                </div>
                
                <div className="upload-option">
                  <h4><FaFileImport /> Geographical Information System Shapefile Upload</h4>
                  <p>Upload spatial data including well point locations, cross-sectional line definitions, or study area boundary polygons for geographical context and visualization</p>
                  <input 
                    type="file" 
                    accept=".shp,.zip" 
                    onChange={(e) => e.target.files[0] && onFileUpload(e.target.files[0])}
                  />
                </div>
              </div>

              <div className="info-box">
                <h4>Comprehensive List of Supported File Formats and Types</h4>
                <ul>
                  <li><strong>CSV - Comma Separated Values:</strong> Well log data files in standard tabular format containing all necessary columns for processing including well identification, coordinates, elevation, depth intervals, and lithology descriptions</li>
                  <li><strong>Shapefile ZIP Archive:</strong> Complete geographical information system shapefile bundle containing the main shapefile and all supporting files including index, database, and projection definition files</li>
                  <li><strong>Individual Shapefile:</strong> Single shapefile component which may require additional supporting files for complete functionality and processing</li>
                  <li><strong>Excel Spreadsheet:</strong> Microsoft Excel format support is currently under development and will be available in future releases</li>
                  <li><strong>LAS Well Log Format:</strong> Standard well log ASCII format commonly used in the petroleum industry is currently being developed for future implementation</li>
                </ul>
              </div>
            </div>
          )}

          {activeSection === 'export' && (
            <div className="content-section">
              <h3>Comprehensive Data Export and Download Options</h3>
              <p>Download your processed and analyzed well data in various industry standard formats suitable for further analysis, reporting, visualization, and integration with other geographical information systems and software applications.</p>
              
              <div className="export-options">
                <div className="export-group">
                  <h4>Well Data Export Formats and Options</h4>
                  <div className="format-buttons">
                    <button onClick={() => onExport && onExport('wells', 'csv')}>CSV Format</button>
                    <button onClick={() => onExport && onExport('wells', 'json')}>JSON Format</button>
                    <button onClick={() => onExport && onExport('wells', 'shp')}>Shapefile Format</button>
                  </div>
                </div>
                
                <div className="export-group">
                  <h4>Stratigraphy Layers Export Options</h4>
                  <div className="format-buttons">
                    <button onClick={() => onExport && onExport('layers', 'csv')}>CSV Format</button>
                    <button onClick={() => onExport && onExport('layers', 'json')}>JSON Format</button>
                    <button onClick={() => onExport && onExport('layers', 'shp')}>Shapefile Format</button>
                  </div>
                </div>
                
                <div className="export-group">
                  <h4>Two Dimensional Cross Section Export</h4>
                  <div className="format-buttons">
                    <button onClick={() => onExport && onExport('combined_2d', 'png')}>PNG Image Format</button>
                    <button onClick={() => onExport && onExport('combined_2d', 'shp')}>Shapefile Format</button>
                  </div>
                </div>
                
                <div className="export-group">
                  <h4>Three Dimensional Model Export</h4>
                  <div className="format-buttons">
                    <button onClick={() => onExport && onExport('combined_3d', 'vtk')}>VTK Format</button>
                    <button onClick={() => onExport && onExport('combined_3d', 'kml')}>KML Format</button>
                    <button onClick={() => onExport && onExport('combined_3d', 'shp')}>Shapefile Format</button>
                  </div>
                </div>
              </div>

              <div className="info-box">
                <h4>Comprehensive Export Format Information and Details</h4>
                <ul>
                  <li><strong>CSV - Comma Separated Values Format:</strong> Standard tabular data format ideal for spreadsheet analysis, statistical processing, and data sharing across different software platforms and applications</li>
                  <li><strong>JSON - JavaScript Object Notation Format:</strong> Lightweight data interchange format that is easy for humans to read and write and easy for machines to parse and generate, ideal for web applications and data exchange</li>
                  <li><strong>Shapefile Format:</strong> Geographical information system compatible vector data format stored as a set of related files, typically distributed as a compressed ZIP archive for convenience</li>
                  <li><strong>VTK - Visualization Toolkit Format:</strong> Advanced three dimensional visualization data format compatible with ParaView, VisIt, and other scientific visualization software applications</li>
                  <li><strong>KML - Keyhole Markup Language Format:</strong> XML based notation for expressing geographic annotation and visualization within Internet based earth browsers including Google Earth</li>
                  <li><strong>PNG - Portable Network Graphics Format:</strong> High quality image format suitable for reports, presentations, publications, and documentation with lossless data compression</li>
                </ul>
              </div>
            </div>
          )}

          {activeSection === 'help' && (
            <div className="content-section">
              <h3>Comprehensive Help Support and User Assistance</h3>
              
              <div className="help-section">
                <h4><FaQuestionCircle /> Comprehensive Quick Start Guide and Tutorial</h4>
                <p>Get started with VolcanoStrat AI platform through the following comprehensive steps that will guide you through the entire workflow from data import to final results and export:</p>
                <ol>
                  <li><strong>Data Upload:</strong> Upload your well log information in any of the supported file formats including comma separated values, Microsoft Excel spreadsheets, LAS well log ASCII files, GeoJSON geographical data format, or various shapefile configurations</li>
                  <li><strong>Results Review:</strong> Carefully examine and review the automatically processed standardized results including the artificial intelligence classified stratigraphic layers with their corresponding hydro properties and confidence scores</li>
                  <li><strong>Interactive Exploration:</strong> Explore the generated three dimensional voxel based geological models and interactive two dimensional cross-sectional views that provide valuable insights into subsurface stratigraphy and relationships</li>
                  <li><strong>Advanced Analysis:</strong> Utilize the artificial intelligence powered geologist to ask specific questions about individual layers, overall productivity assessments, aquifer characteristics, and hydrogeological properties</li>
                  <li><strong>Data Export:</strong> Export your processed data and results in multiple industry standard formats including CSV tabular data, JSON structured data, PDF comprehensive reports, Shapefile spatial data, VTK three dimensional models, and KML geographical data</li>
                </ol>
                <p className="info-box">Important Professional Tip: For optimal results and comprehensive stratigraphic correlation, upload your cross-section line definition as a Shapefile format to generate detailed two dimensional stratigraphic profiles that clearly display layer correlations and geological relationships</p>
              </div>

              <div className="help-section">
                <h4><FaEnvelope /> Comprehensive Contact Information and Support Channels</h4>
                <p>
                  For comprehensive technical support, detailed questions, valuable feedback, suggestions for improvements, or any other inquiries regarding the VolcanoStrat AI platform, please feel free to contact our development team:
                </p>
                <ul>
                  <li>
                    <strong>Primary Official Contact:</strong> 
                    <a href="mailto:wagari.mosisa@ju.edu.et" target="_blank" rel="noopener noreferrer">
                      wagari.mosisa@ju.edu.et
                    </a>
                  </li>
                  <li>
                    <strong>Alternate Personal Contact:</strong> 
                    <a href="mailto:wagarimosisa@gmail.com" target="_blank" rel="noopener noreferrer">
                      wagarimosisa@gmail.com
                    </a>
                  </li>
                </ul>
              </div>

              <div className="help-section">
                <h4><FaUserGraduate /> Platform Developer and Project Leader Information</h4>
                <p>
                  <strong>Wagari Mosisa Kitessa</strong><br />
                  <span className="role">Lead Developer, Principal Geologist, and Project Coordinator</span>
                </p>
                <p>
                  VolcanoStrat AI platform was specifically developed and designed to effectively address the significant and longstanding challenge associated with standardizing complex heterogeneous volcanic well log data for comprehensive hydrogeological analysis and detailed aquifer characterization purposes at various scales ranging from local site investigations to regional and basin scale assessments. This advanced platform transforms inconsistent and varied data formats into consistent standardized hydrostratigraphic models that can be used for reliable groundwater resource evaluation and management.
                </p>
              </div>

              <div className="help-section">
                <h4><FaGithub /> Open Source Repository and Community Contribution Platform</h4>
                <p>
                  View the complete source code, make valuable contributions, report technical issues, suggest new features, or participate in community discussions through our official open source repository:
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
                <h4><FaInfoCircle /> Comprehensive Information About VolcanoStrat AI Platform</h4>
                <p>
                  <strong>Mission Statement:</strong> The primary mission of VolcanoStrat AI platform is to fundamentally transform the way heterogeneous volcanic well log data is processed and interpreted by developing advanced artificial intelligence powered systems that can automatically convert complex inconsistent raw data into comprehensive uncertainty-aware hydrostratigraphic knowledge models and reliable groundwater decision-support systems for effective resource management.
                </p>
                <p>
                  <strong>Vision Statement:</strong> Our vision is to enable and empower hydrogeologists, geological researchers, professional consultants, government water agencies, private sector organizations, and academic institutions from all around the world to efficiently build consistent, scientifically explainable, technically defensible, and completely reproducible subsurface geological models from their diverse and heterogeneous well data regardless of source format or original quality.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="dashboard-footer">
          <p>
            © {new Date().getFullYear()} VolcanoStrat AI | 
            Built for you!
          </p>
          <p className="version">Version 1.0.0 | Advanced Global Volcanic Hydrostratigraphy Intelligence Platform</p>
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
