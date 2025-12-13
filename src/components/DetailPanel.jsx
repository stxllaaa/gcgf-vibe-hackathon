export default function DetailPanel({ selectedFeature, onClose }) {
  if (!selectedFeature) {
    return null;
  }

  const { layerId, properties, geometry } = selectedFeature;

  // 레이어 이름 매핑
  const layerNames = {
    climate_monitoring: '기후변화 모니터링 지점',
    heat_wave: '폭염 위험지역',
    flood_risk: '홍수 위험지역',
    green_space: '녹지 공간',
    emd_boundary: '읍면동 경계'
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.title}>{layerNames[layerId] || layerId}</h3>
        <button onClick={onClose} style={styles.closeButton}>
          ✕
        </button>
      </div>

      <div style={styles.content}>
        <h4 style={styles.sectionTitle}>속성 정보</h4>
        <table style={styles.table}>
          <tbody>
            {Object.entries(properties).map(([key, value]) => (
              <tr key={key} style={styles.tableRow}>
                <td style={styles.tableKey}>{key}</td>
                <td style={styles.tableValue}>
                  {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <h4 style={styles.sectionTitle}>지오메트리 타입</h4>
        <p style={styles.text}>{geometry.type}</p>

        {geometry.coordinates && (
          <>
            <h4 style={styles.sectionTitle}>좌표</h4>
            <pre style={styles.code}>
              {JSON.stringify(geometry.coordinates, null, 2).substring(0, 500)}
              {JSON.stringify(geometry.coordinates).length > 500 && '\n...'}
            </pre>
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    position: 'absolute',
    top: '20px',
    right: '20px',
    width: '350px',
    maxHeight: '80vh',
    backgroundColor: '#ffffff',
    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
    borderRadius: '8px',
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '15px 20px',
    borderBottom: '1px solid #e0e0e0',
    backgroundColor: '#f8f9fa',
    borderTopLeftRadius: '8px',
    borderTopRightRadius: '8px'
  },
  title: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#333',
    margin: 0
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '20px',
    cursor: 'pointer',
    color: '#666',
    padding: '0',
    width: '24px',
    height: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '4px',
    transition: 'background-color 0.2s'
  },
  content: {
    padding: '20px',
    overflowY: 'auto',
    flex: 1
  },
  sectionTitle: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#555',
    marginTop: '15px',
    marginBottom: '10px'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '13px'
  },
  tableRow: {
    borderBottom: '1px solid #f0f0f0'
  },
  tableKey: {
    padding: '8px 8px 8px 0',
    fontWeight: '600',
    color: '#666',
    verticalAlign: 'top',
    width: '40%'
  },
  tableValue: {
    padding: '8px 0',
    color: '#333',
    wordBreak: 'break-word'
  },
  text: {
    fontSize: '13px',
    color: '#333',
    margin: '5px 0'
  },
  code: {
    fontSize: '11px',
    backgroundColor: '#f5f5f5',
    padding: '10px',
    borderRadius: '4px',
    overflow: 'auto',
    maxHeight: '200px',
    color: '#333',
    fontFamily: 'monospace'
  }
};
