import React, { useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { useTravelContext } from '../context/TravelContext';

const Container = styled.div`
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 30px;
`;

const BackButton = styled.button`
  background: none;
  border: none;
  color: #666;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 8px;
  margin-right: 15px;
  transition: color 0.3s;

  &:hover {
    color: #333;
  }
`;

const Title = styled.h1`
  margin: 0;
  font-size: 1.8rem;
  color: #333;
`;

const Content = styled.div`
  background: white;
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
`;

const BlogForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  font-weight: 500;
  color: #333;
`;

const Input = styled.input`
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;

  &:focus {
    outline: none;
    border-color: #667eea;
  }
`;

const TextArea = styled.textarea`
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  min-height: 200px;
  resize: vertical;

  &:focus {
    outline: none;
    border-color: #667eea;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 10px;
  justify-content: flex-end;
`;

const Button = styled.button`
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const SubmitButton = styled(Button)`
  background: #667eea;
  color: white;

  &:hover:not(:disabled) {
    background: #5a67d8;
  }
`;

const CancelButton = styled(Button)`
  background: #e2e8f0;
  color: #4a5568;

  &:hover {
    background: #cbd5e0;
  }
`;

const Blog = () => {
  const navigate = useNavigate();
  const { cities } = useTravelContext();
  const [blogData, setBlogData] = useState({
    title: '',
    content: '',
    city: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    // TODO: 实现博客保存功能
    console.log('Blog data:', blogData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setBlogData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <Container>
      <Header>
        <BackButton onClick={() => navigate('/dashboard')}>
          <i className="fas fa-arrow-left"></i>
        </BackButton>
        <Title>旅行博客</Title>
      </Header>

      <Content>
        <BlogForm onSubmit={handleSubmit}>
          <FormGroup>
            <Label>标题</Label>
            <Input
              type="text"
              name="title"
              value={blogData.title}
              onChange={handleChange}
              placeholder="输入博客标题"
              required
            />
          </FormGroup>

          <FormGroup>
            <Label>选择城市</Label>
            <Input
              as="select"
              name="city"
              value={blogData.city}
              onChange={handleChange}
              required
            >
              <option value="">选择城市</option>
              {cities.map((city, index) => (
                <option key={index} value={city.name}>
                  {city.name}, {city.country}
                </option>
              ))}
            </Input>
          </FormGroup>

          <FormGroup>
            <Label>内容</Label>
            <TextArea
              name="content"
              value={blogData.content}
              onChange={handleChange}
              placeholder="分享你的旅行故事..."
              required
            />
          </FormGroup>

          <ButtonGroup>
            <CancelButton type="button" onClick={() => navigate('/dashboard')}>
              取消
            </CancelButton>
            <SubmitButton type="submit">
              发布
            </SubmitButton>
          </ButtonGroup>
        </BlogForm>
      </Content>
    </Container>
  );
};

export default Blog; 