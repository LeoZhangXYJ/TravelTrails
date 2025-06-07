import React from 'react';
import { useTravelContext } from '../../context/TravelContext';
import { FaPlane, FaCar, FaWalking, FaBus, FaCalendarAlt } from 'react-icons/fa';

const CityForm = () => {
  const { 
    cities, 
    currentCityIndex, 
    setCurrentCityIndex, 
    deleteCity
  } = useTravelContext();

  // 辅助函数，根据交通方式返回对应的图标（简化为5种主要方式）
  const getTransportIcon = (mode) => {
    switch (mode) {
      case 'plane':
        return <FaPlane title="飞机" />;
      case 'car':
        return <FaCar title="汽车" />;
      case 'bus':
        return <FaBus title="巴士" />;
      
      case 'walk':
        return <FaWalking title="步行" />;
      default:
        return <FaCar title="汽车" />; // 默认显示汽车图标
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
        {cities
          .slice() // 创建副本避免修改原数组
          .sort((a, b) => {
            // 首先处理起点（没有日期的城市）
            if (!a.startDate && !b.startDate) return 0;
            if (!a.startDate) return -1; // 起点排在最前面
            if (!b.startDate) return 1;
            
            // 按开始日期排序
            const dateA = new Date(a.startDate);
            const dateB = new Date(b.startDate);
            return dateA - dateB;
          })
          .map((city, index) => {
            // 找到原数组中的索引
            const originalIndex = cities.findIndex(c => c.id === city.id);
            return (
              <div 
                key={city.id || index} 
                className={`city-item ${originalIndex === currentCityIndex ? 'active' : ''}`}
              >
                <div className="city-info" onClick={() => setCurrentCityIndex(originalIndex)} style={{ cursor: 'pointer' }}>
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
            );
          })}
      </div>
    </div>
  );
};

export default CityForm;