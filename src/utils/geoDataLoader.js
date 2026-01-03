import Papa from 'papaparse';
import wellknown from 'wellknown';
import union from '@turf/union';

/**
 * Load and parse Gyeonggi-do boundary data from CSV
 * Merges 읍면동 boundaries into 시군구 level
 * @returns {Promise<Object>} GeoJSON FeatureCollection with 시군구 boundaries
 */
export const loadGyeonggiSignguBoundaries = async () => {
  try {
    console.log('🗺️  Starting to load boundary data from CSV...');
    console.log('📄 CSV path: /data/gyonggi_dong_geo_df.csv');

    const response = await fetch('/data/gyonggi_dong_geo_df.csv');

    if (!response.ok) {
      throw new Error(`Failed to fetch CSV: ${response.status} ${response.statusText}`);
    }

    const csvText = await response.text();
    console.log(`✅ CSV file loaded, size: ${csvText.length} bytes`);

    return new Promise((resolve, reject) => {
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          try {
            console.log(`📊 CSV parsed: ${results.data.length} rows`);

            // Group 읍면동 by 시군구
            const signguGroups = {};
            let parseErrors = 0;

            results.data.forEach(row => {
              if (!row.shape || !row.signgu_nm) {
                return;
              }

              try {
                const geometry = wellknown.parse(row.shape);
                if (!geometry) {
                  parseErrors++;
                  return;
                }

                const signguNm = row.signgu_nm;
                const signguCd = row.signgu_cd;

                if (!signguGroups[signguNm]) {
                  signguGroups[signguNm] = {
                    signgu_cd: signguCd,
                    signgu_nm: signguNm,
                    geometries: []
                  };
                }

                signguGroups[signguNm].geometries.push({
                  type: 'Feature',
                  properties: {},
                  geometry: geometry
                });
              } catch (error) {
                console.error(`Error parsing geometry for ${row.admdong_nm}:`, error);
                parseErrors++;
              }
            });

            console.log(`📍 Found ${Object.keys(signguGroups).length} 시군구 groups`);

            // Merge geometries for each 시군구
            const features = [];
            for (const [signguNm, group] of Object.entries(signguGroups)) {
              try {
                let mergedGeometry = group.geometries[0];

                // Union all geometries in this 시군구
                for (let i = 1; i < group.geometries.length; i++) {
                  try {
                    mergedGeometry = union(mergedGeometry, group.geometries[i]);
                  } catch (unionError) {
                    console.warn(`Union error for ${signguNm}, polygon ${i}:`, unionError.message);
                  }
                }

                if (mergedGeometry) {
                  features.push({
                    type: 'Feature',
                    properties: {
                      signgu_cd: group.signgu_cd,
                      signgu_nm: group.signgu_nm,
                      sgg_nm: group.signgu_nm,
                      SGG_NM: group.signgu_nm
                    },
                    geometry: mergedGeometry.geometry || mergedGeometry
                  });
                }
              } catch (error) {
                console.error(`Error merging geometries for ${signguNm}:`, error);
              }
            }

            const geoJSON = {
              type: 'FeatureCollection',
              features: features
            };

            console.log(`✅ Successfully created ${features.length} 시군구 boundary features`);
            if (parseErrors > 0) {
              console.warn(`⚠️  ${parseErrors} features failed to parse`);
            }
            console.log('📍 Sample feature:', features[0]);

            resolve(geoJSON);
          } catch (error) {
            console.error('❌ Error processing CSV data:', error);
            reject(error);
          }
        },
        error: (error) => {
          console.error('❌ Papa Parse error:', error);
          reject(error);
        }
      });
    });
  } catch (error) {
    console.error('❌ Error loading boundary data:', error);
    throw error;
  }
};

/**
 * Get bounds from GeoJSON FeatureCollection
 * @param {Object} geoJSON - GeoJSON FeatureCollection
 * @returns {Array} Bounds array [[south, west], [north, east]]
 */
