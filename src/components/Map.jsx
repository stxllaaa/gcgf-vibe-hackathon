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
function Map({ layerData, boundaryData, activeLayers, onFeatureClick }) {
  const center = [37.4138, 127.5183]; // Gyeonggi-do center
  const zoom = 9;

  // 경계 스타일
  const getBoundaryStyle = () => {
    return {
      fillColor: 'transparent',
      fillOpacity: 0,
      weight: 2,
      opacity: 0.8,
      color: '#2d6a4f'  // 경기도 green
    };
  };

  // Get style for features based on layer type
  const getDataStyle = (feature, layerType) => {
    const baseStyle = {
      fillOpacity: 0.6,
      weight: 1,
      opacity: 1,
      color: '#fff'
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

  // Handle boundary feature
  const onEachBoundary = (feature, layer) => {
    layer.on({
      mouseover: (e) => {
        const layer = e.target;
        layer.setStyle({
          weight: 3,
          color: '#40916c'
        });
      },
      mouseout: (e) => {
        const layer = e.target;
        layer.setStyle({
          weight: 2,
          color: '#2d6a4f'
        });
      }
    });

    // Bind tooltip - 읍면동명 표시
    if (feature.properties && feature.properties.admdong_nm) {
      layer.bindTooltip(`${feature.properties.admdong_nm} (${feature.properties.signgu_nm})`, {
        permanent: false,
        direction: 'top',
        className: 'boundary-tooltip'
      });
    }
  };

  // Handle data feature click
  const onEachDataFeature = (feature, layer, layerType) => {
    layer.on({
      click: () => {
        if (onFeatureClick) {
          onFeatureClick(feature, layerType);
        }
      },
      mouseover: (e) => {
        const layer = e.target;
        layer.setStyle({
          weight: 2,
          fillOpacity: 0.8
        });
      },
      mouseout: (e) => {
        const layer = e.target;
        layer.setStyle({
          weight: 1,
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

        {/* 읍면동 경계 레이어 - 항상 먼저 렌더링 (뒤쪽) */}
        {activeLayers.boundary && boundaryData && boundaryData.features && (
          <>
            <GeoJSON
              key={`boundary-${boundaryData.features.length}`}
              data={boundaryData}
              style={getBoundaryStyle}
              onEachFeature={onEachBoundary}
            />
            <FitBounds data={boundaryData} />
          </>
        )}

        {/* WFS 데이터 레이어 - 위에 렌더링 (앞쪽) */}
        {activeLayers.data && layerData[activeLayers.data] && layerData[activeLayers.data].features && (
          <GeoJSON
            key={`data-${activeLayers.data}-${layerData[activeLayers.data].features.length}`}
            data={layerData[activeLayers.data]}
            style={(feature) => getDataStyle(feature, activeLayers.data)}
            onEachFeature={(feature, layer) => onEachDataFeature(feature, layer, activeLayers.data)}
          />
        )}
      </MapContainer>
    </div>
  );
}

export default Map;
