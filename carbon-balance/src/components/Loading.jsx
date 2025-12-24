import React from 'react';

const Loading = ({ message = '데이터를 불러오는 중...' }) => {
  return (
    <div className="loading-overlay">
      <div className="loading-spinner">
        <div className="spinner"></div>
        <p>{message}</p>
      </div>
    </div>
  );
};

export default Loading;
