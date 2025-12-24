import { EMISSION_FACTOR } from './constants';

const pointInPolygon = (point, polygon) => {
  const [x, y] = point;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0], yi = polygon[i][1];
    const xj = polygon[j][0], yj = polygon[j][1];

    if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }

  return inside;
};

const getPolygonCoords = (geometry) => {
  if (!geometry) return [];

  if (geometry.type === 'Polygon') {
    return geometry.coordinates[0];
  } else if (geometry.type === 'MultiPolygon') {
    return geometry.coordinates[0][0];
  }
  return [];
};

const getCentroid = (geometry) => {
  const coords = getPolygonCoords(geometry);
  if (coords.length === 0) return null;

  let sumX = 0, sumY = 0;
  coords.forEach(coord => {
    sumX += coord[0];
    sumY += coord[1];
  });

  return [sumX / coords.length, sumY / coords.length];
};

const isPointInDong = (point, dongGeometry) => {
  if (!point || !dongGeometry) return false;

  if (dongGeometry.type === 'Polygon') {
    return pointInPolygon(point, dongGeometry.coordinates[0]);
  } else if (dongGeometry.type === 'MultiPolygon') {
    for (const polygon of dongGeometry.coordinates) {
      if (pointInPolygon(point, polygon[0])) {
        return true;
      }
    }
  }
  return false;
};

export const aggregateByDong = (dongGeoJSON, treeCarbonData, absorptionData, buildingData) => {
  if (!dongGeoJSON || !dongGeoJSON.features) {
    return dongGeoJSON;
  }

  const dongStats = {};
  dongGeoJSON.features.forEach((dong, idx) => {
    dongStats[idx] = {
      treeCarbon: 0,
      carbonAbsorption: 0,
      buildingEmission: 0
    };
  });

  if (treeCarbonData && treeCarbonData.features) {
    treeCarbonData.features.forEach(feature => {
      const centroid = getCentroid(feature.geometry);
      if (!centroid) return;

      const carbonValue = parseFloat(feature.properties?.cbn_strgat) || 0;

      dongGeoJSON.features.forEach((dong, idx) => {
        if (isPointInDong(centroid, dong.geometry)) {
          dongStats[idx].treeCarbon += carbonValue;
        }
      });
    });
  }

  if (absorptionData && absorptionData.features) {
    absorptionData.features.forEach(feature => {
      const centroid = getCentroid(feature.geometry);
      if (!centroid) return;

      const nppValue = parseFloat(feature.properties?.biotop_whol_npp) || 0;

      dongGeoJSON.features.forEach((dong, idx) => {
        if (isPointInDong(centroid, dong.geometry)) {
          dongStats[idx].carbonAbsorption += nppValue;
        }
      });
    });
  }

  if (buildingData && buildingData.features) {
    buildingData.features.forEach(feature => {
      const centroid = getCentroid(feature.geometry);
      if (!centroid) return;

      const tfar = parseFloat(feature.properties?.tfar) || 0;
      const emission = tfar * EMISSION_FACTOR;

      dongGeoJSON.features.forEach((dong, idx) => {
        if (isPointInDong(centroid, dong.geometry)) {
          dongStats[idx].buildingEmission += emission;
        }
      });
    });
  }

  const updatedFeatures = dongGeoJSON.features.map((dong, idx) => {
    const stats = dongStats[idx];
    const netBalance = (stats.treeCarbon + stats.carbonAbsorption) - stats.buildingEmission;

    return {
      ...dong,
      properties: {
        ...dong.properties,
        treeCarbon: stats.treeCarbon,
        carbonAbsorption: stats.carbonAbsorption,
        buildingEmission: stats.buildingEmission,
        netCarbonBalance: netBalance
      }
    };
  });

  return {
    ...dongGeoJSON,
    features: updatedFeatures
  };
};

export const calculateTotals = (dongGeoJSON) => {
  if (!dongGeoJSON || !dongGeoJSON.features) {
    return {
      totalTreeCarbon: 0,
      totalCarbonAbsorption: 0,
      totalBuildingEmission: 0,
      totalNetBalance: 0
    };
  }

  let totalTreeCarbon = 0;
  let totalCarbonAbsorption = 0;
  let totalBuildingEmission = 0;

  dongGeoJSON.features.forEach(feature => {
    totalTreeCarbon += feature.properties.treeCarbon || 0;
    totalCarbonAbsorption += feature.properties.carbonAbsorption || 0;
    totalBuildingEmission += feature.properties.buildingEmission || 0;
  });

  const totalNetBalance = (totalTreeCarbon + totalCarbonAbsorption) - totalBuildingEmission;

  return {
    totalTreeCarbon,
    totalCarbonAbsorption,
    totalBuildingEmission,
    totalNetBalance
  };
};

export const getTop5ByNetBalance = (dongGeoJSON) => {
  if (!dongGeoJSON || !dongGeoJSON.features) {
    return [];
  }

  const sorted = [...dongGeoJSON.features]
    .filter(f => f.properties.admdong_nm)
    .sort((a, b) => b.properties.netCarbonBalance - a.properties.netCarbonBalance);

  return sorted.slice(0, 5).map(f => ({
    admdong_nm: f.properties.admdong_nm,
    signgu_nm: f.properties.signgu_nm,
    netCarbonBalance: f.properties.netCarbonBalance
  }));
};

export const getColorByValue = (value, min, max, colorScale) => {
  if (value <= min + (max - min) * 0.33) {
    return colorScale.low;
  } else if (value <= min + (max - min) * 0.66) {
    return colorScale.mid;
  }
  return colorScale.high;
};

export const getNetBalanceColor = (value) => {
  if (value > 0) {
    if (value > 1000) return '#1a9850';
    if (value > 100) return '#66bd63';
    return '#a6d96a';
  } else if (value < 0) {
    if (value < -1000) return '#d73027';
    if (value < -100) return '#f46d43';
    return '#fdae61';
  }
  return '#ffffbf';
};
