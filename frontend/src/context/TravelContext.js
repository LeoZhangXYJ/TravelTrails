import React, { createContext, useContext, useState, useEffect } from 'react';

const TravelContext = createContext();

export const useTravelContext = () => useContext(TravelContext);

// 存储工具函数
const storageUtils = {
  // 安全地保存到localStorage，处理存储限制
  safeSetItem: (key, value) => {
    try {
      const serialized = JSON.stringify(value);
      
      // 检查数据大小（大约估算）
      const sizeInBytes = new Blob([serialized]).size;
      const sizeInMB = sizeInBytes / (1024 * 1024);
      
      console.log(`尝试存储 ${key}，大小: ${sizeInMB.toFixed(2)}MB`);
      
      // 如果数据太大（超过4MB），尝试压缩存储
      if (sizeInMB > 4) {
        console.warn(`数据过大 (${sizeInMB.toFixed(2)}MB)，尝试优化存储...`);
        
        // 创建不包含照片的轻量版本
        const lightVersion = storageUtils.createLightVersion(value);
        const lightSerialized = JSON.stringify(lightVersion);
        const lightSize = new Blob([lightSerialized]).size / (1024 * 1024);
        
        console.log(`优化后大小: ${lightSize.toFixed(2)}MB`);
        
        if (lightSize > 4) {
          throw new Error('即使优化后数据仍然过大');
        }
        
        localStorage.setItem(key, lightSerialized);
        localStorage.setItem(`${key}_photos_removed`, 'true');
        
        // 显示用户友好的提示
        console.warn('由于存储空间限制，照片数据已被临时移除。请考虑减少照片数量或使用外部存储。');
        return;
      }
      
      localStorage.setItem(key, serialized);
      localStorage.removeItem(`${key}_photos_removed`);
      
    } catch (error) {
      console.error('localStorage存储失败:', error);
      
      if (error.name === 'QuotaExceededError') {
        // 存储空间不足，尝试清理和重试
        storageUtils.handleQuotaExceeded(key, value);
      } else {
        // 其他错误，显示用户友好的消息
        alert('保存数据时出现错误，请刷新页面重试。如果问题持续存在，请清理浏览器缓存。');
      }
    }
  },

  // 处理存储空间不足的情况
  handleQuotaExceeded: (key, value) => {
    try {
      console.log('存储空间不足，尝试清理...');
      
      // 1. 清理其他用户的数据（保留当前用户）
      const currentUsername = localStorage.getItem('username');
      const keysToRemove = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const storageKey = localStorage.key(i);
        if (storageKey && storageKey.includes('cities_') && !storageKey.includes(currentUsername)) {
          keysToRemove.push(storageKey);
        }
      }
      
      keysToRemove.forEach(k => localStorage.removeItem(k));
      console.log(`清理了 ${keysToRemove.length} 个其他用户的数据`);
      
      // 2. 尝试保存轻量版本
      const lightVersion = storageUtils.createLightVersion(value);
      localStorage.setItem(key, JSON.stringify(lightVersion));
      localStorage.setItem(`${key}_photos_removed`, 'true');
      
      // 提示用户
      alert('存储空间不足，已自动清理旧数据并优化存储。部分照片可能需要重新添加。');
      
    } catch (retryError) {
      console.error('清理后仍然无法存储:', retryError);
      alert('存储空间严重不足，请清理浏览器缓存或减少数据量。');
    }
  },

  // 创建不包含照片的轻量版本
  createLightVersion: (cities) => {
    if (!Array.isArray(cities)) return cities;
    
    return cities.map(city => ({
      ...city,
      photos: city.photos ? city.photos.map(photo => ({
        ...photo,
        url: photo.url && photo.url.startsWith('data:') ? '[照片已移除]' : photo.url
      })) : []
    }));
  },

  // 安全地从localStorage获取数据
  safeGetItem: (key) => {
    try {
      const item = localStorage.getItem(key);
      if (!item) return null;
      
      const parsed = JSON.parse(item);
      
      // 检查是否有照片被移除的标记
      const photosRemoved = localStorage.getItem(`${key}_photos_removed`);
      if (photosRemoved === 'true') {
        console.warn('检测到照片数据曾被移除，建议重新添加照片');
      }
      
      return parsed;
    } catch (error) {
      console.error('localStorage读取失败:', error);
      return null;
    }
  }
};

