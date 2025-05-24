import React from 'react';
import { useTravelContext } from '../../context/TravelContext';
import { FaPlane, FaTrain, FaCar, FaShip, FaWalking, FaBus, FaBicycle, FaCalendarAlt } from 'react-icons/fa';
import { MdOutlineQuestionMark } from "react-icons/md";

const CityForm = () => {
  const { 
    cities, 
    currentCityIndex, 
    setCurrentCityIndex, 
    deleteCity
  } = useTravelContext();

  // 辅助函数，根据交通方式返回对应的图标
  const getTransportIcon = (mode) => {
    switch (mode) {
      case 'plane':
        return <FaPlane title="飞机" />;
      case 'train':
        return <FaTrain title="火车" />;
      case 'car':
        return <FaCar title="汽车" />;
      case 'bus':
        return <FaBus title="巴士" />;
      case 'boat':
        return <FaShip title="轮船/渡轮" />;
      case 'bicycle':
        return <FaBicycle title="自行车" />;
      case 'walk':
        return <FaWalking title="步行" />;
      case 'other':
        return <MdOutlineQuestionMark title="其他" />;
      default:
        return null;
    }
  };

  // 格式化日期显示
  const formatDateRange = (startDate, endDate) => {
    if (!startDate && !endDate) return null;
    
    const formatDate = (dateString) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toLocaleDateString('zh-CN', {
        month: 'short',
        day: 'numeric'
      });
    };
    
    if (startDate && endDate) {
      const start = formatDate(startDate);
      const end = formatDate(endDate);
      return `${start} - ${end}`;
    } else if (startDate) {
      return `从 ${formatDate(startDate)}`;
    } else if (endDate) {
      return `至 ${formatDate(endDate)}`;
    }
    return null;
  };

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
            <div className="city-info" onClick={() => setCurrentCityIndex(index)} style={{ cursor: 'pointer' }}>
              <div className="city-main-info">
                <span className="city-name">{city.name}</span>
                <span className="city-transport-icon" style={{ marginLeft: '8px', marginRight: '4px' }}>
                  {getTransportIcon(city.transportMode)}
                </span>
                {city.country && <span className="city-country"> - {city.country}</span>}
              </div>
              {formatDateRange(city.startDate, city.endDate) && (
                <div className="city-date-info" style={{ 
                  fontSize: '0.8rem', 
                  color: '#666', 
                  marginTop: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <FaCalendarAlt style={{ fontSize: '0.7rem' }} />
                  {formatDateRange(city.startDate, city.endDate)}
                </div>
              )}
            </div>
            <div className="city-actions">
              <button 
                className="delete-btn"
                onClick={(e) => { 
                  e.stopPropagation();
                  deleteCity(city.id);
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