import React, { useState, useEffect } from 'react';
import Map from './components/Map';
import Sidebar from './components/Sidebar';
import DetailPanel from './components/DetailPanel';
import Loading from './components/Loading';
import { fetchAllWfsData, loadFallbackData } from './utils/api';
import { loadCsvAsGeoJSON } from './utils/csvToGeoJSON';
import { aggregateByDong, calculateTotals, getTop5ByNetBalance } from './utils/calculations';

function App() {
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('데이터를 불러오는 중...');
  const [error, setError] = useState(null);

  const [dongData, setDongData] = useState(null);
  const [treeCarbonData, setTreeCarbonData] = useState(null);
  const [carbonAbsorptionData, setCarbonAbsorptionData] = useState(null);
  const [buildingData, setBuildingData] = useState(null);

  const [totals, setTotals] = useState({
    totalTreeCarbon: 0,
    totalCarbonAbsorption: 0,
    totalBuildingEmission: 0,
    totalNetBalance: 0
  });
  const [top5Dongs, setTop5Dongs] = useState([]);

  const [selectedDong, setSelectedDong] = useState(null);

  const [layers, setLayers] = useState({
    dongBoundary: true,
    treeCarbon: false,
    carbonAbsorption: false,
    building: false
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingMessage('읍면동 경계 데이터 로드 중...');
        const csvPath = '/data/경기도_시군구별_읍면동_위치정보.csv';
        let dongGeoJSON = await loadCsvAsGeoJSON(csvPath);

        setLoadingMessage('WFS 데이터 로드 중...');
        let wfsData = await fetchAllWfsData();

        if (!wfsData) {
          setLoadingMessage('Fallback 데이터 로드 중...');
          wfsData = await loadFallbackData();
        }

        setTreeCarbonData(wfsData.treeCarbon);
        setCarbonAbsorptionData(wfsData.carbonAbsorption);
        setBuildingData(wfsData.building);

        setLoadingMessage('읍면동별 탄소수지 계산 중...');
        const aggregatedDong = aggregateByDong(
          dongGeoJSON,
          wfsData.treeCarbon,
          wfsData.carbonAbsorption,
          wfsData.building
        );

        setDongData(aggregatedDong);

        const calculatedTotals = calculateTotals(aggregatedDong);
        setTotals(calculatedTotals);

        const top5 = getTop5ByNetBalance(aggregatedDong);
        setTop5Dongs(top5);

        setLoading(false);
      } catch (err) {
        console.error('데이터 로드 오류:', err);
        setError('데이터를 불러오는 중 오류가 발생했습니다.');
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleToggleLayer = (layerName) => {
    setLayers(prev => ({
      ...prev,
      [layerName]: !prev[layerName]
    }));
  };

  const handleDongClick = (dongProperties) => {
    setSelectedDong(dongProperties);
  };

  const handleCloseDetail = () => {
    setSelectedDong(null);
  };

  if (loading) {
    return <Loading message={loadingMessage} />;
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>오류 발생</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>새로고침</button>
      </div>
    );
  }

  return (
    <div className="app">
      <Sidebar
        layers={layers}
        onToggleLayer={handleToggleLayer}
        totals={totals}
        top5Dongs={top5Dongs}
      />

      <main className="main-content">
        <Map
          dongData={dongData}
          treeCarbonData={treeCarbonData}
          carbonAbsorptionData={carbonAbsorptionData}
          buildingData={buildingData}
          layers={layers}
          onDongClick={handleDongClick}
        />

        {selectedDong && (
          <DetailPanel
            data={selectedDong}
            onClose={handleCloseDetail}
          />
        )}
      </main>
    </div>
  );
}

export default App;
