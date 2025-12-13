import { useEffect } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in React-Leaflet
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Component to fit bounds when data changes
function FitBounds({ data }) {
  const map = useMap();

  useEffect(() => {
    if (data && data.features && data.features.length > 0) {
      const geoJsonLayer = L.geoJSON(data);
      const bounds = geoJsonLayer.getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [data, map]);

  return null;
}

/**
 * Map component with Leaflet integration
 */
function Map({ layerData, activeLayer, onFeatureClick }) {
  const center = [37.4138, 127.5183]; // Gyeonggi-do center
  const zoom = 9;

  // Get style for features based on layer type
  const getFeatureStyle = (feature, layerType) => {
    const baseStyle = {
      fillOpacity: 0.6,
      weight: 2,
      opacity: 1,
      color: 'white'
    };

    switch (layerType) {
      case 'soil':
        return { ...baseStyle, fillColor: '#8B4513' }; // Brown
      case 'plant':
        return { ...baseStyle, fillColor: '#228B22' }; // Forest Green
      case 'absorption':
        return { ...baseStyle, fillColor: '#32CD32' }; // Lime Green
      case 'emission':
        return { ...baseStyle, fillColor: '#DC143C' }; // Crimson
      default:
        return { ...baseStyle, fillColor: '#3388ff' };
    }
  };

  // Handle feature click
  const onEachFeature = (feature, layer) => {
    layer.on({
      click: () => {
        if (onFeatureClick) {
          onFeatureClick(feature, activeLayer);
        }
      },
      mouseover: (e) => {
        const layer = e.target;
        layer.setStyle({
          weight: 3,
          fillOpacity: 0.8
        });
      },
      mouseout: (e) => {
        const layer = e.target;
        layer.setStyle({
          weight: 2,
          fillOpacity: 0.6
        });
      }
    });

    // Bind tooltip
    if (feature.properties) {
      const regionName = feature.properties.sgg_nm || feature.properties.SGG_NM || 'Unknown';
      layer.bindTooltip(regionName, {
        permanent: false,
        direction: 'top'
      });
    }
  };

  return (
    <div className="map-container">
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Render active layer */}
        {activeLayer && layerData[activeLayer] && layerData[activeLayer].features && (
          <>
            <GeoJSON
              key={`${activeLayer}-${layerData[activeLayer].features.length}`}
              data={layerData[activeLayer]}
              style={(feature) => getFeatureStyle(feature, activeLayer)}
              onEachFeature={onEachFeature}
            />
            <FitBounds data={layerData[activeLayer]} />
          </>
        )}
      </MapContainer>
    </div>
  );
}

export default Map;
