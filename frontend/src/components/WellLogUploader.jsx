import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import { saveAs } from 'file-saver';
import { FaFileCsv, FaFileExcel, FaFileCode, FaFileArchive, FaFileAlt, FaGlobe, FaInfoCircle } from 'react-icons/fa';

const WellLogUploader = ({ onFileUpload, sampleData }) => {
  const [previewData, setPreviewData] = useState(null);
  const [error, setError] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setError(null);
    setUploadedFile(file);
    setPreviewData(null);
    setIsProcessing(true);

    // Directly pass to parent for processing
    // The backend will handle all formats
    try {
      onFileUpload(file);
      
      // For CSV, show preview
      if (file.name.endsWith('.csv')) {
        Papa.parse(file, {
          header: true,
          complete: (results) => {
            setPreviewData(results.data);
            setIsProcessing(false);
          },
          error: (err) => {
            setError(`Error parsing CSV: ${err.message}`);
            setIsProcessing(false);
          }
        });
      } else {
        // For other formats, just show file info
        setIsProcessing(false);
      }
    } catch (err) {
      setError(`Error uploading file: ${err.message}`);
      setIsProcessing(false);
    }
  }, [onFileUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xlsx', '.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/plain': ['.las'],
      'application/json': ['.json', '.geojson'],
      'application/octet-stream': ['.shp', '.zip'],
      '*/*': ['.las', '.geojson', '.json']
    },
    maxFiles: 1
  });

  const downloadSample = () => {
    const csv = Papa.unparse(sampleData);
    const blob = new Blob([csv], { type: 'text/csv' });
    saveAs(blob, 'sample_well_logs.csv');
  };

  const getFileIcon = (filename) => {
    if (filename.endsWith('.csv')) {
      return <FaFileCsv size={24} />;
    } else if (filename.endsWith('.xlsx') || filename.endsWith('.xls')) {
      return <FaFileExcel size={24} />;
    } else if (filename.endsWith('.las')) {
      return <FaFileCode size={24} />;
    } else if (filename.endsWith('.json') || filename.endsWith('.geojson')) {
      return <FaGlobe size={24} />;
    } else if (filename.endsWith('.shp') || filename.endsWith('.zip')) {
      return <FaFileArchive size={24} />;
    }
    return <FaFileAlt size={24} />;
  };

  const getFileType = (filename) => {
    if (filename.endsWith('.csv')) return 'CSV';
    if (filename.endsWith('.xlsx') || filename.endsWith('.xls')) return 'Excel';
    if (filename.endsWith('.las')) return 'LAS';
    if (filename.endsWith('.json') || filename.endsWith('.geojson')) return 'GeoJSON';
    if (filename.endsWith('.shp') || filename.endsWith('.zip')) return 'Shapefile';
    return 'File';
  };

  return (
    <div className="well-log-uploader">
      <div
        {...getRootProps()}
        className={`dropzone ${isDragActive ? 'active' : ''}`}
      >
        <input {...getInputProps()} />
        <div className="dropzone-content">
          {isProcessing ? (
            <div className="processing">
              <div className="spinner"></div>
              <p>Processing {uploadedFile?.name}...</p>
            </div>
          ) : (
            <>
              <div className="upload-icon">
                {isDragActive ? <FaFileAlt size={48} /> : <FaFileAlt size={48} />}
              </div>
              <p className="main-text">
                {isDragActive
                  ? 'Drop the well log file here'
                  : 'Drag & drop a file here, or click to select'}
              </p>
              <p className="file-types">
                Supported: CSV, Excel (.xlsx, .xls), LAS (.las), GeoJSON (.json, .geojson), Shapefile (.shp, .zip)
              </p>
              <div className="format-icons">
                <span title="CSV"><FaFileCsv size={20} /></span>
                <span title="Excel"><FaFileExcel size={20} /></span>
                <span title="LAS"><FaFileCode size={20} /></span>
                <span title="GeoJSON"><FaGlobe size={20} /></span>
                <span title="Shapefile"><FaFileArchive size={20} /></span>
              </div>
              <button onClick={(e) => { e.stopPropagation(); downloadSample(); }} className="sample-btn">
                <FaFileCsv size={14} /> Download Sample CSV
              </button>
            </>
          )}
        </div>
      </div>

      {uploadedFile && (
        <div className="file-info">
          <span className="file-icon">{getFileIcon(uploadedFile.name)}</span>
          <span className="file-name">{uploadedFile.name}</span>
          <span className="file-type">{getFileType(uploadedFile.name)}</span>
          <span className="file-size">{(uploadedFile.size / 1024).toFixed(1)} KB</span>
        </div>
      )}

      {error && <div className="error"><FaInfoCircle size={16} /> {error}</div>}

      {previewData && (
        <div className="preview-section">
          <h3><FaFileAlt size={16} /> Preview (First 5 Rows)</h3>
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

      <div className="format-guide">
        <h4><FaInfoCircle size={16} /> Format Guide</h4>
        <div className="format-grid">
          <div className="format-item">
            <div className="format-header">
              <FaFileCsv size={18} /> CSV
            </div>
            <p>Standard comma-separated format with required columns</p>
          </div>
          <div className="format-item">
            <div className="format-header">
              <FaFileExcel size={18} /> Excel
            </div>
            <p>Multi-sheet support, auto-detects well data</p>
          </div>
          <div className="format-item">
            <div className="format-header">
              <FaFileCode size={18} /> LAS
            </div>
            <p>Log ASCII Standard format for well logs</p>
          </div>
          <div className="format-item">
            <div className="format-header">
              <FaGlobe size={18} /> GeoJSON
            </div>
            <p>Geospatial JSON format with well locations</p>
          </div>
          <div className="format-item">
            <div className="format-header">
              <FaFileArchive size={18} /> Shapefile
            </div>
            <p>ESRI Shapefile (.shp) or ZIP archive with all files</p>
          </div>
        </div>
      </div>

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
        .upload-icon {
          color: #1a237e;
          margin-bottom: 0.5rem;
        }
        .dropzone-content p {
          margin: 0;
          color: #666;
        }
        .main-text {
          font-size: 1.1rem;
          font-weight: 500;
          color: #333;
        }
        .file-types {
          font-size: 0.85rem;
          color: #666;
          margin-top: 0.25rem;
        }
        .format-icons {
          display: flex;
          gap: 0.75rem;
          margin-top: 0.5rem;
          flex-wrap: wrap;
          justify-content: center;
        }
        .format-icons span {
          display: flex;
          flex-direction: column;
          align-items: center;
          color: #666;
          cursor: default;
        }
        .format-icons span:hover {
          color: #1a237e;
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
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
        }
        .sample-btn:hover {
          background-color: #303f9f;
        }
        .error {
          color: #c62828;
          margin: 1rem 0;
          padding: 0.5rem 1rem;
          background-color: #ffebee;
          border-radius: 0.25rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .file-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          background-color: #f0f2ff;
          border-radius: 0.5rem;
          margin-bottom: 1rem;
          font-size: 0.9rem;
        }
        .file-icon {
          color: #1a237e;
        }
        .file-name {
          flex: 1;
          font-weight: 500;
        }
        .file-type {
          background-color: #1a237e;
          color: white;
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
          font-size: 0.8rem;
        }
        .file-size {
          color: #666;
          font-size: 0.8rem;
        }
        .processing {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          color: #1a237e;
        }
        .spinner {
          width: 32px;
          height: 32px;
          border: 3px solid #f3f3f3;
          border-top: 3px solid #1a237e;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
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
          display: flex;
          align-items: center;
          gap: 0.5rem;
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
        .format-guide {
          margin-top: 2rem;
          padding: 1rem;
          background-color: #f9f9f9;
          border-radius: 0.5rem;
        }
        .format-guide h4 {
          margin-top: 0;
          color: #1a237e;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .format-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 1rem;
          margin-top: 1rem;
        }
        .format-item {
          background-color: white;
          padding: 1rem;
          border-radius: 0.5rem;
          box-shadow: 0 1px 2px rgba(0,0,0,0.1);
        }
        .format-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 600;
          color: #1a237e;
          margin-bottom: 0.5rem;
        }
        .format-item p {
          margin: 0;
          font-size: 0.85rem;
          color: #666;
        }
      `}</style>
    </div>
  );
};

export default WellLogUploader;
