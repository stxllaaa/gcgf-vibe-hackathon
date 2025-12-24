import React from 'react';

const Sidebar = ({
  layers,
  onToggleLayer,
  totals,
  top5Dongs
}) => {
  const formatNumber = (num) => {
    if (num === null || num === undefined) return '0';
    return num.toLocaleString('ko-KR', { maximumFractionDigits: 2 });
  };

  const getBalanceClass = (value) => {
    if (value > 0) return 'positive';
    if (value < 0) return 'negative';
    return 'neutral';
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>경기도 탄소수지 대시보드</h2>
      </div>

      <div className="sidebar-section">
        <h3>레이어 토글</h3>
        <div className="layer-toggles">
          <label className="layer-toggle">
            <input
              type="checkbox"
              checked={layers.dongBoundary}
              onChange={() => onToggleLayer('dongBoundary')}
            />
            <span className="layer-name">읍면동 경계</span>
          </label>

          <label className="layer-toggle">
            <input
              type="checkbox"
              checked={layers.treeCarbon}
              onChange={() => onToggleLayer('treeCarbon')}
            />
            <span className="layer-name tree-carbon">수목 탄소저장</span>
          </label>

          <label className="layer-toggle">
            <input
              type="checkbox"
              checked={layers.carbonAbsorption}
              onChange={() => onToggleLayer('carbonAbsorption')}
            />
            <span className="layer-name carbon-absorption">탄소 흡수</span>
          </label>

          <label className="layer-toggle">
            <input
              type="checkbox"
              checked={layers.building}
              onChange={() => onToggleLayer('building')}
            />
            <span className="layer-name building">건축물 배출</span>
          </label>
        </div>
      </div>

      <div className="sidebar-section">
        <h3>전체 합계</h3>
        <div className="totals">
          <div className="total-row">
            <span className="total-label">총 수목 탄소저장</span>
            <span className="total-value tree-carbon">
              {formatNumber(totals.totalTreeCarbon)} tC
            </span>
          </div>

          <div className="total-row">
            <span className="total-label">총 탄소 흡수</span>
            <span className="total-value carbon-absorption">
              {formatNumber(totals.totalCarbonAbsorption)} tC/year
            </span>
          </div>

          <div className="total-row">
            <span className="total-label">총 건물 배출</span>
            <span className="total-value building">
              {formatNumber(totals.totalBuildingEmission)} tC
            </span>
          </div>

          <div className="total-divider"></div>

          <div className={`total-row net-balance ${getBalanceClass(totals.totalNetBalance)}`}>
            <span className="total-label">총 순 탄소수지</span>
            <span className="total-value">
              {totals.totalNetBalance > 0 ? '+' : ''}{formatNumber(totals.totalNetBalance)} tC
            </span>
          </div>
        </div>
      </div>

      <div className="sidebar-section">
        <h3>순 탄소수지 Top 5 읍면동</h3>
        <div className="top5-list">
          {top5Dongs.length === 0 ? (
            <p className="no-data">데이터 없음</p>
          ) : (
            top5Dongs.map((dong, idx) => (
              <div key={idx} className="top5-item">
                <span className="rank">{idx + 1}</span>
                <div className="dong-info">
                  <span className="dong-name">{dong.admdong_nm}</span>
                  <span className="dong-signgu">{dong.signgu_nm}</span>
                </div>
                <span className={`dong-balance ${getBalanceClass(dong.netCarbonBalance)}`}>
                  {dong.netCarbonBalance > 0 ? '+' : ''}{formatNumber(dong.netCarbonBalance)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="sidebar-footer">
        <small>데이터 출처: 경기도 기후환경정보시스템</small>
      </div>
    </div>
  );
};

export default Sidebar;
