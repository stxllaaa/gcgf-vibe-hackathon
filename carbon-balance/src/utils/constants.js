export const MAP_CENTER = [37.5, 127.0];
export const MAP_ZOOM = 10;

export const EMISSION_FACTOR = 0.0005;

export const WFS_CONFIG = {
  baseUrl: import.meta.env.VITE_WFS_URL || '/wfs',
  apiKey: import.meta.env.VITE_WFS_API_KEY || '',
  typeNames: {
    treeCarbon: 'spggcee:plnt_cbn_strgat_biotop',
    carbonAbsorption: 'spggcee:biotop_cbn_abpvl',
    building: 'spggcee:bldg_info'
  }
};

export const LAYER_COLORS = {
  treeCarbon: {
    low: '#c7e9c0',
    mid: '#74c476',
    high: '#238b45'
  },
  carbonAbsorption: {
    low: '#c6dbef',
    mid: '#6baed6',
    high: '#2171b5'
  },
  building: {
    low: '#fee0d2',
    mid: '#fc9272',
    high: '#de2d26'
  }
};

export const LEGEND_CONFIG = {
  treeCarbon: {
    title: '수목 탄소저장',
    unit: 'tC'
  },
  carbonAbsorption: {
    title: '탄소 흡수',
    unit: 'tC/year'
  },
  building: {
    title: '건물 탄소배출',
    unit: 'tC'
  }
};
