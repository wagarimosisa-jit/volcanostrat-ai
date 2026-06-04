import React from 'react';

const ExportPanel = ({ onExport, availableExports }) => {
  return (
    <div className="export-panel">
      <h3>Export Data</h3>
      <div className="export-options">
        {availableExports.map((exportOption, index) => (
          <div key={index} className="export-group">
            <h4>{exportOption.type.replace(/_/g, ' ')}</h4>
            <div className="format-buttons">
              {exportOption.formats.map((format) => (
                <button
                  key={format}
                  onClick={() => onExport(exportOption.type, format)}
                  className="format-btn"
                >
                  .{format.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .export-panel {
          background-color: white;
          padding: 1.5rem;
          border-radius: 0.5rem;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          margin-top: 1rem;
        }
        .export-panel h3 {
          margin-top: 0;
          color: #1a237e;
        }
        .export-options {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-top: 0.5rem;
        }
        .export-group {
          padding: 0.75rem;
          background-color: #f5f5f5;
          border-radius: 0.5rem;
        }
        .export-group h4 {
          margin: 0 0 0.5rem;
          color: #555;
          font-size: 0.9rem;
        }
        .format-buttons {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
        .format-btn {
          padding: 0.5rem 1rem;
          background-color: #1a237e;
          color: white;
          border: none;
          border-radius: 0.25rem;
          cursor: pointer;
          font-size: 0.85rem;
          font-weight: 600;
        }
        .format-btn:hover {
          background-color: #303f9f;
        }
      `}</style>
    </div>
  );
};

export default ExportPanel;
