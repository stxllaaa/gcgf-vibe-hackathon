import Papa from 'papaparse';
import wkt from 'wellknown';

export const loadCsvAsGeoJSON = async (csvPath) => {
  return new Promise((resolve, reject) => {
    Papa.parse(csvPath, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const features = results.data
            .filter(row => row.shape && row.shape.trim())
            .map((row, index) => {
              let geometry = null;

              try {
                geometry = wkt.parse(row.shape);
              } catch (e) {
                console.warn(`WKT 파싱 실패 (row ${index}):`, e);
                return null;
              }

              if (!geometry) {
                return null;
              }

              return {
                type: 'Feature',
                properties: {
                  admdong_cd: row.admdong_cd || '',
                  admdong_nm: row.admdong_nm || '',
                  signgu_cd: row.signgu_cd || '',
                  signgu_nm: row.signgu_nm || '',
                  treeCarbon: 0,
                  carbonAbsorption: 0,
                  buildingEmission: 0,
                  netCarbonBalance: 0
                },
                geometry: geometry
              };
            })
            .filter(f => f !== null);

          const geojson = {
            type: 'FeatureCollection',
            features: features
          };

          resolve(geojson);
        } catch (error) {
          reject(error);
        }
      },
      error: (error) => {
        reject(error);
      }
    });
  });
};

export const getPolygonCentroid = (geometry) => {
  if (!geometry || !geometry.coordinates) return null;

  let coords = [];

  if (geometry.type === 'Polygon') {
    coords = geometry.coordinates[0];
  } else if (geometry.type === 'MultiPolygon') {
    coords = geometry.coordinates[0][0];
  } else {
    return null;
  }

  if (!coords || coords.length === 0) return null;

  let sumX = 0, sumY = 0;
  coords.forEach(coord => {
    sumX += coord[0];
    sumY += coord[1];
  });

  return [sumY / coords.length, sumX / coords.length];
};
