import React, { useState, useEffect, useCallback, useRef } from 'react';
import styled, { keyframes, css } from 'styled-components';

const fadeIn = keyframes`
  from { opacity: 0; transform: translate(-50%, -50%) scale(0.95); }
  to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
`;

const fadeOut = keyframes`
  from { opacity: 1; transform: translate(-50%, -50%) scale(1); }
  to { opacity: 0; transform: translate(-50%, -50%) scale(0.95); }
`;

const slideInLeft = keyframes`
  from { transform: translateX(-100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
`;

const slideInRight = keyframes`
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
`;

const slideOutLeft = keyframes`
  from { transform: translateX(0); opacity: 1; }
  to { transform: translateX(-100%); opacity: 0; }
`;

const slideOutRight = keyframes`
  from { transform: translateX(0); opacity: 1; }
  to { transform: translateX(100%); opacity: 0; }
`;

const OverlayContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  pointer-events: none;
  opacity: ${({ isExiting }) => (isExiting ? 0 : 1)};
  transition: opacity 0.3s ease-out;
`;

const FocusedPhotoWrapper = styled.div`
  position: absolute;
  top: 50%;
  left: calc(${props => props.sidebarWidth}px + (100vw - ${props => props.sidebarWidth}px) / 2);
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: auto;
  max-width: min(50vw, 600px);
  max-height: 70vh;
  padding: 20px;
  pointer-events: auto;
  ${({ isExiting }) => isExiting ? css`animation: ${fadeOut} 0.3s ease-out forwards;` : css`animation: ${fadeIn} 0.3s ease-out forwards;`}
`;

const Header = styled.div`
  width: 100%;
  text-align: center;
  color: white;
  margin-bottom: 10px;
`;

const Title = styled.h2`
  margin: 0;
  font-size: 1.3rem;
  text-shadow: 0px 0px 8px rgba(0,0,0,0.9);
`;

const PhotoBox = styled.div`
  position: relative;
  width: 100%;
  height: auto;
  max-height: calc(100% - 40px);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
`;

const fadeInImage = keyframes` from { opacity: 0; } to { opacity: 1; } `;
const fadeOutImage = keyframes` from { opacity: 1; } to { opacity: 0; } `;

const Photo = styled.img`
  display: block;
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 8px 30px rgba(0,0,0,0.6);
  transition: transform 0.3s ease-out, opacity 0.3s ease-out;
  transform: ${({ direction, isChanging }) => {
    if (!isChanging) return 'translateX(0)';
    return direction === 'next' ? 'translateX(-100%)' : 'translateX(100%)';
  }};
  opacity: ${({ isChanging }) => isChanging ? 0 : 1};
`;

const PhotoInfo = styled.div`
  color: white;
  padding: 8px 0 0 0;
  font-size: 0.9rem;
  text-align: center;
  width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-shadow: 0px 0px 5px rgba(0,0,0,0.8);
`;

const LoadingSpinner = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    to { transform: translate(-50%, -50%) rotate(360deg); }
  }
`;

const AUTOPLAY_DELAY = 5000;

const PhotoOverlay = ({ photos, cityName, country, onClose, sidebarWidth }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isChanging, setIsChanging] = useState(false);
  const [isOverlayExiting, setIsOverlayExiting] = useState(false);
  const [direction, setDirection] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const touchStartX = useRef(null);
  const autoplayTimer = useRef(null);

  const handleClose = useCallback(() => {
    setIsOverlayExiting(true);
    setTimeout(onClose, 350);
  }, [onClose]);

  const changePhoto = useCallback((newIndex, newDirection) => {
    if (isChanging || !photos || photos.length === 0) return;
    
    setIsChanging(true);
    setDirection(newDirection);
    setIsLoading(true);
    
    setTimeout(() => {
      setCurrentIndex(newIndex);
      setIsChanging(false);
    }, 300);
  }, [isChanging, photos]);

  const handleNext = useCallback(() => {
    const nextIndex = (currentIndex + 1) % photos.length;
    changePhoto(nextIndex, 'next');
  }, [currentIndex, photos, changePhoto]);

  const handlePrev = useCallback(() => {
    const prevIndex = (currentIndex - 1 + photos.length) % photos.length;
    changePhoto(prevIndex, 'prev');
  }, [currentIndex, photos, changePhoto]);

  const handleTouchStart = useCallback((e) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback((e) => {
    if (!touchStartX.current) return;
    
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;
    
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
    
    touchStartX.current = null;
  }, [handleNext, handlePrev]);

  useEffect(() => {
    if (!photos || photos.length === 0) {
      if (!isOverlayExiting) handleClose();
      return;
    }
    if (currentIndex >= photos.length && photos.length > 0) {
      setCurrentIndex(0);
    }
  }, [photos, currentIndex, handleClose, isOverlayExiting]);
  
  useEffect(() => {
    if (isOverlayExiting || !photos || photos.length === 0) return;

    autoplayTimer.current = setTimeout(() => {
      if (currentIndex === photos.length - 1) { 
        handleClose(); 
      } else {
        handleNext(); 
      }
    }, AUTOPLAY_DELAY);

    return () => {
      if (autoplayTimer.current) {
        clearTimeout(autoplayTimer.current);
      }
    };
  }, [currentIndex, photos, handleNext, handleClose, isOverlayExiting]);

  const handleImageLoad = useCallback(() => {
    setIsLoading(false);
  }, []);

  if (!photos || photos.length === 0) {
    return null;
  }

  if (!isOverlayExiting && currentIndex >= photos.length) {
    return null;
  }
  
  const currentPhoto = photos[currentIndex];

  return (
    <OverlayContainer isExiting={isOverlayExiting}>
      <FocusedPhotoWrapper 
        sidebarWidth={sidebarWidth} 
        isExiting={isOverlayExiting}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <Header>
          <Title>{cityName}{country && `, ${country}`}</Title>
        </Header>
        <PhotoBox>
          {currentPhoto && (
            <>
              <Photo 
                key={currentIndex}
                src={currentPhoto.url} 
                alt={`${cityName} photo ${currentIndex + 1}`}
                direction={direction}
                isChanging={isChanging}
                onLoad={handleImageLoad}
              />
              {isLoading && <LoadingSpinner />}
            </>
          )}
        </PhotoBox>
        {currentPhoto && <PhotoInfo>{currentPhoto.caption || `${cityName} - Photo ${currentIndex + 1}`}</PhotoInfo>}
      </FocusedPhotoWrapper>
    </OverlayContainer>
  );
};

export default PhotoOverlay; 