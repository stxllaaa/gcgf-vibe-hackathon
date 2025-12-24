# 경기도 탄소수지 대시보드 (Carbon Balance Dashboard)

React + Vite + Leaflet을 사용한 경기도 WFS API 탄소 데이터 시각화 대시보드

## 📋 프로젝트 개요

경기도 기후변화대응 오픈플랫폼의 WFS API를 활용하여 경기도 지역의 탄소 저장량, 흡수량, 배출량 데이터를 시각화하는 인터랙티브 대시보드입니다.

## 🗂️ 프로젝트 구조

```
carbon-balance/
├── src/
│   ├── components/
│   │   ├── Map.jsx              # Leaflet 지도 컴포넌트
│   │   ├── Sidebar.jsx          # 레이어 선택 및 통계 표시
│   │   └── DetailPanel.jsx      # 클릭 시 상세정보 패널
│   ├── utils/
│   │   ├── api.js               # WFS API 통신
│   │   ├── calculations.js      # 데이터 계산 유틸리티
│   │   └── geoDataLoader.js     # CSV 지오데이터 로드
│   ├── App.jsx                  # 메인 앱 컴포넌트
│   ├── App.css                  # 앱 스타일
│   ├── main.jsx                 # 엔트리 포인트
│   └── index.css                # 글로벌 스타일
├── .env                         # 환경 변수
├── .env.example                 # 환경 변수 예시
├── index.html
├── vite.config.js
└── package.json
```

## 🎯 주요 기능

### 1. 4개 레이어 시각화
- **토양 탄소 저장** (`spggcee:soil_cbn_strgat`)
- **수목 탄소 저장** (`spggcee:plnt_cbn_strgat_biotop`)
- **탄소 흡수량** (`spggcee:biotop_cbn_abpvl`)
- **건물 배출량** (`spggcee:bldg_info`)

### 2. 통계 정보
- 각 레이어별 총량 계산
- 시군별 상위 5개 지역 표시
- 지역별 집계 데이터

### 3. 인터랙티브 기능
- 레이어 토글 및 전환
- 지역 클릭 시 상세정보 표시
- 지도 위 툴팁 표시
- 반응형 디자인

## 🔧 기술 스택

- **Frontend**: React 18
- **Build Tool**: Vite 5
- **Map Library**: Leaflet + React-Leaflet
- **HTTP Client**: Axios
- **Styling**: CSS3 (with CSS Variables)

## 📦 설치 및 실행

### 1. 저장소 클론

```bash
git clone <repository-url>
cd gcgf-vibe-hackathon
```

### 2. 의존성 설치

```bash
npm install
```

### 3. 환경 변수 설정

`.env.example` 파일을 참고하여 `.env` 파일을 생성하고 API 키를 설정합니다:

```bash
VITE_API_KEY=4c58df36-82b2-40b2-b360-6450cca44b1e
VITE_WFS_URL=https://climate.gg.go.kr/ols/api/geoserver/wfs
```

### 4. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:3000`으로 접속합니다.

### 5. 프로덕션 빌드

```bash
npm run build
npm run preview
```

## 🔌 API 정보

### WFS API 엔드포인트
- **URL**: `https://climate.gg.go.kr/ols/api/geoserver/wfs`
- **서비스**: WFS (Web Feature Service)
- **버전**: 1.1.0
- **출력 포맷**: application/json (GeoJSON)

### 레이어 정보

| 레이어 ID | TypeName | 설명 | 단위 |
|----------|----------|------|------|
| soil | spggcee:soil_cbn_strgat | 토양 탄소 저장량 | tC |
| plant | spggcee:plnt_cbn_strgat_biotop | 수목 탄소 저장량 | tC |
| absorption | spggcee:biotop_cbn_abpvl | 탄소 흡수량 | tC/year |
| emission | spggcee:bldg_info | 건물 배출량 | tCO2eq/year |

## 🎨 주요 컴포넌트

### Map.jsx
- Leaflet 기반 지도 렌더링
- GeoJSON 레이어 표시
- 피처 클릭/호버 이벤트 처리
- 자동 지도 범위 조정

### Sidebar.jsx
- 레이어 선택 버튼
- 통계 정보 표시
- 상위 5개 시군 리스트

### DetailPanel.jsx
- 선택된 피처의 상세정보
- 모든 속성 값 표시
- 닫기 기능

## 📊 유틸리티 함수

### api.js
```javascript
fetchWFSData(typename, maxFeatures=1000)  // WFS 데이터 가져오기
fetchAllLayers()                           // 모든 레이어 데이터 가져오기
```

### calculations.js
```javascript
calculateNetBalance(storage, absorption, emission)  // 순 탄소수지 계산
aggregateByRegion(features, valueField)             // 지역별 집계
getTopRegions(regionData, n=5)                      // 상위 N개 지역
calculateTotal(features, valueField)                // 총량 계산
formatNumber(num, decimals=2)                       // 숫자 포맷팅
```

### geoDataLoader.js
```javascript
loadGyeonggiDongBoundaries()                       // CSV에서 읍면동 경계 데이터 로드
simplifyGeometry(geometry, tolerance)               // 폴리곤 좌표 간소화
getBounds(geoJSON)                                  // GeoJSON 경계 박스 계산
matchFeaturesToBoundaries(wfsData, boundaries)      // WFS 데이터와 경계 매칭
```

## 🎨 디자인

- **색상 테마**: Green 계열 (환경/탄소 테마)
- **레이아웃**: Sidebar + Main Content (반응형)
- **인터랙션**: Hover effects, 부드러운 전환
- **반응형**: 데스크톱, 태블릿, 모바일 지원

## 🐛 개발 노트

### 주요 라이브러리 버전
- React: ^18.2.0
- Leaflet: ^1.9.4
- React-Leaflet: ^4.2.1
- Axios: ^1.6.2
- PapaParse: ^5.4.1
- Wellknown: ^0.5.0
- Vite: ^5.0.8

### 알려진 제한사항
- 최대 1000개 피처까지 로드 (maxFeatures 파라미터로 제어)
- API 키가 필요함
- 인터넷 연결 필수

## 📄 라이선스

MIT

## 🙏 데이터 출처

경기도 기후변화대응 오픈플랫폼
- https://climate.gg.go.kr