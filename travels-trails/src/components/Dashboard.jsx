import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/auth';
import CesiumMap from './Map/CesiumMap';
import CityList from './SidePanel/CityList';
import CityForm from './SidePanel/CityForm';
import TourControls from './SidePanel/TourControls';
import PhotoGallery from './SidePanel/PhotoGallery';
import BlogEditor from './SidePanel/BlogEditor';
import PhotoOverlay from './PhotoOverlay';
import { useTravelContext } from '../context/TravelContext';
import './Dashboard.css';

const Dashboard = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showPhotoOverlay, setShowPhotoOverlay] = useState(false);
  const navigate = useNavigate();
  const { cities, currentCityIndex } = useTravelContext();

  const handleLogout = () => {
    authAPI.logout();
    navigate('/login');
  };

  const currentCity = currentCityIndex >= 0 ? cities[currentCityIndex] : null;

  // 当城市改变时，自动显示照片
  useEffect(() => {
    if (currentCity && currentCity.photos && currentCity.photos.length > 0) {
      setShowPhotoOverlay(true);
    }
  }, [currentCityIndex]);

  return (
    <div className="dashboard">
      {/* 主要内容区域 */}
      <div className="dashboard-content">
        {/* 侧边栏 */}
        <aside className={`dashboard-sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}>
          <div className="sidebar-content">
            <div className="sidebar-section">
              <h3>城市管理</h3>
              <CityList />
              <CityForm />
            </div>
            
            <div className="sidebar-section">
              <h3>旅行控制</h3>
              <TourControls />
            </div>
            
            <div className="sidebar-section">
              <h3>照片墙</h3>
              <PhotoGallery onShowPhotos={() => setShowPhotoOverlay(true)} />
            </div>
            
            <div className="sidebar-section">
              <h3>旅行博客</h3>
              <BlogEditor />
            </div>
          </div>
        </aside>

        {/* 地图区域 */}
        <main className="dashboard-main">
          <CesiumMap />
        </main>
      </div>

      {/* 照片展示遮罩层 - 移到最外层 */}
      {showPhotoOverlay && currentCity && currentCity.photos && currentCity.photos.length > 0 && (
        <PhotoOverlay
          photos={currentCity.photos}
          cityName={currentCity.name}
          country={currentCity.country}
          onClose={() => setShowPhotoOverlay(false)}
        />
      )}
    </div>
  );
};

export default Dashboard; 