import React, { useState } from 'react';
import { FaFileCsv, FaFileExcel, FaFilePdf, FaFileArchive, FaGlobe, FaFileCode, FaCube, FaImage, FaFileExport, FaCog, FaInfoCircle } from 'react-icons/fa';

const ExportPanel = ({ onExport, availableExports, wells, standardizedData }) => {
  const [activeCategory, setActiveCategory] = useState('all');
  
  // Define all available export formats
  const allExportFormats = [
    {
      category: 'wells',
      name: 'Well Data',
      icon: <FaGlobe />,
      formats: [
        { format: 'csv', name: 'CSV', icon: <FaFileCsv />, type: 'wells' },
        { format: 'json', name: 'JSON', icon: <FaFileCode />, type: 'wells' },
        { format: 'shp', name: 'Shapefile', icon: <FaFileArchive />, type: 'wells' }
      ]
    },
    {
      category: 'layers',
      name: 'Stratigraphy Layers',
      icon: <FaCube />,
      formats: [
        { format: 'csv', name: 'CSV', icon: <FaFileCsv />, type: 'layers' },
        { format: 'json', name: 'JSON', icon: <FaFileCode />, type: 'layers' },
        { format: 'shp', name: 'Shapefile', icon: <FaFileArchive />, type: 'layers' }
      ]
    },
    {
      category: '2d',
      name: '2D Cross-Section',
      icon: <FaImage />,
      formats: [
        { format: 'png', name: 'PNG Image', icon: <FaImage />, type: 'combined_2d' },
        { format: 'shp', name: 'Shapefile', icon: <FaFileArchive />, type: 'combined_2d' }
      ]
    },
    {
      category: '3d',
      name: '3D Model',
      icon: <FaCube />,
      formats: [
        { format: 'vtk', name: 'VTK', icon: <FaCube />, type: 'combined_3d' },
        { format: 'kml', name: 'KML (Google Earth)', icon: <FaGlobe />, type: 'combined_3d' },
        { format: 'shp', name: 'Shapefile', icon: <FaFileArchive />, type: 'combined_3d' }
      ]
    },
    {
      category: 'reports',
      name: 'Reports',
      icon: <FaFilePdf />,
      formats: [
        { format: 'well_report', name: 'Well Report (PDF)', icon: <FaFilePdf />, type: 'pdf' },
        { format: 'project_report', name: 'Project Report (PDF)', icon: <FaFilePdf />, type: 'pdf' },
        { format: 'causal_report', name: 'Causal Analysis (PDF)', icon: <FaFilePdf />, type: 'pdf' }
      ]
    },
    {
      category: 'causal',
      name: 'Causal Data',
      icon: <FaCog />,
      formats: [
        { format: 'cepr', name: 'CEPR JSON', icon: <FaFileCode />, type: 'cepr' }
      ]
    }
  ];

  const handleExport = (format, type) => {
    // For PDF reports, use the special endpoint
    if (type === 'pdf') {
      onExport(type, format);
    } else {
      onExport(type, format);
    }
  };

  const getExportCount = (category) => {
    if (category === 'all') {
      return allExportFormats.reduce((sum, cat) => sum + cat.formats.length, 0);
    }
    const cat = allExportFormats.find(c => c.category === category);
    return cat ? cat.formats.length : 0;
  };

  // Filter formats based on available exports or data availability
  const isFormatAvailable = (format, type) => {
    // If no specific availableExports, all are available
    if (!availableExports || availableExports.length === 0) {
      return true;
    }
    
    // Check if this type is in available exports
    const typeAvailable = availableExports.some(e => e.type === type);
    if (!typeAvailable) {
      return false;
    }
    
    // Check if format is available for this type
    const exportOption = availableExports.find(e => e.type === type);
    if (!exportOption) {
      return true;
    }
    
    return exportOption.formats.includes(format);
  };

  return (
    <div className="export-panel">
      <div className="export-header">
        <h3><FaFileExport /> Export Data</h3>
        <p className="subtitle">Download your data in multiple formats</p>
      </div>

      <div className="category-tabs">
        <button 
          className={activeCategory === 'all' ? 'active' : ''} 
          onClick={() => setActiveCategory('all')}
        >
          <FaCog /> All ({getExportCount('all')})
        </button>
        {allExportFormats.map((category) => (
          <button 
            key={category.category}
            className={activeCategory === category.category ? 'active' : ''} 
            onClick={() => setActiveCategory(category.category)}
          >
            {category.icon} {category.name} ({category.formats.length})
          </button>
        ))}
      </div>

      <div className="export-grid">
        {allExportFormats.map((category) => {
          // Filter by active category
          if (activeCategory !== 'all' && activeCategory !== category.category) {
            return null;
          }
          
          return (
            <div key={category.category} className="export-category">
              <div className="category-header">
                <span className="category-icon">{category.icon}</span>
                <span className="category-name">{category.name}</span>
              </div>
              <div className="format-buttons">
                {category.formats.map((fmt) => {
                  const isAvailable = isFormatAvailable(fmt.format, fmt.type);
                  
                  return (
                    <button
                      key={`${category.category}-${fmt.format}`}
                      onClick={() => handleExport(fmt.format, fmt.type)}
                      className={`format-btn ${!isAvailable ? 'disabled' : ''}`}
                      disabled={!isAvailable}
                      title={isAvailable ? `Export as ${fmt.name}` : `${fmt.name} not available`}
                    >
                      <span className="format-icon">{fmt.icon}</span>
                      <span className="format-name">{fmt.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="quick-export">
        <h4>Quick Export</h4>
        <div className="quick-buttons">
          <button 
            onClick={() => handleExport('csv', 'wells')} 
            className="quick-btn csv"
            title="Export wells as CSV"
          >
            <FaFileCsv /> Wells (CSV)
          </button>
          <button 
            onClick={() => handleExport('shp', 'wells')} 
            className="quick-btn shp"
            title="Export wells as Shapefile"
          >
            <FaFileArchive /> Wells (SHP)
          </button>
          <button 
            onClick={() => handleExport('well_report', 'pdf')} 
            className="quick-btn pdf"
            title="Export well report as PDF"
          >
            <FaFilePdf /> PDF Report
          </button>
        </div>
      </div>

      <div className="export-info">
        <FaInfoCircle /> <span>All formats support global coordinate systems (WGS84). Shapefiles include metadata and projection information.</span>
      </div>

      <style jsx>{`
        .export-panel {
          background-color: white;
          padding: 1.5rem;
          border-radius: 0.5rem;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          margin-top: 1rem;
        }
        .export-header {
          margin-bottom: 1rem;
        }
        .export-header h3 {
          margin: 0 0 0.25rem;
          color: #1a237e;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .subtitle {
          margin: 0;
          color: #666;
          font-size: 0.9rem;
        }
        .category-tabs {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
          margin-bottom: 1rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #eee;
        }
        .category-tabs button {
          padding: 0.5rem 1rem;
          background-color: #f5f5f5;
          border: none;
          border-radius: 0.25rem;
          cursor: pointer;
          font-size: 0.85rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #555;
        }
        .category-tabs button:hover {
          background-color: #e0e0e0;
        }
        .category-tabs button.active {
          background-color: #1a237e;
          color: white;
        }
        .export-grid {
          display: grid;
          gap: 1rem;
        }
        .export-category {
          padding: 1rem;
          background-color: #f9f9f9;
          border-radius: 0.5rem;
        }
        .category-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.75rem;
          font-weight: 600;
          color: #1a237e;
        }
        .category-icon {
          color: #1a237e;
        }
        .format-buttons {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
        .format-btn {
          padding: 0.5rem 0.75rem;
          background-color: white;
          color: #333;
          border: 1px solid #ddd;
          border-radius: 0.25rem;
          cursor: pointer;
          font-size: 0.85rem;
          display: flex;
          align-items: center;
          gap: 0.35rem;
          transition: all 0.2s;
        }
        .format-btn:hover:not(.disabled) {
          background-color: #f0f2ff;
          border-color: #1a237e;
          color: #1a237e;
        }
        .format-btn.disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .format-icon {
          color: #1a237e;
        }
        .format-name {
          font-weight: 500;
        }
        .quick-export {
          margin-top: 1.5rem;
          padding-top: 1rem;
          border-top: 1px solid #eee;
        }
        .quick-export h4 {
          margin: 0 0 0.75rem;
          color: #1a237e;
          font-size: 1rem;
        }
        .quick-buttons {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
        }
        .quick-btn {
          padding: 0.75rem 1rem;
          border: none;
          border-radius: 0.25rem;
          cursor: pointer;
          font-size: 0.9rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .quick-btn.csv {
          background-color: #4caf50;
          color: white;
        }
        .quick-btn.shp {
          background-color: #2196f3;
          color: white;
        }
        .quick-btn.pdf {
          background-color: #e91e63;
          color: white;
        }
        .quick-btn:hover {
          opacity: 0.9;
        }
        .export-info {
          margin-top: 1rem;
          padding: 0.75rem;
          background-color: #fff3cd;
          border-radius: 0.25rem;
          font-size: 0.85rem;
          color: #856404;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        @media (max-width: 768px) {
          .export-grid {
            grid-template-columns: 1fr;
          }
          .format-buttons {
            justify-content: center;
          }
          .quick-buttons {
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
};

export default ExportPanel;
