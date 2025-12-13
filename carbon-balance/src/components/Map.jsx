import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { MAP_CENTER, MAP_ZOOM, LAYER_COLORS } from '../utils/constants';
import { getNetBalanceColor, getColorByValue } from '../utils/calculations';

const MapController = ({ bounds }) => {
  const map = useMap();

  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [20, 20] });
    }
  }, [bounds, map]);

  return null;
};

const Map = ({
  dongData,
  treeCarbonData,
  carbonAbsorptionData,
  buildingData,
  layers,
  onDongClick
}) => {
  const mapRef = useRef();

  const getTreeCarbonStyle = (feature) => {
    const value = feature.properties?.cbn_strgat || 0;
    const color = getColorByValue(value, 0, 1000, LAYER_COLORS.treeCarbon);

    return {
      fillColor: color,
      fillOpacity: 0.6,
      color: '#2d5a27',
      weight: 1
    };
  };

  const getCarbonAbsorptionStyle = (feature) => {
    const value = feature.properties?.biotop_whol_npp || 0;
    const color = getColorByValue(value, 0, 500, LAYER_COLORS.carbonAbsorption);

    return {
      fillColor: color,
      fillOpacity: 0.6,
      color: '#1a4480',
      weight: 1
    };
  };

  const getBuildingStyle = (feature) => {
    const tfar = feature.properties?.tfar || 0;
    const emission = tfar * 0.0005;
    const color = getColorByValue(emission, 0, 10, LAYER_COLORS.building);

    return {
      fillColor: color,
      fillOpacity: 0.6,
      color: '#8b1a1a',
      weight: 1
    };
  };

  const dongBoundaryStyle = {
    fillColor: 'transparent',
    fillOpacity: 0,
    color: '#666666',
    weight: 2,
    dashArray: '3'
  };

  const dongNetBalanceStyle = (feature) => {
    const netBalance = feature.properties?.netCarbonBalance || 0;
    return {
      fillColor: getNetBalanceColor(netBalance),
      fillOpacity: 0.5,
      color: '#333333',
      weight: 2
    };
  };

  const onEachDong = (feature, layer) => {
    const props = feature.properties;

    layer.bindTooltip(
      `<strong>${props.admdong_nm}</strong><br/>
       순 탄소수지: ${props.netCarbonBalance?.toLocaleString('ko-KR', { maximumFractionDigits: 2 }) || 0} tC`,
      { sticky: true }
    );

    layer.on({
      click: () => {
        if (onDongClick) {
          onDongClick(props);
        }
      },
      mouseover: (e) => {
        e.target.setStyle({
          weight: 4,
          color: '#000'
        });
      },
      mouseout: (e) => {
        e.target.setStyle({
          weight: 2,
          color: '#333333'
        });
      }
    });
  };

  const onEachTreeCarbon = (feature, layer) => {
    const props = feature.properties;
    layer.bindTooltip(
      `<strong>수목 탄소저장</strong><br/>
       시군명: ${props.sigun_nm || '-'}<br/>
       탄소저장량: ${props.cbn_strgat?.toLocaleString() || 0} tC`,
      { sticky: true }
    );
  };

  const onEachAbsorption = (feature, layer) => {
    const props = feature.properties;
    layer.bindTooltip(
      `<strong>탄소 흡수</strong><br/>
       시군명: ${props.sigun_nm || '-'}<br/>
       NPP: ${props.biotop_whol_npp?.toLocaleString() || 0} tC/year`,
      { sticky: true }
    );
  };

  const onEachBuilding = (feature, layer) => {
    const props = feature.properties;
    const emission = (props.tfar || 0) * 0.0005;
    layer.bindTooltip(
      `<strong>건축물</strong><br/>
       연면적: ${props.tfar?.toLocaleString() || 0} m²<br/>
       추정 배출량: ${emission.toFixed(2)} tC`,
      { sticky: true }
    );
  };

  return (
    <div className="map-container">
      <MapContainer
        center={MAP_CENTER}
        zoom={MAP_ZOOM}
        className="leaflet-map"
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {layers.treeCarbon && treeCarbonData && treeCarbonData.features && (
          <GeoJSON
            key={`tree-${treeCarbonData.features.length}`}
            data={treeCarbonData}
            style={getTreeCarbonStyle}
            onEachFeature={onEachTreeCarbon}
          />
        )}

        {layers.carbonAbsorption && carbonAbsorptionData && carbonAbsorptionData.features && (
          <GeoJSON
            key={`absorption-${carbonAbsorptionData.features.length}`}
            data={carbonAbsorptionData}
            style={getCarbonAbsorptionStyle}
            onEachFeature={onEachAbsorption}
          />
        )}

        {layers.building && buildingData && buildingData.features && (
          <GeoJSON
            key={`building-${buildingData.features.length}`}
            data={buildingData}
            style={getBuildingStyle}
            onEachFeature={onEachBuilding}
          />
        )}

        {layers.dongBoundary && dongData && dongData.features && (
          <GeoJSON
            key={`dong-${dongData.features.length}`}
            data={dongData}
            style={dongNetBalanceStyle}
            onEachFeature={onEachDong}
          />
        )}
      </MapContainer>

      <div className="map-legend">
        <h4>범례</h4>
        <div className="legend-section">
          <span className="legend-title">순 탄소수지</span>
          <div className="legend-item">
            <span className="legend-color" style={{ backgroundColor: '#1a9850' }}></span>
            <span>양호 (&gt;1000)</span>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{ backgroundColor: '#66bd63' }}></span>
            <span>보통 양 (100~1000)</span>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{ backgroundColor: '#a6d96a' }}></span>
            <span>약간 양 (0~100)</span>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{ backgroundColor: '#ffffbf' }}></span>
            <span>중립 (0)</span>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{ backgroundColor: '#fdae61' }}></span>
            <span>약간 음 (0~-100)</span>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{ backgroundColor: '#f46d43' }}></span>
            <span>보통 음 (-100~-1000)</span>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{ backgroundColor: '#d73027' }}></span>
            <span>부족 (&lt;-1000)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Map;
