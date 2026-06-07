import React, { useState } from 'react';
import { FaGlobe, FaWater, FaChartBar, FaTachometerAlt, FaLayerGroup, FaCog, FaInfoCircle, FaFileImport, FaFileExport, FaQuestionCircle, FaUserGraduate, FaEnvelope, FaGithub, FaFire, FaCompass, FaRulerCombined, FaSearch, FaFilter, FaGem, FaTint } from 'react-icons/fa';

const Dashboard = ({ wells, standardizedData, voxelModel, onFileUpload, onExport, isExpanded = false, onToggleExpand }) => {
  const [activeSection, setActiveSection] = useState('overview');

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

  return (
    <div className="gvas-dashboard">
      <div className="geological-bg"></div>
      <div className={`side-panel ${isExpanded ? 'expanded' : 'collapsed'}`}>
        <div className="panel-header">
          <div className="logo-area">
            <div className="volcanic-icon">
              <div className="lava-layer l1"></div><div className="lava-layer l2"></div>
              <div className="lava-layer l3"></div><div className="lava-layer l4"></div>
              <div className="core"></div><div className="fractures"></div>
            </div>
            <div className="branding">
              <h2>GVAS</h2>
              <span className="full-name">Global Volcanic Aquifer Solutions</span>
              <span className="tagline">Advanced Causal Subsurface Intelligence Platform for Volcanic Hydrostratigraphy Analysis and Interpretation Worldwide</span>
            </div>
          </div>
          <button className="toggle-side" onClick={onToggleExpand}>{isExpanded ? '←' : '→'}</button>
        </div>

        <div className="main-vertical">
          <div className="scroll-content">
            <S.Welcome />
            <S.PlatformOverview />
            <S.CurrentStatus metrics={calculatedMetrics} />
            <S.GeologicalInfo />
            <S.Environment />
            <S.Features />
            <S.Symbols />
            <S.Properties />
            <S.Classification />
            <S.Stats metrics={calculatedMetrics} />
            <S.MetricsSummary metrics={calculatedMetrics} />
            <S.Nav activeSection={activeSection} setActiveSection={setActiveSection} />
            <S.Content activeSection={activeSection} topProductive={topProductive} onFileUpload={onFileUpload} onExport={onExport} />
            <S.Footer />
          </div>
        </div>
      </div>

      <style jsx>{`
        .gvas-dashboard { position: relative; height: 100%; display: flex; }
        .geological-bg { position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background: linear-gradient(135deg, rgba(10,20,40,0.95), rgba(20,40,60,0.98), rgba(10,20,40,0.95)),
            repeating-linear-gradient(to bottom, transparent, transparent 40px, rgba(80,120,160,0.04) 40px, rgba(80,120,160,0.04) 43px, rgba(120,160,200,0.03) 43px, rgba(120,160,200,0.03) 46px),
            repeating-linear-gradient(-45deg, transparent, transparent 60px, rgba(100,140,180,0.03) 60px, rgba(100,140,180,0.03) 65px),
            radial-gradient(ellipse at 50% 0%, rgba(40,80,120,0.2), transparent 100%);
          z-index: -1; pointer-events: none; }
        
        .side-panel { width: 350px; background: rgba(15,30,50,0.9); color: #fff; display: flex; flex-direction: column;
          transition: width 0.3s; margin: 0.5rem; border-radius: 0.75rem; border: 1px solid rgba(77,166,255,0.3);
          box-shadow: 0 10px 40px rgba(0,0,0,0.6); backdrop-filter: blur(10px); overflow-y: auto; max-height: 100vh; }
        .side-panel.collapsed { width: 60px; }
        .side-panel.collapsed .logo-area .branding, .side-panel.collapsed .main-vertical { display: none; }
        
        .panel-header { display: flex; justify-content: space-between; align-items: center; padding: 1.5rem; border-bottom: 1px solid rgba(77,166,255,0.4);
          background: linear-gradient(135deg, rgba(52,152,219,0.2), rgba(46,204,113,0.2)); }
        .logo-area { display: flex; align-items: center; gap: 1rem; width: 100%; }
        
        .volcanic-icon { position: relative; width: 50px; height: 50px; }
        .lava-layer { position: absolute; border-radius: 50%; opacity: 0.8; }
        .lava-layer.l1 { width: 42px; height: 42px; top: 4px; left: 4px; background: linear-gradient(135deg,#2c3e50,#34495e); z-index: 1; }
        .lava-layer.l2 { width: 34px; height: 34px; top: 7px; left: 7px; background: linear-gradient(135deg,#34495e,#3d566e); z-index: 2; }
        .lava-layer.l3 { width: 26px; height: 26px; top: 10px; left: 10px; background: linear-gradient(135deg,#3d566e,#4a6984); z-index: 3; }
        .lava-layer.l4 { width: 18px; height: 18px; top: 13px; left: 13px; background: linear-gradient(135deg,#4a6984,#5d8ca8); z-index: 4; }
        .core { position: absolute; width: 8px; height: 8px; top: 16px; left: 16px; background: radial-gradient(circle,#85c1e9,#2980b9); border-radius: 50%; z-index: 5;
          box-shadow: 0 0 10px rgba(133,193,233,0.8); animation: glow 2s ease-in-out infinite alternate; }
        .fractures { position: absolute; top: 0; left: 0; width: 50px; height: 50px;
          background-image: linear-gradient(45deg, rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(-45deg, rgba(255,255,255,0.15) 1px, transparent 1px),
            linear-gradient(0deg, rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px);
          background-size: 6px 6px, 6px 6px, 8px 8px, 8px 8px; border-radius: 50%; opacity: 0.7; z-index: 1; animation: rot 30s linear infinite; }
        @keyframes glow { from {box-shadow: 0 0 5px rgba(133,193,233,0.5);} to {box-shadow: 0 0 15px rgba(133,193,233,1);} }
        @keyframes rot { from {transform: rotate(0deg);} to {transform: rotate(360deg);} }
        
        .branding h2 { margin: 0; font-size: 2rem; font-weight: 800; letter-spacing: -1px;
          background: linear-gradient(135deg,#4da6ff,#85c1e9,#4da6ff); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .full-name { color: rgba(255,255,255,0.95); font-size: 1rem; display: block; margin-top: 0.25rem; font-weight: 500; }
        .tagline { color: rgba(133,193,233,0.85); font-size: 0.75rem; display: block; margin-top: 0.2rem; font-style: italic; line-height: 1.5; }
        
        .toggle-side { background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.3); color: #fff; padding: 0.6rem 0.85rem;
          border-radius: 0.5rem; cursor: pointer; font-size: 1.1rem; transition: all 0.2s; min-width: 45px; }
        .toggle-side:hover { background: rgba(77,166,255,0.3); border-color: rgba(77,166,255,0.6); transform: scale(1.1); }
        
        .main-vertical { flex: 1; display: flex; flex-direction: column; }
        .scroll-content { flex: 1; overflow-y: auto; padding: 0.5rem; }
        
        /* All content in single column */
        .sec { padding: 1.25rem 1rem; margin: 0 1rem 1rem 1rem; background: rgba(0,0,0,0.4); border-radius: 0.75rem;
          border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 2px 10px rgba(0,0,0,0.3); }
        .sec h3 { color: #4da6ff; margin: 0 0 0.75rem 0; font-size: 1.1rem; display: flex; align-items: center; gap: 0.75rem;
          border-bottom: 1px solid rgba(77,166,255,0.3); padding-bottom: 0.5rem; }
        .sec-icon { color: #85c1e9; font-size: 1.2rem; }
        .sec p, .sec li, .sec a { color: rgba(255,255,255,0.95); line-height: 1.6; font-size: 0.9rem; text-align: justify; }
        .sec a { color: #4da6ff; text-decoration: none; }
        .sec a:hover { text-decoration: underline; }
        
        /* Grid items in single column */
        .grid1 { display: grid; grid-template-columns: 1fr; gap: 1rem; }
        .card1 { padding: 0.75rem; background: rgba(0,0,0,0.3); border-radius: 0.5rem; border-left: 3px solid rgba(77,166,255,0.3); }
        .card1 strong { display: block; color: #4da6ff; margin-bottom: 0.25rem; font-size: 0.9rem; }
        .card1 p { margin: 0; color: rgba(255,255,255,0.9); font-size: 0.85rem; line-height: 1.5; }
        
        /* Symbols */
        .sym-grid { display: grid; grid-template-columns: 1fr; gap: 1rem; }
        .sym-card { display: flex; gap: 1rem; padding: 0.75rem; background: rgba(0,0,0,0.3); border-radius: 0.5rem; border: 1px solid rgba(77,166,255,0.2); }
        .sym-box { width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; border-radius: 0.25rem; flex-shrink: 0; }
        .sym-box.bas { background: #006400; color: #fff; }
        .sym-box.and { background: #556B2F; color: #fff; }
        .sym-box.rhy { background: #FFB6C1; color: #8B0000; }
        .sym-box.pyr { background: #FFA500; color: #8B4513; }
        .sym-box.flow { background: #4682B4; color: #fff; }
        .sym-box.rech { background: #228B22; color: #fff; }
        .sym-text strong { display: block; color: #4da6ff; margin-bottom: 0.25rem; font-size: 0.9rem; }
        .sym-text p { margin: 0; color: rgba(255,255,255,0.9); font-size: 0.85rem; line-height: 1.5; }
        
        /* Stats */
        .stats-grid { display: grid; grid-template-columns: 1fr; gap: 1rem; }
        .stat-card { background: rgba(0,0,0,0.5); border-radius: 0.75rem; padding: 1.25rem; display: flex; align-items: center; gap: 1rem;
          border: 1px solid rgba(77,166,255,0.3); transition: all 0.3s; }
        .stat-card:hover { transform: translateY(-5px); box-shadow: 0 10px 30px rgba(0,0,0,0.5); border-color: rgba(77,166,255,0.6); }
        .stat-card.hl { background: linear-gradient(135deg, rgba(52,152,219,0.3), rgba(46,204,113,0.2)); border-color: #4da6ff; }
        .stat-card.sc { background: linear-gradient(135deg, rgba(46,204,113,0.3), rgba(52,152,219,0.2)); border-color: #2ecc71; }
        .stat-card.wr { background: linear-gradient(135deg, rgba(241,196,15,0.3), rgba(231,76,60,0.2)); border-color: #f1c40f; }
        .stat-card.in { background: linear-gradient(135deg, rgba(77,166,255,0.3), rgba(133,193,233,0.2)); border-color: #4da6ff; }
        .stat-card.pr { background: linear-gradient(135deg, rgba(52,152,219,0.4), rgba(93,173,226,0.3)); border-color: #5dade2; }
        .stat-icon { font-size: 1.75rem; color: #4da6ff; text-shadow: 0 0 10px rgba(77,166,255,0.5); }
        .stat-value { font-size: 1.75rem; font-weight: bold; color: #fff; text-shadow: 0 2px 5px rgba(0,0,0,0.5); }
        .stat-label { font-size: 0.8rem; color: rgba(255,255,255,0.8); text-transform: uppercase; letter-spacing: 0.5px; font-weight: 500; }
        
        /* Nav */
        .nav-sec { padding: 1rem 1rem; margin: 0 1rem 1rem 1rem; background: rgba(0,0,0,0.3); border-radius: 0.75rem; border: 1px solid rgba(255,255,255,0.1); }
        .nav-buttons { display: flex; flex-direction: column; gap: 0.5rem; }
        .nav-buttons button { display: flex; align-items: center; gap: 0.75rem; padding: 0.85rem 1rem; background: transparent; border: none;
          color: rgba(255,255,255,0.85); border-radius: 0.5rem; cursor: pointer; font-size: 0.9rem; transition: all 0.2s;
          text-align: left; border-left: 3px solid transparent; font-weight: 500; }
        .nav-buttons button:hover { background: rgba(255,255,255,0.1); color: #fff; transform: translateX(5px); }
        .nav-buttons button.active { background: rgba(77,166,255,0.25); color: #fff; border-left-color: #4da6ff; box-shadow: inset 0 0 10px rgba(77,166,255,0.2); }
        
        /* Content */
        .content-panel { padding: 1.5rem 1rem; margin: 0 1rem 1rem 1rem; background: rgba(0,0,0,0.4); border-radius: 0.75rem;
          border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 2px 15px rgba(0,0,0,0.3); }
        .content-panel h3 { color: #4da6ff; margin: 0 0 1rem 0; font-size: 1.1rem; border-bottom: 2px solid rgba(77,166,255,0.4); padding-bottom: 0.5rem; }
        .content-panel p { color: rgba(255,255,255,0.95); margin: 0 0 1rem 0; line-height: 1.6; font-size: 0.9rem; text-align: justify; }
        .table-container { margin: 1rem 0; overflow-x: auto; }
        .data-table { width: 100%; border-collapse: collapse; color: #fff; }
        .data-table th, .data-table td { padding: 0.75rem; text-align: left; border-bottom: 1px solid rgba(255,255,255,0.2); }
        .data-table th { background: rgba(77,166,255,0.2); color: #4da6ff; font-weight: 600; font-size: 0.85rem; }
        .data-table td { color: rgba(255,255,255,0.95); font-size: 0.85rem; }
        .data-table tr:hover { background: rgba(77,166,255,0.15); }
        .no-data { color: rgba(255,255,255,0.6); font-style: italic; text-align: center; padding: 1rem; }
        .rec-box { margin-top: 1.5rem; padding: 1rem; background: linear-gradient(135deg, rgba(76,175,222,0.2), rgba(52,152,219,0.2));
          border-left: 4px solid #4da6ff; border-radius: 0.5rem; box-shadow: 0 2px 10px rgba(77,166,255,0.2); }
        .rec-box h4 { margin: 0 0 0.75rem 0; color: #4da6ff; font-size: 1rem; }
        .rec-box p { margin: 0; color: rgba(255,255,255,0.95); line-height: 1.6; font-size: 0.9rem; }
        .upload-grid { display: grid; grid-template-columns: 1fr; gap: 1rem; margin: 1rem 0; }
        .upload-card { padding: 1rem; background: rgba(255,255,255,0.05); border-radius: 0.5rem; border: 1px dashed rgba(255,255,255,0.3); }
        .upload-card h4 { margin: 0 0 0.5rem 0; display: flex; align-items: center; gap: 0.5rem; color: #fff; font-size: 1rem; }
        .upload-card p { font-size: 0.85rem; color: rgba(255,255,255,0.85); margin: 0 0 0.75rem 0; line-height: 1.5; }
        .export-grid { display: grid; grid-template-columns: 1fr; gap: 1rem; margin: 1rem 0; }
        .export-card { padding: 1rem; background: rgba(255,255,255,0.05); border-radius: 0.5rem; border: 1px solid rgba(255,255,255,0.1); }
        .export-card h4 { margin: 0 0 0.75rem 0; color: #4da6ff; font-size: 1rem; }
        .fmt-buttons { display: flex; gap: 0.5rem; flex-wrap: wrap; }
        .fmt-buttons button { padding: 0.5rem 0.75rem; background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.3);
          border-radius: 0.25rem; color: #fff; cursor: pointer; font-size: 0.8rem; transition: all 0.2s; }
        .fmt-buttons button:hover { background: rgba(255,255,255,0.25); border-color: rgba(77,166,255,0.5); }
        .info-card { margin-top: 1rem; padding: 1rem; background: linear-gradient(135deg, rgba(241,196,15,0.2), rgba(243,156,18,0.2));
          border-left: 4px solid #f1c40f; border-radius: 0.5rem; box-shadow: 0 2px 10px rgba(241,196,15,0.2); }
        .info-card h4 { margin: 0 0 0.75rem 0; color: #f1c40f; font-size: 1rem; }
        .info-card p { margin: 0 0 0.5rem 0; color: rgba(255,255,255,0.95); line-height: 1.6; font-size: 0.9rem; }
        .info-card ul { margin: 0.5rem 0 0 1rem; padding: 0; }
        .info-card li { margin-bottom: 0.5rem; font-size: 0.85rem; color: rgba(255,255,255,0.9); }
        .help-card { background: rgba(0,0,0,0.1); border-radius: 0.5rem; padding: 1rem; margin: 1rem 0; }
        .help-card h4 { color: #4da6ff; display: flex; align-items: center; gap: 0.5rem; margin: 0 0 0.75rem 0; font-size: 1rem; }
        .help-card p { color: rgba(255,255,255,0.95); margin: 0 0 0.75rem 0; line-height: 1.6; font-size: 0.9rem; }
        .help-card ol { padding-left: 1.5rem; margin: 0.5rem 0; }
        .help-card li { margin-bottom: 0.5rem; color: rgba(255,255,255,0.9); font-size: 0.85rem; }
        .help-card a { color: #4da6ff; text-decoration: none; }
        .help-card a:hover { text-decoration: underline; }
        .gh-link { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; background: rgba(255,255,255,0.1);
          border-radius: 0.25rem; color: #fff; text-decoration: none; transition: all 0.2s; margin: 0.5rem 0; }
        .gh-link:hover { background: rgba(77,166,255,0.2); }
        .role { font-size: 0.85rem; opacity: 0.8; }
        .tip { background: rgba(77,166,255,0.1); padding: 0.75rem; border-radius: 0.5rem; border-left: 3px solid #4da6ff;
          margin: 0.75rem 0 0 0; font-size: 0.85rem; color: rgba(255,255,255,0.9); }
        
        .footer { background: rgba(0,0,0,0.4); border-top: 1px solid rgba(255,255,255,0.1); padding: 1.25rem; text-align: center;
          border-radius: 0 0 0.75rem 0.75rem; margin: 0 1rem 0.5rem 1rem; }
        .footer p { margin: 0.25rem 0; line-height: 1.6; color: rgba(255,255,255,0.75); font-size: 0.8rem; }
        .version { font-size: 0.7rem; margin-top: 0.25rem; opacity: 0.7; }
        
        /* Scrollbar */
        ::-webkit-scrollbar { width: 10px; height: 10px; }
        ::-webkit-scrollbar-track { background: rgba(0,0,0,0.3); border-radius: 5px; }
        ::-webkit-scrollbar-thumb { background: linear-gradient(180deg,#4da6ff,#2980b9); border-radius: 5px; }
        ::-webkit-scrollbar-thumb:hover { background: linear-gradient(180deg,#5dade2,#3498db); }
        
        /* Responsive */
        @media (max-width: 768px) {
          .side-panel.collapsed { display: none !important; }
          .side-panel { width: 100% !important; max-width: 100% !important; margin: 0 !important; }
          .side-panel.expanded, .side-panel.collapsed { width: 100% !important; }
        }
        @media (min-width: 768px) {
          .side-panel { min-width: 280px !important; max-width: 350px !important; }
          .side-panel.collapsed { width: 60px !important; }
        }
        
        .sec, .content-panel, .nav-sec, .footer { width: 100%; max-width: 100%; box-sizing: border-box; }
      `}</style>
    </div>
  );
};

