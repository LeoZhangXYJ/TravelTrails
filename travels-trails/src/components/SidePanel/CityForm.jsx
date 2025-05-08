import React from 'react';
import { useTravelContext } from '../../context/TravelContext';

const CityForm = () => {
  const { 
    cities, 
    currentCityIndex, 
    setCurrentCityIndex, 
    removeCityFromContext 
  } = useTravelContext();

  // 如果没有城市，显示提示信息
  if (cities.length === 0) {
    return (
      <div className="city-management">
        <h3>已添加的城市</h3>
        <p>尚未添加任何城市。请使用上方的表单添加城市。</p>
      </div>
    );
  }

  return (
    <div className="city-management">
      <h3>已添加的城市</h3>
      <div className="city-list">
        {cities.map((city, index) => (
          <div 
            key={city.id || index} 
            className={`city-item ${index === currentCityIndex ? 'active' : ''}`}
          >
            <div className="city-info">
              <span className="city-name">{city.name}</span>
              <span className="city-transport">({city.transportMode})</span>
              {city.country && <span className="city-country"> - {city.country}</span>}
            </div>
            <div className="city-actions">
              <button 
                className="select-btn"
                onClick={() => setCurrentCityIndex(index)}
              >
                查看
              </button>
              <button 
                className="delete-btn"
                onClick={() => {
                  removeCityFromContext(index);
                }}
              >
                删除
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CityForm;