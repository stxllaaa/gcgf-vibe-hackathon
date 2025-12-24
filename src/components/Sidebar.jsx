import { useMemo } from 'react';
import { calculateTotal, aggregateByRegion, getTopRegions, formatNumber } from '../utils/calculations';

/**
 * Sidebar component with layer selection and statistics
 */
function Sidebar({ layerData, boundaryData, activeLayers, onLayerChange }) {
  const layers = [
    { id: 'soil', name: '토양 탄소 저장', field: 'cbn_strgat', unit: 'tC' },
    { id: 'plant', name: '수목 탄소 저장', field: 'cbn_strgat', unit: 'tC' },
    { id: 'absorption', name: '탄소 흡수량', field: 'cbn_abpvl', unit: 'tC/year' },
    { id: 'emission', name: '건물 배출량', field: 'ghg_emsvl', unit: 'tCO2eq/year' }
  ];

  // Calculate statistics for active layer
  const statistics = useMemo(() => {
    const activeDataLayer = activeLayers?.data;

    console.log('📊 Sidebar: Calculating statistics for layer:', activeDataLayer);
    console.log('📦 Sidebar: Layer data:', {
      activeDataLayer,
      hasLayerData: !!layerData[activeDataLayer],
      hasFeatures: !!layerData[activeDataLayer]?.features,
      featureCount: layerData[activeDataLayer]?.features?.length || 0
    });

    if (!activeDataLayer || !layerData[activeDataLayer] || !layerData[activeDataLayer].features) {
      console.warn('⚠️  Sidebar: No data available for statistics');
      return null;
    }

    const layer = layers.find(l => l.id === activeDataLayer);
    if (!layer) {
      console.warn('⚠️  Sidebar: Layer config not found for:', activeDataLayer);
      return null;
    }

    const features = layerData[activeDataLayer].features;
    console.log(`🔍 Sidebar: Processing ${features.length} features`);
    console.log('📍 Sidebar: Sample feature properties:', features[0]?.properties);
    console.log(`🔑 Sidebar: Looking for field: ${layer.field}`);

    const total = calculateTotal(features, layer.field);
    const regionData = aggregateByRegion(features, layer.field);
    const topRegions = getTopRegions(regionData, 5);

    console.log('✅ Sidebar: Statistics calculated:', {
      total,
      regionCount: Object.keys(regionData).length,
      topRegions: topRegions.map(r => ({ name: r.name, total: r.total }))
    });

    return {
      total,
      unit: layer.unit,
      topRegions,
      featureCount: features.length
    };
  }, [activeLayers?.data, layerData]);

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h1>경기도 탄소수지 대시보드</h1>
        <p className="subtitle">Gyeonggi-do Carbon Balance Dashboard</p>
      </div>

      <div className="layer-selection">
        <h2>레이어 선택</h2>

        {/* 읍면동 경계 토글 */}
        <div className="boundary-toggle">
          <button
            className={`layer-button ${activeLayers?.boundary ? 'active' : ''}`}
            onClick={() => onLayerChange('boundary')}
          >
            <span className="layer-name">📍 읍면동 경계</span>
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

          <div className="stat-card total">
            <div className="stat-label">총 {layers.find(l => l.id === activeLayers?.data)?.name}</div>
            <div className="stat-value">
              {formatNumber(statistics.total, 0)}
              <span className="stat-unit"> {statistics.unit}</span>
            </div>
            <div className="stat-meta">
              총 {statistics.featureCount}개 지역
            </div>
          </div>

          <div className="top-regions">
            <h3>상위 5개 시군</h3>
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
