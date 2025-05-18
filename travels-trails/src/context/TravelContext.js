import React, { createContext, useContext, useState } from 'react';

const TravelContext = createContext();

export const useTravelContext = () => {
  const context = useContext(TravelContext);
  if (!context) {
    throw new Error('useTravelContext must be used within a TravelProvider');
  }
  return context;
};

export const TravelProvider = ({ children }) => {
  const [cities, setCities] = useState([]);
  const [stats, setStats] = useState({
    totalCities: 0,
    totalPhotos: 0,
    totalBlogs: 0
  });

  const addCityToContext = (city) => {
    setCities(prevCities => [...prevCities, city]);
    setStats(prevStats => ({
      ...prevStats,
      totalCities: prevStats.totalCities + 1
    }));
  };

  const removeCityFromContext = (cityId) => {
    setCities(prevCities => prevCities.filter(city => city.id !== cityId));
    setStats(prevStats => ({
      ...prevStats,
      totalCities: prevStats.totalCities - 1
    }));
  };

  const updateStats = (newStats) => {
    setStats(prevStats => ({
      ...prevStats,
      ...newStats
    }));
  };

  const value = {
    cities,
    stats,
    addCityToContext,
    removeCityFromContext,
    updateStats
  };

  return (
    <TravelContext.Provider value={value}>
      {children}
    </TravelContext.Provider>
  );
};