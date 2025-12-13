import axios from 'axios';

// 환경변수 설정 (Node.js 환경)
const WFS_API_URL = 'https://climate.gg.go.kr/ols/api/geoserver/wfs';
const WFS_API_KEY = '4c58df04073c74b76a1dd992872919707';
const EMD_API_URL = 'https://openapi.gg.go.kr/TB25BPTGGSIGEMDLOCM';
const EMD_API_KEY = '0a1df04073c74b76a1dd992872919707';

const WFS_LAYERS = [
  { id: 'climate_monitoring', typeName: 'climate:monitoring_stations', name: '기후변화 모니터링 지점' },
  { id: 'heat_wave', typeName: 'climate:heat_wave_zones', name: '폭염 위험지역' },
  { id: 'flood_risk', typeName: 'climate:flood_risk_zones', name: '홍수 위험지역' },
  { id: 'green_space', typeName: 'climate:green_spaces', name: '녹지 공간' }
];

console.log('='.repeat(80));
console.log('경기도 기후변화 API 테스트');
console.log('='.repeat(80));
console.log('');

/**
 * WFS API 테스트
 */
async function testWFSLayer(layer) {
  console.log(`\n[테스트] ${layer.name} (${layer.typeName})`);
  console.log('-'.repeat(80));

  try {
    const response = await axios.get(WFS_API_URL, {
      params: {
        service: 'WFS',
        version: '2.0.0',
        request: 'GetFeature',
        typeName: layer.typeName,
        outputFormat: 'application/json',
        srsName: 'EPSG:4326',
        key: WFS_API_KEY
      },
      timeout: 10000
    });

    if (response.status === 200) {
      const data = response.data;
      const featureCount = data.features ? data.features.length : 0;

      console.log(`✓ 성공: HTTP ${response.status}`);
      console.log(`  - 피처 개수: ${featureCount}`);

      if (featureCount > 0) {
        const firstFeature = data.features[0];
        console.log(`  - 첫 번째 피처 속성:`, JSON.stringify(firstFeature.properties, null, 2));
      } else {
        console.log(`  ⚠ 경고: 데이터가 비어있습니다`);
      }

      return { success: true, count: featureCount };
    }

  } catch (error) {
    console.log(`✗ 실패:`);

    if (error.response) {
      console.log(`  - HTTP 상태: ${error.response.status}`);
      console.log(`  - 응답:`, error.response.data);
    } else if (error.request) {
      console.log(`  - 요청 전송됨, 응답 없음`);
      console.log(`  - 오류: ${error.message}`);
    } else {
      console.log(`  - 오류: ${error.message}`);
    }

    return { success: false, error: error.message };
  }
}

/**
 * 읍면동 경계 API 테스트
 */
