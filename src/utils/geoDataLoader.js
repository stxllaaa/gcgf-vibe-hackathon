import Papa from 'papaparse';
import wellknown from 'wellknown';

/**
 * Load and parse Gyeonggi-do boundary data from CSV
 * @returns {Promise<Object>} GeoJSON FeatureCollection
 */
export const loadGyeonggiDongBoundaries = async () => {
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
            console.log('🔍 Sample row:', results.data[0]);

            // Convert CSV rows to GeoJSON features
            let parseErrors = 0;
            const features = results.data
              .filter(row => {
                const hasData = row.shape && row.admdong_nm;
                if (!hasData) {
                  console.warn('Skipping row with missing data:', row);
                }
                return hasData;
              })
              .map(row => {
                try {
                  // Parse WKT to GeoJSON using wellknown
                  const geometry = wellknown.parse(row.shape);

                  if (!geometry) {
                    console.warn(`Failed to parse geometry for ${row.admdong_nm}`);
                    parseErrors++;
                    return null;
                  }

                  return {
                    type: 'Feature',
                    properties: {
                      admdong_cd: row.admdong_cd,
                      admdong_nm: row.admdong_nm,
                      signgu_cd: row.signgu_cd,
                      signgu_nm: row.signgu_nm,
                      sgg_nm: row.signgu_nm, // Alias for compatibility
                      SGG_NM: row.signgu_nm  // Alias for compatibility
                    },
                    geometry: geometry
                  };
                } catch (error) {
                  console.error(`Error parsing feature for ${row.admdong_nm}:`, error);
                  parseErrors++;
                  return null;
                }
              })
              .filter(feature => feature !== null);

            const geoJSON = {
              type: 'FeatureCollection',
              features: features
            };

            console.log(`✅ Successfully loaded ${features.length} boundary features`);
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
 * Simplify polygon coordinates for better performance
 * @param {Object} geometry - GeoJSON geometry
 * @param {number} tolerance - Simplification tolerance
 * @returns {Object} Simplified geometry
 */
export const simplifyGeometry = (geometry, tolerance = 0.0001) => {
  // Basic Douglas-Peucker simplification could be implemented here
  // For now, return as-is; consider using turf.js for more advanced simplification
  return geometry;
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
      // Single coordinate pair [lng, lat]
      const [lng, lat] = coords;
      minLng = Math.min(minLng, lng);
      maxLng = Math.max(maxLng, lng);
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
    } else {
      // Array of coordinates
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
 * Match WFS features to boundary regions
 * @param {Object} wfsData - WFS GeoJSON data
 * @param {Object} boundaries - Boundary GeoJSON data
 * @returns {Object} Matched features with boundary info
 */
export const matchFeaturesToBoundaries = (wfsData, boundaries) => {
  if (!wfsData || !boundaries) return wfsData;

  // Create a map of region codes/names for quick lookup
  const boundaryMap = new Map();
  boundaries.features.forEach(feature => {
    const props = feature.properties;
    if (props.signgu_nm) {
      boundaryMap.set(props.signgu_nm, feature);
    }
    if (props.admdong_nm) {
      boundaryMap.set(props.admdong_nm, feature);
    }
  });

  // Enhance WFS features with boundary information
  const enhancedFeatures = wfsData.features.map(feature => {
    const regionName = feature.properties.sgg_nm || feature.properties.SGG_NM;
    const boundary = boundaryMap.get(regionName);

    return {
      ...feature,
      boundary: boundary || null
    };
  });

  return {
    ...wfsData,
    features: enhancedFeatures
  };
};
