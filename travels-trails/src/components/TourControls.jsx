import React from 'react';
import { useTravelContext } from '../context/TravelContext';

const TourControls = () => {
  const { 
    cities, 
    isTouring, 
    toggleTour 
  } = useTravelContext();
  
  if (cities.length < 2) {
    return (
      <div className="media-section">
        <h3>轨迹浏览</h3>
        <p>需要至少两个城市才能开始浏览</p>
      </div>
    );
  }
  
  return (
    <div className="media-section">
      <h3>轨迹浏览</h3>
      <div className="tour-controls">
        <button 
          onClick={toggleTour}
          className={isTouring ? 'stop-tour' : 'start-tour'}
        >
          {isTouring ? '停止浏览' : '开始浏览'}
        </button>
      </div>
    </div>
  );
};

export default TourControls; 