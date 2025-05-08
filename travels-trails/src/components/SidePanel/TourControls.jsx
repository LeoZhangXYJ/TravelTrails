import React from 'react';
import { useTravelContext } from '../../context/TravelContext';

const TourControls = () => {
  const { cities, isTouring, toggleTour } = useTravelContext();

  return (
    <div className="tour-controls-container">
      <h3>轨迹浏览</h3>
      <div className="tour-controls">
        <button
          className={`tour-btn ${isTouring ? 'stop' : 'start'}`}
          onClick={toggleTour}
          disabled={cities.length < 2}
        >
          {isTouring ? '停止浏览' : '轨迹浏览'}
        </button>
      </div>
      {cities.length < 2 && (
        <p className="tour-hint">需要至少添加两个城市才能开始轨迹浏览</p>
      )}
    </div>
  );
};

export default TourControls;