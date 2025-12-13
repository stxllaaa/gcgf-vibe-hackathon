import { WFS_LAYERS } from '../utils/api';

const LAYER_INFO = [
  ...WFS_LAYERS,
  {
    id: 'emd_boundary',
    name: '읍면동 경계',
    typeName: 'emd:boundary',
    color: '#666666'
  }
];

export default function Sidebar({ visibleLayers, onToggleLayer, loading }) {
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>경기도 기후변화 지도</h2>
        <p style={styles.subtitle}>레이어 선택</p>
      </div>

      <div style={styles.layerList}>
        {LAYER_INFO.map(layer => (
          <div key={layer.id} style={styles.layerItem}>
            <label style={styles.label}>
              <input
                type="checkbox"
                checked={visibleLayers[layer.id] || false}
                onChange={() => onToggleLayer(layer.id)}
                disabled={loading}
                style={styles.checkbox}
              />
              <span
                style={{
                  ...styles.colorBox,
                  backgroundColor: layer.color
                }}
              />
              <span style={styles.layerName}>{layer.name}</span>
            </label>
          </div>
        ))}
      </div>

      {loading && (
        <div style={styles.loadingIndicator}>
          데이터 로딩 중...
        </div>
      )}

      <div style={styles.footer}>
        <p style={styles.footerText}>
          데이터 출처: 경기도 기후변화 대응 시스템
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    width: '300px',
    height: '100%',
    backgroundColor: '#ffffff',
    boxShadow: '2px 0 10px rgba(0,0,0,0.1)',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 1000
  },
  header: {
    padding: '20px',
    borderBottom: '1px solid #e0e0e0'
  },
  title: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '8px'
  },
  subtitle: {
    fontSize: '14px',
    color: '#666'
  },
  layerList: {
    flex: 1,
    padding: '10px',
    overflowY: 'auto'
  },
  layerItem: {
    marginBottom: '8px',
    padding: '10px',
    borderRadius: '6px',
    transition: 'background-color 0.2s',
    cursor: 'pointer',
    backgroundColor: '#f9f9f9'
  },
  label: {
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
    fontSize: '14px'
  },
  checkbox: {
    marginRight: '10px',
    cursor: 'pointer',
    width: '16px',
    height: '16px'
  },
  colorBox: {
    width: '16px',
    height: '16px',
    borderRadius: '3px',
    marginRight: '10px',
    border: '1px solid #ccc'
  },
  layerName: {
    color: '#333',
    flex: 1
  },
  loadingIndicator: {
    padding: '15px',
    textAlign: 'center',
    color: '#666',
    fontSize: '14px',
    borderTop: '1px solid #e0e0e0'
  },
  footer: {
    padding: '15px',
    borderTop: '1px solid #e0e0e0',
    backgroundColor: '#f5f5f5'
  },
  footerText: {
    fontSize: '12px',
    color: '#999',
    textAlign: 'center',
    margin: 0
  }
};
