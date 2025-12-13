import { formatNumber } from '../utils/calculations';

/**
 * DetailPanel component for displaying feature details
 */
function DetailPanel({ feature, layerType, onClose }) {
  if (!feature) return null;

  const getLayerInfo = (type) => {
    const layerInfo = {
      soil: { name: '토양 탄소 저장', field: 'cbn_strgat', unit: 'tC' },
      plant: { name: '수목 탄소 저장', field: 'cbn_strgat', unit: 'tC' },
      absorption: { name: '탄소 흡수량', field: 'cbn_abpvl', unit: 'tC/year' },
      emission: { name: '건물 배출량', field: 'ghg_emsvl', unit: 'tCO2eq/year' }
    };
    return layerInfo[type] || {};
  };

  const layerInfo = getLayerInfo(layerType);
  const properties = feature.properties;

  // Extract common fields
  const regionName = properties.sgg_nm || properties.SGG_NM || 'Unknown';
  const mainValue = properties[layerInfo.field];

  // Get all property keys except geometry-related ones
  const detailKeys = Object.keys(properties).filter(
    key => !key.toLowerCase().includes('geom') &&
           !key.toLowerCase().includes('shape') &&
           properties[key] !== null &&
           properties[key] !== undefined
  );

  return (
    <div className="detail-panel">
      <div className="detail-header">
        <h3>{layerInfo.name} 상세정보</h3>
        <button className="close-button" onClick={onClose}>
          ×
        </button>
      </div>

      <div className="detail-content">
        <div className="detail-section">
          <div className="detail-main">
            <div className="detail-region">{regionName}</div>
            {mainValue && (
              <div className="detail-value">
                {formatNumber(mainValue, 2)}
                <span className="detail-unit"> {layerInfo.unit}</span>
              </div>
            )}
          </div>
        </div>

        <div className="detail-section">
          <h4>상세 속성</h4>
          <div className="detail-properties">
            {detailKeys.map(key => (
              <div key={key} className="property-row">
                <span className="property-key">{key}</span>
                <span className="property-value">
                  {typeof properties[key] === 'number'
                    ? formatNumber(properties[key], 2)
                    : properties[key]
                  }
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DetailPanel;
