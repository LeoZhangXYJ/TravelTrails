import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { useTravelContext } from '../context/TravelContext';

const Bg = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #e0e7ff 0%, #f8fafc 100%);
  padding-top: 90px; /* 防止被导航栏遮挡 */
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const Banner = styled.div`
  color: #5a67d8;
  font-size: 2.1rem;
  font-weight: 800;
  letter-spacing: 1.5px;
  margin-bottom: 2.5rem;
  display: flex;
  align-items: center;
  gap: 14px;
`;

const BackBtn = styled.button`
  background: none;
  border: none;
  color: #667eea;
  font-size: 1.7rem;
  cursor: pointer;
  margin-bottom: 1.5rem;
  align-self: flex-start;
  transition: color 0.2s;
  &:hover { color: #5a67d8; }
`;

const Form = styled.form`
  width: 100%;
  max-width: 520px;
  display: flex;
  flex-direction: column;
  gap: 2.2rem;
`;

const Label = styled.label`
  font-weight: 500;
  color: #7b8190;
  font-size: 1rem;
  margin-bottom: 7px;
  letter-spacing: 0.5px;
`;

const Input = styled.input`
  padding: 16px 18px;
  border: 1.5px solid #e5e7eb;
  border-radius: 1.2rem;
  font-size: 1.13rem;
  background: #f8fafc;
  transition: border 0.2s, box-shadow 0.2s;
  width: 100%;
  &::placeholder { color: #b6bac8; opacity: 1; }
  &:focus { border-color: #667eea; outline: none; box-shadow: 0 0 0 2px #e0e7ff; }
`;

const Select = styled.select`
  padding: 16px 18px;
  border: 1.5px solid #e5e7eb;
  border-radius: 1.2rem;
  font-size: 1.13rem;
  background: #f8fafc;
  transition: border 0.2s, box-shadow 0.2s;
  width: 100%;
  &::placeholder { color: #b6bac8; opacity: 1; }
  &:focus { border-color: #667eea; outline: none; box-shadow: 0 0 0 2px #e0e7ff; }
`;

const Textarea = styled.textarea`
  padding: 16px 18px;
  border: 1.5px solid #e5e7eb;
  border-radius: 1.2rem;
  font-size: 1.13rem;
  min-height: 140px;
  resize: vertical;
  background: #f8fafc;
  transition: border 0.2s, box-shadow 0.2s;
  width: 100%;
  &::placeholder { color: #b6bac8; opacity: 1; }
  &:focus { border-color: #667eea; outline: none; box-shadow: 0 0 0 2px #e0e7ff; }
`;

const Button = styled.button`
  background: linear-gradient(90deg, #667eea 0%, #5a67d8 100%);
  color: #fff;
  border: none;
  border-radius: 1.2rem;
  padding: 18px 0;
  font-size: 1.18rem;
  font-weight: 800;
  cursor: pointer;
  margin-top: 8px;
  box-shadow: 0 2px 12px rgba(60,80,180,0.10);
  transition: background 0.2s, transform 0.15s;
  letter-spacing: 1px;
  width: 100%;
  &:hover {
    background: linear-gradient(90deg, #5a67d8 0%, #667eea 100%);
    transform: translateY(-2px) scale(1.04);
  }
`;

