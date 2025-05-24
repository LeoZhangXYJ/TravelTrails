import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Dashboard from './components/Dashboard';
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

const App = () => {
  return (
    <Router>
      <Navbar />
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
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
};

export default App;