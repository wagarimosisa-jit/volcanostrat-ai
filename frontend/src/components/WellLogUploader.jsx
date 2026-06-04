import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import { saveAs } from 'file-saver';

const WellLogUploader = ({ onFileUpload, sampleData }) => {
  const [previewData, setPreviewData] = useState(null);
  const [error, setError] = useState(null);

  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setError(null);

    if (file.name.endsWith('.csv')) {
      Papa.parse(file, {
        header: true,
        complete: (results) => {
          setPreviewData(results.data);
          onFileUpload(file);
        },
        error: (err) => {
          setError(`Error parsing CSV: ${err.message}`);
        }
      });
    } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      setError('Excel files require additional setup. Please use CSV for now.');
    } else {
      setError('Unsupported file type. Please upload CSV or Excel files.');
    }
  }, [onFileUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xlsx', '.xls']
    },
    maxFiles: 1
  });

  const downloadSample = () => {
    const csv = Papa.unparse(sampleData);
    const blob = new Blob([csv], { type: 'text/csv' });
    saveAs(blob, 'sample_well_logs.csv');
  };

  return (
    <div className="well-log-uploader">
      <div
        {...getRootProps()}
        className={`dropzone ${isDragActive ? 'active' : ''}`}
      >
        <input {...getInputProps()} />
        <div className="dropzone-content">
          <p>
            {isDragActive
              ? 'Drop the well log file here'
              : 'Drag & drop a CSV file here, or click to select'}
          </p>
          <p className="file-types">Supported: CSV (Excel coming soon)</p>
          <button onClick={(e) => { e.stopPropagation(); downloadSample(); }} className="sample-btn">
            Download Sample CSV
          </button>
        </div>
      </div>

      {error && <div className="error">{error}</div>}

      {previewData && (
        <div className="preview-section">
          <h3>Preview (First 5 Rows)</h3>
          <div className="preview-table">
            <table>
              <thead>
                <tr>
                  {Object.keys(previewData[0]).map(key => (
                    <th key={key}>{key}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewData.slice(0, 5).map((row, i) => (
                  <tr key={i}>
                    {Object.values(row).map((val, j) => (
                      <td key={j}>{val}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <style jsx>{`
        .well-log-uploader {
          max-width: 800px;
          margin: 0 auto;
        }
        .dropzone {
          border: 2px dashed #ccc;
          border-radius: 0.5rem;
          padding: 2rem;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s;
          margin-bottom: 1rem;
        }
        .dropzone.active {
          border-color: #1a237e;
          background-color: #f0f2ff;
        }
        .dropzone-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
        }
        .dropzone-content p {
          margin: 0;
          color: #666;
        }
        .file-types {
          font-size: 0.9rem;
          color: #999;
        }
        .sample-btn {
          background-color: #1a237e;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 0.25rem;
          cursor: pointer;
          font-size: 0.9rem;
          margin-top: 0.5rem;
        }
        .sample-btn:hover {
          background-color: #303f9f;
        }
        .error {
          color: #c62828;
          margin: 1rem 0;
          padding: 0.5rem;
          background-color: #ffebee;
          border-radius: 0.25rem;
        }
        .preview-section {
          margin-top: 1.5rem;
          background-color: white;
          padding: 1rem;
          border-radius: 0.5rem;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .preview-section h3 {
          margin-top: 0;
          color: #1a237e;
        }
        .preview-table {
          overflow-x: auto;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 0.5rem;
        }
        th, td {
          padding: 0.5rem;
          border: 1px solid #ddd;
          text-align: left;
        }
        th {
          background-color: #f0f2f5;
          font-weight: 600;
        }
        tr:nth-child(even) {
          background-color: #f9f9f9;
        }
      `}</style>
    </div>
  );
};

export default WellLogUploader;
