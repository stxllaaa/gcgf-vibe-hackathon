import { formatNumber } from '../utils/calculations';
import { LAYER_CONFIG } from '../utils/api';

/**
 * DetailPanel component for displaying feature details
 */
function DetailPanel({ feature, layerType, onClose }) {
  if (!feature) return null;

  const getLayerInfo = (type) => {
    const config = LAYER_CONFIG[type];
    if (!config) return {};

    return {
      name: config.name,
      field: config.valueField,
      unit: config.unit
    };
  };

  const layerInfo = getLayerInfo(layerType);
  const properties = feature.properties;

  // Extract common fields
  const regionName = properties.signgu_nm || properties.sgg_nm || properties.SGG_NM || 'Unknown';
  const mainValue = properties[layerInfo.field];

  // Get all property keys except geometry-related ones
  const detailKeys = Object.keys(properties).filter(
    key => !key.toLowerCase().includes('geom') &&
           !key.toLowerCase().includes('shape') &&
           properties[key] !== null &&
           properties[key] !== undefined
  );

  // Field name translations
  const fieldTranslations = {
    signgu_nm: '시군구명',
    signgu_cd: '시군구코드',
    sgg_nm: '시군구명',
    SGG_NM: '시군구명',
    soil_cb_st: '토양 탄소 저장량',
    cbn_strgat: '탄소 저장량',
    biot_npp: '탄소 흡수량 (NPP)',
    GAS_REDUCT_AMNT: '온실가스 배출량',
    feature_count: '집계 개수'
  };

  const getFieldLabel = (key) => {
    return fieldTranslations[key] || key;
  };

  return (
    <div className="detail-panel">
      <div className="detail-header">
        <h3>{layerInfo.name} 상세정보</h3>
        <button className="close-button" onClick={onClose}>
          x
        </button>
      </div>

      <div className="detail-content">
        <div className="detail-section">
          <div className="detail-main">
            <div className="detail-region">{regionName}</div>
            {mainValue !== undefined && mainValue !== null && (
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
                <span className="property-key">{getFieldLabel(key)}</span>
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
