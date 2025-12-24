# 경기도 탄소수지 대시보드

경기도 지역의 **수목 탄소저장**, **탄소 흡수(비오톱 NPP)**, **건축물 탄소 배출**을 통합하여 **읍면동 단위 순 탄소수지**를 시각화하는 웹 GIS 대시보드입니다.

## 순 탄소수지 계산식

```
순 탄소수지 = (수목 탄소저장 + 탄소 흡수) - 건축물 배출
```

## 기술 스택

- React 18 + Vite
- Leaflet / react-leaflet
- Axios
- PapaParse
- wellknown (WKT → GeoJSON)

## 시작하기

### 설치

```bash
npm install
```

### 환경변수 설정

`.env.example`을 참고하여 `.env` 파일을 생성합니다:

```bash
cp .env.example .env
```

필요시 API 키를 설정합니다:

```
VITE_WFS_API_KEY=YOUR_API_KEY
VITE_WFS_URL=https://climate.gg.go.kr/ols/api/geoserver/wfs
```

### 개발 서버 실행

```bash
npm run dev
```

### 빌드

```bash
npm run build
```

### 미리보기

```bash
npm run preview
```

## 데이터 소스

### 1. 수목 탄소저장 지도 (WFS)
- typeName: `spggcee:plnt_cbn_strgat_biotop`
- 주요 필드: `cbn_strgat` (탄소저장량)

### 2. 탄소 흡수 지도 (WFS)
- typeName: `spggcee:biotop_cbn_abpvl`
- 주요 필드: `biotop_whol_npp` (비오톱 전체 NPP)

### 3. 건축물 정보 지도 (WFS)
- typeName: `spggcee:bldg_info`
- 주요 필드: `tfar` (연면적)
- 배출량 계산: `tfar * 0.0005`

### 4. 읍면동 경계 데이터 (CSV)
- 파일 경로: `public/data/경기도_시군구별_읍면동_위치정보.csv`
- WKT 형식의 경계 데이터

## 기능

- 읍면동 단위 탄소수지 시각화
- 레이어 토글 (읍면동 경계, 수목 탄소, 탄소 흡수, 건물 배출)
- 읍면동 클릭 시 상세 정보 표시
- 전체 합계 및 Top 5 읍면동 표시
- WFS API 실패 시 fallback 데이터 사용

## 배포

Vercel 배포 가능한 구조로 설계되었습니다.

```bash
vercel
```

## 라이선스

MIT License

## 데이터 출처

경기도 기후환경정보시스템
