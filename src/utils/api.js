import axios from 'axios';

const WFS_URL = import.meta.env.VITE_WFS_URL;
const API_KEY = import.meta.env.VITE_API_KEY;

/**
 * Fetch WFS data from Gyeonggi-do Climate API
 * @param {string} typename - Layer name (e.g., 'spggcee:soil_cbn_strgat')
 * @param {number} maxFeatures - Maximum number of features to fetch
 * @returns {Promise<Object>} GeoJSON FeatureCollection
 */
export const fetchWFSData = async (typename, maxFeatures = 1000) => {
  try {
    console.log(`🔄 Fetching WFS data for: ${typename}`);
    console.log(`📍 API URL: ${WFS_URL}`);
    console.log(`🔑 API Key present: ${API_KEY ? 'Yes' : 'No'}`);

    const params = {
      apiKey: API_KEY,
      service: 'WFS',
      version: '1.1.0',
      request: 'GetFeature',
      typeName: typename,
      outputFormat: 'application/json',
      maxFeatures: maxFeatures
    };

    console.log('📤 Request params:', params);
    const response = await axios.get(WFS_URL, { params });

    console.log(`✅ Response received for ${typename}:`, {
      status: response.status,
      hasData: !!response.data,
      hasFeatures: !!response.data?.features,
      featureCount: response.data?.features?.length || 0,
      firstFeature: response.data?.features?.[0]
    });

    if (response.data && response.data.features) {
      console.log(`✅ Successfully loaded ${response.data.features.length} features for ${typename}`);
      return response.data;
    } else {
      console.error('❌ Invalid response format:', response.data);
      throw new Error('Invalid response format');
    }
  } catch (error) {
    console.error(`❌ Error fetching WFS data for ${typename}:`, error);
    console.error('Error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    throw error;
  }
};

/**
 * Fetch all carbon-related layers
 * @returns {Promise<Object>} Object containing all layer data
 */
export const fetchAllLayers = async () => {
  console.log('🚀 Starting to fetch all WFS layers...');

  const layers = {
    soil: 'spggcee:soil_cbn_strgat',
    plant: 'spggcee:plnt_cbn_strgat_biotop',
    absorption: 'spggcee:biotop_cbn_abpvl',
    emission: 'spggcee:bldg_info'
  };

  const results = {};
  let successCount = 0;
  let failCount = 0;

  for (const [key, typename] of Object.entries(layers)) {
    try {
      console.log(`\n📊 Fetching ${key} layer (${typename})...`);
      results[key] = await fetchWFSData(typename);
      successCount++;
    } catch (error) {
      console.error(`❌ Failed to fetch ${key} layer:`, error);
      results[key] = { type: 'FeatureCollection', features: [] };
      failCount++;
    }
  }

  console.log('\n📈 Layer fetch summary:', {
    success: successCount,
    failed: failCount,
    total: Object.keys(layers).length,
    results: Object.keys(results).map(key => ({
      layer: key,
      featureCount: results[key]?.features?.length || 0
    }))
  });

  return results;
};
