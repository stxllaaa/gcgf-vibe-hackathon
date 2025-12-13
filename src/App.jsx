import { useState, useEffect } from 'react';
import Map from './components/Map';
import Sidebar from './components/Sidebar';
import DetailPanel from './components/DetailPanel';
import { fetchAllLayers } from './utils/api';
import './App.css';

function App() {
  const [layerData, setLayerData] = useState({
    soil: null,
    plant: null,
    absorption: null,
    emission: null
  });
  const [activeLayer, setActiveLayer] = useState(null);
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchAllLayers();
        setLayerData(data);

        // Set first available layer as active
        const firstLayer = Object.keys(data).find(key => data[key]?.features?.length > 0);
        if (firstLayer) {
          setActiveLayer(firstLayer);
        }
      } catch (err) {
        console.error('Error loading data:', err);
        setError('데이터를 불러오는 중 오류가 발생했습니다. 나중에 다시 시도해주세요.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleLayerChange = (layerId) => {
    setActiveLayer(layerId);
    setSelectedFeature(null); // Clear selection when changing layers
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
        layerData={layerData}
        activeLayer={activeLayer}
        onLayerChange={handleLayerChange}
      />
      <div className="main-content">
        <Map
          layerData={layerData}
          activeLayer={activeLayer}
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
