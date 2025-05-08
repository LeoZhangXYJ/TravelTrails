import React, { useRef, useState } from 'react';
import { useTravelContext } from '../../context/TravelContext';

const PhotoGallery = () => {
  const fileInputRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const { cities, currentCityIndex, addPhotoToCity, removePhotoFromCity } = useTravelContext();

  const currentCity = currentCityIndex >= 0 ? cities[currentCityIndex] : null;
  
  const handleFileSelect = (e) => {
    if (!currentCity) {
      alert('请先选择一个城市');
      return;
    }

    const files = e.target.files;
    if (files.length === 0) return;

    setIsLoading(true);

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        addPhotoToCity(event.target.result); // 使用 addPhotoToCity 而不是 updateCity
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
    fileInputRef.current?.click();
  };

  const handleRemovePhoto = (photoIndex) => {
    if (currentCityIndex < 0) return;
    removePhotoFromCity(currentCityIndex, photoIndex);
  };

  if (!currentCity) {
    return (
      <div className="photo-gallery">
        <h3>照片画廊</h3>
        <p>请先选择一个城市</p>
      </div>
    );
  }

  return (
    <div className="photo-gallery">
      <h3>照片画廊 - {currentCity.name}</h3>
      <div className="gallery-controls">
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          ref={fileInputRef}
          style={{ display: 'none' }}
        />
        <button 
          onClick={handleUploadClick} 
          disabled={isLoading}
          className="upload-btn"
        >
          {isLoading ? '上传中...' : '上传照片'}
        </button>
      </div>
      
      {currentCity.photos && currentCity.photos.length > 0 ? (
        <div className="photos-container">
          {currentCity.photos.map((photo, idx) => (
            <div key={idx} className="photo-item">
              <img src={photo} alt={`${currentCity.name} 照片 ${idx + 1}`} />
              <button 
                className="remove-photo" 
                onClick={() => handleRemovePhoto(idx)}
              >
                删除
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="no-photos">这个城市还没有照片</p>
      )}
    </div>
  );
};

export default PhotoGallery;