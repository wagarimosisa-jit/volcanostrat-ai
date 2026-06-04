import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, useHelper } from '@react-three/drei';
import * as dat from 'dat.gui';

const Layer = ({ position, size, color, modifiers, layerNumber, onClick }) => {
  const meshRef = useRef();

  useFrame((state) => {
    meshRef.current.rotation.y += 0.005;
  });

  return (
    <mesh
      ref={meshRef}
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        onClick(layerNumber);
      }}
    >
      <boxGeometry args={size} />
      <meshStandardMaterial
        color={color}
        transparent={true}
        opacity={0.8}
      />
    </mesh>
  );
};

const Model3DViewer = ({ wells, voxelModel, onLinePointsChange }) => {
  const [selectedLayer, setSelectedLayer] = useState(null);
  const [showAxes, setShowAxes] = useState(true);
  const [wireframe, setWireframe] = useState(false);

  // Convert voxel model to simplified layers for visualization
  const layers = [];
  if (voxelModel) {
    const layerColors = {
      'Aquifer (High Productivity)': '#1a237e',
      'Aquifer (Moderate Productivity)': '#303f9f',
      'Aquifer (Low Productivity)': '#7986cb',
      'Aquitard': '#9e9e9e',
      'Unknown': '#ff5722'
    };

    wells.forEach(well => {
      well.Layers.forEach((layer, index) => {
        const color = layerColors[layer.Hydro_Property] || '#9e9e9e';
        layers.push({
          position: [0, 0, -layer.Depth_Start / 2],
          size: [10, 10, layer.Thickness],
          color: color,
          modifiers: layer.Modifiers,
          layerNumber: layer.Layer_Number,
          hydroProperty: layer.Hydro_Property
        });
      });
    });
  }

  const handleLayerClick = (layerNumber) => {
    setSelectedLayer(layerNumber);
  };

  return (
    <div className="model-3d-viewer">
      <div className="viewer-container">
        <Canvas camera={{ position: [0, 0, 50], fov: 50 }}>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} />
          <spotLight position={[0, 0, 100]} angle={0.3} penumbra={1} />

          {showAxes && <axesHelper args={[20]} />}

          {layers.map((layer, index) => (
            <Layer
              key={index}
              position={layer.position}
              size={layer.size}
              color={layer.color}
              modifiers={layer.modifiers}
              layerNumber={layer.layerNumber}
              onClick={handleLayerClick}
            />
          ))}

          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
          />
          <Environment preset="city" />
        </Canvas>
      </div>

      <div className="viewer-controls">
        <div className="control-group">
          <label>
            <input
              type="checkbox"
              checked={showAxes}
              onChange={(e) => setShowAxes(e.target.checked)}
            />
            Show Axes
          </label>
          <label>
            <input
              type="checkbox"
              checked={wireframe}
              onChange={(e) => setWireframe(e.target.checked)}
            />
            Wireframe
          </label>
        </div>

        {selectedLayer && (
          <div className="layer-info">
            <h4>Selected Layer: {selectedLayer}</h4>
            <p>Click on a layer in the 3D model to select it.</p>
          </div>
        )}

        <div className="legend">
          <h4>Legend</h4>
          <div className="legend-item">
            <span className="legend-color" style={{ backgroundColor: '#1a237e' }}></span>
            <span>Aquifer (High Productivity)</span>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{ backgroundColor: '#303f9f' }}></span>
            <span>Aquifer (Moderate Productivity)</span>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{ backgroundColor: '#7986cb' }}></span>
            <span>Aquifer (Low Productivity)</span>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{ backgroundColor: '#9e9e9e' }}></span>
            <span>Aquitard</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        .model-3d-viewer {
          display: flex;
          gap: 1rem;
          height: 70vh;
          min-height: 500px;
        }
        .viewer-container {
          flex: 1;
          border: 1px solid #ddd;
          border-radius: 0.5rem;
          overflow: hidden;
          background-color: #f9f9f9;
        }
        .viewer-controls {
          width: 300px;
          padding: 1rem;
          background-color: white;
          border-radius: 0.5rem;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .control-group {
          margin-bottom: 1rem;
        }
        .control-group label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
          cursor: pointer;
        }
        .layer-info {
          margin: 1rem 0;
          padding: 0.75rem;
          background-color: #e3f2fd;
          border-radius: 0.25rem;
        }
        .legend {
          margin-top: 1rem;
        }
        .legend h4 {
          margin-top: 0;
          color: #1a237e;
        }
        .legend-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin: 0.25rem 0;
        }
        .legend-color {
          display: inline-block;
          width: 16px;
          height: 16px;
          border-radius: 0.25rem;
          border: 1px solid #ddd;
        }
        @media (max-width: 768px) {
          .model-3d-viewer {
            flex-direction: column;
            height: auto;
          }
          .viewer-container {
            height: 400px;
          }
          .viewer-controls {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default Model3DViewer;
