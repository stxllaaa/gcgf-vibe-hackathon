import { useMemo } from 'react';
import { LAYER_CONFIG } from '../utils/api';
import { calculateTotal, aggregateByRegion, getTopRegions, formatNumber } from '../utils/calculations';

/**
 * Sidebar component with layer selection and statistics
 */
function Sidebar({ layerData, boundaryData, activeLayers, selectedRegion, onLayerChange, onRegionChange }) {
  const layers = [
    { id: 'soil', name: '토양 탄소 저장', field: LAYER_CONFIG.soil.valueField, unit: LAYER_CONFIG.soil.unit },
    { id: 'plant', name: '수목 탄소 저장', field: LAYER_CONFIG.plant.valueField, unit: LAYER_CONFIG.plant.unit },
    { id: 'absorption', name: '탄소 흡수량', field: LAYER_CONFIG.absorption.valueField, unit: LAYER_CONFIG.absorption.unit },
    { id: 'emission', name: '온실가스 배출량', field: LAYER_CONFIG.emission.valueField, unit: LAYER_CONFIG.emission.unit }
  ];

  // 시군구 목록 추출 (중복 제거)
  const signguList = useMemo(() => {
    if (!boundaryData || !boundaryData.features) return [];
    const signguSet = new Set();
    boundaryData.features.forEach(feature => {
      if (feature.properties.signgu_nm) {
        signguSet.add(feature.properties.signgu_nm);
      }
    });
    return Array.from(signguSet).sort();
  }, [boundaryData]);

  // 선택된 시군구의 경계 feature
  const selectedBoundary = useMemo(() => {
    if (!boundaryData || !boundaryData.features || !selectedRegion.signgu) return null;
    return boundaryData.features.find(
      feature => feature.properties.signgu_nm === selectedRegion.signgu
    );
  }, [boundaryData, selectedRegion]);

  // 선택된 영역 내의 데이터 필터링
  const filteredLayerData = useMemo(() => {
    if (!selectedRegion.signgu || !activeLayers.data) {
      return layerData;
    }

    const filtered = {};
    Object.keys(layerData).forEach(key => {
      if (!layerData[key] || !layerData[key].features) {
        filtered[key] = layerData[key];
        return;
      }

      // 선택된 시군구의 데이터만 필터링
      const filteredFeatures = layerData[key].features.filter(feature => {
        const featureSgg = feature.properties.signgu_nm || feature.properties.sgg_nm || feature.properties.SGG_NM;
        return featureSgg === selectedRegion.signgu;
      });

      filtered[key] = {
        ...layerData[key],
        features: filteredFeatures
      };
    });

    return filtered;
  }, [layerData, selectedRegion, activeLayers.data]);

  // Calculate statistics for active layer
  const statistics = useMemo(() => {
    const activeDataLayer = activeLayers?.data;

    console.log('📊 Sidebar: Calculating statistics for layer:', activeDataLayer);
    console.log('📍 Sidebar: Selected region:', selectedRegion);

    if (!activeDataLayer || !filteredLayerData[activeDataLayer] || !filteredLayerData[activeDataLayer].features) {
      console.warn('⚠️  Sidebar: No data available for statistics');
      return null;
    }

    const layer = layers.find(l => l.id === activeDataLayer);
    if (!layer) {
      console.warn('⚠️  Sidebar: Layer config not found for:', activeDataLayer);
      return null;
    }

    const features = filteredLayerData[activeDataLayer].features;
    console.log(`🔍 Sidebar: Processing ${features.length} features`);

    if (features.length > 0) {
      console.log('📋 Sample feature properties:', features[0]?.properties);
    }

    const total = calculateTotal(features, layer.field);
    const regionData = aggregateByRegion(features, layer.field);
    const topRegions = getTopRegions(regionData, 5);

    console.log('✅ Sidebar: Statistics calculated:', {
      total,
      regionCount: Object.keys(regionData).length,
      topRegions: topRegions.map(r => ({ name: r.name, total: r.total })),
      selectedArea: selectedRegion.signgu || '전체'
    });

    return {
      total,
      unit: layer.unit,
      topRegions,
      featureCount: features.length
    };
  }, [activeLayers?.data, filteredLayerData, selectedRegion, layers]);

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h1>경기도 탄소수지 대시보드</h1>
        <p className="subtitle">Gyeonggi-do Carbon Balance Dashboard</p>
      </div>

      <div className="layer-selection">
        <h2>지역 선택</h2>

        {/* 시군구 드롭다운 */}
        <div className="region-select">
          <label htmlFor="signgu-select">시/군/구</label>
          <select
            id="signgu-select"
            value={selectedRegion.signgu || ''}
            onChange={(e) => onRegionChange(e.target.value || null)}
            className="select-dropdown"
          >
            <option value="">전체</option>
            {signguList.map(signgu => (
              <option key={signgu} value={signgu}>{signgu}</option>
            ))}
          </select>
        </div>

        <h2 style={{ marginTop: '20px' }}>레이어 선택</h2>

        {/* 시군구 경계 토글 */}
        <div className="boundary-toggle">
          <button
            className={`layer-button ${activeLayers?.boundary ? 'active' : ''}`}
            onClick={() => onLayerChange('boundary')}
          >
            <span className="layer-name">시군구 경계</span>
            {boundaryData && (
              <span className="layer-count">
                ({boundaryData.features?.length || 0})
              </span>
            )}
          </button>
        </div>

        {/* 데이터 레이어 선택 */}
        <h3 style={{ fontSize: '14px', marginTop: '16px', marginBottom: '8px', opacity: 0.8 }}>
          탄소 데이터
        </h3>
        <div className="layer-buttons">
          {layers.map(layer => (
            <button
              key={layer.id}
              className={`layer-button ${activeLayers?.data === layer.id ? 'active' : ''}`}
              onClick={() => onLayerChange(layer.id)}
            >
              <span className="layer-name">{layer.name}</span>
              {layerData[layer.id] && (
                <span className="layer-count">
                  ({layerData[layer.id].features?.length || 0})
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {statistics && (
        <div className="statistics">
          <h2>통계</h2>

          {selectedRegion.signgu && (
            <div className="selected-region-info">
              <strong>{selectedRegion.signgu}</strong>
            </div>
          )}

          <div className="stat-card total">
            <div className="stat-label">
              {selectedRegion.signgu ? '' : '총 '}{layers.find(l => l.id === activeLayers?.data)?.name}
            </div>
            <div className="stat-value">
              {formatNumber(statistics.total, 0)}
              <span className="stat-unit"> {statistics.unit}</span>
            </div>
            <div className="stat-meta">
              {selectedRegion.signgu ? '선택 지역' : `총 ${statistics.featureCount}개 시군구`}
            </div>
          </div>

          {!selectedRegion.signgu && statistics.topRegions.length > 0 && (
            <div className="top-regions">
              <h3>상위 5개 시군구</h3>
              <div className="regions-list">
                {statistics.topRegions.map((region, index) => (
                  <div key={region.name} className="region-item">
                    <div className="region-rank">{index + 1}</div>
                    <div className="region-info">
                      <div className="region-name">{region.name}</div>
                      <div className="region-value">
                        {formatNumber(region.total, 0)} {statistics.unit}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {!activeLayers?.data && (
        <div className="empty-state">
          <p>데이터 레이어를 선택하여 통계를 확인하세요</p>
        </div>
      )}

      <div className="sidebar-footer">
        <p className="data-source">
          데이터 출처: 경기도 기후변화대응 오픈플랫폼
        </p>
      </div>
    </div>
  );
}

export default Sidebar;