export const TravelProvider = ({ children }) => {
  const [cities, setCities] = useState(() => {
    const username = localStorage.getItem('username');
    const savedCities = username ? storageUtils.safeGetItem(`cities_${username}`) : null;
    return savedCities || [];
  });
  const [currentCityIndex, setCurrentCityIndex] = useState(-1);
  const [isTouring, setIsTouring] = useState(false);
  const [tourIndex, setTourIndex] = useState(0);
  const [blogContent, setBlogContent] = useState(() => {
    const username = localStorage.getItem('username');
    return username ? localStorage.getItem(`blogContent_${username}`) || '' : '';
  });

  // 优化的存储效果 - 使用防抖和错误处理
  useEffect(() => {
    const username = localStorage.getItem('username');
    if (username && cities.length >= 0) {
      // 使用防抖延迟存储，避免频繁写入
      const timeoutId = setTimeout(() => {
        storageUtils.safeSetItem(`cities_${username}`, cities);
      }, 500);
      
      return () => clearTimeout(timeoutId);
    }
  }, [cities]);

  useEffect(() => {
    const username = localStorage.getItem('username');
    if (username) {
      try {
        localStorage.setItem(`blogContent_${username}`, blogContent);
      } catch (error) {
        console.error('博客内容存储失败:', error);
      }
    }
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

  // 添加照片到当前选中的城市
  const addPhotoToCurrentCity = (photoData) => {
    if (currentCityIndex < 0 || !cities[currentCityIndex]) return;
    
    const currentCity = cities[currentCityIndex];
    setCities(prevCities =>
      prevCities.map(city => {
        if (city.id === currentCity.id) {
          const updatedPhotos = Array.isArray(city.photos) ? [...city.photos, photoData] : [photoData];
          return { ...city, photos: updatedPhotos };
        }
        return city;
      })
    );
  };

  // 从城市中删除照片
  const removePhotoFromCity = (cityIndex, photoIndex) => {
    if (cityIndex < 0 || cityIndex >= cities.length) return;
    
    setCities(prevCities =>
      prevCities.map((city, index) => {
        if (index === cityIndex) {
          const updatedPhotos = Array.isArray(city.photos) 
            ? city.photos.filter((_, pIndex) => pIndex !== photoIndex)
            : [];
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

  // 清理存储空间的函数
  const clearStorageSpace = () => {
    try {
      const username = localStorage.getItem('username');
      if (!username) return;

      // 显示确认对话框
      const confirmed = window.confirm(
        '这将清理浏览器存储空间，可能会移除一些照片数据。是否继续？'
      );
      
      if (!confirmed) return;

      // 1. 清理其他用户的数据
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.includes('cities_') && !key.includes(username)) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      // 2. 优化当前用户的数据
      const lightVersion = storageUtils.createLightVersion(cities);
      storageUtils.safeSetItem(`cities_${username}`, lightVersion);
      
      alert(`已清理 ${keysToRemove.length} 个旧数据项，并优化了当前数据存储。`);
      
      // 刷新页面以重新加载优化后的数据
      window.location.reload();
      
    } catch (error) {
      console.error('清理存储空间失败:', error);
      alert('清理失败，请手动清理浏览器缓存。');
    }
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
    addPhotoToCurrentCity,
    removePhotoFromCity,
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
    getOriginalIndexFromSortedCity,
    clearStorageSpace
  };

  return (
    <TravelContext.Provider value={value}>
      {children}
    </TravelContext.Provider>
  );
};