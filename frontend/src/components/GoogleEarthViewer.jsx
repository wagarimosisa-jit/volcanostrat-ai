import React, { useEffect, useRef } from 'react';
import { Viewer, Entity, CameraFlyTo } from 'resium';
import { Cartesian3, Math as CesiumMath, Color } from 'cesium';

const GoogleEarthViewer = ({ wells }) => {
  const viewerRef = useRef(null);

  // Convert decimal degrees to Cesium Cartesian3
  const toCartesian3 = (longitude, latitude, height = 0) => {
    return Cartesian3.fromDegrees(longitude, latitude, height);
  };

  // Center on wells
  useEffect(() => {
    if (viewerRef.current?.cesiumElement && wells.length > 0) {
      const viewer = viewerRef.current.cesiumElement;
      const bounds = wells.reduce((acc, well) => {
        acc.minLong = Math.min(acc.minLong, well.Coordinates.X);
        acc.maxLong = Math.max(acc.maxLong, well.Coordinates.X);
        acc.minLat = Math.min(acc.minLat, well.Coordinates.Y);
        acc.maxLat = Math.max(acc.maxLat, well.Coordinates.Y);
        return acc;
      }, {
        minLong: Infinity,
        maxLong: -Infinity,
        minLat: Infinity,
        maxLat: -Infinity
      });

      // Fly to bounds
      viewer.camera.flyTo({
        destination: Cartesian3.fromDegrees(
          (bounds.minLong + bounds.maxLong) / 2,
          (bounds.minLat + bounds.maxLat) / 2,
          1000
        ),
        orientation: {
          heading: CesiumMath.toRadians(0),
          pitch: CesiumMath.toRadians(-45),
          roll: 0.0
        }
      });
    }
  }, [wells]);

  return (
    <div className="google-earth-viewer">
      <Viewer
        ref={viewerRef}
        full
        terrainProvider={null}
        timeline={false}
        animation={false}
        homeButton={false}
        navigationHelpButton={false}
        baseLayerPicker={true}
        geocoder={true}
        sceneModePicker={false}
      >
        {wells.map((well, index) => (
          <Entity
            key={index}
            name={well.Well_ID}
            position={toCartesian3(
              well.Coordinates.X,
              well.Coordinates.Y,
              well.Coordinates.Elevation
            )}
            point={{
              pixelSize: 10,
              color: well.Layers.some(l => l.Hydro_Property?.includes('Aquifer'))
                ? Color.BLUE
                : Color.GRAY,
              outlineColor: Color.WHITE,
              outlineWidth: 2
            }}
            description={
              `<div style="padding: 10px;">
                <h4>${well.Well_ID}</h4>
                <p><strong>Coordinates:</strong> ${well.Coordinates.X}, ${well.Coordinates.Y}</p>
                <p><strong>Elevation:</strong> ${well.Coordinates.Elevation} m</p>
                <p><strong>Layers:</strong> ${well.Layers.length}</p>
                <p><strong>Productive:</strong> ${
                  well.Layers.some(l => l.Hydro_Property?.includes('Aquifer')) ? 'Yes' : 'No'
                }</p>
              </div>`
            }
          />
        ))}
      </Viewer>

      <div className="earth-controls">
        <p>🌍 <strong>Google Earth View</strong></p>
        <p>Blue points = Aquifer wells | Gray points = Non-productive wells</p>
        <p>Click on a point to see details</p>
      </div>

      <style jsx>{`
        .google-earth-viewer {
          position: relative;
          width: 100%;
          height: 70vh;
          min-height: 500px;
        }
        .earth-controls {
          position: absolute;
          bottom: 1rem;
          left: 1rem;
          background-color: rgba(255, 255, 255, 0.9);
          padding: 1rem;
          border-radius: 0.5rem;
          z-index: 1000;
        }
        .earth-controls p {
          margin: 0 0 0.5rem;
          font-size: 0.9rem;
        }
        .earth-controls p:first-child {
          font-weight: 600;
          color: #1a237e;
        }
      `}</style>
    </div>
  );
};

export default GoogleEarthViewer;
