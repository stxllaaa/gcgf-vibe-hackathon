import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Leaflet 기본 아이콘 수정 (Vite 환경)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

/**
 * 지도 중심을 경기도로 맞추는 컴포넌트
 */
function MapInitializer() {
  const map = useMap();

  useEffect(() => {
    // 경기도 중심 좌표 (수원시)
    map.setView([37.2636, 127.0286], 10);
  }, [map]);

  return null;
}

/**
 * 메인 지도 컴포넌트
 */
export default function Map({ layers, visibleLayers, onFeatureClick }) {
  const geoJsonRefs = useRef({});

  // 레이어 스타일 정의
  const getLayerStyle = (layerId) => {
    const styles = {
      climate_monitoring: {
        color: '#3388ff',
        fillColor: '#3388ff',
        fillOpacity: 0.6,
        radius: 8,
        weight: 2
      },
      heat_wave: {
        color: '#ff3333',
        fillColor: '#ff3333',
        fillOpacity: 0.4,
        weight: 2
      },
      flood_risk: {
        color: '#33ccff',
        fillColor: '#33ccff',
        fillOpacity: 0.4,
        weight: 2
      },
      green_space: {
        color: '#33ff33',
        fillColor: '#33ff33',
        fillOpacity: 0.4,
        weight: 2
      },
      emd_boundary: {
        color: '#666666',
        fillColor: 'transparent',
        fillOpacity: 0.1,
        weight: 1,
        dashArray: '3, 3'
      }
    };

    return styles[layerId] || {
      color: '#888888',
      fillColor: '#888888',
      fillOpacity: 0.4,
      weight: 2
    };
  };

  // Point 피처를 CircleMarker로 변환
  const pointToLayer = (feature, latlng) => {
    return L.circleMarker(latlng);
  };

  // 피처 클릭 이벤트 핸들러
  const onEachFeature = (feature, layer, layerId) => {
    layer.on('click', () => {
      onFeatureClick({
        layerId,
        properties: feature.properties,
        geometry: feature.geometry
      });
    });

    // 호버 효과
    layer.on('mouseover', function() {
      this.setStyle({
        weight: 3,
        fillOpacity: 0.7
      });
    });

    layer.on('mouseout', function() {
      this.setStyle(getLayerStyle(layerId));
    });
  };

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <MapContainer
        style={{ width: '100%', height: '100%' }}
        zoom={10}
        scrollWheelZoom={true}
      >
        <MapInitializer />

        {/* OpenStreetMap 타일 레이어 */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* 읍면동 경계 레이어 (가장 먼저 그려서 뒤에 배치) */}
        {visibleLayers.emd_boundary && layers.emd_boundary && (
          <GeoJSON
            key="emd_boundary"
            data={layers.emd_boundary}
            style={getLayerStyle('emd_boundary')}
            onEachFeature={(feature, layer) => onEachFeature(feature, layer, 'emd_boundary')}
          />
        )}

        {/* WFS 레이어들 */}
        {Object.entries(layers).map(([layerId, data]) => {
          if (layerId === 'emd_boundary' || !visibleLayers[layerId] || !data) {
            return null;
          }

          return (
            <GeoJSON
              key={layerId}
              data={data}
              style={getLayerStyle(layerId)}
              pointToLayer={pointToLayer}
              onEachFeature={(feature, layer) => onEachFeature(feature, layer, layerId)}
              ref={el => geoJsonRefs.current[layerId] = el}
            />
          );
        })}
      </MapContainer>
    </div>
  );
}
