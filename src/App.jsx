import { useState, useEffect } from 'react';
import Map from './components/Map';
import Sidebar from './components/Sidebar';
import DetailPanel from './components/DetailPanel';
import { WFS_LAYERS, fetchWFSData, fetchEmdBoundary } from './utils/api';

export default function App() {
  const [layers, setLayers] = useState({});
  const [visibleLayers, setVisibleLayers] = useState({
    climate_monitoring: true,
    heat_wave: true,
    flood_risk: true,
    green_space: true,
    emd_boundary: true
  });
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 초기 데이터 로드
  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError(null);

    try {
      const loadedLayers = {};

      // WFS 레이어 로드
      console.log('WFS 레이어 로드 시작...');
      for (const layer of WFS_LAYERS) {
        try {
          console.log(`로딩: ${layer.name} (${layer.typeName})`);
          const data = await fetchWFSData(layer.typeName);
          loadedLayers[layer.id] = data;
          console.log(`성공: ${layer.name} - ${data.features?.length || 0}개 피처`);
        } catch (err) {
          console.error(`실패: ${layer.name}`, err.message);
          // 실패한 레이어는 null로 설정
          loadedLayers[layer.id] = null;
        }
      }

      // 읍면동 경계 로드
      console.log('읍면동 경계 로드 시작...');
      try {
        const emdData = await fetchEmdBoundary();
        loadedLayers.emd_boundary = emdData;
        console.log(`성공: 읍면동 경계 - ${emdData.features?.length || 0}개 피처`);
      } catch (err) {
        console.error('실패: 읍면동 경계', err.message);
        loadedLayers.emd_boundary = null;
      }

      setLayers(loadedLayers);

      // 모든 레이어가 null인지 확인
      const hasAnyData = Object.values(loadedLayers).some(data => data !== null);
      if (!hasAnyData) {
        setError('모든 레이어 로드에 실패했습니다. 폴백 데이터를 확인하세요.');
      }

    } catch (err) {
      console.error('데이터 로드 오류:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleToggleLayer(layerId) {
    setVisibleLayers(prev => ({
      ...prev,
      [layerId]: !prev[layerId]
    }));
  }

  function handleFeatureClick(feature) {
    setSelectedFeature(feature);
  }

  function handleCloseDetail() {
    setSelectedFeature(null);
  }

  return (
    <div style={styles.container}>
      <Sidebar
        visibleLayers={visibleLayers}
        onToggleLayer={handleToggleLayer}
        loading={loading}
      />

      <div style={styles.mapContainer}>
        {error && (
          <div style={styles.errorBanner}>
            <strong>오류:</strong> {error}
            <button onClick={loadData} style={styles.retryButton}>
              재시도
            </button>
          </div>
        )}

        <Map
          layers={layers}
          visibleLayers={visibleLayers}
          onFeatureClick={handleFeatureClick}
        />

        <DetailPanel
          selectedFeature={selectedFeature}
          onClose={handleCloseDetail}
        />
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    width: '100vw',
    height: '100vh',
    overflow: 'hidden'
  },
  mapContainer: {
    flex: 1,
    position: 'relative'
  },
  errorBanner: {
    position: 'absolute',
    top: '10px',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: '#ff3333',
    color: 'white',
    padding: '12px 20px',
    borderRadius: '6px',
    zIndex: 2000,
    boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    fontSize: '14px'
  },
  retryButton: {
    backgroundColor: 'white',
    color: '#ff3333',
    border: 'none',
    padding: '5px 12px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '13px'
  }
};
