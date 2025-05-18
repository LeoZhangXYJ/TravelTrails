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
  const [currentCityIndex, setCurrentCityIndex] = useState(-1);
  const [isTouring, setIsTouring] = useState(false);
  const [tourIndex, setTourIndex] = useState(0);
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

  const removeCityFromContext = (cityIndexOrId) => {
    setCities(prevCities => {
      // 如果传入的是数字，则按索引删除
      if (typeof cityIndexOrId === 'number') {
        const newCities = [...prevCities];
        newCities.splice(cityIndexOrId, 1);
        return newCities;
      }
      // 如果传入的是城市ID，则按ID删除
      return prevCities.filter(city => city.id !== cityIndexOrId);
    });
    
    // 更新当前选中的城市索引
    setCurrentCityIndex(prevIndex => {
      if (prevIndex === -1) return -1;
      if (typeof cityIndexOrId === 'number') {
        if (prevIndex === cityIndexOrId) return -1;
        if (prevIndex > cityIndexOrId) return prevIndex - 1;
        return prevIndex;
      }
      return prevIndex;
    });

    setStats(prevStats => ({
      ...prevStats,
      totalCities: prevStats.totalCities - 1
    }));
  };

  const updateCityBlog = (cityId, content) => {
    setCities(prevCities => {
      return prevCities.map(city => {
        if (city.id === cityId) {
          const hasBlog = !!city.blog;
          return {
            ...city,
            blog: content
          };
        }
        return city;
      });
    });

    // 更新博客统计
    setStats(prevStats => ({
      ...prevStats,
      totalBlogs: prevStats.totalBlogs + (content ? 1 : -1)
    }));
  };

  const updateStats = (newStats) => {
    setStats(prevStats => ({
      ...prevStats,
      ...newStats
    }));
  };

  const toggleTour = () => {
    setIsTouring(prev => !prev);
    if (!isTouring) {
      setTourIndex(0);
    }
  };

  const stopTour = () => {
    setIsTouring(false);
    setTourIndex(0);
  };

  const addPhotoToCity = (photoUrl) => {
    if (currentCityIndex >= 0) {
      setCities(prevCities => {
        const newCities = [...prevCities];
        if (!newCities[currentCityIndex].photos) {
          newCities[currentCityIndex].photos = [];
        }
        newCities[currentCityIndex].photos.push(photoUrl);
        return newCities;
      });
      setStats(prevStats => ({
        ...prevStats,
        totalPhotos: prevStats.totalPhotos + 1
      }));
    }
  };

  const removePhotoFromCity = (cityIndex, photoIndex) => {
    setCities(prevCities => {
      const newCities = [...prevCities];
      newCities[cityIndex].photos.splice(photoIndex, 1);
      return newCities;
    });
    setStats(prevStats => ({
      ...prevStats,
      totalPhotos: prevStats.totalPhotos - 1
    }));
  };

  const value = {
    cities,
    currentCityIndex,
    setCurrentCityIndex,
    isTouring,
    tourIndex,
    setTourIndex,
    stats,
    addCityToContext,
    removeCityFromContext,
    updateCityBlog,
    updateStats,
    toggleTour,
    stopTour,
    addPhotoToCity,
    removePhotoFromCity
  };

  return (
    <TravelContext.Provider value={value}>
      {children}
    </TravelContext.Provider>
  );
};