export const getBounds = (geoJSON) => {
  if (!geoJSON || !geoJSON.features || geoJSON.features.length === 0) {
    return null;
  }

  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLng = Infinity;
  let maxLng = -Infinity;

  const processCoordinates = (coords) => {
    if (typeof coords[0] === 'number') {
      const [lng, lat] = coords;
      minLng = Math.min(minLng, lng);
      maxLng = Math.max(maxLng, lng);
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
    } else {
      coords.forEach(processCoordinates);
    }
  };

  geoJSON.features.forEach(feature => {
    if (feature.geometry && feature.geometry.coordinates) {
      processCoordinates(feature.geometry.coordinates);
    }
  });

  return [
    [minLat, minLng],
    [maxLat, maxLng]
  ];
};

/**
 * Check if a point is inside a polygon (simplified point-in-polygon)
 * @param {Array} point - [lng, lat]
 * @param {Object} polygon - GeoJSON geometry
 * @returns {boolean}
 */
const pointInPolygon = (point, polygon) => {
  const [x, y] = point;
  let inside = false;

  const processRing = (ring) => {
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const xi = ring[i][0], yi = ring[i][1];
      const xj = ring[j][0], yj = ring[j][1];

      if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
        inside = !inside;
      }
    }
  };

  if (polygon.type === 'Polygon') {
    processRing(polygon.coordinates[0]);
  } else if (polygon.type === 'MultiPolygon') {
    polygon.coordinates.forEach(poly => processRing(poly[0]));
  }

  return inside;
};

/**
 * Get centroid of a geometry
 * @param {Object} geometry - GeoJSON geometry
 * @returns {Array} [lng, lat]
 */
const getCentroid = (geometry) => {
  let sumX = 0, sumY = 0, count = 0;

  const processCoords = (coords) => {
    if (typeof coords[0] === 'number') {
      sumX += coords[0];
      sumY += coords[1];
      count++;
    } else {
      coords.forEach(processCoords);
    }
  };

  processCoords(geometry.coordinates);
  return count > 0 ? [sumX / count, sumY / count] : [0, 0];
};

/**
 * Spatial join: Aggregate WFS data by 시군구 boundaries
 * @param {Object} wfsData - WFS GeoJSON data
 * @param {Object} boundaries - 시군구 boundary GeoJSON data
 * @param {string} valueField - Field to aggregate
 * @returns {Object} Aggregated data by 시군구
 */
export const spatialJoinToSigngu = (wfsData, boundaries, valueField) => {
  if (!wfsData?.features || !boundaries?.features) {
    return {};
  }

  const result = {};

  // Initialize result for each 시군구
  boundaries.features.forEach(boundary => {
    const signguNm = boundary.properties.signgu_nm;
    result[signguNm] = {
      signgu_nm: signguNm,
      signgu_cd: boundary.properties.signgu_cd,
      total: 0,
      count: 0,
      geometry: boundary.geometry
    };
  });

  // For each WFS feature, find which 시군구 it belongs to
  wfsData.features.forEach(feature => {
    if (!feature.geometry) return;

    const centroid = getCentroid(feature.geometry);
    const value = parseFloat(feature.properties[valueField]) || 0;

    // Find matching 시군구
    for (const boundary of boundaries.features) {
      if (pointInPolygon(centroid, boundary.geometry)) {
        const signguNm = boundary.properties.signgu_nm;
        if (result[signguNm]) {
          result[signguNm].total += value;
          result[signguNm].count++;
        }
        break;
      }
    }
  });

  return result;
};

/**
 * Create aggregated GeoJSON from spatial join result
 * @param {Object} aggregatedData - Result from spatialJoinToSigngu
 * @param {string} valueField - Field name for the aggregated value
 * @returns {Object} GeoJSON FeatureCollection
 */
export const createAggregatedGeoJSON = (aggregatedData, valueField) => {
  const features = Object.values(aggregatedData)
    .filter(item => item.geometry)
    .map(item => ({
      type: 'Feature',
      properties: {
        signgu_nm: item.signgu_nm,
        signgu_cd: item.signgu_cd,
        sgg_nm: item.signgu_nm,
        SGG_NM: item.signgu_nm,
        [valueField]: item.total,
        feature_count: item.count
      },
      geometry: item.geometry
    }));

  return {
    type: 'FeatureCollection',
    features
  };
};
