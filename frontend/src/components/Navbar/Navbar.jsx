import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/auth';
import { useTravelContext } from '../../context/TravelContext';
import '../../styles/Dashboard.css';

const Navbar = ({ showOnlyLogo = false }) => {
  const navigate = useNavigate();
  const isAuthenticated = authAPI.isAuthenticated();
  const { clearStorageSpace } = useTravelContext();

  const handleLogout = () => {
    authAPI.logout();
    navigate('/login');
  };

  const handleClearStorage = () => {
    if (clearStorageSpace) {
      clearStorageSpace();
    }
  };

  return (
    <nav className="dashboard-nav">
      <div className="nav-brand">
        <i className="fas fa-globe-americas"></i>
        <span>Travel Trails</span>
      </div>
      {!showOnlyLogo && (
        <div className="nav-controls">
          {isAuthenticated && (
            <>
              <button 
                className="nav-btn"
                onClick={() => navigate('/statistics')}
              >
                <i className="fas fa-chart-bar"></i>
                <span>统计概览</span>
              </button>
              <button 
                className="nav-btn"
                onClick={() => navigate('/ai-recommendations')}
              >
                <i className="fas fa-robot"></i>
                <span>AI 推荐</span>
              </button>
              <button 
                className="nav-btn"
                onClick={handleClearStorage}
                title="清理存储空间"
              >
                <i className="fas fa-broom"></i>
                <span>清理</span>
              </button>
              <button className="nav-logout" onClick={handleLogout}>
                <i className="fas fa-sign-out-alt"></i>
                <span>退出</span>
              </button>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar; 