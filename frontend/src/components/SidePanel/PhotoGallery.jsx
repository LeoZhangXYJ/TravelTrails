import React, { useRef, useState } from 'react';
import { useTravelContext } from '../../context/TravelContext';
import styled from 'styled-components';

const GalleryContainer = styled.div`
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 15px;
  margin-top: 10px;
`;

const PhotoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-top: 10px;
`;

const PhotoItem = styled.div`
  position: relative;
  aspect-ratio: 1;
  cursor: pointer;
  overflow: hidden;
  border-radius: 4px;
  transition: transform 0.2s;

  &:hover {
    transform: scale(1.05);
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const PhotoInfo = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 5px;
  font-size: 0.8em;
  text-align: center;
`;

const NoPhotos = styled.div`
  text-align: center;
  color: #666;
  padding: 20px;
  font-style: italic;
`;

const UploadButton = styled.button`
  width: 100%;
  padding: 8px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.3s;
  margin-bottom: 10px;

  &:hover {
    background: #45a049;
  }

  &:disabled {
    background: #666;
    cursor: not-allowed;
  }
`;

const RemoveButton = styled.button`
  position: absolute;
  top: 5px;
  right: 5px;
  background: rgba(244, 67, 54, 0.8);
  color: white;
  border: none;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: background 0.3s;

  &:hover {
    background: rgba(244, 67, 54, 1);
  }
`;

const PhotoGallery = ({ onShowPhotos }) => {
  const fileInputRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const { cities, currentCityIndex, addPhotoToCity, removePhotoFromCity } = useTravelContext();

  const currentCity = currentCityIndex >= 0 ? cities[currentCityIndex] : null;
  const isHomeBase = currentCity && currentCity.transportMode === 'home';
  
  const handleFileSelect = (e) => {
    if (!currentCity) {
      alert('请先选择一个城市');
      return;
    }
    if (isHomeBase) {
      alert('起点（家）不支持上传照片。');
      return;
    }

    const files = e.target.files;
    if (files.length === 0) return;

    setIsLoading(true);

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        addPhotoToCity({
          url: event.target.result,
          timestamp: new Date().toISOString()
        });
        setIsLoading(false);
      };
      reader.onerror = () => {
        alert('读取文件失败');
        setIsLoading(false);
      };
      reader.readAsDataURL(file);
    });
    
    // 清空文件输入框，以便再次选择相同的文件
    e.target.value = null;
  };

  const handleUploadClick = () => {
    if (isHomeBase) {
      alert('起点（家）不支持上传照片。');
      return;
    }
    fileInputRef.current?.click();
  };

  const handleRemovePhoto = (photoIndex) => {
    if (currentCityIndex < 0) return;
    if (isHomeBase) {
      // 此处不应发生，因为删除按钮会被禁用
      alert('起点（家）的照片无法删除。');
      return;
    }
    removePhotoFromCity(currentCityIndex, photoIndex);
  };

  if (!currentCity) {
    return (
      <GalleryContainer>
        <h3>照片墙</h3>
        <NoPhotos>请先选择一个城市</NoPhotos>
      </GalleryContainer>
    );
  }

  return (
    <GalleryContainer>
      <h3>照片墙</h3>
      <input
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        ref={fileInputRef}
        style={{ display: 'none' }}
        disabled={isHomeBase}
      />
      <UploadButton onClick={handleUploadClick} disabled={isLoading || isHomeBase}>
        {isLoading ? '上传中...' : (isHomeBase ? '起点无法上传' : '上传照片')}
      </UploadButton>
      
      {isHomeBase ? (
        <NoPhotos>起点（家）不支持照片墙功能。</NoPhotos>
      ) : (!currentCity.photos || currentCity.photos.length === 0) ? (
        <NoPhotos>暂无照片</NoPhotos>
      ) : (
        <PhotoGrid>
          {currentCity.photos.map((photo, index) => (
            <PhotoItem key={index}>
              <img 
                src={photo.url} 
                alt={`${currentCity.name} - ${index + 1}`} 
                onClick={onShowPhotos}
              />
              <RemoveButton onClick={() => handleRemovePhoto(index)} disabled={isHomeBase}>
                删除
              </RemoveButton>
              <PhotoInfo>
                {currentCity.name}, {currentCity.country}
              </PhotoInfo>
            </PhotoItem>
          ))}
        </PhotoGrid>
      )}
    </GalleryContainer>
  );
};

export default PhotoGallery;