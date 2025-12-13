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
    const params = {
      apiKey: API_KEY,
      service: 'WFS',
      version: '1.1.0',
      request: 'GetFeature',
      typeName: typename,
      outputFormat: 'application/json',
      maxFeatures: maxFeatures
    };

    const response = await axios.get(WFS_URL, { params });

    if (response.data && response.data.features) {
      return response.data;
    } else {
      throw new Error('Invalid response format');
    }
  } catch (error) {
    console.error(`Error fetching WFS data for ${typename}:`, error);
    throw error;
  }
};

/**
 * Fetch all carbon-related layers
 * @returns {Promise<Object>} Object containing all layer data
 */
export const fetchAllLayers = async () => {
  const layers = {
    soil: 'spggcee:soil_cbn_strgat',
    plant: 'spggcee:plnt_cbn_strgat_biotop',
    absorption: 'spggcee:biotop_cbn_abpvl',
    emission: 'spggcee:bldg_info'
  };

  const results = {};

  for (const [key, typename] of Object.entries(layers)) {
    try {
      results[key] = await fetchWFSData(typename);
    } catch (error) {
      console.error(`Failed to fetch ${key} layer:`, error);
      results[key] = { type: 'FeatureCollection', features: [] };
    }
  }

  return results;
};
