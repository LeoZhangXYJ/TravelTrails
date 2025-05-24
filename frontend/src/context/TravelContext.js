import React, { createContext, useContext, useState, useEffect } from 'react';

const TravelContext = createContext();

export const useTravelContext = () => useContext(TravelContext);

export const TravelProvider = ({ children }) => {
  const [cities, setCities] = useState(() => {
    const savedCities = localStorage.getItem('cities');
    return savedCities ? JSON.parse(savedCities) : [];
  });
  const [currentCityIndex, setCurrentCityIndex] = useState(-1);
  const [isTouring, setIsTouring] = useState(false);
  const [tourIndex, setTourIndex] = useState(0);
  const [blogContent, setBlogContent] = useState(() => {
    return localStorage.getItem('blogContent') || '';
  });

  useEffect(() => {
    localStorage.setItem('cities', JSON.stringify(cities));
  }, [cities]);

  useEffect(() => {
    localStorage.setItem('blogContent', blogContent);
  }, [blogContent]);

  const addCity = (cityData) => {
    const newCity = { 
      ...cityData, 
      id: Date.now().toString(),
      photos: cityData.photos || [],
      blog: ''
    };
    setCities(prevCities => [...prevCities, newCity]);
    setCurrentCityIndex(cities.length);
  };

  const updateCity = (cityId, updatedData) => {
    setCities(prevCities => 
      prevCities.map(city => 
        city.id === cityId ? { ...city, ...updatedData } : city
      )
    );
  };

  const deleteCity = (cityId) => {
    setCities(prevCities => {
      const cityIndexToDelete = prevCities.findIndex(city => city.id === cityId);
      const newCities = prevCities.filter(city => city.id !== cityId);
      
      if (currentCityIndex === cityIndexToDelete) {
        setCurrentCityIndex(newCities.length > 0 ? 0 : -1);
      } else if (currentCityIndex > cityIndexToDelete) {
        setCurrentCityIndex(currentCityIndex - 1);
      }
      return newCities;
    });
  };

  const addPhotoToCity = (cityId, photoUrl) => {
    setCities(prevCities =>
      prevCities.map(city => {
        if (city.id === cityId) {
          const updatedPhotos = Array.isArray(city.photos) ? [...city.photos, photoUrl] : [photoUrl];
          return { ...city, photos: updatedPhotos };
        }
        return city;
      })
    );
  };

  const startTour = () => {
    if (cities.length > 1) {
      setIsTouring(true);
      setTourIndex(0);
    }
  };

  const stopTour = () => {
    setIsTouring(false);
  };

  const toggleTour = () => {
    if (isTouring) {
      stopTour();
    } else {
      startTour();
    }
  };

  const selectCityById = (cityId) => {
    const cityIndex = cities.findIndex(city => city.id === cityId);
    if (cityIndex !== -1) {
      setCurrentCityIndex(cityIndex);
      if (isTouring) {
        stopTour();
      }
    }
  };

  // 获取所有已占用的日期范围
  const getOccupiedDateRanges = (excludeCityId = null) => {
    return cities
      .filter(city => city.id !== excludeCityId && city.startDate && city.endDate)
      .map(city => ({
        cityId: city.id,
        cityName: city.name,
        startDate: new Date(city.startDate),
        endDate: new Date(city.endDate)
      }));
  };

  // 检查日期范围是否与已有城市冲突
  const checkDateConflict = (startDate, endDate, excludeCityId = null) => {
    if (!startDate || !endDate) return null;
    
    const newStart = new Date(startDate);
    const newEnd = new Date(endDate);
    const occupiedRanges = getOccupiedDateRanges(excludeCityId);
    
    for (const range of occupiedRanges) {
      // 检查是否有重叠
      if (
        (newStart >= range.startDate && newStart <= range.endDate) ||
        (newEnd >= range.startDate && newEnd <= range.endDate) ||
        (newStart <= range.startDate && newEnd >= range.endDate)
      ) {
        return {
          conflict: true,
          conflictCity: range.cityName,
          conflictStart: range.startDate,
          conflictEnd: range.endDate
        };
      }
    }
    
    return { conflict: false };
  };

  // 获取所有被占用的日期（用于日期选择器禁用）
  const getDisabledDates = (excludeCityId = null) => {
    const occupiedRanges = getOccupiedDateRanges(excludeCityId);
    const disabledDates = [];
    
    occupiedRanges.forEach(range => {
      const current = new Date(range.startDate);
      const end = new Date(range.endDate);
      
      while (current <= end) {
        disabledDates.push(new Date(current));
        current.setDate(current.getDate() + 1);
      }
    });
    
    return disabledDates;
  };

  // 获取按日期排序的城市序列（用于轨迹浏览）
  const getSortedCitiesForTour = () => {
    return cities
      .slice() // 创建副本
      .sort((a, b) => {
        // 首先处理起点（没有日期的城市）
        if (!a.startDate && !b.startDate) return 0;
        if (!a.startDate) return -1; // 起点排在最前面
        if (!b.startDate) return 1;
        
        // 按开始日期排序
        const dateA = new Date(a.startDate);
        const dateB = new Date(b.startDate);
        return dateA - dateB;
      });
  };

  // 获取原始数组中城市的索引（从排序后的城市获取）
  const getOriginalIndexFromSortedCity = (sortedCity) => {
    return cities.findIndex(city => city.id === sortedCity.id);
  };

  const stats = {
    totalCities: cities.length,
  };

  const value = {
    cities,
    addCity,
    updateCity,
    deleteCity,
    currentCityIndex,
    setCurrentCityIndex,
    selectCityById,
    isTouring,
    startTour,
    stopTour,
    toggleTour,
    tourIndex,
    setTourIndex,
    stats,
    blogContent,
    setBlogContent,
    addPhotoToCity,
    updateCityBlog: (cityId, blogText) => {
      setCities(prevCities =>
        prevCities.map(city =>
          city.id === cityId ? { ...city, blog: blogText } : city
        )
      );
    },
    getOccupiedDateRanges,
    checkDateConflict,
    getDisabledDates,
    getSortedCitiesForTour,
    getOriginalIndexFromSortedCity
  };

  return (
    <TravelContext.Provider value={value}>
      {children}
    </TravelContext.Provider>
  );
};