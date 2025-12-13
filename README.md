# 경기도 기후변화 지도 (GCGF Vibe Hackathon)

경기도 기후변화 대응 시스템 데이터를 활용한 인터랙티브 지도 애플리케이션입니다.

## 기능

- 📍 **기후변화 모니터링 지점**: 경기도 내 기후변화 모니터링 센터 위치 및 정보
- 🔥 **폭염 위험지역**: 폭염 취약 지역 표시
- 💧 **홍수 위험지역**: 홍수 위험 지역 표시
- 🌳 **녹지 공간**: 공원 및 녹지 공간 정보
- 🗺️ **읍면동 경계**: 경기도 행정구역 경계선

## 기술 스택

- **Frontend**: React 18 + Vite
- **지도 라이브러리**: Leaflet + React-Leaflet
- **API**:
  - 경기도 기후변화 WFS API
  - 경기도 읍면동 경계 OpenAPI
- **스타일링**: CSS-in-JS (인라인 스타일)

## 설치 및 실행

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env` 파일이 이미 생성되어 있습니다:

```env
VITE_WFS_API_URL=https://climate.gg.go.kr/ols/api/geoserver/wfs
VITE_WFS_API_KEY=4c58df04073c74b76a1dd992872919707
VITE_EMD_API_URL=https://openapi.gg.go.kr/TB25BPTGGSIGEMDLOCM
VITE_EMD_API_KEY=0a1df04073c74b76a1dd992872919707
```

### 3. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 http://localhost:5173 접속

### 4. 프로덕션 빌드

```bash
npm run build
npm run preview
```

## API 테스트

API 연결 상태를 테스트하려면:

```bash
npm run test:api
```

**참고**: API가 403 오류를 반환하는 경우, 애플리케이션은 자동으로 폴백 데이터(`public/data/fallback_data.json`)를 사용합니다.

## 프로젝트 구조

```
gcgf-vibe-hackathon/
├── src/
│   ├── components/
│   │   ├── Map.jsx           # 지도 컴포넌트
│   │   ├── Sidebar.jsx       # 레이어 토글 사이드바
│   │   └── DetailPanel.jsx   # 피처 상세 정보 패널
│   ├── utils/
│   │   └── api.js            # API 호출 및 데이터 처리
│   ├── test/
│   │   └── api-test.js       # API 테스트 스크립트
│   ├── App.jsx               # 메인 앱 컴포넌트
│   ├── main.jsx              # 앱 엔트리 포인트
│   └── index.css             # 글로벌 스타일
├── public/
│   └── data/
│       └── fallback_data.json # 폴백 데이터
├── .env                       # 환경 변수
├── vite.config.js            # Vite 설정 (CORS 프록시 포함)
└── package.json

```

## 사용 방법

1. **레이어 선택**: 왼쪽 사이드바에서 원하는 레이어를 체크박스로 선택
2. **피처 클릭**: 지도에서 마커나 폴리곤을 클릭하면 오른쪽에 상세 정보 패널 표시
3. **지도 조작**: 마우스 드래그로 이동, 스크롤로 줌 인/아웃

## CORS 프록시 설정

개발 환경에서 CORS 문제를 해결하기 위해 Vite 프록시가 설정되어 있습니다:

- `/api/geoserver` → `https://climate.gg.go.kr/ols/api/geoserver`
- `/api/emd` → `https://openapi.gg.go.kr/TB25BPTGGSIGEMDLOCM`

## 트러블슈팅

### API 403 오류

API 키가 특정 도메인에서만 작동하도록 제한되어 있을 수 있습니다. 이 경우:

1. 애플리케이션은 자동으로 폴백 데이터를 사용합니다
2. 브라우저 개발자 도구 콘솔에서 "폴백 데이터 사용" 메시지 확인
3. 실제 API 데이터가 필요한 경우, API 제공자에게 도메인 등록 요청

### 빌드 오류

```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

## 라이선스

MIT

## 개발자

GCGF Vibe Hackathon 프로젝트