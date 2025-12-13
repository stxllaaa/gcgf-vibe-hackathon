import axios from 'axios';

// WFS 레이어 정의
export const WFS_LAYERS = [
  {
    id: 'climate_monitoring',
    name: '기후변화 모니터링 지점',
    typeName: 'climate:monitoring_stations',
    color: '#3388ff'
  },
  {
    id: 'heat_wave',
    name: '폭염 위험지역',
    typeName: 'climate:heat_wave_zones',
    color: '#ff3333'
  },
  {
    id: 'flood_risk',
    name: '홍수 위험지역',
    typeName: 'climate:flood_risk_zones',
    color: '#33ccff'
  },
  {
    id: 'green_space',
    name: '녹지 공간',
    typeName: 'climate:green_spaces',
    color: '#33ff33'
  }
];

/**
 * WFS API에서 GeoJSON 데이터 가져오기
 */
export async function fetchWFSData(layerTypeName) {
  try {
    // CORS 회피를 위해 프록시 사용
    const response = await axios.get('/api/geoserver/wfs', {
      params: {
        service: 'WFS',
        version: '2.0.0',
        request: 'GetFeature',
        typeName: layerTypeName,
        outputFormat: 'application/json',
        srsName: 'EPSG:4326',
        key: import.meta.env.VITE_WFS_API_KEY
      },
      timeout: 10000
    });

    return response.data;
  } catch (error) {
    console.error(`WFS API 오류 (${layerTypeName}):`, error.message);

    // 폴백 데이터 로드 시도
    try {
      const fallbackResponse = await axios.get('/data/fallback_data.json');
      const layerId = WFS_LAYERS.find(l => l.typeName === layerTypeName)?.id;

      if (fallbackResponse.data && fallbackResponse.data[layerId]) {
        console.log(`폴백 데이터 사용: ${layerTypeName}`);
        return fallbackResponse.data[layerId];
      }
    } catch (fallbackError) {
      console.error('폴백 데이터 로드 실패:', fallbackError.message);
    }

    throw error;
  }
}

/**
 * 읍면동 경계 데이터 가져오기
 */
export async function fetchEmdBoundary() {
  try {
    // CORS 회피를 위해 프록시 사용
    const response = await axios.get('/api/emd', {
      params: {
        KEY: import.meta.env.VITE_EMD_API_KEY,
        Type: 'json',
        pSize: 1000,
        pIndex: 1
      },
      timeout: 15000
    });

    // API 응답을 GeoJSON 형식으로 변환
    const data = response.data;

    if (!data.TB25BPTGGSIGEMDLOCM || !Array.isArray(data.TB25BPTGGSIGEMDLOCM[1].row)) {
      throw new Error('읍면동 경계 데이터 형식이 올바르지 않습니다');
    }

    const features = data.TB25BPTGGSIGEMDLOCM[1].row.map(item => {
      // SHAPE 필드를 GeoJSON geometry로 변환
      let geometry;
      try {
        // SHAPE 필드가 WKT 형식이라고 가정
        geometry = parseWKTToGeoJSON(item.SHAPE);
      } catch (e) {
        console.warn('SHAPE 파싱 실패:', e);
        return null;
      }

      return {
        type: 'Feature',
        properties: {
          name: item.ADMDONG_NM,
          sigungu: item.SIGNGU_NM,
          code: item.ADMDONG_CD
        },
        geometry: geometry
      };
    }).filter(f => f !== null);

    return {
      type: 'FeatureCollection',
      features: features
    };

  } catch (error) {
    console.error('읍면동 경계 API 오류:', error.message);

    // 폴백 데이터 로드 시도
    try {
      const fallbackResponse = await axios.get('/data/fallback_data.json');
      if (fallbackResponse.data && fallbackResponse.data.emd_boundary) {
        console.log('폴백 데이터 사용: 읍면동 경계');
        return fallbackResponse.data.emd_boundary;
      }
    } catch (fallbackError) {
      console.error('폴백 데이터 로드 실패:', fallbackError.message);
    }

    throw error;
  }
}

/**
 * WKT(Well-Known Text)를 GeoJSON geometry로 변환
 * 간단한 POLYGON 파싱만 지원
 */
function parseWKTToGeoJSON(wkt) {
  if (!wkt || typeof wkt !== 'string') {
    throw new Error('Invalid WKT');
  }

  // POLYGON((x1 y1, x2 y2, ...)) 형식 파싱
  const polygonMatch = wkt.match(/POLYGON\s*\(\((.*?)\)\)/i);
  if (polygonMatch) {
    const coords = polygonMatch[1]
      .split(',')
      .map(pair => {
        const [x, y] = pair.trim().split(/\s+/);
        return [parseFloat(x), parseFloat(y)];
      });

    return {
      type: 'Polygon',
      coordinates: [coords]
    };
  }

  // MULTIPOLYGON(((x1 y1, ...)), ((x1 y1, ...))) 형식 파싱
  const multiPolygonMatch = wkt.match(/MULTIPOLYGON\s*\((.*)\)/i);
  if (multiPolygonMatch) {
    // 간단한 파싱 (완전하지 않음)
    const polygons = [];
    const content = multiPolygonMatch[1];

    // 각 폴리곤을 추출
    const polygonRegex = /\(\((.*?)\)\)/g;
    let match;
    while ((match = polygonRegex.exec(content)) !== null) {
      const coords = match[1]
        .split(',')
        .map(pair => {
          const [x, y] = pair.trim().split(/\s+/);
          return [parseFloat(x), parseFloat(y)];
        });
      polygons.push([coords]);
    }

    return {
      type: 'MultiPolygon',
      coordinates: polygons
    };
  }

  throw new Error(`Unsupported WKT format: ${wkt.substring(0, 50)}...`);
}

/**
 * 모든 레이어 데이터 로드
 */
export async function loadAllLayers() {
  const results = {
    wfs: {},
    emd: null,
    errors: []
  };

  // WFS 레이어 로드
  for (const layer of WFS_LAYERS) {
    try {
      const data = await fetchWFSData(layer.typeName);
      results.wfs[layer.id] = data;
    } catch (error) {
      results.errors.push({
        layer: layer.id,
        error: error.message
      });
    }
  }

  // 읍면동 경계 로드
  try {
    results.emd = await fetchEmdBoundary();
  } catch (error) {
    results.errors.push({
      layer: 'emd_boundary',
      error: error.message
    });
  }

  return results;
}
