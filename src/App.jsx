import { useState, useEffect } from 'react';
import Map from './components/Map';
import Sidebar from './components/Sidebar';
import DetailPanel from './components/DetailPanel';
import { fetchAllLayers, LAYER_CONFIG } from './utils/api';
import { loadGyeonggiSignguBoundaries, spatialJoinToSigngu, createAggregatedGeoJSON } from './utils/geoDataLoader';
import './App.css';

function App() {
  const [rawLayerData, setRawLayerData] = useState({
    soil: null,
    plant: null,
    absorption: null,
    emission: null
  });
  const [aggregatedLayerData, setAggregatedLayerData] = useState({
    soil: null,
    plant: null,
    absorption: null,
    emission: null
  });
  const [boundaryData, setBoundaryData] = useState(null);
  const [emissionBySigngu, setEmissionBySigngu] = useState({});
  const [activeLayers, setActiveLayers] = useState({
    boundary: true,
    data: null
  });
  const [selectedRegion, setSelectedRegion] = useState({
    signgu: null
  });
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('🎬 App: Starting data load...');
        setLoading(true);
        setError(null);

        // 동시에 로드
        const [data, boundaries] = await Promise.all([
          fetchAllLayers(),
          loadGyeonggiSignguBoundaries()
        ]);

        console.log('📦 App: Received layer data:', {
          soil: data.soil?.features?.length || 0,
          plant: data.plant?.features?.length || 0,
          absorption: data.absorption?.features?.length || 0,
          boundaries: boundaries?.features?.length || 0,
          emissionBySigngu: Object.keys(data.emissionBySigngu || {}).length
        });

        setRawLayerData(data);
        setBoundaryData(boundaries);
        setEmissionBySigngu(data.emissionBySigngu || {});

        // 시군구별로 공간조인하여 집계된 데이터 생성
        const aggregated = {};

        // WFS 레이어들 공간조인
        for (const [key, config] of Object.entries(LAYER_CONFIG)) {
          if (config.typename && data[key]?.features?.length > 0) {
            console.log(`🔄 Spatial joining ${key} layer...`);
            const joinResult = spatialJoinToSigngu(data[key], boundaries, config.valueField);
            aggregated[key] = createAggregatedGeoJSON(joinResult, config.valueField);
            console.log(`✅ ${key}: ${aggregated[key].features.length} 시군구 aggregated`);
          } else {
            aggregated[key] = { type: 'FeatureCollection', features: [] };
          }
        }

        // 온실가스 배출량은 이미 시군구별 데이터이므로 경계와 매칭
        if (data.emissionBySigngu && boundaries?.features) {
          const emissionFeatures = boundaries.features.map(boundary => {
            const signguNm = boundary.properties.signgu_nm;
            const emissionData = data.emissionBySigngu[signguNm];

            return {
              type: 'Feature',
              properties: {
                ...boundary.properties,
                GAS_REDUCT_AMNT: emissionData?.GAS_REDUCT_AMNT || 0
              },
              geometry: boundary.geometry
            };
          });

          aggregated.emission = {
            type: 'FeatureCollection',
            features: emissionFeatures
          };
          console.log(`✅ emission: ${emissionFeatures.length} 시군구 with emission data`);
        }

        setAggregatedLayerData(aggregated);

        // Set first available layer as active
        const firstLayer = Object.keys(aggregated).find(
          key => aggregated[key]?.features?.length > 0
        );
        console.log(`🎯 App: Setting active layer to: ${firstLayer || 'none'}`);

        if (firstLayer) {
          setActiveLayers({ boundary: true, data: firstLayer });
        }

        console.log('✅ App: Data loaded successfully');
      } catch (err) {
        console.error('❌ App: Error loading data:', err);
        setError('데이터를 불러오는 중 오류가 발생했습니다. 나중에 다시 시도해주세요.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleLayerChange = (layerId) => {
    if (layerId === 'boundary') {
      setActiveLayers(prev => ({ ...prev, boundary: !prev.boundary }));
    } else {
      setActiveLayers(prev => ({ ...prev, data: layerId }));
    }
    setSelectedFeature(null);
  };

  const handleRegionChange = (signgu) => {
    setSelectedRegion({ signgu });
    setSelectedFeature(null);
  };

  const handleFeatureClick = (feature, layerType) => {
    setSelectedFeature({ feature, layerType });
  };

  const handleCloseDetail = () => {
    setSelectedFeature(null);
  };

  if (loading) {
    return (
      <div className="app loading-state">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>데이터를 불러오는 중...</p>
          <p className="loading-sub">시군구 경계 및 탄소 데이터 로딩 중</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app error-state">
        <div className="error-message">
          <h2>오류 발생</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <Sidebar
        layerData={aggregatedLayerData}
        boundaryData={boundaryData}
        activeLayers={activeLayers}
        selectedRegion={selectedRegion}
        onLayerChange={handleLayerChange}
        onRegionChange={handleRegionChange}
      />
      <div className="main-content">
        <Map
          layerData={aggregatedLayerData}
          boundaryData={boundaryData}
          activeLayers={activeLayers}
          selectedRegion={selectedRegion}
          onFeatureClick={handleFeatureClick}
        />
        {selectedFeature && (
          <DetailPanel
            feature={selectedFeature.feature}
            layerType={selectedFeature.layerType}
            onClose={handleCloseDetail}
          />
        )}
      </div>
    </div>
  );
}

export default App;
