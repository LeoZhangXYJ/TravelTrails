import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
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

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  text-align: center;
`;

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const LoadingSpinner = styled.div`
  width: 50px;
  height: 50px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;
  margin-bottom: 20px;
`;

const LoadingText = styled.p`
  color: #666;
  font-size: 1.2rem;
  margin: 0;
`;

const ResultContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-top: 20px;
`;

const CityCard = styled.div`
  background: #f8f9fa;
  border-radius: 12px;
  padding: 20px;
  transition: transform 0.3s, box-shadow 0.3s;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  }
`;

const CityName = styled.h3`
  margin: 0 0 10px 0;
  color: #333;
  font-size: 1.4rem;
  display: flex;
  align-items: center;
  gap: 10px;

  i {
    color: #667eea;
  }
`;

const CityInfo = styled.div`
  color: #666;
  margin-bottom: 15px;
`;

const RecommendationReason = styled.p`
  color: #666;
  font-style: italic;
  border-left: 3px solid #667eea;
  padding-left: 15px;
  margin: 0;
`;

const ErrorMessage = styled.div`
  color: #dc3545;
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 4px;
  padding: 15px;
  margin: 20px 0;
  text-align: center;
`;

const AI = () => {
  const navigate = useNavigate();
  const { cities } = useTravelContext();
  const [isLoading, setIsLoading] = useState(true);
  const [recommendations, setRecommendations] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAIRecommendations = async () => {
      try {
        console.log('Sending cities data:', cities);
        
        const formattedCities = cities.map(city => ({
          city: city.name,
          country: city.country
        }));
        
        console.log('Formatted cities data:', formattedCities);
        
        const requestBody = { visitedCities: formattedCities };
        console.log('Request body:', JSON.stringify(requestBody));
        
        const response = await fetch('http://localhost:8001/test-api', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(requestBody),
        });

        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(errorData?.detail || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Received recommendations:', data);
        setRecommendations(data);
        setError(null);
      } catch (error) {
        console.error('Error details:', error);
        setError(error.message || '获取推荐失败，请稍后重试');
      } finally {
        setIsLoading(false);
      }
    };

    if (cities && cities.length > 0) {
      fetchAIRecommendations();
    } else {
      setError('没有足够的旅行数据来生成推荐');
      setIsLoading(false);
    }
  }, [cities]);

  return (
    <Container>
      <Header>
        <BackButton onClick={() => navigate('/dashboard')}>
          <i className="fas fa-arrow-left"></i>
        </BackButton>
        <Title>AI 智能推荐</Title>
      </Header>

      <Content>
        {isLoading ? (
          <LoadingContainer>
            <LoadingSpinner />
            <LoadingText>AI 正在分析您的旅行偏好，为您推荐下一个目的地...</LoadingText>
          </LoadingContainer>
        ) : error ? (
          <ErrorMessage>
            <i className="fas fa-exclamation-circle"></i> {error}
          </ErrorMessage>
        ) : (
          <ResultContainer>
            {recommendations.map((city, index) => (
              <CityCard key={index}>
                <CityName>
                  <i className="fas fa-map-marker-alt"></i>
                  {city.city}, {city.country}
                </CityName>
                <CityInfo>
                  <div style={{ marginBottom: '10px' }}>
                    <strong>推荐偏好：</strong>
                    {city.inferred_preferences.join('、')}
                  </div>
                  <RecommendationReason>{city.reason}</RecommendationReason>
                </CityInfo>
              </CityCard>
            ))}
          </ResultContainer>
        )}
      </Content>
    </Container>
  );
};

export default AI; 