// Sections as separate components for better organization
const S = {
  Welcome: () => (
    <div className="sec">
      <h3><FaGlobe className="sec-icon" /> Welcome to GVAS Platform</h3>
      <p>Your Comprehensive Global Volcanic Aquifer Solutions Platform is specifically designed, carefully developed, and meticulously engineered for advanced volcanic hydrostratigraphy analysis, comprehensive interpretation, intelligent groundwater resource evaluation, and sophisticated subsurface investigation across all volcanic regions and geological environments worldwide. This powerful platform transforms complex heterogeneous well log data from multiple sources and diverse formats into standardized consistent scientifically defensible and reproducible hydrostratigraphic models that can be reliably used for detailed analysis interpretation visualization and decision making purposes in hydrogeological investigations and groundwater resource management operations.</p>
    </div>
  ),

  PlatformOverview: () => (
    <div className="sec">
      <h3><FaInfoCircle className="sec-icon" /> Platform Overview and Technical Capabilities</h3>
      <p><strong>GVAS - Global Volcanic Aquifer Solutions</strong> represents a revolutionary breakthrough, significant advancement, and comprehensive development in the specialized field of volcanic hydrostratigraphy, aquifer modeling, and subsurface intelligence, specifically designed and meticulously engineered to effectively address, successfully overcome, and completely resolve the long-standing and significant challenges associated with processing, analyzing, standardizing, and accurately interpreting complex heterogeneous well log data from diverse volcanic regions, varied geological environments, and multiple international data sources and formats worldwide.</p>
      <p>This advanced, sophisticated, state-of-the-art, and cutting-edge platform automatically, systematically, and intelligently transforms raw and completely unprocessed well-log descriptions from multiple international sources, diverse data formats, and varied quality levels into standardized, consistent, uniform, scientifically explainable, technically defensible, completely reproducible, and professionally acceptable hydrostratigraphic units that can be reliably and confidently used for further comprehensive analysis, detailed interpretation, advanced visualization, professional reporting, and critical decision-making processes in hydrogeological investigations and groundwater resource management operations.</p>
      <p>The system effectively leverages the most advanced artificial intelligence algorithms, extensive machine learning techniques, comprehensive global geological knowledge bases, sophisticated data processing pipelines, and state-of-the-art computational methods to deliver exceptionally accurate, highly reliable, completely validated, and scientifically sound results that consistently meet and exceed the highest international standards and best practices in hydrogeological investigation, groundwater resource evaluation, and geological interpretation worldwide.</p>
    </div>
  ),

  CurrentStatus: ({ metrics }) => (
    <div className="sec">
      <h3><FaTachometerAlt className="sec-icon" /> Current Project Status Progress Overview and Achievement Summary</h3>
      <p>Successfully, efficiently, and effectively processed, comprehensively analyzed, and systematically standardized {metrics.totalWells} individual wells containing a cumulative total of {metrics.totalLayers} stratigraphic layers with an overall geological complexity reduction achievement of {metrics.complexityReduction} percent accomplished through systematic, automated, intelligent, and completely validated standardization and classification processes that ensure absolute consistency, scientific validity, technical accuracy, and professional reliability across all datasets and wells regardless of source location format or original quality.</p>
    </div>
  ),

  GeologicalInfo: () => (
    <div className="sec">
      <h3><FaGem className="sec-icon" /> Important Geological Information Educational Content and Scientific Knowledge</h3>
      <p>Basaltic aquifer systems represent some of the most productive, most reliable, most extensively utilized, and most valuable groundwater resources in volcanic terranes worldwide, characterized by their exceptional, remarkable, and outstanding extensive lateral continuity, exceptional fracture-controlled permeability, significant groundwater storage capacity, and efficient transmission characteristics that collectively make them ideal and perfect for large-scale water supply development, long-term sustainable extraction operations, and municipal industrial agricultural and domestic consumption applications across volcanic regions worldwide.</p>
      <p>The Columbia River Basalt Group located in the Pacific Northwest region of the United States serves as an excellent, well-documented, thoroughly studied, extensively researched, and internationally recognized example of a highly productive basalt aquifer system with transmissivity values that can range significantly from as low as 10 square meters per day in less fractured zones to as high as 500 square meters per day or more in areas with extensive fracturing development, significant vesicularity enhancement, and advanced weathering improvement within the lava flows that create optimal hydrogeological properties.</p>
      <p>These exceptional and outstanding hydrogeological properties consistently make basaltic aquifers particularly valuable, extremely important, and highly desirable for municipal water supply systems, agricultural irrigation networks, industrial applications, domestic consumption, and various other water resource development operations, providing reliable, sustainable, long-lasting, and high-yield groundwater resources for communities, industries, agricultural operations, and domestic users across all volcanic regions worldwide.</p>
    </div>
  ),

  Environment: () => (
    <div className="sec">
      <h3><FaTint className="sec-icon" /> Current Geological Environment Characteristics Hydrogeological Setting and Regional Context</h3>
      <div className="grid1">
        <div className="card1">
          <span className="env-lbl">Tectonic Setting and Regional Terrane Type:</span>
          <span className="env-val">Active Continental Rift Valley System characterized by ongoing extensional tectonics with associated volcanic activity magmatic emplacement sedimentary basin development and structural deformation that creates complex geological architectures.</span>
        </div>
        <div className="card1">
          <span className="env-lbl">Predominant Lithological Units and Rock Formations:</span>
          <span className="env-val">Basaltic lava flows with varying degrees of fracturing and vesicularity development, Andesitic volcanic rocks with intermediate silica composition, Rhyolitic dome complexes with felsic characteristics, Pyroclastic deposits including tuff ignimbrite and volcanic breccia formations that represent the complete volcanic sequence.</span>
        </div>
        <div className="card1">
          <span className="env-lbl">Hydrogeological Characteristics and Aquifer Properties:</span>
          <span className="env-val">Complex fractured volcanic aquifer systems exhibiting dual-porosity behavior that effectively and efficiently combines both matrix porosity and fracture permeability to create highly productive and exceptionally efficient groundwater flow and storage systems with remarkable transmission capabilities.</span>
        </div>
        <div className="card1">
          <span className="env-lbl">Groundwater Flow Mechanisms and Transmission Pathways:</span>
          <span className="env-val">Predominantly fracture-controlled flow systems with significant and substantial contribution from intergranular porosity vesicular cavities and weathered zones within the volcanic rocks creating complex but highly productive flow networks that ensure optimal hydrogeological performance.</span>
        </div>
      </div>
    </div>
  ),

  Features: () => (
    <div className="sec">
      <h3><FaFire className="sec-icon" /> Advanced Platform Features Technical Capabilities and Specialized Tools</h3>
      <div className="grid1">
        <div className="card1"><FaFire className="fe-icon" /><strong>Advanced Causal Artificial Intelligence Engine</strong><p>Powerful machine learning and deep learning algorithms for intelligent geological interpretation and hydrostratigraphic classification with comprehensive analysis.</p></div>
        <div className="card1"><FaRulerCombined className="fe-icon" /><strong>Three Dimensional Voxel Modeling</strong><p>Sophisticated 3D geological modeling capabilities for comprehensive subsurface visualization and spatial analysis with advanced rendering.</p></div>
        <div className="card1"><FaLayerGroup className="fe-icon" /><strong>Volcanic Stratigraphy Analysis</strong><p>Advanced stratigraphic correlation and layer analysis for understanding complex volcanic sequences and formations with detailed interpretation.</p></div>
        <div className="card1"><FaChartBar className="fe-icon" /><strong>Advanced Data Analytics and Visualization Tools</strong><p>Comprehensive analytical tools for statistical analysis pattern recognition and data visualization in multiple industry standard formats.</p></div>
        <div className="card1"><FaSearch className="fe-icon" /><strong>Automated Aquifer Discovery and Characterization</strong><p>Intelligent identification and detailed characterization of promising groundwater targets with comprehensive evaluation and scientific validation.</p></div>
        <div className="card1"><FaFilter className="fe-icon" /><strong>Intelligent Lithology Standardization System</strong><p>Automatic standardization and harmonization of diverse lithology descriptions from multiple sources and formats with complete validation worldwide.</p></div>
      </div>
      <style jsx>{`.fe-icon { color: #4da6ff; font-size: 1.2rem; margin-right: 0.75rem; }`}</style>
    </div>
  ),

  Symbols: () => (
    <div className="sec">
      <h3><FaLayerGroup className="sec-icon" /> International Geological Symbols Standard Notations and Global Classification System</h3>
      <div className="sym-grid">
        <div className="sym-card"><div className="sym-box bas">■</div><div className="sym-text"><strong>Basalt - Volcanic Extrusive Rock</strong><p>Volcanic extrusive rock formed from low-viscosity lava, typically dark gray to black in color, fine-grained texture, can form extensive lava flows and volcanic plateaus, important and productive aquifer when extensively fractured and weathered for optimal hydrogeological properties.</p></div></div>
        <div className="sym-card"><div className="sym-box and">■</div><div className="sym-text"><strong>Andesite - Intermediate Volcanic Rock</strong><p>Intermediate volcanic rock with composition between basalt and rhyolite, typically medium to dark gray in color, fine-grained texture, commonly found in subduction zones and volcanic arc settings across all continents.</p></div></div>
        <div className="sym-card"><div className="sym-box rhy">■</div><div className="sym-text"><strong>Rhyolite - Felsic Volcanic Rock</strong><p>Felsic volcanic rock with high silica content, typically light gray to pink in color, fine-grained texture, volcanic equivalent of granite, often forms volcanic domes flows and pyroclastic deposits in continental settings.</p></div></div>
        <div className="sym-card"><div className="sym-box pyr">■</div><div className="sym-text"><strong>Pyroclastic Rocks - Fragmental Volcanic Deposits</strong><p>Fragmented material produced by explosive volcanic eruptions, includes tuff ignimbrite and volcanic breccia, can form excellent and highly productive aquifers when unwelded well-sorted and properly deposited for optimal hydrogeological performance.</p></div></div>
        <div className="sym-card"><div className="sym-box flow">→</div><div className="sym-text"><strong>Groundwater Flow Direction Indicator</strong><p>Movement of water through aquifers, typically flowing from recharge areas to discharge points, controlled and directed by hydraulic gradient and permeability distribution within the geological formations and rock matrices.</p></div></div>
        <div className="sym-card"><div className="sym-box rech">↑</div><div className="sym-text"><strong>Aquifer Recharge Zone Location</strong><p>Area where water enters an aquifer system, typically elevated terrain exposed bedrock fractures or permeable formations that allow precipitation and surface water to effectively infiltrate and recharge the groundwater resources.</p></div></div>
      </div>
    </div>
  ),

  Properties: () => (
    <div className="sec">
      <h3><FaGem className="sec-icon" /> Geological Characteristics Properties and Hydrogeological Parameters Definition</h3>
      <div className="grid1">
        <div className="card1"><strong>Hydraulic Conductivity and Permeability Properties:</strong><p>The ease with which water moves through rock or soil, determined and controlled by grain size distribution sorting characteristics porosity development and fracturing intensity, crucial and essential for accurate aquifer productivity assessment and reliable yield prediction in hydrogeological investigations.</p></div>
        <div className="card1"><strong>Storage Capacity and Groundwater Retention:</strong><p>The ability of geological formations to effectively hold and reliably release water, influenced and determined by total porosity effective porosity permeability distribution and interconnected pore network development of the rock matrix and fracture systems for optimal hydrogeological performance.</p></div>
        <div className="card1"><strong>Volcanic Aquifer Systems and Flow Behavior:</strong><p>Characterized by significant heterogeneity with permeability primarily controlled by fractures vesicles weathering zones and secondary porosity development, often exhibiting complex dual-porosity behavior with both matrix flow and fracture flow components contributing to overall system productivity efficiency and hydrogeological effectiveness.</p></div>
      </div>
    </div>
  ),

  Classification: () => (
    <div className="sec">
      <h3><FaLayerGroup className="sec-icon" /> International Lithology Classification System Standardized Rock Type Definitions and Characteristics</h3>
      <div className="grid1">
        <div className="card1"><strong>Basalt Classification and Characteristics:</strong><p>Mafic extrusive volcanic rock with low silica content, typically dark colored appearance ranging from dark gray to black, fine-grained aphanitic to glassy texture, forms extensive lava flows pillow lavas in submarine environments and volcanic plateaus covering vast geographical areas across different continents and volcanic provinces.</p></div>
        <div className="card1"><strong>Andesite Classification and Characteristics:</strong><p>Intermediate volcanic rock with medium silica content, typically gray to dark gray in color, fine-grained texture, commonly associated with subduction zone volcanism stratovolcanoes development and volcanic arc systems in tectonically active regions worldwide.</p></div>
        <div className="card1"><strong>Rhyolite Classification and Characteristics:</strong><p>Felsic extrusive volcanic rock with high silica content, typically light gray to pink in color, fine-grained texture, often forms volcanic domes lava flows and extensive pyroclastic deposits, representing the most silicic extrusive volcanic rock type in continental volcanic settings and geological environments.</p></div>
        <div className="card1"><strong>Pyroclastic Rocks Classification and Characteristics:</strong><p>Volcanic fragmental deposits including ash lapilli bombs and blocks of various sizes, can be loose or welded depending on the depositional environment and post-depositional processes, important for understanding explosive eruption history stratigraphic correlation and aquifer potential assessment in volcanic sequences.</p></div>
        <div className="card1"><strong>Sedimentary Rocks Classification and Characteristics:</strong><p>Deposited by water wind ice or gravity through various sedimentary processes, typically layered and stratified in appearance, can include clastic detrital varieties chemical precipitates and organic accumulations, important for groundwater storage and transmission in interbedded sequences with volcanic rocks.</p></div>
      </div>
    </div>
  ),

  Stats: ({ metrics }) => (
    <div className="sec">
      <h3><FaChartBar className="sec-icon" /> Project Metrics Statistical Summary and Performance Indicators Overview</h3>
      <div className="stats-grid">
        <div className="stat-card hl"><FaChartBar className="stat-icon" /><div><span className="stat-value">{metrics.totalWells}</span><span className="stat-label">Total Wells Successfully Processed</span></div></div>
        <div className="stat-card"><FaLayerGroup className="stat-icon" /><div><span className="stat-value">{metrics.totalLayers}</span><span className="stat-label">Stratigraphic Layers Analyzed</span></div></div>
        <div className="stat-card sc"><FaWater className="stat-icon" /><div><span className="stat-value">{metrics.aquiferLayers}</span><span className="stat-label">Aquifer Layers Identified as Productive</span></div></div>
        <div className="stat-card wr"><FaTachometerAlt className="stat-icon" /><div><span className="stat-value">{metrics.avgConfidence}%</span><span className="stat-label">Average Classification Confidence Level</span></div></div>
        <div className="stat-card in"><FaCog className="stat-icon" /><div><span className="stat-value">{metrics.complexityReduction}%</span><span className="stat-label">Complexity Reduction Through Standardization</span></div></div>
        <div className="stat-card pr"><FaGlobe className="stat-icon" /><div><span className="stat-value">Global</span><span className="stat-label">Coordinate Systems Fully Supported</span></div></div>
      </div>
    </div>
  ),

  MetricsSummary: ({ metrics }) => (
    <div className="sec">
      <h3><FaInfoCircle className="sec-icon" /> Comprehensive Project Metrics Performance Indicators and Detailed Analysis Results</h3>
      <p><strong>Total Wells Successfully Processed:</strong> {metrics.totalWells} individual wells have been comprehensively and successfully analyzed processed and standardized by the GVAS platform using advanced artificial intelligence algorithms extensive geological knowledge bases and sophisticated data processing pipelines that ensure scientific accuracy technical validity and professional reliability.</p>
      <p><strong>Standardized Hydrostratigraphic Units Established:</strong> {metrics.totalLayers > 0 ? Math.round(metrics.totalLayers * (1 - metrics.complexityReduction/100)) : 0} distinct consistent and scientifically defensible hydrostratigraphic units have been systematically established defined and categorized through the comprehensive standardization classification and harmonization processes that ensure complete consistency and universal applicability across all datasets.</p>
      <p><strong>Complexity Reduction Index Achievement:</strong> {metrics.complexityReduction}% - This important and valuable metric represents the overall significant reduction in geological complexity effectively achieved through systematic intelligent and comprehensive classification and grouping of similar lithological descriptions from diverse international sources that previously created confusion inconsistency and unreliability in hydrogeological interpretations.</p>
      <p><strong>Average Classification Confidence Assessment:</strong> {metrics.avgConfidence}% average confidence level in our layer classifications hydro property predictions and geological interpretations across all processed wells demonstrating the exceptional reliability accuracy and scientific validity of the platform across all applications.</p>
      <p><strong>Aquifer Potential and Productivity Assessment:</strong> {metrics.aquiferLayers} layers have been positively identified as productive aquifers out of a total of {metrics.totalLayers} layers analyzed providing valuable comprehensive and actionable insights into groundwater resource potential for development management and sustainable extraction operations with complete scientific backing and technical validation.</p>
    </div>
  ),

  Nav: ({ activeSection, setActiveSection }) => (
    <div className="nav-sec">
      <h3><FaCompass className="sec-icon" /> Dashboard Navigation and Quick Access Menu</h3>
      <div className="nav-buttons">
        <button className={activeSection === 'overview' ? 'active' : ''} onClick={() => setActiveSection('overview')}><FaInfoCircle /> Overview</button>
        <button className={activeSection === 'productive' ? 'active' : ''} onClick={() => setActiveSection('productive')}><FaWater /> Top Aquifers</button>
        <button className={activeSection === 'upload' ? 'active' : ''} onClick={() => setActiveSection('upload')}><FaFileImport /> Quick Upload</button>
        <button className={activeSection === 'export' ? 'active' : ''} onClick={() => setActiveSection('export')}><FaFileExport /> Export</button>
        <button className={activeSection === 'help' ? 'active' : ''} onClick={() => setActiveSection('help')}><FaQuestionCircle /> Help</button>
      </div>
    </div>
  ),

  Content: ({ activeSection, topProductive, onFileUpload, onExport }) => (
    <div className="content-sections">
      {activeSection === 'overview' && (
        <div className="content-panel">
          <h3>Platform Comprehensive Capabilities and Technical Specifications</h3>
          <p>The GVAS Global Volcanic Aquifer Solutions platform provides comprehensive advanced and sophisticated analysis and interpretation capabilities specifically designed for volcanic hydrostratigraphy applications worldwide. With extensive global coverage and advanced AI-powered classification systems the platform transforms complex well log data from diverse international sources into actionable reliable and scientifically validated geological insights and hydrogeological understanding that meet the highest international standards and best practices in the field.</p>
          <p>The system automatically standardizes lithology descriptions from diverse international sources accurately identifies productive aquifer layers and systematically generates detailed three-dimensional voxel models for comprehensive visualization analysis and interpretation that provide complete understanding and support critical decision making in hydrogeological investigations and groundwater resource management operations across all volcanic regions worldwide.</p>
          <p>All classifications interpretations and predictions are scientifically defensible technically validated and backed by extensive global case studies empirical data published research from leading institutions and established hydrogeological principles that ensure professional reliability accuracy and international acceptance across all applications and geological environments.</p>
        </div>
      )}

      {activeSection === 'productive' && (
        <div className="content-panel">
          <h3>Aquifer Target Analysis Identification and Comprehensive Recommendations</h3>
          <p>Based on detailed comprehensive and systematic artificial intelligence analysis and interpretation of your uploaded well log data the following stratigraphic layers have been positively identified as the most promising groundwater targets for potential development exploitation and sustainable extraction based on their hydrogeological characteristics productivity potential and geological properties that demonstrate exceptional quality and reliability for groundwater resource development.</p>
          
          {topProductive.length > 0 ? (
            <div className="table-container">
              <table className="data-table">
                <thead><tr><th>Rank</th><th>Well ID</th><th>Layer Type</th><th>Depth Range</th><th>Thickness</th><th>Confidence</th></tr></thead>
                <tbody>
                  {topProductive.map((layer, index) => (
                    <tr key={index}>
                      <td>{index + 1}</td><td>{layer.Well_ID}</td><td>{layer.Hydro_Property}</td>
                      <td>{layer.Depth_Start}-{layer.Depth_End} m</td><td>{layer.Thickness} m</td>
                      <td>{(layer.Confidence * 100).toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="no-data">Currently no aquifer layers have been identified in your uploaded well data. Please upload your well log information and process it through the platform to receive detailed aquifer identification and comprehensive groundwater target recommendations with complete analysis and scientific validation.</p>
          )}

          {topProductive.length > 0 && (
            <div className="rec-box">
              <h4>Artificial Intelligence Powered Recommendations and Professional Guidance</h4>
              <p>Based on comprehensive analysis the most promising and productive groundwater target within your dataset is the <strong>{topProductive[0].Hydro_Property}</strong> layer located in well <strong>{topProductive[0].Well_ID}</strong> at a depth interval between <strong>{topProductive[0].Depth_Start}-{topProductive[0].Depth_End} meters below ground surface</strong> with an exceptional classification confidence level of <strong>{(topProductive[0].Confidence * 100).toFixed(1)}%</strong>. This layer represents the optimal and most promising target for groundwater development activities and sustainable extraction operations with complete scientific backing and technical validation.</p>
            </div>
          )}
        </div>
      )}

      {activeSection === 'upload' && (
        <div className="content-panel">
          <h3>Comprehensive Data Upload Interface and File Import Options with Complete Support</h3>
          <p>Upload your valuable and important well data files in various supported formats including standard tabular data geographical information system files and specialized well log formats. Our advanced system will automatically process and standardize your data for comprehensive analysis and interpretation with complete validation quality assurance and scientific accuracy that meets international standards and best practices.</p>
          
          <div className="upload-grid">
            <div className="upload-card">
              <h4><FaFileImport /> CSV and Excel File Upload</h4>
              <p>Standard tabular format containing well log information with all required columns for complete processing and comprehensive analysis by our advanced platform with automatic validation standardization and quality control procedures that ensure data integrity and reliability.</p>
              <input type="file" accept=".csv,.xlsx,.xls" onChange={e => e.target.files[0] && onFileUpload(e.target.files[0])} />
            </div>
            <div className="upload-card">
              <h4><FaFileImport /> Shapefile Upload</h4>
              <p>Upload spatial data including well point locations cross-sectional line definitions or study area boundary polygons for geographical context and comprehensive visualization with complete spatial referencing and coordinate system support that ensures accurate geospatial analysis.</p>
              <input type="file" accept=".shp,.zip" onChange={e => e.target.files[0] && onFileUpload(e.target.files[0])} />
            </div>
          </div>

          <div className="info-card">
            <h4>Comprehensive List of Supported File Formats and Complete Technical Specifications</h4>
            <p>All supported file formats are fully validated extensively tested and completely compatible with international standards and industry best practices for geological data processing and hydrogeological analysis with comprehensive quality assurance and scientific validation.</p>
            <ul>
              <li><strong>CSV - Comma Separated Values:</strong> Well log data files in standard tabular format containing all necessary columns for processing including well identification coordinates elevation depth intervals and lithology descriptions with complete metadata.</li>
              <li><strong>Shapefile ZIP Archive:</strong> Complete geographical information system shapefile bundle containing the main shapefile and all supporting files including index database and projection definition files for comprehensive spatial analysis and geospatial accuracy.</li>
              <li><strong>Individual Shapefile:</strong> Single shapefile component which may require additional supporting files for complete functionality and comprehensive processing with full geospatial capabilities and coordinate system support.</li>
            </ul>
          </div>
        </div>
      )}

      {activeSection === 'export' && (
        <div className="content-panel">
          <h3>Comprehensive Data Export Options and Download Capabilities with Complete Interpretation</h3>
          <p>Download your processed and analyzed well data in various industry standard formats suitable for further analysis reporting visualization and integration with other geographical information systems and software applications. All exports include comprehensive interpretations complete evidence PDF reports with detailed explanations uncertainty assessments and global case study comparisons with scientific validation.</p>
          
          <div className="export-grid">
            <div className="export-card">
              <h4>Well Data Export Formats and Complete Options</h4>
              <div className="fmt-buttons">
                <button onClick={() => onExport && onExport('wells', 'csv')}>CSV Format</button>
                <button onClick={() => onExport && onExport('wells', 'json')}>JSON Format</button>
                <button onClick={() => onExport && onExport('wells', 'shp')}>Shapefile Format</button>
              </div>
            </div>
            <div className="export-card">
              <h4>Stratigraphy Layers Export Options and Complete Formats</h4>
              <div className="fmt-buttons">
                <button onClick={() => onExport && onExport('layers', 'csv')}>CSV Format</button>
                <button onClick={() => onExport && onExport('layers', 'json')}>JSON Format</button>
                <button onClick={() => onExport && onExport('layers', 'shp')}>Shapefile Format</button>
              </div>
            </div>
            <div className="export-card">
              <h4>Cross Section and 3D Model Exports with Complete Visualization</h4>
              <div className="fmt-buttons">
                <button onClick={() => onExport && onExport('combined_2d', 'png')}>PNG Image</button>
                <button onClick={() => onExport && onExport('combined_2d', 'shp')}>Shapefile</button>
                <button onClick={() => onExport && onExport('pdf', 'well_report')}>PDF Report with Interpretations and Evidence</button>
                <button onClick={() => onExport && onExport('combined_3d', 'vtk')}>VTK 3D</button>
                <button onClick={() => onExport && onExport('combined_3d', 'kml')}>KML Format</button>
                <button onClick={() => onExport && onExport('pdf', 'project_report')}>Project PDF Report with Complete Evidence</button>
              </div>
            </div>
          </div>

          <div className="info-card">
            <h4>Complete Export Format Information Technical Specifications and Capabilities</h4>
            <p>All export formats include detailed interpretations comprehensive evidence complete analysis with scientific explanations global comparisons and professional validation that meet international standards and industry best practices for hydrogeological reporting and groundwater resource documentation.</p>
            <ul>
              <li><strong>CSV:</strong> Standard tabular data format ideal for spreadsheet analysis statistical processing and data sharing across different software platforms and applications.</li>
              <li><strong>JSON:</strong> Lightweight data interchange format for web applications system integration and data exchange between different software and platforms.</li>
              <li><strong>Shapefile:</strong> Geographical information system compatible vector data for spatial analysis mapping applications and geospatial visualization.</li>
              <li><strong>VTK:</strong> Advanced three dimensional visualization data format compatible with ParaView VisIt and other scientific visualization software applications.</li>
              <li><strong>KML:</strong> Geographical visualization format for Google Earth and similar platforms with complete spatial referencing and coordinate system support.</li>
              <li><strong>PNG:</strong> High quality image format suitable for reports presentations publications and professional documentation with lossless data compression.</li>
              <li><strong>PDF:</strong> Comprehensive reports with all interpretations evidence explanations scientific analysis and professional documentation that meet international standards.</li>
            </ul>
          </div>
        </div>
      )}

      {activeSection === 'help' && (
        <div className="content-panel">
          <h3>Comprehensive Help Support and Complete User Assistance Center</h3>
          
          <div className="help-card">
            <h4><FaQuestionCircle /> Complete Quick Start Guide Comprehensive Tutorial and Step-by-Step Instructions</h4>
            <p>Get started with the GVAS Global Volcanic Aquifer Solutions platform through the following comprehensive and detailed steps that will guide you through the entire workflow from data import to final results export and professional reporting with complete scientific validation and technical accuracy.</p>
            <ol>
              <li><strong>Data Upload:</strong> Upload your well log information in any of the supported file formats including CSV Excel Shapefile or GeoJSON with complete metadata coordinate information and all required columns for comprehensive processing.</li>
              <li><strong>Results Review:</strong> Carefully examine and review the automatically processed standardized results including the artificial intelligence classified stratigraphic layers with their corresponding hydro properties confidence scores and scientific explanations.</li>
              <li><strong>Interactive Exploration:</strong> Explore the generated three dimensional voxel based geological models and interactive two dimensional cross-sectional views that provide valuable insights into subsurface stratigraphy relationships and geological understanding.</li>
              <li><strong>Advanced Analysis:</strong> Utilize the artificial intelligence powered geologist to ask specific questions about individual layers overall productivity assessments aquifer characteristics and hydrogeological properties with natural language processing.</li>
              <li><strong>Data Export:</strong> Export your processed data and results in multiple industry standard formats including CSV JSON PDF comprehensive reports Shapefile VTK and KML for further analysis reporting and professional use.</li>
            </ol>
            <p className="tip">For optimal results and comprehensive stratigraphic correlation upload your cross-section line definition as a Shapefile format to generate detailed two dimensional stratigraphic profiles that clearly display layer correlations and geological relationships with complete scientific accuracy.</p>
          </div>

          <div className="help-card">
            <h4><FaEnvelope /> Complete Contact Information and Professional Support Channels</h4>
            <p>For comprehensive technical support detailed questions valuable feedback suggestions for improvements or any other professional inquiries regarding the GVAS Global Volcanic Aquifer Solutions platform please feel free to contact our development team through the following official channels that provide complete and reliable support.</p>
            <ul>
              <li><strong>Primary Official Contact:</strong> <a href="mailto:wagari.mosisa@ju.edu.et" target="_blank" rel="noopener noreferrer">wagari.mosisa@ju.edu.et</a></li>
              <li><strong>Alternate Personal Contact:</strong> <a href="mailto:wagarimosisa@gmail.com" target="_blank" rel="noopener noreferrer">wagarimosisa@gmail.com</a></li>
            </ul>
          </div>

          <div className="help-card">
            <h4><FaUserGraduate /> Platform Developer Professional Qualifications and Complete Information</h4>
            <p><strong>Wagari Mosisa Kitessa</strong><br /><span className="role">Lead Developer Principal Geologist and Project Coordinator with Extensive Experience</span></p>
            <p>GVAS Global Volcanic Aquifer Solutions platform was specifically developed designed and meticulously engineered to effectively address the significant and long-standing challenge associated with standardizing complex heterogeneous volcanic well log data for comprehensive hydrogeological analysis and detailed aquifer characterization purposes at various scales ranging from local site investigations to regional and basin scale assessments. This advanced platform transforms inconsistent and varied data formats into consistent standardized hydrostratigraphic models that can be used for reliable groundwater resource evaluation professional management and international reporting.</p>
          </div>

          <div className="help-card">
            <h4><FaGithub /> Open Source Repository Complete Access and Community Contribution Platform</h4>
            <p>View the complete source code make valuable contributions report technical issues suggest new features or participate in community discussions through our official open source repository that provides complete transparency full access and professional collaboration opportunities for developers researchers and hydrogeologists worldwide.</p>
            <p><a href="https://github.com/wagarimosisa-jit/volcanostrat-ai" target="_blank" rel="noopener noreferrer" className="gh-link"><FaGithub /> wagarimosisa-jit/volcanostrat-ai</a></p>
          </div>

          <div className="help-card">
            <h4><FaInfoCircle /> Complete Information About GVAS Platform Mission Vision and Professional Objectives</h4>
            <p><strong>Mission Statement:</strong> The primary mission of GVAS Global Volcanic Aquifer Solutions platform is to fundamentally transform the way heterogeneous volcanic well log data is processed and interpreted by developing advanced artificial intelligence powered systems that can automatically convert complex inconsistent raw data into comprehensive uncertainty-aware hydrostratigraphic knowledge models and reliable groundwater decision-support systems for effective resource management professional analysis and international reporting that meets the highest standards in the field.</p>
            <p><strong>Vision Statement:</strong> Our vision is to enable and empower hydrogeologists geological researchers professional consultants government water agencies private sector organizations and academic institutions from all around the world to efficiently build consistent scientifically explainable technically defensible and completely reproducible subsurface geological models from their diverse and heterogeneous well data regardless of source format original quality or geographical location with complete accuracy and international acceptance.</p>
          </div>
        </div>
      )}
    </div>
  ),

  Footer: () => (
    <div className="footer">
      <p>© {new Date().getFullYear()} GVAS - Global Volcanic Aquifer Solutions | Built for you!</p>
      <p className="version">Version 1.0.0 | Advanced Global Volcanic Hydrostratigraphy Intelligence Platform for Worldwide Applications</p>
    </div>
  )
};

export default Dashboard;
