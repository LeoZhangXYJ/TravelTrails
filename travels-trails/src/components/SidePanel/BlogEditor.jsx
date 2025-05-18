import React, { useState, useEffect } from 'react';
import { useTravelContext } from '../../context/TravelContext';

const BlogEditor = () => {
  const { cities, currentCityIndex, updateCityBlog } = useTravelContext();
  const [blogContent, setBlogContent] = useState('');

  // 当当前选中的城市改变时，更新博客内容
  useEffect(() => {
    if (currentCityIndex >= 0 && cities[currentCityIndex]) {
      setBlogContent(cities[currentCityIndex].blog || '');
    } else {
      setBlogContent('');
    }
  }, [currentCityIndex, cities]);

  const handleContentChange = (e) => {
    const newContent = e.target.value;
    setBlogContent(newContent);
    if (currentCityIndex >= 0) {
      updateCityBlog(cities[currentCityIndex].id, newContent);
    }
  };

  return (
    <div className="blog-editor">
      <h3>旅行博客</h3>
      {cities.length === 0 ? (
        <p className="text-muted">请先添加城市</p>
      ) : currentCityIndex < 0 ? (
        <p className="text-muted">请选择一个城市来编写博客</p>
      ) : (
        <div className="mb-3">
          <div className="city-info mb-2">
            <h4>{cities[currentCityIndex].name}</h4>
            <span className="text-muted">
              {cities[currentCityIndex].country} - {cities[currentCityIndex].transportMode}
            </span>
          </div>
          <textarea
            className="form-control"
            rows="10"
            value={blogContent}
            onChange={handleContentChange}
            placeholder="写下你的旅行故事..."
            style={{
              backgroundColor: 'rgba(44, 44, 46, 0.8)',
              color: '#ffffff',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              padding: '0.75rem 1rem',
              resize: 'vertical',
              minHeight: '200px'
            }}
          />
        </div>
      )}
    </div>
  );
};

export default BlogEditor;