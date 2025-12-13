/**
 * Calculate net carbon balance
 * @param {number} storage - Carbon storage amount
 * @param {number} absorption - Carbon absorption amount
 * @param {number} emission - Carbon emission amount
 * @returns {number} Net carbon balance
 */
export const calculateNetBalance = (storage = 0, absorption = 0, emission = 0) => {
  return (storage + absorption) - emission;
};

/**
 * Aggregate carbon data by region (sgg_nm)
 * @param {Array} features - GeoJSON features
 * @param {string} valueField - Field name to aggregate (e.g., 'cbn_strgat', 'cbn_abpvl')
 * @returns {Object} Aggregated data by region
 */
export const aggregateByRegion = (features, valueField) => {
  const regionData = {};

  features.forEach(feature => {
    const regionName = feature.properties.sgg_nm || feature.properties.SGG_NM || 'Unknown';
    const value = parseFloat(feature.properties[valueField]) || 0;

    if (!regionData[regionName]) {
      regionData[regionName] = {
        name: regionName,
        total: 0,
        count: 0
      };
    }

    regionData[regionName].total += value;
    regionData[regionName].count += 1;
  });

  return regionData;
};

/**
 * Get top N regions by value
 * @param {Object} regionData - Aggregated region data
 * @param {number} n - Number of top regions to return
 * @returns {Array} Top N regions sorted by total value
 */
export const getTopRegions = (regionData, n = 5) => {
  return Object.values(regionData)
    .sort((a, b) => b.total - a.total)
    .slice(0, n);
};

/**
 * Calculate total for all features
 * @param {Array} features - GeoJSON features
 * @param {string} valueField - Field name to sum
 * @returns {number} Total value
 */
export const calculateTotal = (features, valueField) => {
  return features.reduce((sum, feature) => {
    const value = parseFloat(feature.properties[valueField]) || 0;
    return sum + value;
  }, 0);
};

/**
 * Format large numbers with commas
 * @param {number} num - Number to format
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted number
 */
export const formatNumber = (num, decimals = 2) => {
  if (num === null || num === undefined) return '0';
  return num.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

/**
 * Get color based on value range for choropleth mapping
 * @param {number} value - Value to map to color
 * @param {number} min - Minimum value in dataset
 * @param {number} max - Maximum value in dataset
 * @returns {string} Hex color code
 */
export const getColorByValue = (value, min, max) => {
  const normalized = (value - min) / (max - min);

  // Green scale for positive values
  if (value >= 0) {
    const intensity = Math.floor(255 * (1 - normalized * 0.7));
    return `rgb(${intensity}, 255, ${intensity})`;
  }

  // Red scale for negative values (emissions)
  const intensity = Math.floor(255 * (1 - Math.abs(normalized) * 0.7));
  return `rgb(255, ${intensity}, ${intensity})`;
};
