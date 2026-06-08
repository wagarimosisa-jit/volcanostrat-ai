import React, { useState } from 'react';
import { FaGlobe, FaWater, FaChartBar, FaTachometerAlt, FaLayerGroup, FaCog, FaInfoCircle, FaFileImport, FaFileExport, FaQuestionCircle, FaUserGraduate, FaEnvelope, FaGithub, FaFire, FaCompass, FaRulerCombined, FaSearch, FaFilter, FaGem, FaTint, FaBars, FaChevronDown, FaChevronUp } from 'react-icons/fa';

const Dashboard = ({ wells, standardizedData, voxelModel, onFileUpload, onExport, isExpanded = false, onToggleExpand }) => {
  const [activeSection, setActiveSection] = useState('overview');
  const [activeMenu, setActiveMenu] = useState(null);
  const [activeSubMenu, setActiveSubMenu] = useState(null);

  const calculateMetrics = () => {
    if (!standardizedData?.wells) return { totalWells: 0, totalLayers: 0, aquiferLayers: 0, avgConfidence: 0, complexityReduction: 0 };
    const wellsData = standardizedData.wells;
    let totalLayers = 0, aquiferLayers = 0, confidenceSum = 0, confidenceCount = 0;
    const uniqueUnits = new Set();
    wellsData.forEach(well => {
      (well.Layers || []).forEach(layer => {
        totalLayers++;
        if (layer.Hydro_Property?.includes('Aquifer')) aquiferLayers++;
        uniqueUnits.add(`${layer.Modifiers?.join(',')}|${layer.Hydro_Property || 'Unknown'}`);
        if (layer.Confidence !== undefined) { confidenceSum += layer.Confidence; confidenceCount++; }
      });
    });
    return {
      totalWells: wellsData.length,
      totalLayers,
      aquiferLayers,
      avgConfidence: confidenceCount > 0 ? (confidenceSum / confidenceCount * 100).toFixed(1) : 0,
      complexityReduction: totalLayers > 0 ? (((totalLayers - uniqueUnits.size) / totalLayers) * 100).toFixed(1) : 0
    };
  };

  const calculatedMetrics = calculateMetrics();
  const getTopProductiveLayers = () => {
    if (!standardizedData?.wells) return [];
    const layers = standardizedData.wells.flatMap(w => (w.Layers || []).filter(l => l.Hydro_Property?.includes('Aquifer')).map(l => ({...l, Well_ID: w.Well_ID})));
    layers.sort((a,b) => {
      const score = p => p.Hydro_Property?.includes('High') ? 3 : p.Hydro_Property?.includes('Moderate') ? 2 : 1;
      return score(b.Hydro_Property) - score(a.Hydro_Property);
    });
    return layers.slice(0, 5);
  };
  const topProductive = getTopProductiveLayers();

  // Menu structure with submenus
  const menuItems = [
    {
      id: 'home',
      title: 'Home',
      icon: <FaGlobe />,
      submenu: [
        { id: 'welcome', title: 'Welcome', component: <S.Welcome /> },
        { id: 'overview', title: 'Platform Overview', component: <S.PlatformOverview /> },
        { id: 'status', title: 'Current Status', component: <S.CurrentStatus metrics={calculatedMetrics} /> }
      ]
    },
    {
      id: 'geology',
      title: 'Geology',
      icon: <FaLayerGroup />,
      submenu: [
        { id: 'geo-info', title: 'Geological Information', component: <S.GeologicalInfo /> },
        { id: 'environment', title: 'Environment', component: <S.Environment /> },
        { id: 'properties', title: 'Properties', component: <S.Properties /> },
        { id: 'classification', title: 'Classification', component: <S.Classification /> },
        { id: 'symbols', title: 'Symbols', component: <S.Symbols /> }
      ]
    },
    {
      id: 'features',
      title: 'Features',
      icon: <FaFire />,
      submenu: [
        { id: 'features-list', title: 'Platform Features', component: <S.Features /> }
      ]
    },
    {
      id: 'statistics',
      title: 'Statistics',
      icon: <FaChartBar />,
      submenu: [
        { id: 'stats', title: 'Project Stats', component: <S.Stats metrics={calculatedMetrics} /> },
        { id: 'metrics', title: 'Metrics Summary', component: <S.MetricsSummary metrics={calculatedMetrics} /> }
      ]
    },
    {
      id: 'tools',
      title: 'Tools',
      icon: <FaCog />,
      submenu: [
        { id: 'upload', title: 'Quick Upload', component: <S.Content activeSection="upload" topProductive={topProductive} onFileUpload={onFileUpload} onExport={onExport} /> },
        { id: 'export', title: 'Export Options', component: <S.Content activeSection="export" topProductive={topProductive} onFileUpload={onFileUpload} onExport={onExport} /> },
        { id: 'aquifers', title: 'Top Aquifers', component: <S.Content activeSection="productive" topProductive={topProductive} onFileUpload={onFileUpload} onExport={onExport} /> }
      ]
    },
    {
      id: 'help',
      title: 'Help',
      icon: <FaQuestionCircle />,
      submenu: [
        { id: 'help-main', title: 'Help Center', component: <S.Content activeSection="help" topProductive={topProductive} onFileUpload={onFileUpload} onExport={onExport} /> }
      ]
    }
  ];

  const toggleMenu = (menuId) => {
    setActiveMenu(activeMenu === menuId ? null : menuId);
  };

  const selectSubMenu = (menuId, subMenuId) => {
    setActiveMenu(menuId);
    setActiveSubMenu(subMenuId);
    setActiveSection(subMenuId);
  };

  // Find active submenu component
  const getActiveContent = () => {
    for (const menu of menuItems) {
      const activeSub = menu.submenu.find(sub => sub.id === activeSubMenu);
      if (activeSub) return activeSub.component;
    }
    return <S.Welcome />; // Default
  };

  return (
    <div className="gvas-dashboard">
      <div className={`top-panel ${isExpanded ? 'expanded' : 'collapsed'}`}>
        <div className="panel-header">
          <div className="logo-area">
            <div className="branding">
              <h2><FaGlobe className="gvas-icon" /> GVAS - Global Volcanic Aquifer Solutions</h2>
              {isExpanded && <span className="tagline">Advanced AI-Powered Hydrostratigraphy Platform</span>}
            </div>
          </div>
          
          {isExpanded && (
            <div className="main-nav">
              {menuItems.map(menu => (
                <div key={menu.id} className="nav-item">
                  <button 
                    className={`nav-button ${activeMenu === menu.id ? 'active' : ''}`}
                    onClick={() => toggleMenu(menu.id)}
                  >
                    {menu.icon}
                    <span>{menu.title}</span>
                    <FaChevronDown className={`chevron ${activeMenu === menu.id ? 'rotated' : ''}`} />
                  </button>
                  
                  {activeMenu === menu.id && (
                    <div className="submenu-dropdown">
                      {menu.submenu.map(sub => (
                        <button 
                          key={sub.id}
                          className={`submenu-item ${activeSubMenu === sub.id ? 'active' : ''}`}
                          onClick={() => selectSubMenu(menu.id, sub.id)}
                        >
                          <span className="submenu-dot"></span>
                          {sub.title}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {isExpanded && (
          <div className="main-horizontal">
            <div className="scroll-content">
              {getActiveContent()}
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .gvas-dashboard { width: 100%; position: relative; }
        
        /* Modern Professional Style */
        .top-panel { 
          width: 100%; 
          background: linear-gradient(135deg, #1976d2 0%, #2196f3 100%); 
          color: #fff; 
          display: flex; 
          flex-direction: column;
          border-bottom: 2px solid #4da6ff;
          box-shadow: 0 4px 20px rgba(0,0,0,0.2); 
        }
        .top-panel.collapsed { min-height: 70px; }
        .top-panel.expanded { min-height: auto; max-height: none; }
        
        .panel-header { 
          display: flex; 
          align-items: center; 
          padding: 1rem 2rem; 
          background: transparent; 
          border-bottom: 1px solid rgba(255,255,255,0.1); 
          width: 100%; 
          box-sizing: border-box; 
          position: relative;
          justify-content: space-between;
        }
        .gvas-icon { font-size: 1.5rem; color: #ff9800; margin-right: 0.5rem; }
        
        .toggle-side { 
          background: #4da6ff; 
          border: none; 
          color: #fff; 
          padding: 0.5rem 1rem;
          border-radius: 0.35rem; 
          cursor: pointer; 
          font-size: 1.2rem; 
          transition: all 0.2s; 
          min-width: 50px; 
          text-align: center; 
          font-weight: bold;
        }
        .toggle-side:hover { background: #0052a3; transform: scale(1.05); }
        

        .logo-area { display: flex; align-items: center; gap: 1rem; flex: 1; min-width: 0; }
        
        .branding { flex: 1; }
        .branding h2 { 
          margin: 0; 
          font-size: 1.8rem; 
          font-weight: 700; 
          color: #fff; 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          display: flex;
          align-items: center;
          letter-spacing: -0.5px;
        }
        .tagline { 
          color: #b3c7ff; 
          font-size: 0.85rem; 
          display: block; 
          margin-top: 0.3rem; 
          font-weight: 300; 
          opacity: 0.9;
        }
        
        /* Main Navigation */
        .main-nav { 
          display: flex; 
          gap: 0.25rem; 
          margin-left: auto;
          padding-left: 1rem;
        }
        
        .nav-item { position: relative; }
        
        .nav-button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.6rem 1rem;
          background: transparent;
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 0.35rem;
          color: #ccc;
          cursor: pointer;
          font-size: 0.9rem;
          transition: all 0.2s;
          font-weight: 500;
        }
        .nav-button:hover {
          background: rgba(255,255,255,0.1);
          color: #fff;
          border-color: rgba(255,255,255,0.4);
        }
        .nav-button.active {
          background: #4da6ff;
          color: #fff;
          border-color: #4da6ff;
        }
        
        .chevron {
          transition: transform 0.3s ease;
          font-size: 0.75rem;
        }
        .chevron.rotated {
          transform: rotate(180deg);
        }
        
        /* Submenu Dropdown */
        .submenu-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          min-width: 200px;
          background: #0a1628;
          border: 1px solid #4da6ff;
          border-radius: 0.35rem;
          box-shadow: 0 8px 32px rgba(0,0,0,0.4);
          z-index: 1000;
          margin-top: 0.25rem;
          padding: 0.5rem 0;
        }
        
        .submenu-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          width: 100%;
          padding: 0.6rem 1rem;
          background: transparent;
          border: none;
          color: #ccc;
          cursor: pointer;
          font-size: 0.85rem;
          transition: all 0.2s;
          text-align: left;
          border-radius: 0.25rem;
        }
        .submenu-item:hover {
          background: rgba(255,255,255,0.05);
          color: #fff;
        }
        .submenu-item.active {
          background: #4da6ff;
          color: #fff;
        }
        .nsubmenu-dot {
          width: 8px;
          height: 8px;
          background: #4da6ff;
          border-radius: 50%;
          flex-shrink: 0;
        }
        
        .main-horizontal { flex: 1; display: flex; flex-direction: column; width: 100%; }
        .scroll-content { 
          flex: 1; 
          overflow-y: auto; 
          padding: 1rem;
          background: linear-gradient(to bottom, rgba(10,22,40,0.9), rgba(26,26,46,0.95));
        }
        
        /* Content Sections */
        .sec { 
          padding: 1.5rem; 
          margin: 0 0 1.5rem 0; 
          background: rgba(255,255,255,0.03); 
          border-radius: 0.5rem;
          border-left: 4px solid #4da6ff;
          box-shadow: 0 2px 15px rgba(0,0,0,0.3);
        }
        .sec h3 { 
          color: #fff; 
          margin: 0 0 1rem 0; 
          font-size: 1.2rem; 
          display: flex; 
          align-items: center; 
          gap: 0.75rem;
          border-bottom: 1px solid rgba(0,102,204,0.3); 
          padding-bottom: 0.75rem;
        }
        .sec-icon { color: #4da6ff; font-size: 1.3rem; }
        .sec p, .sec li, .sec a { color: #ccc; line-height: 1.7; font-size: 0.95rem; }
        .sec a { color: #0088ff; text-decoration: none; }
        .sec a:hover { text-decoration: underline; color: #00aaff; }
        
        /* Grid Layout */
        .grid1 { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem; }
        .card1 { 
          padding: 1rem; 
          background: rgba(255,255,255,0.02); 
          border-radius: 0.5rem; 
          border-left: 3px solid #4da6ff;
          transition: all 0.3s;
        }
        .card1:hover { background: rgba(255,255,255,0.05); }
        .card1 strong { 
          display: block; 
          color: #fff; 
          margin-bottom: 0.5rem; 
          font-size: 0.95rem;
        }
        .card1 p { margin: 0; color: #bbb; font-size: 0.85rem; line-height: 1.6; }
        
        /* Symbols */
        .sym-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1rem; }
        .sym-card { 
          display: flex; 
          gap: 1rem; 
          padding: 1rem; 
          background: rgba(255,255,255,0.02); 
          border-radius: 0.5rem; 
          border: 1px solid rgba(0,102,204,0.2);
        }
        .sym-box { 
          width: 40px; 
          height: 40px; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          font-size: 1.5rem; 
          border-radius: 0.35rem; 
          flex-shrink: 0;
        }
        .sym-box.bas { background: #004d00; color: #fff; }
        .sym-box.and { background: #1a3d2e; color: #fff; }
        .sym-box.rhy { background: #8b2e48; color: #fff; }
        .sym-box.pyr { background: #663300; color: #fff; }
        .sym-box.flow { background: #4da6ff; color: #fff; }
        .sym-box.rech { background: #006400; color: #fff; }
        .sym-text strong { display: block; color: #fff; margin-bottom: 0.5rem; font-size: 0.9rem; }
        .sym-text p { margin: 0; color: #bbb; font-size: 0.85rem; line-height: 1.6; }
        
        /* Stats */
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; }
        .stat-card { 
          background: rgba(255,255,255,0.05); 
          border-radius: 0.5rem; 
          padding: 1.25rem; 
          display: flex; 
          align-items: center; 
          gap: 1rem;
          border: 1px solid rgba(0,102,204,0.2);
          transition: all 0.3s;
        }
        .stat-card:hover { 
          transform: translateY(-5px); 
          box-shadow: 0 10px 30px rgba(0,102,204,0.2); 
          border-color: #4da6ff;
        }
        .stat-card.hl { background: rgba(0,102,204,0.1); border-color: #4da6ff; }
        .stat-icon { font-size: 1.75rem; color: #0088ff; }
        .stat-value { font-size: 1.75rem; font-weight: bold; color: #fff; }
        .stat-label { 
          font-size: 0.75rem; 
          color: #888; 
          text-transform: uppercase; 
          letter-spacing: 0.5px; 
          font-weight: 500;
        }
        
        /* Content Panel */
        .content-panel { 
          padding: 1.5rem; 
          margin: 0 0 1rem 0; 
          background: rgba(255,255,255,0.03); 
          border-radius: 0.5rem;
          border-left: 4px solid #4da6ff;
          box-shadow: 0 2px 15px rgba(0,0,0,0.3);
        }
        .content-panel h3 { 
          color: #fff; 
          margin: 0 0 1rem 0; 
          font-size: 1.2rem; 
          border-bottom: 2px solid #4da6ff; 
          padding-bottom: 0.75rem;
        }
        .content-panel p { color: #ccc; margin: 0 0 1rem 0; line-height: 1.7; font-size: 0.95rem; }
        
        /* Table */
        .table-container { margin: 1rem 0; overflow-x: auto; }
        .data-table { width: 100%; border-collapse: collapse; color: #fff; }
        .data-table th, .data-table td { padding: 0.75rem; text-align: left; border-bottom: 1px solid rgba(0,102,204,0.2); }
        .data-table th { background: rgba(0,102,204,0.2); color: #0088ff; font-weight: 600; font-size: 0.85rem; }
        .data-table td { color: #ccc; font-size: 0.85rem; }
        .data-table tr:hover { background: rgba(0,102,204,0.05); }
        .no-data { color: #666; font-style: italic; text-align: center; padding: 1rem; }
        
        /* Info Cards */
        .rec-box { 
          margin-top: 1.5rem; 
          padding: 1rem; 
          background: rgba(0,102,204,0.1);
          border-left: 4px solid #0088ff;
          border-radius: 0.5rem;
        }
        .rec-box h4 { margin: 0 0 0.75rem 0; color: #0088ff; font-size: 1rem; }
        .rec-box p { margin: 0; color: #fff; line-height: 1.6; font-size: 0.9rem; }
        
        .upload-grid, .export-grid { display: grid; grid-template-columns: 1fr; gap: 1rem; margin: 1rem 0; }
        .upload-card, .export-card { 
          padding: 1rem; 
          background: rgba(255,255,255,0.02); 
          border-radius: 0.5rem; 
          border: 1px dashed rgba(0,102,204,0.3);
        }
        .upload-card h4, .export-card h4 { 
          margin: 0 0 0.75rem 0; 
          display: flex; 
          align-items: center; 
          gap: 0.5rem; 
          color: #fff; 
          font-size: 1rem;
        }
        .upload-card p, .export-card p { 
          font-size: 0.85rem; 
          color: #bbb; 
          margin: 0 0 0.75rem 0; 
          line-height: 1.5;
        }
        .fmt-buttons { display: flex; gap: 0.5rem; flex-wrap: wrap; }
        .fmt-buttons button { 
          padding: 0.5rem 0.75rem; 
          background: #4da6ff; 
          border: none;
          border-radius: 0.35rem; 
          color: #fff; 
          cursor: pointer; 
          font-size: 0.8rem; 
          transition: all 0.2s;
        }
        .fmt-buttons button:hover { background: #0052a3; }
        
        /* Info Card */
        .info-card { 
          margin-top: 1rem; 
          padding: 1rem; 
          background: rgba(0,102,204,0.1);
          border-left: 4px solid #0088ff;
          border-radius: 0.5rem;
        }
        .info-card h4 { margin: 0 0 0.75rem 0; color: #0088ff; font-size: 1rem; }
        .info-card p { margin: 0 0 0.5rem 0; color: #fff; line-height: 1.6; font-size: 0.9rem; }
        .info-card ul { margin: 0.5rem 0 0 1rem; padding: 0; }
        .info-card li { margin-bottom: 0.5rem; font-size: 0.85rem; color: #ccc; }
        
        /* Help Card */
        .help-card { 
          background: rgba(255,255,255,0.03); 
          border-radius: 0.5rem; 
          padding: 1rem; 
          margin: 1rem 0; 
          border: 1px solid rgba(0,102,204,0.2);
        }
        .help-card h4 { color: #fff; display: flex; align-items: center; gap: 0.5rem; margin: 0 0 0.75rem 0; font-size: 1rem; }
        .help-card p { color: #ccc; margin: 0 0 0.75rem 0; line-height: 1.6; font-size: 0.9rem; }
        .help-card ol { padding-left: 1.5rem; margin: 0.5rem 0; }
        .help-card li { margin-bottom: 0.5rem; color: #ccc; font-size: 0.85rem; }
        .help-card a { color: #0088ff; text-decoration: none; }
        .help-card a:hover { text-decoration: underline; }
        
        .gh-link { 
          display: inline-flex; 
          align-items: center; 
          gap: 0.5rem; 
          padding: 0.5rem 1rem; 
          background: #4da6ff;
          border-radius: 0.35rem; 
          color: #fff; 
          text-decoration: none; 
          transition: all 0.2s; 
          margin: 0.5rem 0;
        }
        .gh-link:hover { background: #0052a3; }
        
        .role { font-size: 0.85rem; opacity: 0.8; color: #888; }
        .tip { 
          background: rgba(0,102,204,0.1); 
          padding: 0.75rem; 
          border-radius: 0.35rem; 
          border-left: 3px solid #0088ff;
          margin: 0.75rem 0 0 0; 
          font-size: 0.85rem; 
          color: #ccc;
        }
        

        /* Scrollbar */
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: #0a1628; border-radius: 4px; }
        ::-webkit-scrollbar-thumb { background: #4da6ff; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #0088ff; }
        
        /* Responsive */
        @media (max-width: 768px) {
          .main-nav { flex-wrap: wrap; }
          .submenu-dropdown { min-width: 180px; }
          .branding { min-width: auto; }
          .branding h2 { font-size: 1.4rem; }
        }
      `}</style>
    </div>
  );
};

// Sections as separate components for better organization
const S = {
  Welcome: () => (
    <div className="sec">
      <h3><FaInfoCircle className="sec-icon" /> Welcome to GVAS Platform</h3>
      <p>The Global Volcanic Aquifer Solutions (GVAS) platform is your comprehensive solution for advanced volcanic hydrostratigraphy analysis and groundwater resource evaluation. This powerful platform transforms complex heterogeneous well log data from multiple sources and diverse formats into standardized, consistent hydrostratigraphic models that can be reliably used for detailed analysis, interpretation, visualization, and decision-making in hydrogeological investigations.</p>
    </div>
  ),

  PlatformOverview: () => (
    <div className="sec">
      <h3><FaGlobe className="sec-icon" /> Platform Overview</h3>
      <p>GVAS - Global Volcanic Aquifer Solutions represents a revolutionary breakthrough in volcanic hydrostratigraphy, aquifer modeling, and subsurface intelligence. The platform automatically processes and standardizes well log data from diverse international sources using advanced artificial intelligence algorithms and extensive geological knowledge bases.</p>
      <p>The system effectively leverages AI, machine learning, and state-of-the-art computational methods to deliver accurate, reliable, and scientifically validated results that meet international standards in hydrogeological investigation and groundwater resource evaluation.</p>
    </div>
  ),

  CurrentStatus: ({ metrics }) => (
    <div className="sec">
      <h3><FaTachometerAlt className="sec-icon" /> Current Project Status</h3>
      <p>Successfully processed and analyzed {metrics.totalWells} wells containing {metrics.totalLayers} stratigraphic layers with an overall geological complexity reduction of {metrics.complexityReduction}% through systematic standardization and classification processes.</p>
    </div>
  ),

  GeologicalInfo: () => (
    <div className="sec">
      <h3><FaGem className="sec-icon" /> Geological Information</h3>
      <p>Basaltic aquifer systems represent some of the most productive and reliable groundwater resources in volcanic terranes worldwide. These systems are characterized by exceptional lateral continuity, fracture-controlled permeability, and efficient transmission characteristics.</p>
      <p>The Columbia River Basalt Group serves as an excellent example of a highly productive basalt aquifer system with transmissivity values ranging from 10 to 500 square meters per day, depending on fracturing and weathering.</p>
    </div>
  ),

  Environment: () => (
    <div className="sec">
      <h3><FaTint className="sec-icon" /> Geological Environment Characteristics</h3>
      <div className="grid1">
        <div className="card1">
          <strong>Tectonic Setting:</strong>
          <p>Active Continental Rift Valley System with extensional tectonics and associated volcanic activity.</p>
        </div>
        <div className="card1">
          <strong>Lithological Units:</strong>
          <p>Basaltic lava flows, Andesitic volcanic rocks, Rhyolitic dome complexes, Pyroclastic deposits.</p>
        </div>
        <div className="card1">
          <strong>Hydrogeological Characteristics:</strong>
          <p>Complex fractured volcanic aquifer systems exhibiting dual-porosity behavior with both matrix porosity and fracture permeability.</p>
        </div>
      </div>
    </div>
  ),

  Features: () => (
    <div className="sec">
      <h3><FaFire className="sec-icon" /> Advanced Platform Features</h3>
      <div className="grid1">
        <div className="card1"><FaFire className="fe-icon" /><strong>AI Causal Engine</strong><p>Powerful ML and DL algorithms for intelligent geological interpretation and hydrostratigraphic classification.</p></div>
        <div className="card1"><FaRulerCombined className="fe-icon" /><strong>3D Voxel Modeling</strong><p>Sophisticated 3D geological modeling for comprehensive subsurface visualization and spatial analysis.</p></div>
        <div className="card1"><FaLayerGroup className="fe-icon" /><strong>Volcanic Stratigraphy</strong><p>Advanced stratigraphic correlation and layer analysis for understanding complex volcanic sequences.</p></div>
        <div className="card1"><FaChartBar className="fe-icon" /><strong>Data Analytics</strong><p>Comprehensive analytical tools for statistical analysis, pattern recognition, and data visualization.</p></div>
      </div>
      <style jsx>{`.fe-icon { color: #4da6ff; font-size: 1.2rem; margin-right: 0.75rem; }`}</style>
    </div>
  ),

  Symbols: () => (
    <div className="sec">
      <h3><FaLayerGroup className="sec-icon" /> International Geological Symbols</h3>
      <div className="sym-grid">
        <div className="sym-card"><div className="sym-box bas">■</div><div className="sym-text"><strong>Basalt</strong><p>Volcanic extrusive rock formed from low-viscosity lava, typically dark gray to black, fine-grained.</p></div></div>
        <div className="sym-card"><div className="sym-box and">■</div><div className="sym-text"><strong>Andesite</strong><p>Intermediate volcanic rock with medium silica content, typically gray to dark gray.</p></div></div>
        <div className="sym-card"><div className="sym-box rhy">■</div><div className="sym-text"><strong>Rhyolite</strong><p>Felsic volcanic rock with high silica content, typically light gray to pink.</p></div></div>
        <div className="sym-card"><div className="sym-box pyr">■</div><div className="sym-text"><strong>Pyroclastic</strong><p>Fragmental volcanic deposits including ash, lapilli, bombs, and blocks from explosive eruptions.</p></div></div>
        <div className="sym-card"><div className="sym-box flow">→</div><div className="sym-text"><strong>Flow Direction</strong><p>Movement of water through aquifers, controlled by hydraulic gradient and permeability.</p></div></div>
        <div className="sym-card"><div className="sym-box rech">↑</div><div className="sym-text"><strong>Recharge Zone</strong><p>Area where water enters an aquifer system, typically elevated terrain or exposed bedrock.</p></div></div>
      </div>
    </div>
  ),

  Properties: () => (
    <div className="sec">
      <h3><FaGem className="sec-icon" /> Geological Properties</h3>
      <div className="grid1">
        <div className="card1"><strong>Hydraulic Conductivity:</strong><p>Ease with which water moves through rock or soil, determined by grain size, sorting, porosity, and fracturing.</p></div>
        <div className="card1"><strong>Storage Capacity:</strong><p>Ability of geological formations to hold and release water, influenced by porosity and permeability distribution.</p></div>
        <div className="card1"><strong>Volcanic Aquifer Systems:</strong><p>Characterized by significant heterogeneity with permeability controlled by fractures, vesicles, and weathering zones.</p></div>
      </div>
    </div>
  ),

  Classification: () => (
    <div className="sec">
      <h3><FaLayerGroup className="sec-icon" /> Lithology Classification</h3>
      <div className="grid1">
        <div className="card1"><strong>Basalt:</strong><p>Mafic extrusive volcanic rock with low silica content, dark colored, fine-grained, forms extensive lava flows.</p></div>
        <div className="card1"><strong>Andesite:</strong><p>Intermediate volcanic rock with medium silica content, gray to dark gray, commonly in subduction zones.</p></div>
        <div className="card1"><strong>Rhyolite:</strong><p>Felsic extrusive volcanic rock with high silica content, light gray to pink, fine-grained.</p></div>
        <div className="card1"><strong>Pyroclastic Rocks:</strong><p>Volcanic fragmental deposits including ash, lapilli, bombs, and blocks from explosive eruptions.</p></div>
      </div>
    </div>
  ),

  Stats: ({ metrics }) => (
    <div className="sec">
      <h3><FaChartBar className="sec-icon" /> Project Statistics</h3>
      <div className="stats-grid">
        <div className="stat-card hl"><FaChartBar className="stat-icon" /><div><span className="stat-value">{metrics.totalWells}</span><span className="stat-label">Total Wells Processed</span></div></div>
        <div className="stat-card"><FaLayerGroup className="stat-icon" /><div><span className="stat-value">{metrics.totalLayers}</span><span className="stat-label">Layers Analyzed</span></div></div>
        <div className="stat-card"><FaWater className="stat-icon" /><div><span className="stat-value">{metrics.aquiferLayers}</span><span className="stat-label">Aquifer Layers</span></div></div>
        <div className="stat-card"><FaTachometerAlt className="stat-icon" /><div><span className="stat-value">{metrics.avgConfidence}%</span><span className="stat-label">Avg Confidence</span></div></div>
        <div className="stat-card"><FaCog className="stat-icon" /><div><span className="stat-value">{metrics.complexityReduction}%</span><span className="stat-label">Complexity Reduction</span></div></div>
      </div>
    </div>
  ),

  MetricsSummary: ({ metrics }) => (
    <div className="sec">
      <h3><FaInfoCircle className="sec-icon" /> Metrics Summary</h3>
      <p><strong>Total Wells:</strong> {metrics.totalWells} wells comprehensively analyzed and processed.</p>
      <p><strong>Complexity Reduction:</strong> {metrics.complexityReduction}% - Significant reduction in geological complexity achieved through systematic classification.</p>
      <p><strong>Average Confidence:</strong> {metrics.avgConfidence}% - High confidence level in layer classifications and geological interpretations.</p>
      <p><strong>Aquifer Potential:</strong> {metrics.aquiferLayers} layers identified as productive aquifers out of {metrics.totalLayers} total layers.</p>
    </div>
  ),

  Content: ({ activeSection, topProductive, onFileUpload, onExport }) => {
    const renderUpload = () => (
      <div className="content-panel">
        <h3>Comprehensive Data Upload</h3>
        <p>Upload your well data files in various supported formats. Our advanced system will automatically process and standardize your data.</p>
        
        <div className="upload-grid">
          <div className="upload-card">
            <h4><FaFileImport /> CSV and Excel File Upload</h4>
            <p>Standard tabular format containing well log information with all required columns.</p>
            <input type="file" accept=".csv,.xlsx,.xls" onChange={e => e.target.files[0] && onFileUpload(e.target.files[0])} />
          </div>
          <div className="upload-card">
            <h4><FaFileImport /> Shapefile Upload</h4>
            <p>Upload spatial data including well point locations, cross-sectional line definitions, or study area boundaries.</p>
            <input type="file" accept=".shp,.zip" onChange={e => e.target.files[0] && onFileUpload(e.target.files[0])} />
          </div>
        </div>
      </div>
    );

    const renderExport = () => (
      <div className="content-panel">
        <h3>Comprehensive Data Export Options</h3>
        <p>Download your processed data in various industry standard formats with complete interpretations and evidence.</p>
        
        <div className="export-grid">
          <div className="export-card">
            <h4>Well Data Export</h4>
            <div className="fmt-buttons">
              <button onClick={() => onExport && onExport('wells', 'csv')}>CSV</button>
              <button onClick={() => onExport && onExport('wells', 'json')}>JSON</button>
              <button onClick={() => onExport && onExport('wells', 'shp')}>Shapefile</button>
            </div>
          </div>
          <div className="export-card">
            <h4>Stratigraphy Export</h4>
            <div className="fmt-buttons">
              <button onClick={() => onExport && onExport('layers', 'csv')}>CSV</button>
              <button onClick={() => onExport && onExport('layers', 'json')}>JSON</button>
              <button onClick={() => onExport && onExport('layers', 'shp')}>Shapefile</button>
            </div>
          </div>
          <div className="export-card">
            <h4>3D Model & Reports</h4>
            <div className="fmt-buttons">
              <button onClick={() => onExport && onExport('combined_3d', 'vtk')}>VTK</button>
              <button onClick={() => onExport && onExport('combined_3d', 'kml')}>KML</button>
              <button onClick={() => onExport && onExport('pdf', 'well_report')}>PDF Report</button>
              <button onClick={() => onExport && onExport('pdf', 'project_report')}>Project Report</button>
            </div>
          </div>
        </div>
      </div>
    );

    const renderAquifers = () => (
      <div className="content-panel">
        <h3>Aquifer Target Analysis</h3>
        <p>Based on AI analysis, the following stratigraphic layers have been identified as the most promising groundwater targets:</p>
        
        {topProductive.length > 0 ? (
          <div className="table-container">
            <table className="data-table">
              <thead><tr><th>Rank</th><th>Well ID</th><th>Layer Type</th><th>Depth Range</th><th>Confidence</th></tr></thead>
              <tbody>
                {topProductive.map((layer, index) => (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td>{layer.Well_ID}</td>
                    <td>{layer.Hydro_Property}</td>
                    <td>{layer.Depth_Start}-{layer.Depth_End} m</td>
                    <td>{(layer.Confidence * 100).toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="no-data">Upload well data to see aquifer recommendations.</p>
        )}
        
        {topProductive.length > 0 && (
          <div className="rec-box">
            <h4>AI Recommendations</h4>
            <p>The most promising groundwater target is the <strong>{topProductive[0].Hydro_Property}</strong> layer in well <strong>{topProductive[0].Well_ID}</strong> at depth {topProductive[0].Depth_Start}-{topProductive[0].Depth_End}m with confidence of <strong>{(topProductive[0].Confidence * 100).toFixed(1)}%</strong>.</p>
          </div>
        )}
      </div>
    );

    const renderHelp = () => (
      <div className="content-panel">
        <h3>Help & Support Center</h3>
        
        <div className="help-card">
          <h4><FaQuestionCircle /> Quick Start Guide</h4>
          <p>Get started with GVAS through these comprehensive steps:</p>
          <ol>
            <li><strong>Upload Data:</strong> Import well log files in supported formats (CSV, Excel, Shapefile).</li>
            <li><strong>Review Results:</strong> Examine AI-classified stratigraphic layers with hydro properties.</li>
            <li><strong>Explore Models:</strong> View 3D voxel models and interactive cross-sections.</li>
            <li><strong>Use AI Geologist:</strong> Ask questions about layers, productivity, and aquifer characteristics.</li>
            <li><strong>Export Data:</strong> Download results in multiple formats (CSV, JSON, PDF, Shapefile, VTK, KML).</li>
          </ol>
        </div>

        <div className="help-card">
          <h4><FaEnvelope /> Contact Information</h4>
          <p>For technical support or inquiries:</p>
          <ul>
            <li><strong>Primary:</strong> <a href="mailto:wagari.mosisa@ju.edu.et">wagari.mosisa@ju.edu.et</a></li>
            <li><strong>Alternate:</strong> <a href="mailto:wagarimosisa@gmail.com">wagarimosisa@gmail.com</a></li>
          </ul>
        </div>

        <div className="help-card">
          <h4><FaUserGraduate /> About the Developer</h4>
          <p><strong>Wagari Mosisa Kitessa</strong><br /><span className="role">Lead Developer & Principal Geologist</span></p>
          <p>GVAS was developed to address the challenge of standardizing complex heterogeneous volcanic well log data for comprehensive hydrogeological analysis and aquifer characterization.</p>
        </div>

        <div className="help-card">
          <h4><FaGithub /> Open Source Repository</h4>
          <p>View source code, contribute, or report issues:</p>
          <p><a href="https://github.com/wagarimosisa-jit/volcanostrat-ai" target="_blank" rel="noopener noreferrer" className="gh-link"><FaGithub /> wagarimosisa-jit/volcanostrat-ai</a></p>
        </div>

        <div className="help-card">
          <h4><FaInfoCircle /> Mission & Vision</h4>
          <p><strong>Mission:</strong> Transform how heterogeneous volcanic well log data is processed by developing AI-powered systems that convert complex inconsistent data into comprehensive hydrostratigraphic knowledge models.</p>
          <p><strong>Vision:</strong> Enable hydrogeologists worldwide to efficiently build consistent, scientifically explainable, technically defensible subsurface geological models from diverse well data.</p>
        </div>
      </div>
    );

    switch (activeSection) {
      case 'upload':
        return renderUpload();
      case 'export':
        return renderExport();
      case 'productive':
        return renderAquifers();
      case 'help':
        return renderHelp();
      default:
        return (
          <div className="content-panel">
            <h3>Platform Overview</h3>
            <p>Select a menu option from above to get started.</p>
          </div>
        );
    }
  },


};

export default Dashboard;

