import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';

const fadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

const fadeOut = keyframes`
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
`;

const OverlayContainer = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 80%;
  max-width: 1200px;
  background: rgba(0, 0, 0, 0.9);
  border-radius: 12px;
  padding: 20px;
  z-index: 9999;
  animation: ${props => props.isEntering ? fadeIn : fadeOut} 0.3s ease-in-out;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  opacity: ${props => props.isEntering ? 1 : 0};
  pointer-events: ${props => props.isEntering ? 'auto' : 'none'};
`;

const PhotoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 15px;
  margin-top: 15px;
`;

const PhotoContainer = styled.div`
  position: relative;
  aspect-ratio: 1;
  overflow: hidden;
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.3s ease;

  &:hover {
    transform: scale(1.05);
  }
`;

const Photo = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const PhotoInfo = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 8px;
  font-size: 0.9rem;
  text-align: center;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  color: white;
`;

const Title = styled.h2`
  margin: 0;
  font-size: 1.5rem;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 5px;
  transition: transform 0.3s ease;

  &:hover {
    transform: scale(1.1);
  }
`;

const PhotoOverlay = ({ photos, cityName, country, onClose }) => {
  const [isEntering, setIsEntering] = useState(true);
  const [shouldRender, setShouldRender] = useState(true);

  useEffect(() => {
    // 1秒后开始淡出
    const timer = setTimeout(() => {
      setIsEntering(false);
      // 等待淡出动画完成后移除组件
      setTimeout(() => {
        setShouldRender(false);
        onClose();
      }, 300);
    }, 1000);

    return () => clearTimeout(timer);
  }, [onClose]);

  if (!shouldRender || !photos || photos.length === 0) return null;

  return (
    <OverlayContainer isEntering={isEntering}>
      <Header>
        <Title>{cityName}, {country}</Title>
        <CloseButton onClick={onClose}>
          <i className="fas fa-times"></i>
        </CloseButton>
      </Header>

      <PhotoGrid>
        {photos.map((photo, index) => (
          <PhotoContainer key={index}>
            <Photo
              src={photo.url}
              alt={`${cityName} 的照片 ${index + 1}`}
            />
            <PhotoInfo>
              {cityName} - {index + 1}
            </PhotoInfo>
          </PhotoContainer>
        ))}
      </PhotoGrid>
    </OverlayContainer>
  );
};

export default PhotoOverlay; 