import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/auth';
import '../Dashboard.css';

const Navbar = () => {
  const navigate = useNavigate();
  const isAuthenticated = authAPI.isAuthenticated();

  const handleLogout = () => {
    authAPI.logout();
    navigate('/login');
  };

  return (
    <nav className="dashboard-nav">
      <div className="nav-brand">
        <i className="fas fa-globe-americas"></i>
        <span>Travel Trails</span>
      </div>
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
            <button className="nav-logout" onClick={handleLogout}>
              <i className="fas fa-sign-out-alt"></i>
              <span>退出</span>
            </button>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar; 