import { useEffect, useMemo } from 'react';
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
function FitBounds({ data, selectedBoundary }) {
  const map = useMap();

  useEffect(() => {
    // 선택된 시군구가 있으면 그 경계로 줌
    if (selectedBoundary && selectedBoundary.geometry) {
      const geoJsonLayer = L.geoJSON(selectedBoundary);
      const bounds = geoJsonLayer.getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [30, 30] });
        return;
      }
    }

    // 그렇지 않으면 전체 데이터로 줌
    if (data && data.features && data.features.length > 0) {
      const geoJsonLayer = L.geoJSON(data);
      const bounds = geoJsonLayer.getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [data, selectedBoundary, map]);

  return null;
}

/**
 * Map component with Leaflet integration
 */
function Map({ layerData, boundaryData, activeLayers, selectedRegion, onFeatureClick }) {
  const center = [37.4138, 127.5183]; // Gyeonggi-do center
  const zoom = 9;

  // 선택된 시군구 경계 찾기
  const selectedBoundary = boundaryData?.features?.find(
    feature => feature.properties.signgu_nm === selectedRegion.signgu
  );

  // 선택된 시군구의 데이터만 필터링
  const filteredLayerData = useMemo(() => {
    if (!selectedRegion.signgu || !activeLayers.data || !layerData[activeLayers.data]) {
      return null;
    }

    const filtered = layerData[activeLayers.data].features.filter(feature => {
      const featureSgg = feature.properties.signgu_nm ||
                         feature.properties.sgg_nm ||
                         feature.properties.SGG_NM;
      return featureSgg === selectedRegion.signgu;
    });

    return {
      type: 'FeatureCollection',
      features: filtered
    };
  }, [layerData, activeLayers.data, selectedRegion.signgu]);

  // 경계 스타일 (선택된 시군구는 강조)
  const getBoundaryStyle = (feature) => {
    const isSelected = selectedRegion.signgu &&
                      feature.properties.signgu_nm === selectedRegion.signgu;

    return {
      fillColor: isSelected ? '#74c69d' : 'transparent',
      fillOpacity: isSelected ? 0.15 : 0,
      weight: isSelected ? 3 : 1.5,
      opacity: isSelected ? 1 : 0.6,
      color: isSelected ? '#1b4332' : '#2d6a4f'
    };
  };

  // Get style for features based on layer type
  const getDataStyle = (feature, layerType) => {
    const baseStyle = {
      fillOpacity: 0.7,
      weight: 2,
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
        const isSelected = selectedRegion.signgu &&
                          feature.properties.signgu_nm === selectedRegion.signgu;
        layer.setStyle({
          weight: 3,
          color: isSelected ? '#1b4332' : '#40916c',
          fillOpacity: isSelected ? 0.25 : 0.1,
          fillColor: '#74c69d'
        });
      },
      mouseout: (e) => {
        const layer = e.target;
        layer.setStyle(getBoundaryStyle(feature));
      }
    });

    // Bind tooltip - 시군구명 표시
    if (feature.properties && feature.properties.signgu_nm) {
      layer.bindTooltip(feature.properties.signgu_nm, {
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
          weight: 3,
          fillOpacity: 0.85
        });
      },
      mouseout: (e) => {
        const layer = e.target;
        layer.setStyle({
          weight: 2,
          fillOpacity: 0.7
        });
      }
    });

    // Bind tooltip
    if (feature.properties) {
      const regionName = feature.properties.signgu_nm || feature.properties.sgg_nm || feature.properties.SGG_NM || 'Unknown';
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

        {/* 시군구 경계 레이어 - 항상 먼저 렌더링 (뒤쪽) */}
        {activeLayers.boundary && boundaryData && boundaryData.features && (
          <>
            <GeoJSON
              key={`boundary-${boundaryData.features.length}-${selectedRegion.signgu || 'all'}`}
              data={boundaryData}
              style={(feature) => getBoundaryStyle(feature)}
              onEachFeature={onEachBoundary}
            />
            <FitBounds data={boundaryData} selectedBoundary={selectedBoundary} />
          </>
        )}

        {/* 선택된 시군구의 데이터 레이어만 표시 */}
        {activeLayers.data && selectedRegion.signgu && filteredLayerData && filteredLayerData.features.length > 0 && (
          <GeoJSON
            key={`data-${activeLayers.data}-${selectedRegion.signgu}`}
            data={filteredLayerData}
            style={(feature) => getDataStyle(feature, activeLayers.data)}
            onEachFeature={(feature, layer) => onEachDataFeature(feature, layer, activeLayers.data)}
          />
        )}
      </MapContainer>
    </div>
  );
}

export default Map;
