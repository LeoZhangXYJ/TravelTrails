import React, { useState } from 'react';
import { useTravelContext } from '../../context/TravelContext';

const BlogEditor = () => {
  const { cities } = useTravelContext();
  const [selectedCity, setSelectedCity] = useState(null);
  const [blogContent, setBlogContent] = useState('');

  const handleCitySelect = (city) => {
    setSelectedCity(city);
    setBlogContent(city.blog || '');
  };

  const handleContentChange = (e) => {
    setBlogContent(e.target.value);
    if (selectedCity) {
      selectedCity.blog = e.target.value;
    }
  };

  return (
    <div className="blog-editor">
      <h3>旅行博客</h3>
      {cities.length === 0 ? (
        <p className="text-muted">请先添加城市</p>
      ) : (
        <>
          <div className="mb-3">
            <label className="form-label">选择城市</label>
            <select 
              className="form-select"
              value={selectedCity?.id || ''}
              onChange={(e) => {
                const city = cities.find(c => c.id === e.target.value);
                handleCitySelect(city);
              }}
            >
              <option value="">请选择城市</option>
              {cities.map(city => (
                <option key={city.id} value={city.id}>
                  {city.name}
                </option>
              ))}
            </select>
          </div>
          
          {selectedCity && (
            <div className="mb-3">
              <label className="form-label">博客内容</label>
              <textarea
                className="form-control"
                rows="6"
                value={blogContent}
                onChange={handleContentChange}
                placeholder="写下你的旅行故事..."
                style={{
                  backgroundColor: 'rgba(44, 44, 46, 0.8)',
                  color: '#ffffff',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  padding: '0.75rem 1rem',
                  resize: 'vertical'
                }}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default BlogEditor;