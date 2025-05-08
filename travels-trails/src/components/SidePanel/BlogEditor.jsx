import React, { useState, useEffect } from 'react';
import { useTravelContext } from '../../context/TravelContext';

const BlogEditor = () => {
  const [blogContent, setBlogContent] = useState('');
  const { cities, currentCityIndex, updateCityBlog } = useTravelContext();

  // 当选中城市改变时，更新编辑器内容
  useEffect(() => {
    if (currentCityIndex >= 0 && cities[currentCityIndex]) {
      setBlogContent(cities[currentCityIndex].blog || '');
    } else {
      setBlogContent('');
    }
  }, [currentCityIndex, cities]);

  const handleContentChange = (e) => {
    setBlogContent(e.target.value);
  };

  const handleSaveBlog = () => {
    updateCityBlog(blogContent);
    alert('博客保存成功！');
  };

  if (currentCityIndex < 0) {
    return (
      <div className="blog-editor">
        <h3>旅行日志</h3>
        <p>请先选择一个城市</p>
      </div>
    );
  }

  return (
    <div className="blog-editor">
      <h3>旅行日志 - {cities[currentCityIndex].name}</h3>
      <textarea
        value={blogContent}
        onChange={handleContentChange}
        placeholder="记录你在这个城市的经历和感想..."
        rows={8}
      />
      <button onClick={handleSaveBlog} className="save-btn">保存日志</button>
    </div>
  );
};

export default BlogEditor;