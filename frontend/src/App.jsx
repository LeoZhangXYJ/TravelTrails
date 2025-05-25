import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Dashboard from './pages/Dashboard';
import Statistics from './pages/Statistics';
import PhotoShowcase from './pages/PhotoShowcase';
import AIRecommendationsPage from './pages/AIRecommendations';
import Navbar from './components/Navbar/Navbar';
import { authAPI } from './services/auth';
import { TravelProvider } from './context/TravelContext';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

const PrivateRoute = ({ children }) => {
  return authAPI.isAuthenticated() ? children : <Navigate to="/login" />;
};

// 条件渲染导航栏的组件
const ConditionalNavbar = () => {
  const location = useLocation();
  const hideNavbarPaths = []; // 不再隐藏任何页面的导航栏
  const authOnlyPaths = ['/login', '/register']; // 登录和注册页面只显示logo
  
  if (hideNavbarPaths.includes(location.pathname)) {
    return null;
  }
  
  // 在登录和注册页面只显示logo部分
  const showOnlyLogo = authOnlyPaths.includes(location.pathname);
  
  return <Navbar showOnlyLogo={showOnlyLogo} />;
};

const App = () => {
  return (
    <TravelProvider>
      <Router>
        <ConditionalNavbar />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/statistics"
            element={
              <PrivateRoute>
                <Statistics />
              </PrivateRoute>
            }
          />
          <Route
            path="/photos"
            element={
              <PrivateRoute>
                <PhotoShowcase />
              </PrivateRoute>
            }
          />
          <Route
            path="/ai-recommendations"
            element={
              <PrivateRoute>
                <AIRecommendationsPage />
              </PrivateRoute>
            }
          />
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    </TravelProvider>
  );
};

export default App;