const Blog = () => {
  const navigate = useNavigate();
  const { cities = [] } = useTravelContext();
  const [form, setForm] = useState({
    title: '',
    city: '',
    content: ''
  });
  const [blogs, setBlogs] = useState([]);
  const [currentBlogIndex, setCurrentBlogIndex] = useState(0);
  const loadedRef = useRef(false); // 标记是否已加载过localStorage

  // 加载本地存储的博客
  useEffect(() => {
    if (!loadedRef.current) {
      const saved = localStorage.getItem('blogs');
      if (saved) {
        setBlogs(JSON.parse(saved));
      }
      loadedRef.current = true;
    }
  }, []);

  // 每次blogs变化时写入localStorage
  useEffect(() => {
    if (loadedRef.current) {
      localStorage.setItem('blogs', JSON.stringify(blogs));
    }
  }, [blogs]);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = e => {
    e.preventDefault();
    setBlogs(prev => {
      const newBlogs = [
        { ...form, date: new Date().toLocaleString() },
        ...prev
      ];
      setCurrentBlogIndex(0); // 新发布后自动切换到最新
      return newBlogs;
    });
    setForm({ title: '', city: '', content: '' });
  };

  return (
    <Bg>
      <BackBtn onClick={() => navigate('/dashboard')} title="返回">← 返回</BackBtn>
      <Banner>
        <span role="img" aria-label="book">📖</span> 旅行博客
      </Banner>
      <Form onSubmit={handleSubmit}>
        <div>
          <Label>标题</Label>
          <Input
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="请输入博客标题"
            required
          />
        </div>
        <div>
          <Label>关联城市</Label>
          <Select
            name="city"
            value={form.city}
            onChange={handleChange}
            required
          >
            <option value="">请选择城市</option>
            {cities.map((city, idx) => (
              <option key={city.id || idx} value={city.name}>
                {city.name} {city.country ? `- ${city.country}` : ''}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label>内容</Label>
          <Textarea
            name="content"
            value={form.content}
            onChange={handleChange}
            placeholder="写下你的旅行故事..."
            required
          />
        </div>
        <Button type="submit">发布</Button>
      </Form>
      {blogs.length > 0 && (
        <div style={{ width: '100%', maxWidth: 520, margin: '48px auto 0', padding: '0 2px', textAlign: 'center' }}>
          <h2 style={{ color: '#5a67d8', fontWeight: 700, fontSize: '1.4rem', marginBottom: 24 }}>📝 已发布博客</h2>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
            <button
              onClick={() => setCurrentBlogIndex(i => Math.max(i - 1, 0))}
              disabled={currentBlogIndex === 0}
              style={{
                border: 'none', background: 'none', fontSize: 28, color: currentBlogIndex === 0 ? '#b6bac8' : '#667eea', cursor: currentBlogIndex === 0 ? 'not-allowed' : 'pointer', transition: 'color 0.2s', padding: 0
              }}
              aria-label="上一条"
            >
              &#8592;
            </button>
            <div style={{
              minWidth: 340,
              maxWidth: 520,
              width: '100%',
              background: '#fff',
              borderRadius: '1.2rem',
              boxShadow: '0 2px 12px rgba(60,80,180,0.08)',
              padding: '1.5rem 1.5rem 1.2rem 1.5rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              margin: '0 8px',
              transition: 'box-shadow 0.2s',
              wordBreak: 'break-all',
              whiteSpace: 'pre-wrap',
              lineHeight: 1.7
            }}>
              <div style={{ fontWeight: 700, fontSize: '1.15rem', color: '#2d3748', marginBottom: 6 }}>{blogs[currentBlogIndex].title}</div>
              <div style={{ color: '#7b8190', fontSize: '0.98rem', marginBottom: 8 }}>
                {blogs[currentBlogIndex].city && <span>🏙️ {blogs[currentBlogIndex].city} &nbsp; </span>}
                <span style={{ fontSize: '0.92rem', color: '#b6bac8' }}>{blogs[currentBlogIndex].date}</span>
              </div>
              <div style={{ color: '#444', fontSize: '1.08rem' }}>{blogs[currentBlogIndex].content}</div>
            </div>
            <button
              onClick={() => setCurrentBlogIndex(i => Math.min(i + 1, blogs.length - 1))}
              disabled={currentBlogIndex === blogs.length - 1}
              style={{
                border: 'none', background: 'none', fontSize: 28, color: currentBlogIndex === blogs.length - 1 ? '#b6bac8' : '#667eea', cursor: currentBlogIndex === blogs.length - 1 ? 'not-allowed' : 'pointer', transition: 'color 0.2s', padding: 0
              }}
              aria-label="下一条"
            >
              &#8594;
            </button>
          </div>
          <div style={{ marginTop: 12, color: '#7b8190', fontSize: '0.98rem' }}>
            {currentBlogIndex + 1} / {blogs.length}
          </div>
        </div>
      )}
    </Bg>
  );
};

export default Blog; 