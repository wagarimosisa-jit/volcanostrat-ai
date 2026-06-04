import React, { useState, useEffect } from 'react';

const CrossSectionTool = ({ crossSection, onGenerate, linePoints, onLinePointsChange, wells }) => {
  const [localLinePoints, setLocalLinePoints] = useState(linePoints);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    setLocalLinePoints(linePoints);
  }, [linePoints]);

  const handlePointChange = (index, field, value) => {
    const newPoints = [...localLinePoints];
    newPoints[index] = { ...newPoints[index], [field]: parseFloat(value) };
    setLocalLinePoints(newPoints);
  };

  const handleGenerate = () => {
    onLinePointsChange(localLinePoints);
    onGenerate();
  };

  const handleReset = () => {
    setLocalLinePoints([
      { x: wells[0]?.Coordinates.X || 0, y: wells[0]?.Coordinates.Y || 0 },
      { x: wells[1]?.Coordinates.X || 100, y: wells[1]?.Coordinates.Y || 100 }
    ]);
  };

  return (
    <div className="cross-section-tool">
      <h3>Cross-Section Tool</h3>

      <div className="controls">
        <div className="point-controls">
          {localLinePoints.map((point, index) => (
            <div key={index} className="point-control">
              <h4>Point {index + 1}</h4>
              <div className="coordinate-inputs">
                <div>
                  <label>X (Longitude):</label>
                  <input
                    type="number"
                    value={point.x}
                    onChange={(e) => handlePointChange(index, 'x', e.target.value)}
                    step="0.0001"
                  />
                </div>
                <div>
                  <label>Y (Latitude):</label>
                  <input
                    type="number"
                    value={point.y}
                    onChange={(e) => handlePointChange(index, 'y', e.target.value)}
                    step="0.0001"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="actions">
          <button onClick={handleGenerate} className="generate-btn">
            Generate Cross-Section
          </button>
          <button onClick={handleReset} className="reset-btn">
            Reset to Wells
          </button>
        </div>
      </div>

      {crossSection?.image && (
        <div className="cross-section-image">
          <h4>Cross-Section Preview</h4>
          <img
            src={`data:image/png;base64,${crossSection.image}`}
            alt="Cross-section"
          />
        </div>
      )}

      <style jsx>{`
        .cross-section-tool {
          background-color: white;
          padding: 1.5rem;
          border-radius: 0.5rem;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .cross-section-tool h3 {
          margin-top: 0;
          color: #1a237e;
        }
        .controls {
          margin: 1rem 0;
        }
        .point-controls {
          display: flex;
          gap: 1rem;
          margin-bottom: 1rem;
          flex-wrap: wrap;
        }
        .point-control {
          flex: 1;
          min-width: 200px;
          padding: 1rem;
          background-color: #f5f5f5;
          border-radius: 0.5rem;
        }
        .point-control h4 {
          margin-top: 0;
          color: #1a237e;
        }
        .coordinate-inputs {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .coordinate-inputs div {
          display: flex;
          flex-direction: column;
        }
        .coordinate-inputs label {
          font-size: 0.85rem;
          color: #666;
          margin-bottom: 0.25rem;
        }
        .coordinate-inputs input {
          padding: 0.5rem;
          border: 1px solid #ddd;
          border-radius: 0.25rem;
          font-size: 0.9rem;
        }
        .actions {
          display: flex;
          gap: 0.5rem;
          margin-top: 1rem;
        }
        .generate-btn, .reset-btn {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 0.5rem;
          cursor: pointer;
          font-size: 0.9rem;
          font-weight: 600;
        }
        .generate-btn {
          background-color: #1a237e;
          color: white;
        }
        .generate-btn:hover {
          background-color: #303f9f;
        }
        .reset-btn {
          background-color: #f5f5f5;
          color: #333;
        }
        .reset-btn:hover {
          background-color: #e0e0e0;
        }
        .cross-section-image {
          margin-top: 1.5rem;
          text-align: center;
        }
        .cross-section-image h4 {
          color: #1a237e;
        }
        .cross-section-image img {
          max-width: 100%;
          border: 1px solid #ddd;
          border-radius: 0.5rem;
          margin-top: 0.5rem;
        }
      `}</style>
    </div>
  );
};

export default CrossSectionTool;
