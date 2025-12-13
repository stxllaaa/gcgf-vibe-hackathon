import React from 'react';

const DetailPanel = ({ data, onClose }) => {
  if (!data) return null;

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
    <div className="detail-panel">
      <div className="detail-header">
        <h3>{data.admdong_nm}</h3>
        <button className="close-btn" onClick={onClose}>&times;</button>
      </div>

      <div className="detail-content">
        <div className="detail-row">
          <span className="label">시군구명</span>
          <span className="value">{data.signgu_nm || '-'}</span>
        </div>

        <div className="detail-divider"></div>

        <div className="detail-row carbon-storage">
          <span className="label">수목 탄소저장량</span>
          <span className="value">{formatNumber(data.treeCarbon)} tC</span>
        </div>

        <div className="detail-row carbon-absorption">
          <span className="label">탄소 흡수량</span>
          <span className="value">{formatNumber(data.carbonAbsorption)} tC/year</span>
        </div>

        <div className="detail-row carbon-emission">
          <span className="label">건물 탄소배출량</span>
          <span className="value">{formatNumber(data.buildingEmission)} tC</span>
        </div>

        <div className="detail-divider"></div>

        <div className={`detail-row net-balance ${getBalanceClass(data.netCarbonBalance)}`}>
          <span className="label">순 탄소수지</span>
          <span className="value">
            {data.netCarbonBalance > 0 ? '+' : ''}{formatNumber(data.netCarbonBalance)} tC
          </span>
        </div>

        <div className="balance-explanation">
          <small>
            순 탄소수지 = (수목 탄소저장 + 탄소 흡수) - 건물 배출
          </small>
        </div>
      </div>
    </div>
  );
};

export default DetailPanel;
