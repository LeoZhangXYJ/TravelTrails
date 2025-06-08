import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/auth';
import CesiumMap from '../components/Map/CesiumMap';
import CityList from '../components/SidePanel/CityList';
import CityForm from '../components/SidePanel/CityForm';
import TourControls from '../components/SidePanel/TourControls';
import LayerSwitcher from '../components/SidePanel/LayerSwitcher';
import PhotoGallery from '../components/SidePanel/PhotoGallery';
import PhotoOverlay from '../components/UI/PhotoOverlay';
import { useTravelContext } from '../context/TravelContext';
import { SIDEBAR_EXPANDED_WIDTH, SIDEBAR_COLLAPSED_WIDTH } from '../utils/constants';
import '../styles/Dashboard.css';

const Dashboard = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showPhotoOverlay, setShowPhotoOverlay] = useState(false);
  const [currentLayer, setCurrentLayer] = useState(null);
  const navigate = useNavigate();
  const { cities, currentCityIndex } = useTravelContext();

  const currentSidebarWidth = isSidebarCollapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_EXPANDED_WIDTH;
  const currentCity = currentCityIndex >= 0 ? cities[currentCityIndex] : null;

  const handleLogout = () => {
    authAPI.logout();
    navigate('/login');
  };
  // 处理底图切换
  const handleSwitchLayer = (layerId) => {
    setCurrentLayer(layerId);
  };

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
              <h3>底图设置</h3>
              <LayerSwitcher 
                onSwitchLayer={handleSwitchLayer} 
                currentLayer={currentLayer} 
              />
            </div>

            
            <div className="sidebar-section">
              <h3>城市管理</h3>
              <CityList />
              <CityForm />
            </div>
            
            <div className="sidebar-section">
              <h3></h3>
              <TourControls />
            </div>
            
            <div className="sidebar-section">
              <h3></h3>
              <PhotoGallery onShowPhotos={() => setShowPhotoOverlay(true)} />
            </div>
            
           
          </div>
        </aside>

        {/* 地图区域 */}
        <main className="dashboard-main">
          <CesiumMap currentLayer={currentLayer} />
        </main>
      </div>

      {/* 照片展示遮罩层 - 移到最外层 */}
      {showPhotoOverlay && currentCity && currentCity.photos && currentCity.photos.length > 0 && (
        <PhotoOverlay
          photos={currentCity.photos}
          cityName={currentCity.name}
          country={currentCity.country}
          onClose={() => setShowPhotoOverlay(false)}
          sidebarWidth={currentSidebarWidth}
        />
      )}
    </div>
  );
};

export default Dashboard; 