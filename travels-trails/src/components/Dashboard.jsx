import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/auth';
import CesiumMap from './Map/CesiumMap';
import CityList from './SidePanel/CityList';
import CityForm from './SidePanel/CityForm';
import TourControls from './SidePanel/TourControls';
import Stats from './SidePanel/Stats';
import PhotoGallery from './SidePanel/PhotoGallery';
import BlogEditor from './SidePanel/BlogEditor';
import AIRecommendations from './SidePanel/AIRecommendations';
import './Dashboard.css';

const Dashboard = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    authAPI.logout();
    navigate('/login');
  };

  return (
    <div className="dashboard">
      {/* 顶部导航栏 */}
      <nav className="dashboard-nav">
        <div className="nav-brand">
          <i className="fas fa-globe-americas"></i>
          <span>Travel Trails</span>
        </div>
        <div className="nav-controls">
          <button 
            className="nav-toggle"
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          >
            <i className={`fas fa-${isSidebarCollapsed ? 'bars' : 'times'}`}></i>
          </button>
          <button className="nav-logout" onClick={handleLogout}>
            <i className="fas fa-sign-out-alt"></i>
            <span>退出</span>
          </button>
        </div>
      </nav>

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
              <h3>统计信息</h3>
              <Stats />
            </div>
            
            <div className="sidebar-section">
              <h3>照片墙</h3>
              <PhotoGallery />
            </div>
            
            <div className="sidebar-section">
              <h3>旅行博客</h3>
              <BlogEditor />
            </div>

            <div className="sidebar-section">
              <AIRecommendations />
            </div>
          </div>
        </aside>

        {/* 地图区域 */}
        <main className="dashboard-main">
          <CesiumMap />
        </main>
      </div>
    </div>
  );
};

export default Dashboard; 