import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Dashboard from './components/Dashboard';
import Statistics from './pages/Statistics';
import PhotoShowcase from './pages/PhotoShowcase';
import AIRecommendationsPage from './pages/AIRecommendations';
import Blog from './pages/Blog';
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
  const hideNavbarPaths = ['/login', '/register'];
  
  if (hideNavbarPaths.includes(location.pathname)) {
    return null;
  }
  
  return <Navbar />;
};

const App = () => {
  return (
    <Router>
      <ConditionalNavbar />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <TravelProvider>
                <Dashboard />
              </TravelProvider>
            </PrivateRoute>
          }
        />
        <Route
          path="/statistics"
          element={
            <PrivateRoute>
              <TravelProvider>
                <Statistics />
              </TravelProvider>
            </PrivateRoute>
          }
        />
        <Route
          path="/photos"
          element={
            <PrivateRoute>
              <TravelProvider>
                <PhotoShowcase />
              </TravelProvider>
            </PrivateRoute>
          }
        />
        <Route
          path="/ai-recommendations"
          element={
            <PrivateRoute>
              <TravelProvider>
                <AIRecommendationsPage />
              </TravelProvider>
            </PrivateRoute>
          }
        />
        <Route
          path="/blog"
          element={
            <PrivateRoute>
              <TravelProvider>
                <Blog />
              </TravelProvider>
            </PrivateRoute>
          }
        />
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
};

export default App;