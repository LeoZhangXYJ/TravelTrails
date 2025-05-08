import React from 'react';
import { useTravelContext } from '../../context/TravelContext';

const Stats = () => {
  const { stats } = useTravelContext();
  
  return (
    <div className="media-section">
      <h3>旅行统计</h3>
      <div className="stats-container">
        <div className="stat-item">
          <div className="stat-value">{stats.citiesCount}</div>
          <div className="stat-label">已访问城市</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">{stats.countriesCount}</div>
          <div className="stat-label">已访问国家</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">{stats.totalDistance}</div>
          <div className="stat-label">总距离(km)</div>
        </div>
      </div>
    </div>
  );
};

export default Stats; 