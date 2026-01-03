import axios from 'axios';

// WFS API 설정
const WFS_URL = 'https://climate.gg.go.kr/ols/api/geoserver/wfs';
const WFS_API_KEY = '4c58df36-82b2-40b2-b360-6450cca44b1e';

// 경기도 온실가스 배출량 OpenAPI 설정
const GG_OPENAPI_URL = 'https://openapi.gg.go.kr/GGSIGUNGREENGASEMSTM';
const GG_OPENAPI_KEY = '35e553bfdadb4324b7195731217899fc';

// 좌표계: EPSG:5186
const SRS_NAME = 'EPSG:5186';

/**
 * Fetch WFS data from Gyeonggi-do Climate API
 * @param {string} typename - Layer name (e.g., 'spggcee:soil_cbn_strgat')
 * @param {number} maxFeatures - Maximum number of features to fetch
 * @returns {Promise<Object>} GeoJSON FeatureCollection
 */
export const fetchWFSData = async (typename, maxFeatures = 5000) => {
  try {
    console.log(`🔄 Fetching WFS data for: ${typename}`);

    const params = {
      apiKey: WFS_API_KEY,
      service: 'WFS',
      version: '1.1.0',
      request: 'GetFeature',
      typeName: typename,
      outputFormat: 'application/json',
      maxFeatures: maxFeatures,
      srsName: SRS_NAME
    };

    console.log('📤 Request params:', params);
    const response = await axios.get(WFS_URL, { params });

    console.log(`✅ Response received for ${typename}:`, {
      status: response.status,
      hasData: !!response.data,
      hasFeatures: !!response.data?.features,
      featureCount: response.data?.features?.length || 0
    });

    if (response.data && response.data.features) {
      console.log(`✅ Successfully loaded ${response.data.features.length} features for ${typename}`);

      // 첫 번째 feature의 properties 로깅 (디버깅용)
      if (response.data.features.length > 0) {
        console.log('📋 Sample feature properties:', response.data.features[0].properties);
      }

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
 * Fetch 시군구별 온실가스 배출량 from 경기도 OpenAPI
 * @returns {Promise<Object>} Emission data by 시군구
 */
export const fetchEmissionData = async () => {
  try {
    console.log('🔄 Fetching 온실가스 배출량 data from 경기도 OpenAPI...');

    const params = {
      KEY: GG_OPENAPI_KEY,
      Type: 'json',
      pIndex: 1,
      pSize: 100
    };

    const response = await axios.get(GG_OPENAPI_URL, { params });

    console.log('📦 Raw OpenAPI response:', response.data);

    // OpenAPI 응답 구조 파싱
    const apiData = response.data?.GGSIGUNGREENGASEMSTM;

    if (!apiData) {
      console.error('❌ Invalid OpenAPI response structure');
      return { type: 'FeatureCollection', features: [] };
    }

    // 결과 코드 확인
    const resultCode = apiData[0]?.head?.[1]?.RESULT?.CODE;
    if (resultCode !== 'INFO-000') {
      console.error('❌ OpenAPI error:', apiData[0]?.head?.[1]?.RESULT?.MESSAGE);
      return { type: 'FeatureCollection', features: [] };
    }

    const rows = apiData[1]?.row || [];
    console.log(`✅ Fetched ${rows.length} emission records`);

    // 시군구명으로 그룹화하여 데이터 정리
    const emissionBySigngu = {};
    rows.forEach(row => {
      const signguNm = row.SIGUN_NM;
      const gasReductAmnt = parseFloat(row.GAS_REDUCT_AMNT) || 0;

      if (!emissionBySigngu[signguNm]) {
        emissionBySigngu[signguNm] = {
          signgu_nm: signguNm,
          GAS_REDUCT_AMNT: 0,
          records: []
        };
      }

      emissionBySigngu[signguNm].GAS_REDUCT_AMNT += gasReductAmnt;
      emissionBySigngu[signguNm].records.push(row);
    });

    console.log('📊 Emission data by 시군구:', Object.keys(emissionBySigngu));

    return emissionBySigngu;
  } catch (error) {
    console.error('❌ Error fetching emission data:', error);
    console.error('Error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    return {};
  }
};

/**
 * Layer 설정 정보
 * - soil: 토양 탄소저장지도(비오톱) - 변수명: soil_cb_st
 * - plant: 수목 탄소저장지도 - 변수명: cbn_strgat
 * - absorption: 탄소흡수지도(비오톱) - 변수명: biot_npp
 * - emission: 시군구별 온실가스 배출량 - 변수명: GAS_REDUCT_AMNT
 */
export const LAYER_CONFIG = {
  soil: {
    typename: 'spggcee:soil_cbn_strgat',
    valueField: 'soil_cb_st',
    name: '토양 탄소 저장',
    unit: 'tC'
  },
  plant: {
    typename: 'spggcee:plnt_cbn_strgat_biotop',
    valueField: 'cbn_strgat',
    name: '수목 탄소 저장',
    unit: 'tC'
  },
  absorption: {
    typename: 'spggcee:biotop_cbn_abpvl',
    valueField: 'biot_npp',
    name: '탄소 흡수량',
    unit: 'tC/year'
  },
  emission: {
    typename: null, // OpenAPI 사용
    valueField: 'GAS_REDUCT_AMNT',
    name: '온실가스 배출량',
    unit: 'tCO2eq'
  }
};

/**
 * Fetch all carbon-related layers
 * @returns {Promise<Object>} Object containing all layer data
 */
export const fetchAllLayers = async () => {
  console.log('🚀 Starting to fetch all layers...');

  const results = {
    soil: { type: 'FeatureCollection', features: [] },
    plant: { type: 'FeatureCollection', features: [] },
    absorption: { type: 'FeatureCollection', features: [] },
    emission: { type: 'FeatureCollection', features: [] }
  };

  let successCount = 0;
  let failCount = 0;

  // Fetch WFS layers
  for (const [key, config] of Object.entries(LAYER_CONFIG)) {
    if (config.typename) {
      try {
        console.log(`\n📊 Fetching ${key} layer (${config.typename})...`);
        results[key] = await fetchWFSData(config.typename);
        successCount++;
      } catch (error) {
        console.error(`❌ Failed to fetch ${key} layer:`, error.message);
        failCount++;
      }
    }
  }

  // Fetch emission data from OpenAPI (stored separately, will be merged with boundaries)
  try {
    console.log('\n📊 Fetching emission data from OpenAPI...');
    const emissionData = await fetchEmissionData();
    results.emissionBySigngu = emissionData;
    successCount++;
  } catch (error) {
    console.error('❌ Failed to fetch emission data:', error.message);
    results.emissionBySigngu = {};
    failCount++;
  }

  console.log('\n📈 Layer fetch summary:', {
    success: successCount,
    failed: failCount,
    results: Object.keys(results).map(key => ({
      layer: key,
      featureCount: results[key]?.features?.length ||
                   (key === 'emissionBySigngu' ? Object.keys(results[key] || {}).length : 0)
    }))
  });

  return results;
};
