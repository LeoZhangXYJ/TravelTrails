import React from 'react';
import { useTravelContext } from '../../context/TravelContext';

const Stats = () => {
  const { stats, cities } = useTravelContext();
  
  // 计算总距离
  const calculateTotalDistance = () => {
    if (cities.length < 2) return 0;
    
    let totalDistance = 0;
    for (let i = 1; i < cities.length; i++) {
      const prev = cities[i - 1];
      const curr = cities[i];
      const R = 6371; // 地球半径（公里）
      const dLat = toRad(curr.coordinates.lat - prev.coordinates.lat);
      const dLon = toRad(curr.coordinates.lon - prev.coordinates.lon);
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(toRad(prev.coordinates.lat)) * Math.cos(toRad(curr.coordinates.lat)) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      totalDistance += R * c;
    }
    return Math.round(totalDistance);
  };

  // 计算访问的国家数量
  const calculateCountriesCount = () => {
    const countries = new Set(cities.map(city => city.country));
    return countries.size;
  };

  const toRad = (degrees) => {
    return degrees * (Math.PI / 180);
  };
  
  return (
    <div className="media-section">
      <h3>旅行统计</h3>
      <div className="stats-container">
        <div className="stat-item">
          <div className="stat-value">{stats.totalCities}</div>
          <div className="stat-label">已访问城市</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">{calculateCountriesCount()}</div>
          <div className="stat-label">已访问国家</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">{calculateTotalDistance()} km</div>
          <div className="stat-label">总距离</div>
        </div>
      </div>
    </div>
  );
};

export default Stats; 