async function testEmdBoundaryAPI() {
  console.log(`\n[테스트] 읍면동 경계 API`);
  console.log('-'.repeat(80));

  try {
    const response = await axios.get(EMD_API_URL, {
      params: {
        KEY: EMD_API_KEY,
        Type: 'json',
        pSize: 10, // 테스트용으로 10개만
        pIndex: 1
      },
      timeout: 15000
    });

    if (response.status === 200) {
      const data = response.data;

      console.log(`✓ 성공: HTTP ${response.status}`);
      console.log(`  - 응답 구조:`, Object.keys(data));

      // API 응답 형식 확인
      if (data.TB25BPTGGSIGEMDLOCM) {
        const apiData = data.TB25BPTGGSIGEMDLOCM;
        console.log(`  - API 데이터 구조:`, Object.keys(apiData));

        if (apiData[1] && apiData[1].row) {
          const rows = apiData[1].row;
          console.log(`  - 행 개수: ${rows.length}`);

          if (rows.length > 0) {
            const firstRow = rows[0];
            console.log(`  - 첫 번째 데이터:`, {
              ADMDONG_NM: firstRow.ADMDONG_NM,
              SIGNGU_NM: firstRow.SIGNGU_NM,
              ADMDONG_CD: firstRow.ADMDONG_CD,
              SHAPE: firstRow.SHAPE ? `${firstRow.SHAPE.substring(0, 100)}...` : 'N/A'
            });

            return { success: true, count: rows.length };
          }
        } else {
          console.log(`  ⚠ 경고: 예상하지 못한 데이터 형식`);
          console.log(`  - 전체 응답:`, JSON.stringify(data, null, 2).substring(0, 500));
        }
      } else {
        console.log(`  ⚠ 경고: TB25BPTGGSIGEMDLOCM 필드가 없습니다`);
        console.log(`  - 전체 응답:`, JSON.stringify(data, null, 2).substring(0, 500));
      }

      return { success: true, count: 0 };
    }

  } catch (error) {
    console.log(`✗ 실패:`);

    if (error.response) {
      console.log(`  - HTTP 상태: ${error.response.status}`);
      console.log(`  - 응답:`, JSON.stringify(error.response.data, null, 2).substring(0, 500));
    } else if (error.request) {
      console.log(`  - 요청 전송됨, 응답 없음`);
      console.log(`  - 오류: ${error.message}`);
    } else {
      console.log(`  - 오류: ${error.message}`);
    }

    return { success: false, error: error.message };
  }
}

/**
 * 모든 API 테스트 실행
 */
async function runAllTests() {
  const results = {
    wfs: {},
    emd: null
  };

  console.log('\n📡 WFS API 테스트 시작...\n');

  // WFS 레이어 테스트
  for (const layer of WFS_LAYERS) {
    results.wfs[layer.id] = await testWFSLayer(layer);
    await new Promise(resolve => setTimeout(resolve, 1000)); // 1초 대기
  }

  console.log('\n📡 읍면동 경계 API 테스트 시작...\n');

  // 읍면동 경계 테스트
  results.emd = await testEmdBoundaryAPI();

  // 결과 요약
  console.log('\n' + '='.repeat(80));
  console.log('테스트 결과 요약');
  console.log('='.repeat(80));

  const wfsSuccess = Object.values(results.wfs).filter(r => r.success).length;
  const wfsTotal = Object.keys(results.wfs).length;

  console.log(`\nWFS 레이어: ${wfsSuccess}/${wfsTotal} 성공`);
  Object.entries(results.wfs).forEach(([id, result]) => {
    const status = result.success ? '✓' : '✗';
    const detail = result.success ? `${result.count}개` : result.error;
    console.log(`  ${status} ${id}: ${detail}`);
  });

  console.log(`\n읍면동 경계: ${results.emd.success ? '✓ 성공' : '✗ 실패'}`);
  if (results.emd.success) {
    console.log(`  - ${results.emd.count}개`);
  } else {
    console.log(`  - ${results.emd.error}`);
  }

  console.log('\n' + '='.repeat(80));

  // 모든 테스트가 실패한 경우 경고
  if (wfsSuccess === 0 && !results.emd.success) {
    console.log('\n⚠️  모든 API 테스트가 실패했습니다!');
    console.log('   - 인터넷 연결을 확인하세요');
    console.log('   - API 키가 유효한지 확인하세요');
    console.log('   - API 서버가 정상 작동 중인지 확인하세요');
    console.log('   - CORS 문제인 경우 브라우저에서 프록시를 통해 접근하세요\n');
  } else if (wfsSuccess < wfsTotal || !results.emd.success) {
    console.log('\n⚠️  일부 API 테스트가 실패했습니다');
    console.log('   - 애플리케이션은 폴백 데이터를 사용하여 실행됩니다\n');
  } else {
    console.log('\n✅ 모든 API 테스트가 성공했습니다!\n');
  }
}

// 테스트 실행
runAllTests().catch(error => {
  console.error('치명적인 오류:', error);
  process.exit(1);
});
