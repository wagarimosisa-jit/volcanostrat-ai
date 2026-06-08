import React, { useState } from 'react';
import { FaGlobe, FaWater, FaChartBar, FaTachometerAlt, FaLayerGroup, FaCog, FaInfoCircle, FaFileImport, FaQuestionCircle, FaUserGraduate, FaEnvelope, FaGithub, FaLinkedin, FaFire, FaRulerCombined, FaGem, FaTint, FaChevronDown } from 'react-icons/fa';

const Dashboard = ({ wells, standardizedData, voxelModel, onFileUpload, onExport, isExpanded = false, onToggleExpand }) => {
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
      id: 'ethiopia',
      title: 'Ethiopian Geology',
      icon: <FaGem />,
      submenu: [
        { id: 'ethio-overview', title: 'Ethiopian Geological Overview', component: <S.EthiopianGeology /> },
        { id: 'renaissance-dam', title: 'Renaissance Dam Geology', component: <S.RenaissanceDam /> }
      ]
    },
    {
      id: 'geology',
      title: 'Geology',
      icon: <FaLayerGroup />,
      submenu: [
        { id: 'geo-info', title: 'Geological Information', component: <S.GeologicalInfo /> },
        { id: 'environment', title: 'Geological Environment', component: <S.Environment /> },
        { id: 'properties', title: 'Geological Properties', component: <S.Properties /> },
        { id: 'classification', title: 'Lithology Classification', component: <S.Classification /> },
        { id: 'symbols', title: 'Rock Types & Definitions', component: <S.Symbols /> },
        { id: 'formats', title: 'Format Guide', component: <S.FormatGuide /> }
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
        
        /* Developer Profile */
        .developer-profile { display: flex; align-items: center; gap: 1.5rem; margin: 1rem 0; padding: 1rem; background: rgba(255,255,255,0.05); border-radius: 0.5rem; border: 1px solid rgba(0,102,204,0.2); }
        .dev-photo { width: 150px; height: 180px; border-radius: 0.5rem; object-fit: cover; border: 3px solid #4da6ff; box-shadow: 0 4px 15px rgba(0,0,0,0.3); }
        .dev-info { flex: 1; }
        .dev-info h5 { margin: 0 0 0.5rem 0; color: #fff; font-size: 1.2rem; }
        .linkedin-link { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; background: #0077b5; border-radius: 0.35rem; color: #fff; text-decoration: none; transition: all 0.2s; margin: 0.5rem 0; }
        .linkedin-link:hover { background: #005582; }
        

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

  EthiopianGeology: () => (
    <div className="sec">
      <h3><FaGem className="sec-icon" /> Ethiopian Geological Overview</h3>
      <p>Ethiopia possesses one of the most fascinating and complex geological terrains in the world, characterized by diverse lithologies, active tectonics, and significant volcanic activity. The country's geology is dominated by the Ethiopian Rift Valley System, which is part of the East African Rift System extending from the Red Sea in the north to Mozambique in the south. This rift system divides Ethiopia into three major geological provinces: the Western Plateau, the Eastern Plateau, and the Rift Valley itself. The Western Plateau consists primarily of Precambrian metamorphic rocks and Mesozoic sedimentary sequences, while the Eastern Plateau is dominated by extensive Tertiary volcanic rocks, particularly the Ethiopian Flood Basalts. The Main Ethiopian Rift and the Afar Depression represent active continental rift zones with ongoing volcanic and tectonic activity, including the famous Erta Ale and Dallol volcanic areas in the Afar region.</p>
      <p>The geology of Ethiopia is of immense importance for understanding continental break-up processes, the evolution of large igneous provinces, and the development of rift valley systems. The country's geological history spans from the Precambrian to the Quaternary, with significant events including the Pan-African orogeny, the opening of the Tethys Ocean, the emplacement of large igneous provinces, and the development of the East African Rift System. Ethiopia's geological diversity is also reflected in its mineral resources, which include gold, platinum, tantalum, potash, and various industrial minerals. The country's hydrogeological systems are equally diverse, with significant groundwater resources occurring in both volcanic and sedimentary aquifers, as well as in complex fractured rock systems associated with the rift valley.</p>
    </div>
  ),

  RenaissanceDam: () => (
    <div className="sec">
      <h3><FaGem className="sec-icon" /> Grand Ethiopian Renaissance Dam Geology</h3>
      <p>The Grand Ethiopian Renaissance Dam (GERD), located on the Blue Nile River in the Benishangul-Gumuz region of northwestern Ethiopia, is constructed on a complex geological foundation comprising predominantly Precambrian basement rocks and overlying Mesozoic sedimentary sequences. The dam site is characterized by a geological setting that includes gneisses, schists, and granitic rocks of the Precambrian age, which form the primary foundation for this massive hydroelectric project. The Blue Nile River has carved a deep gorge through these ancient rocks, creating an ideal location for dam construction with significant height and storage capacity. The geological formations in the area have undergone extensive metamorphism and deformation during the Pan-African orogeny, resulting in complex structural patterns that required careful engineering consideration during dam design and construction.</p>
      <p>The reservoir area of the GERD covers a vast region with diverse geological characteristics, including extensive basaltic lava flows and interbedded sedimentary rocks. The geological complexity of the area presented significant challenges for reservoir tightness and seepage control, necessitating comprehensive geological and geotechnical investigations. The presence of fault zones and fractured rock formations required special attention to ensure the stability and safety of the dam structure. Moreover, the regional geology includes areas of karst development in limestone formations, which needed to be addressed through grouting and other remedial measures. The successful construction of the GERD demonstrates the application of advanced geological engineering principles to overcome the challenges posed by this complex geological setting, making it one of the most significant engineering achievements in African hydroelectric development.</p>
    </div>
  ),

  GeologicalInfo: () => (
    <div className="sec">
      <h3><FaGem className="sec-icon" /> Comprehensive Geological Information</h3>
      <p>Geology is the scientific study of the Earth, its composition, structure, processes, and history. It encompasses a wide range of sub-disciplines that examine various aspects of our planet from the microscopic scale of minerals and crystals to the macroscopic scale of mountain ranges and continental plates. Geological investigations reveal that the Earth is composed of several concentric layers: the crust (continental and oceanic), the mantle (upper and lower), and the core (outer liquid and inner solid). The Earth's lithosphere, which includes the crust and uppermost mantle, is broken into tectonic plates that are constantly in motion, driving the processes of continental drift, mountain building, volcanic activity, and earthquake generation.</p>
      <p>Rocks, the fundamental building blocks of the Earth's lithosphere, are classified into three main types based on their mode of formation: igneous rocks, which solidify from molten magma or lava; sedimentary rocks, which are deposited through various surface processes and subsequently lithified; and metamorphic rocks, which are pre-existing rocks that have been transformed by heat, pressure, and chemically active fluids. The rock cycle concept illustrates the dynamic and interconnected nature of these three rock types, with processes such as weathering, erosion, deposition, burial, metamorphism, melting, and crystallization constantly recycling Earth's materials. Geological time is vast, with the Earth being approximately 4.54 billion years old, and geological processes typically operating over millions to hundreds of millions of years, although some processes like volcanic eruptions and earthquakes occur over much shorter timescales.</p>
      <p>Plate tectonics is the unifying theory of geology that explains the large-scale motion of Earth's lithosphere. This theory states that the lithosphere is divided into a series of plates that move relative to each other on the more ductile asthenosphere. Plate boundaries are characterized by three main types of interactions: divergent boundaries where plates move apart and new lithosphere is created; convergent boundaries where plates move toward each other and one plate is typically subducted beneath the other; and transform boundaries where plates slide past each other horizontally. These plate interactions are responsible for the creation of various geological features including mid-ocean ridges, mountain ranges, deep ocean trenches, and major fault systems. The study of plate tectonics has revolutionized our understanding of Earth's geological evolution and continues to be a fundamental concept in modern geology.</p>
    </div>
  ),

  Environment: () => (
    <div className="sec">
      <h3><FaTint className="sec-icon" /> Geological Environment Characteristics</h3>
      <p>Geological environments represent the diverse settings in which geological processes operate and geological materials are formed, deformed, and transformed. These environments can be broadly categorized into several major types, each characterized by distinctive physical, chemical, and biological conditions that influence the nature of geological processes and the resulting geological products. The most fundamental division is between continental environments, which occur on land above sea level, and marine environments, which occur within the world's oceans and seas. Continental environments include fluvial (river) systems, lacustrine (lake) systems, aeolian (wind) systems, glacial systems, and various weathering and soil-forming environments. Marine environments include shallow marine settings such as continental shelves, deeper marine settings of the continental slope and rise, and the deep ocean abyssal plains.</p>
      
      <div className="grid1">
        <div className="card1">
          <strong>Tectonic Environments:</strong>
          <p>Tectonic environments are classified based on plate tectonic settings and include divergent plate boundaries characterized by extensional stress regimes and the formation of new oceanic crust; convergent plate boundaries characterized by compressional stress regimes and the formation of mountain ranges, volcanic arcs, and deep ocean trenches; and transform plate boundaries characterized by shear stress regimes and the development of major strike-slip fault systems. Each tectonic environment produces distinctive geological features and rock assemblages that reflect the prevailing stress conditions and thermal regimes.</p>
        </div>
        <div className="card1">
          <strong>Volcanic Environments:</strong>
          <p>Volcanic environments encompass the diverse settings in which magma reaches the Earth's surface. These include mid-ocean ridge systems where basaltic lavas erupt along divergent plate boundaries; subduction zone volcanic arcs where andesitic to rhyolitic magmas are generated above subducting oceanic plates; hotspot volcanic systems where mantle plumes produce volcanic chains and flood basalt provinces; and continental rift volcanic systems where alkaline basalts and bimodal volcanic suites are erupted in response to lithospheric extension. Each volcanic environment produces characteristic volcanic landforms, rock types, and eruption styles that reflect the composition and viscosity of the erupted magmas.</p>
        </div>
        <div className="card1">
          <strong>Sedimentary Environments:</strong>
          <p>Sedimentary environments encompass the wide range of settings in which sediments are deposited, including alluvial fans and braided river systems in mountainous regions; meandering river systems and floodplains in lower relief areas; deltaic systems where rivers enter standing bodies of water; various lake environments ranging from small oxbow lakes to vast inland seas; desert environments characterized by aeolian dune systems and ephemeral streams; and glacial environments dominated by ice sheets, valley glaciers, and their associated meltwater systems. Each sedimentary environment is characterized by distinctive sedimentary structures, grain size distributions, and sedimentary facies that reflect the depositional processes and energy conditions.</p>
        </div>
        <div className="card1">
          <strong>Metamorphic Environments:</strong>
          <p>Metamorphic environments occur where pre-existing rocks are subjected to elevated temperatures and pressures that cause mineralogical, chemical, and structural changes. These environments include regional metamorphism associated with orogenic belts and continent-continent collisions; contact metamorphism surrounding igneous intrusions; dynamic metamorphism along fault zones; hydrothermal metamorphism associated with circulating hot fluids; and burial metamorphism resulting from deep subsidence of sedimentary basins. The intensity of metamorphism is described by metamorphic grade, which increases from low-grade (e.g., slate and phyllite) through medium-grade (e.g., schist) to high-grade (e.g., gneiss) as temperature and pressure conditions intensify.</p>
        </div>
        <div className="card1">
          <strong>Hydrogeological Environments:</strong>
          <p>Hydrogeological environments represent the various settings in which groundwater occurs, moves, and interacts with geological materials. These include unconfined aquifers where the water table is the upper boundary of the saturated zone; confined aquifers where groundwater is bounded above and below by impermeable layers; fracture flow systems in consolidated rocks where groundwater movement is controlled by networks of fractures, joints, and faults; karst systems in soluble rocks such as limestone and dolomite where groundwater flow is enhanced by solution-enlarged fractures and caves; and porous media systems in unconsolidated sediments where groundwater flow occurs through the interconnected pore spaces between sedimentary particles.</p>
        </div>
      </div>
    </div>
  ),

  Properties: () => (
    <div className="sec">
      <h3><FaGem className="sec-icon" /> Geological Properties and Characteristics</h3>
      
      <div className="grid1">
        <div className="card1">
          <strong>Physical Properties:</strong>
          <p>Physical properties of rocks and minerals include density, which is the mass per unit volume typically measured in grams per cubic centimeter; porosity, which is the percentage of void space in a rock and can be primary (intergranular) or secondary (fracture-related); permeability, which is the ability of a material to transmit fluids and is measured in darcies or square meters; specific gravity, which is the ratio of the density of a substance to the density of water; hardness, which is the resistance of a mineral to scratching as measured by the Mohs scale; and magnetic susceptibility, which measures the degree to which a material can be magnetized in an external magnetic field. These physical properties are fundamental to understanding how geological materials behave under various conditions and are crucial for many engineering and hydrogeological applications.</p>
        </div>
        <div className="card1">
          <strong>Mechanical Properties:</strong>
          <p>Mechanical properties describe how geological materials respond to applied stresses and include compressive strength, which is the maximum compressive stress a material can withstand before failure; tensile strength, which is the maximum tensile stress; shear strength, which is the resistance to sliding along planes within a material; elastic modulus (Young's modulus), which describes the stiffness of a material; Poisson's ratio, which is the ratio of lateral strain to axial strain under uniaxial stress; and cohesion, which is the internal bonding strength of a material. These properties are essential for assessing the stability of slopes, the design of foundations, tunnels, and other engineered structures, and the evaluation of earthquake hazards.</p>
        </div>
        <div className="card1">
          <strong>Hydraulic Properties:</strong>
          <p>Hydraulic properties control the storage and transmission of fluids in geological materials and include hydraulic conductivity, which quantifies the ease with which water can move through a porous medium; transmissivity, which is the product of hydraulic conductivity and aquifer thickness; storativity (storage coefficient), which is the volume of water released from or taken into storage per unit surface area per unit change in head; specific yield, which is the ratio of the volume of water yielded by gravity drainage to the total volume of the aquifer material; specific retention, which is the ratio of the volume of water retained against gravity drainage to the total volume; and capillary pressure, which describes the pressure difference across the interface between two immiscible fluids.</p>
        </div>
        <div className="card1">
          <strong>Thermal Properties:</strong>
          <p>Thermal properties govern the heat transfer characteristics of geological materials and include thermal conductivity, which is the ability of a material to conduct heat; thermal diffusivity, which is the ratio of thermal conductivity to the product of density and specific heat capacity; specific heat capacity, which is the amount of heat required to raise the temperature of a unit mass of a material by one degree; thermal expansion coefficient, which describes how the volume of a material changes with temperature; and radiogenic heat production, which is the heat generated by the radioactive decay of isotopes within geological materials. These properties are important for understanding geothermal systems, the thermal evolution of sedimentary basins, and various geophysical applications.</p>
        </div>
        <div className="card1">
          <strong>Chemical Properties:</strong>
          <p>Chemical properties of geological materials include mineralogical composition, which describes the types and proportions of minerals present; major element chemistry, which typically includes the concentrations of silicon, aluminum, iron, calcium, magnesium, sodium, potassium, titanium, manganese, and phosphorus; trace element chemistry, which includes elements present in concentrations typically less than 0.1 weight percent; isotope ratios, which can provide information about the sources, ages, and histories of geological materials; pH and Eh (oxidation-reduction potential), which describe the acidity and oxidation state of water and other fluids; and solubility, which describes the maximum concentration of a substance that can dissolve in a given solvent under specific conditions.</p>
        </div>
        <div className="card1">
          <strong>Electrical Properties:</strong>
          <p>Electrical properties of geological materials include electrical conductivity, which is the ability of a material to conduct electric current; electrical resistivity, which is the inverse of electrical conductivity; dielectric constant (relative permittivity), which describes the ability of a material to store electrical charge when subjected to an electrical field; induced polarization, which describes the ability of a material to temporarily store and then release electrical charge; and self-potential (spontaneous polarization), which is the natural electrical potential that exists within the Earth in the absence of externally applied currents. These electrical properties form the basis for various electrical and electromagnetic geophysical exploration methods.</p>
        </div>
        <div className="card1">
          <strong>Magnetic Properties:</strong>
          <p>Magnetic properties of geological materials include magnetic susceptibility, which measures the degree to which a material can be magnetized in an external magnetic field; remanent magnetization, which is the permanent magnetization that a material retains after an external magnetic field is removed; coercivity, which is the reverse magnetic field required to reduce the magnetization to zero; and Curie temperature, which is the temperature above which ferromagnetic materials lose their permanent magnetization. These properties are fundamental to magnetic exploration methods and paleomagnetic studies, which use the magnetic properties of rocks to investigate geological structures and Earth's magnetic field history.</p>
        </div>
      </div>
    </div>
  ),

  Classification: () => (
    <div className="sec">
      <h3><FaLayerGroup className="sec-icon" /> Lithology Classification Systems</h3>
      <p>Lithology classification involves the systematic categorization of rocks based on various criteria including mineralogical composition, chemical composition, texture, structure, and mode of formation. Different classification schemes are used depending on the type of rock being classified and the purpose of the classification. For igneous rocks, the most widely used classification is based on mineralogical composition and silica content, with further subdivisions based on texture and occurrence. Sedimentary rocks are typically classified based on their grain size, mineralogical composition, and depositional environment. Metamorphic rocks are classified based on their mineral assemblages, textures, and the metamorphic grade, with additional considerations of their protolith (original rock type) and metamorphic facies.</p>
      
      <div className="grid1">
        <div className="card1">
          <strong>Classification by Composition:</strong>
          <p>Compositional classification divides rocks based on their mineral or chemical constituents. For igneous rocks, this includes felsic rocks (rich in feldspar and silica, typically light-colored), intermediate rocks, mafic rocks (rich in magnesium and iron, typically dark-colored), and ultramafic rocks (composed almost entirely of ferromagnesian minerals). The International Union of Geological Sciences (IUGS) classification for igneous rocks uses modal mineralogy (volume percentages of minerals) and chemical composition to define fields on classification diagrams such as the QAPF diagram for plutonic rocks and the TAS diagram for volcanic rocks. For sedimentary rocks, compositional classification distinguishes between siliclastic rocks (composed of silicate minerals and rock fragments), carbonate rocks (composed primarily of carbonate minerals), evaporite rocks (formed by evaporation and precipitation of mineral salts), and organic rocks (composed of organic material such as coal and oil shale).</p>
        </div>
        <div className="card1">
          <strong>Classification by Texture:</strong>
          <p>Textural classification categorizes rocks based on the size, shape, and arrangement of their constituent grains or crystals. For igneous rocks, texture is primarily described in terms of grain size (phaneritic for coarse-grained, aphanitic for fine-grained, porphyritic for rocks with large crystals in a fine-grained matrix) and crystal habit (euhedral for well-formed crystals, anhedral for poorly formed crystals). Additional textural terms include glassy (for rocks with a glassy matrix), vesicular (containing gas bubbles), and amygdaloidal (with vesicles filled by secondary minerals). For sedimentary rocks, texture includes grain size (clay, silt, sand, gravel, boulder), sorting (the range of grain sizes), roundness (the degree of abrasion of grains), and sphericity (the degree to which grains approach a spherical shape). For metamorphic rocks, texture includes foliated (with parallel alignment of minerals) and non-foliated (without parallel alignment) varieties, with further subdivisions based on the type and intensity of foliation.</p>
        </div>
        <div className="card1">
          <strong>Classification by Structure:</strong>
          <p>Structural classification groups rocks based on their large-scale internal organization and the geometric relationships between their components. For igneous rocks, structural classification includes massive (without preferred orientation), flow-banded (with bands formed by magma flow), layered (with alternating mineral layers), and vesicular (with abundant gas bubbles) structures. For sedimentary rocks, structural classification includes bedded (with distinct layers or beds), laminated (with thin layers), cross-bedded (with inclined layers), graded bedded (with systematic grain size variations), and massive (without distinct layering) structures. For metamorphic rocks, structural classification includes foliated structures such as slaty cleavage, phyllitic structure, schistose structure, and gneissose structure, which reflect the intensity and type of metamorphic deformation.</p>
        </div>
        <div className="card1">
          <strong>Classification by Genesis:</strong>
          <p>Genetic classification categorizes rocks based on their mode of origin or formation processes. For igneous rocks, this includes volcanic (extrusive) rocks that solidify at or near the Earth's surface, and plutonic (intrusive) rocks that solidify below the Earth's surface. Volcanic rocks are further subdivided into lava flows, pyroclastic deposits (formed from fragmented volcanic material ejected explosively), and volcaniclastic deposits (formed from the transportation and deposition of volcanic particles). Plutonic rocks are classified based on their depth of emplacement as subvolcanic (shallow intrusions), hypabyssal (intermediate depth intrusions), and abyssal (deep intrusions). For sedimentary rocks, genetic classification includes clastic rocks (formed from the transportation and deposition of weathered rock fragments), chemical rocks (formed by chemical precipitation from solution), biochemical rocks (formed by biological processes), and organic rocks (formed from the accumulation of organic material). For metamorphic rocks, genetic classification is based on the metamorphic environment and includes contact metamorphic rocks, regional metamorphic rocks, dynamic metamorphic rocks, hydrothermal metamorphic rocks, and burial metamorphic rocks.</p>
        </div>
      </div>
    </div>
  ),

  Symbols: () => (
    <div className="sec">
      <h3><FaLayerGroup className="sec-icon" /> Rock Types and Definitions</h3>
      <p>The following comprehensive list describes the major rock types found in the Earth's crust, organized by their primary mode of formation. Each rock type is characterized by its distinctive mineralogical composition, texture, chemical composition, and geological occurrence. Understanding these rock types and their characteristics is fundamental to geological mapping, resource exploration, and the interpretation of Earth's geological history.</p>
      
      <div className="grid1">
        <div className="card1">
          <strong>Igneous Rocks:</strong>
          <p><strong>Granite:</strong> A coarse-grained (phaneritic) intrusive igneous rock composed primarily of quartz, feldspar (both potassium feldspar and plagioclase feldspar), and mica (both biotite and muscovite). Granite typically contains more than 20% quartz by volume and has a felsic composition with silica content greater than 65%. Granites form from the slow crystallization of magma at depth and are commonly found in continental crust, forming the cores of many mountain ranges and the basement rocks of continental interiors. Varieties of granite include alkali granite (rich in potassium feldspar), granodiorite (with more plagioclase than potassium feldspar), and tonalite (with very little potassium feldspar). Granites are widely used as dimension stone and as aggregate in construction.</p>
          <p><strong>Basalt:</strong> A fine-grained (aphanitic) extrusive igneous rock composed primarily of plagioclase feldspar and pyroxene, with minor amounts of olivine, magnetite, and ilmenite. Basalt has a mafic composition with silica content typically between 45% and 55%. Basalts are the most common volcanic rock type on Earth, forming the oceanic crust and extensive lava flows on continents. Basalts can be subdivided based on their chemical composition and mineralogy into tholeiitic basalt (low in alkali elements and characterized by the presence of both clinopyroxene and orthopyroxene), alkali basalt (richer in alkali elements and typically containing olivine and clinopyroxene without orthopyroxene), and high-alumina basalt. Basalts weather to form fertile soils and are important sources of construction aggregate.</p>
          <p><strong>Andesite:</strong> A fine-grained extrusive igneous rock with an intermediate composition between basalt and rhyolite, typically containing 55-65% silica. Andesites are composed primarily of plagioclase feldspar with variable amounts of pyroxene, amphibole, biotite, and quartz. Andesites are commonly associated with subduction zone volcanism and are named after the Andes Mountains in South America, where they are abundant. Andesites can be further classified based on their mineralogy and chemical composition, and they typically form stratovolcanoes and volcanic domes in convergent plate boundary settings.</p>
          <p><strong>Rhyolite:</strong> A fine-grained extrusive igneous rock with a felsic composition similar to granite, typically containing more than 65% silica. Rhyolites are composed primarily of quartz, potassium feldspar (sanidine or orthoclase), and plagioclase feldspar, with minor amounts of biotite or amphibole. Rhyolites are the volcanic equivalent of granite and are commonly associated with explosive volcanic eruptions due to their high viscosity and gas content. Rhyolitic lava flows are relatively rare compared to basaltic flows, and rhyolite commonly occurs as pyroclastic deposits including pumice, ash, and obsidian (volcanic glass).</p>
        </div>
        <div className="card1">
          <strong>Sedimentary Rocks:</strong>
          <p><strong>Sandstone:</strong> A clastic sedimentary rock composed primarily of sand-sized mineral particles or rock fragments. Sandstones are classified based on their mineralogical composition as quartz arenite (more than 90% quartz), arkose (more than 25% feldspar), lithic arenite (more than 25% rock fragments), and wacke (matrix-rich with more than 15% mud). Sandstones are typically deposited in a wide range of environments including rivers, deltas, beaches, deserts, and deep marine settings. The grain size, sorting, roundness, and composition of sandstones provide important information about their depositional environment and source area. Sandstones are important reservoir rocks for groundwater and hydrocarbons.</p>
          <p><strong>Limestone:</strong> A chemical or biochemical sedimentary rock composed primarily of calcium carbonate (calcite) or the double carbonate of calcium and magnesium (dolomite). Limestones are classified based on their origin and texture as biochemical limestone (formed from the accumulation of skeletal material from organisms), chemical limestone (formed by chemical precipitation), clastic limestone (formed from the transportation and deposition of carbonate particles), and crystalline limestone (formed by recrystallization). Limestones are commonly deposited in shallow marine environments and are important industrial rocks used in the production of cement, lime, and as dimension stone. Limestones are also important aquifers and reservoir rocks, and they commonly display karst features including caves, sinkholes, and underground drainage systems.</p>
          <p><strong>Shale:</strong> A fine-grained clastic sedimentary rock composed of mud-sized particles (less than 0.0625 mm) including clay minerals, quartz, feldspar, and organic material. Shales are characterized by their fissility, which is the ability to split into thin layers along bedding planes. Shales are typically deposited in low-energy environments such as deep marine settings, floodplains, and lakes. The clay minerals in shales provide important information about the depositional environment, and the organic content of shales can be a source of hydrocarbons. Shales are important as source rocks for oil and gas, as seals for hydrocarbon reservoirs, and as the most common sedimentary rock type in the Earth's crust.</p>
          <p><strong>Conglomerate:</strong> A coarse-grained clastic sedimentary rock composed of rounded clasts (pebbles, cobbles, or boulders) in a finer-grained matrix. Conglomerates are classified based on the composition of their clasts as oligomictic (clasts of one rock type), polymictic (clasts of multiple rock types), and petromictic (clasts with a wide variety of rock types). The roundness, size, and sorting of clasts in conglomerates provide important information about the transport distance and depositional environment. Conglomerates are typically deposited in high-energy environments such as rivers, alluvial fans, and beaches, and they can be important aquifers and reservoir rocks.</p>
        </div>
        <div className="card1">
          <strong>Metamorphic Rocks:</strong>
          <p><strong>Gneiss:</strong> A coarse-grained foliated metamorphic rock characterized by alternating light and dark mineral bands (gneissic banding). Gneisses are composed primarily of quartz, feldspar, mica, and amphibole, with the mineral assemblage and texture reflecting the intensity of metamorphism and the composition of the original rock (protolith). Gneisses form under high-grade metamorphic conditions (high temperature and pressure) and are commonly found in the cores of mountain ranges and in Precambrian shield areas. Gneisses can be classified based on their protolith as orthogneiss (derived from igneous rocks) and paragneiss (derived from sedimentary rocks). The foliation in gneisses typically dips steeply and can be used to infer the structural history of the region.</p>
          <p><strong>Schist:</strong> A medium to coarse-grained foliated metamorphic rock characterized by a schistose structure in which platy minerals (primarily micas) are aligned parallel to each other. Schists are composed of varying proportions of micas (muscovite, biotite, or chlorite), quartz, feldspar, and other minerals, with the specific mineral assemblage depending on the composition of the protolith and the metamorphic grade. Schists form under medium-grade metamorphic conditions and are classified based on their dominant mica as mica schist (muscovite or biotite), chlorite schist, talc schist, or graphite schist. The schistosity in schists represents the planar fabric element that formed perpendicular to the maximum compressive stress during metamorphism.</p>
          <p><strong>Marble:</strong> A coarse-grained non-foliated metamorphic rock composed primarily of recrystallized carbonate minerals (calcite or dolomite). Marble forms from the metamorphism of limestone or dolomite and is characterized by its interlocking calcite or dolomite grains with a granoblastic texture. Marbles can be white, gray, or various colors depending on the presence of impurities, and they commonly contain accessory minerals such as quartz, mica, pyroxene, amphibole, and graphite. Marble is an important dimension stone used in sculpture, architecture, and monuments, and it can also be used as a filler in various industrial applications. Marbles are commonly found in regions that have experienced regional metamorphism.</p>
          <p><strong>Quartzite:</strong> A coarse-grained non-foliated metamorphic rock composed almost entirely of quartz. Quartzite forms from the metamorphism of quartz-rich sandstone and is characterized by its interlocking quartz grains with a granoblastic or mosaical texture. Quartzites are extremely hard and durable rocks that are resistant to chemical weathering. They commonly form ridges and resistant outcrops in the landscape. Quartzites can be white, gray, or various colors depending on the presence of impurities, and they are commonly used as dimension stone, aggregate, and as a source of silica for various industrial applications. Quartzites typically form under medium to high-grade metamorphic conditions.</p>
        </div>
      </div>
    </div>
  ),

  FormatGuide: () => (
    <div className="sec">
      <h3><FaFileImport className="sec-icon" /> Supported Data Format Guide</h3>
      <p>The GVAS platform supports a wide range of data formats to accommodate diverse data sources and user requirements. Each format has specific characteristics, advantages, and use cases. Understanding these formats will help you choose the most appropriate format for your data and ensure optimal processing and analysis results.</p>
      
      <div className="grid1">
        <div className="card1">
          <strong>CSV (Comma-Separated Values):</strong>
          <p>CSV is a simple, widely used tabular data format that stores information in plain text form with values separated by commas. Each line in a CSV file represents a data record, and each record consists of one or more fields separated by commas. CSV files are human-readable and can be easily created, viewed, and edited using text editors or spreadsheet applications such as Microsoft Excel, LibreOffice Calc, or Google Sheets. CSV files are ideal for well log data where information is organized in a tabular structure with consistent column headers. The simplicity of the CSV format makes it easy to import and export data between different software applications, and it is supported by virtually all data analysis and visualization tools. When preparing well log data in CSV format, ensure that column headers are included in the first row, consistent delimiters are used, and missing data are appropriately represented.</p>
        </div>
        <div className="card1">
          <strong>Excel (XLSX, XLS):</strong>
          <p>Excel files are spreadsheet documents created using Microsoft Excel or compatible spreadsheet applications. Excel files can contain multiple worksheets within a single file, with each worksheet capable of storing data in a tabular format. Excel files support various data types including text, numbers, dates, times, and Boolean values, as well as formatting options such as cell styles, colors, and fonts. Excel files are particularly useful for well log data that may be organized across multiple sheets, with each sheet potentially containing different types of information such as well header data, lithology logs, geophysical logs, or water quality data. Excel files can also include formulas, charts, and other analysis tools that can be useful for preliminary data exploration and validation. When using Excel files for well log data, it is recommended to organize data in a clean tabular format with consistent column headers and to avoid merging cells or using complex formulas that may interfere with data import.</p>
        </div>
        <div className="card1">
          <strong>Shapefile (SHP):</strong>
          <p>A shapefile is a popular geospatial vector data format developed by ESRI for storing the location, shape, and attributes of geographic features. A shapefile consists of multiple component files including the main .shp file containing the geometric data, the .shx file containing the shape index, and the .dbf file containing the attribute data in dBASE format. Shapefiles can store various vector feature types including points, lines (polylines), and polygons, making them ideal for representing spatial data such as well locations, cross-sectional lines, study area boundaries, and geological contacts. Shapefiles are widely used in geographic information systems (GIS) and are supported by most GIS software applications. When using shapefiles for well log data, point features can represent well locations, line features can represent cross-sectional lines or geological contacts, and polygon features can represent study areas, geological units, or aquifer boundaries. It is important to ensure that all component files of the shapefile are kept together and that the coordinate system is properly defined.</p>
        </div>
        <div className="card1">
          <strong>KML (Keyhole Markup Language):</strong>
          <p>KML is an XML-based file format used to display geographic data in Earth browsers such as Google Earth, Google Maps, and other geospatial applications. KML files can contain various geographic features including points, lines, polygons, and 3D models, as well as styles, overlays, and other visualization elements. KML files are human-readable and can be created and edited using text editors or specialized KML authoring tools. KML files are particularly useful for visualizing and sharing geospatial data in a 3D Earth browser environment, and they support the creation of complex visualizations including nested folders, custom icons, labels, and HTML-based pop-up balloons. When using KML files for well log data, points can represent well locations with custom icons, lines can represent cross-sectional traces or geological contacts, and polygons can represent study areas or geological units. KML files created by GVAS can be directly loaded into Google Earth for interactive 3D visualization and analysis.</p>
        </div>
        <div className="card1">
          <strong>VTK (Visualization Toolkit):</strong>
          <p>VTK is an open-source file format used for storing 3D visualization data, particularly unstructured grid data representing complex geometric and scalar/field data. VTK files are commonly used in scientific visualization applications for representing 3D models, finite element meshes, and volumetric data. VTK files created by GVAS contain 3D voxel models representing the subsurface geological structure derived from well log data. These files can store information about the spatial distribution of geological units, hydrostratigraphic layers, and various geological properties in three dimensions. VTK files are supported by various scientific visualization software packages including ParaView, VisIt, and 3D Slicer. When using VTK files for 3D geological modeling, the voxel size and resolution can be adjusted to balance between model detail and computational efficiency. VTK files provide a powerful means of visualizing and analyzing complex 3D geological relationships and can be used for advanced geological interpretation and resource evaluation.</p>
        </div>
        <div className="card1">
          <strong>JSON (JavaScript Object Notation):</strong>
          <p>JSON is a lightweight, text-based data interchange format that is easy for humans to read and write and easy for machines to parse and generate. JSON data is structured as key-value pairs or ordered lists, and it supports various data types including strings, numbers, Booleans, arrays, and objects. JSON files are commonly used for data exchange between web applications and servers, and they are natively supported by JavaScript and many other programming languages. JSON files created by GVAS contain well log data, geological interpretations, and other information in a structured, hierarchical format that preserves the relationships between different data elements. JSON files are particularly useful for web-based applications, data archiving, and data exchange with other software systems. When using JSON files for well log data, the hierarchical structure can represent the organization of data from the project level (containing multiple wells) to the well level (containing multiple layers) to the layer level (containing various properties and measurements).</p>
        </div>
      </div>
    </div>
  ),

  Features: () => (
    <div className="sec">
      <h3><FaFire className="sec-icon" /> Advanced Platform Features</h3>
      <div className="grid1">
        <div className="card1"><FaFire className="fe-icon" /><strong>AI Causal Engine</strong><p>Powerful machine learning and deep learning algorithms for intelligent geological interpretation, hydrostratigraphic classification, and predictive modeling of subsurface conditions. The AI system automatically identifies patterns in complex well log data, correlates stratigraphic units across multiple wells, and generates comprehensive hydrogeological models.</p></div>
        <div className="card1"><FaRulerCombined className="fe-icon" /><strong>3D Voxel Modeling</strong><p>Sophisticated three-dimensional geological modeling capabilities for comprehensive subsurface visualization and spatial analysis. The voxel modeling system creates detailed 3D representations of geological formations, aquifer systems, and hydrostratigraphic units based on well log interpretations and geological knowledge bases.</p></div>
        <div className="card1"><FaLayerGroup className="fe-icon" /><strong>Volcanic Stratigraphy</strong><p>Advanced stratigraphic correlation and layer analysis tools specifically designed for understanding complex volcanic sequences. The system automatically identifies and correlates volcanic layers, recognizes volcanic facies associations, and interprets volcanic depositional environments.</p></div>
        <div className="card1"><FaChartBar className="fe-icon" /><strong>Data Analytics</strong><p>Comprehensive analytical tools for statistical analysis, spatial pattern recognition, and multidimensional data visualization. The analytics suite includes descriptive statistics, correlation analysis, cluster analysis, and various visualization tools for exploring relationships in well log data.</p></div>
      </div>
      <style jsx>{`.fe-icon { color: #4da6ff; font-size: 1.2rem; margin-right: 0.75rem; }`}</style>
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
          <div className="developer-profile">
            <img src="https://via.placeholder.com/150x180/1976d2/ffffff?text=Dr.+Wagari+Mosisa" alt="Wagari Mosisa Kitessa, PhD" className="dev-photo" />
            <div className="dev-info">
              <h5>Wagari Mosisa Kitessa, PhD</h5>
              <p className="role">Lead Developer & Principal Geologist</p>
              <p><a href="https://www.linkedin.com/in/wagari-mosisa-phd-9b50ab85/" target="_blank" rel="noopener noreferrer" className="linkedin-link">
                <FaLinkedin /> View LinkedIn Profile
              </a></p>
            </div>
          </div>
          <p>GVAS was developed to address the challenge of standardizing complex heterogeneous volcanic well log data for comprehensive hydrogeological analysis and aquifer characterization. Dr. Wagari Mosisa Kitessa is an experienced geologist and hydrogeologist with expertise in volcanic aquifer systems, groundwater resource evaluation, and AI-powered geological data analysis. His research focuses on transforming complex well log data into actionable hydrostratigraphic knowledge through advanced computational methods and machine learning algorithms.</p>
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

