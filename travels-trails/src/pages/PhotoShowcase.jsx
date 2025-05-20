import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTravelContext } from '../context/TravelContext';
import styled, { keyframes } from 'styled-components';

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
`;

const fadeOut = keyframes`
  from {
    opacity: 1;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(0.95);
  }
`;

const ShowcaseContainer = styled.div`
  min-height: 100vh;
  background: #000;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
`;

const Header = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
`;

const BackButton = styled.button`
  background: none;
  border: none;
  color: white;
  font-size: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  i {
    font-size: 1.2rem;
  }
`;

const PhotoContainer = styled.div`
  position: relative;
  width: 100%;
  max-width: 1200px;
  height: 80vh;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Photo = styled.img`
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  animation: ${props => props.isEntering ? fadeIn : fadeOut} 1s ease-in-out;
`;

const PhotoInfo = styled.div`
  position: absolute;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 1rem 2rem;
  border-radius: 8px;
  text-align: center;
  animation: ${props => props.isEntering ? fadeIn : fadeOut} 1s ease-in-out;
`;

const Controls = styled.div`
  position: fixed;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 1rem;
  z-index: 1000;
`;

const ControlButton = styled.button`
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const PhotoShowcase = () => {
  const navigate = useNavigate();
  const { cities } = useTravelContext();
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [isEntering, setIsEntering] = useState(true);
  const [autoPlay, setAutoPlay] = useState(true);
  const [displayDuration] = useState(5000); // 每张照片显示5秒

  // 获取所有城市的照片
  const allPhotos = cities.reduce((acc, city) => {
    if (city.photos && city.photos.length > 0) {
      return [...acc, ...city.photos.map(photo => ({
        url: photo,
        city: city.name,
        country: city.country
      }))];
    }
    return acc;
  }, []);

  useEffect(() => {
    if (!autoPlay || allPhotos.length === 0) return;

    const timer = setTimeout(() => {
      setIsEntering(false);
      setTimeout(() => {
        setCurrentPhotoIndex((prev) => (prev + 1) % allPhotos.length);
        setIsEntering(true);
      }, 1000); // 等待淡出动画完成
    }, displayDuration);

    return () => clearTimeout(timer);
  }, [currentPhotoIndex, autoPlay, allPhotos.length, displayDuration]);

  const handlePrevious = () => {
    setIsEntering(false);
    setTimeout(() => {
      setCurrentPhotoIndex((prev) => (prev - 1 + allPhotos.length) % allPhotos.length);
      setIsEntering(true);
    }, 1000);
  };

  const handleNext = () => {
    setIsEntering(false);
    setTimeout(() => {
      setCurrentPhotoIndex((prev) => (prev + 1) % allPhotos.length);
      setIsEntering(true);
    }, 1000);
  };

  if (allPhotos.length === 0) {
    return (
      <ShowcaseContainer>
        <Header>
          <BackButton onClick={() => navigate('/dashboard')}>
            <i className="fas fa-arrow-left"></i>
            返回地图
          </BackButton>
        </Header>
        <div style={{ color: 'white', textAlign: 'center' }}>
          <h2>暂无照片</h2>
          <p>请先在地图上添加城市并上传照片</p>
        </div>
      </ShowcaseContainer>
    );
  }

  return (
    <ShowcaseContainer>
      <Header>
        <BackButton onClick={() => navigate('/dashboard')}>
          <i className="fas fa-arrow-left"></i>
          返回地图
        </BackButton>
      </Header>

      <PhotoContainer>
        <Photo
          src={allPhotos[currentPhotoIndex].url}
          alt={`${allPhotos[currentPhotoIndex].city} 的照片`}
          isEntering={isEntering}
        />
        <PhotoInfo isEntering={isEntering}>
          <h3>{allPhotos[currentPhotoIndex].city}</h3>
          <p>{allPhotos[currentPhotoIndex].country}</p>
        </PhotoInfo>
      </PhotoContainer>

      <Controls>
        <ControlButton onClick={handlePrevious}>
          <i className="fas fa-chevron-left"></i>
        </ControlButton>
        <ControlButton onClick={() => setAutoPlay(!autoPlay)}>
          <i className={`fas fa-${autoPlay ? 'pause' : 'play'}`}></i>
        </ControlButton>
        <ControlButton onClick={handleNext}>
          <i className="fas fa-chevron-right"></i>
        </ControlButton>
      </Controls>
    </ShowcaseContainer>
  );
};

export default PhotoShowcase; 