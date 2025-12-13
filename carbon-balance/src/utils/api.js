import axios from 'axios';
import { WFS_CONFIG } from './constants';

const buildWfsUrl = (typeName, maxFeatures = 10000) => {
  const params = new URLSearchParams({
    service: 'WFS',
    version: '1.1.0',
    request: 'GetFeature',
    typeName: typeName,
    outputFormat: 'application/json',
    maxFeatures: maxFeatures.toString(),
    srsName: 'EPSG:4326'
  });

  if (WFS_CONFIG.apiKey) {
    params.append('apiKey', WFS_CONFIG.apiKey);
  }

  return `${WFS_CONFIG.baseUrl}?${params.toString()}`;
};

export const fetchTreeCarbonData = async () => {
  try {
    const url = buildWfsUrl(WFS_CONFIG.typeNames.treeCarbon);
    const response = await axios.get(url, { timeout: 30000 });
    return response.data;
  } catch (error) {
    console.error('수목 탄소저장 데이터 fetch 실패:', error);
    throw error;
  }
};

export const fetchCarbonAbsorptionData = async () => {
  try {
    const url = buildWfsUrl(WFS_CONFIG.typeNames.carbonAbsorption);
    const response = await axios.get(url, { timeout: 30000 });
    return response.data;
  } catch (error) {
    console.error('탄소 흡수 데이터 fetch 실패:', error);
    throw error;
  }
};

export const fetchBuildingData = async () => {
  try {
    const url = buildWfsUrl(WFS_CONFIG.typeNames.building);
    const response = await axios.get(url, { timeout: 30000 });
    return response.data;
  } catch (error) {
    console.error('건축물 데이터 fetch 실패:', error);
    throw error;
  }
};

export const fetchAllWfsData = async () => {
  try {
    const [treeCarbon, carbonAbsorption, building] = await Promise.all([
      fetchTreeCarbonData(),
      fetchCarbonAbsorptionData(),
      fetchBuildingData()
    ]);

    return {
      treeCarbon,
      carbonAbsorption,
      building
    };
  } catch (error) {
    console.error('WFS 데이터 fetch 실패, fallback 사용:', error);
    return null;
  }
};

export const loadFallbackData = async () => {
  try {
    const response = await axios.get('/data/fallback_data.json');
    return response.data;
  } catch (error) {
    console.error('Fallback 데이터 로드 실패:', error);
    return {
      treeCarbon: { features: [] },
      carbonAbsorption: { features: [] },
      building: { features: [] }
    };
  }
};
