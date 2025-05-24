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
    }
  };

  return (
    <TravelContext.Provider value={value}>
      {children}
    </TravelContext.Provider>
  );
};