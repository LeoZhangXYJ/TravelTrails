import React, { createContext, useState, useContext, useCallback, useMemo, useEffect } from 'react';

const TravelContext = createContext();

export function useTravelContext() {
  return useContext(TravelContext);
}

export function TravelProvider({ children }) {
  const [cities, setCities] = useState([]);
  const [currentCityIndex, setCurrentCityIndex] = useState(-1);
  
  // 添加轨迹浏览相关状态
  const [isTouring, setIsTouring] = useState(false);
  const [tourIndex, setTourIndex] = useState(0);
  
  const addCityToContext = useCallback((newCity) => {
    setCities(prevCities => [...prevCities, newCity]);
  }, []);

  const removeCityFromContext = useCallback((indexToRemove) => {
    setCities(prevCities => prevCities.filter((_, index) => index !== indexToRemove));
    if (currentCityIndex === indexToRemove) {
      setCurrentCityIndex(-1);
    } else if (currentCityIndex > indexToRemove) {
      setCurrentCityIndex(prev => prev -1);
    }
  }, [currentCityIndex]);
  
  // 添加照片到指定城市
  const addPhotoToCity = useCallback((photo) => {
    if (currentCityIndex < 0 || currentCityIndex >= cities.length) {
      alert('请先选择一个城市');
      return;
    }
    
    setCities(prevCities => {
      const newCities = [...prevCities];
      if (!newCities[currentCityIndex].photos) {
        newCities[currentCityIndex].photos = [];
      }
      newCities[currentCityIndex].photos.push(photo);
      return newCities;
    });
  }, [cities, currentCityIndex]);
  
  // 删除城市的照片
  const removePhotoFromCity = useCallback((cityIndex, photoIndex) => {
    setCities(prevCities => {
      const newCities = [...prevCities];
      newCities[cityIndex].photos.splice(photoIndex, 1);
      return newCities;
    });
  }, []);

  // 更新博客内容
  const updateCityBlog = useCallback((content) => {
    if (currentCityIndex < 0) return;
    
    setCities(prevCities => {
      const newCities = [...prevCities];
      newCities[currentCityIndex].blog = content;
      return newCities;
    });
  }, [currentCityIndex]);

  // 轨迹浏览控制
  const startTour = useCallback(() => {
    if (cities.length < 2) {
      alert('至少需要两个城市才能开始轨迹浏览');
      return;
    }
    setTourIndex(0);
    setIsTouring(true);
  }, [cities.length]);

  const stopTour = useCallback(() => {
    setIsTouring(false);
  }, []);

  const toggleTour = useCallback(() => {
    if (!isTouring) {
      startTour();
    } else {
      stopTour();
    }
  }, [isTouring, startTour, stopTour]);

  // 计算统计数据
  const stats = useMemo(() => {
    // 获取唯一国家数量
    const uniqueCountries = new Set(cities.map(city => city.country));
    
    // 计算总距离
    let totalDistance = 0;
    if (cities.length > 1) {
      for (let i = 1; i < cities.length; i++) {
        const prevCity = cities[i - 1];
        const currentCity = cities[i];
        const distance = calculateDistance(
          prevCity.coordinates.lat,
          prevCity.coordinates.lon,
          currentCity.coordinates.lat,
          currentCity.coordinates.lon
        );
        totalDistance += distance;
      }
    }
    
    return {
      citiesCount: cities.length,
      countriesCount: uniqueCountries.size,
      totalDistance: Math.round(totalDistance)
    };
  }, [cities]);

  const value = {
    cities,
    setCities,
    addCityToContext,
    removeCityFromContext,
    addPhotoToCity,
    removePhotoFromCity,
    updateCityBlog,
    currentCityIndex,
    setCurrentCityIndex,
    isTouring,
    setIsTouring,
    tourIndex,
    setTourIndex,
    startTour,
    stopTour,
    toggleTour,
    stats
  };

  return (
    <TravelContext.Provider value={value}>
      {children}
    </TravelContext.Provider>
  );
}

// 计算两点之间的距离（km）
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // 地球半径（公里）
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function toRad(degrees) {
  return degrees * (Math.PI / 180);
}

export default TravelProvider;