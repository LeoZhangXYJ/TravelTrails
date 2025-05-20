import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTravelContext } from '../context/TravelContext';
import styled from 'styled-components';

const StatisticsContainer = styled.div`
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2rem;
`;

const BackButton = styled.button`
  background: none;
  border: none;
  color: #4a5568;
  font-size: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  transition: all 0.3s ease;

  &:hover {
    background: #f7fafc;
    color: #2d3748;
  }

  i {
    font-size: 1.2rem;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-top: 2rem;
`;

const StatCard = styled.div`
  background: white;
  border-radius: 15px;
  padding: 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  text-align: center;
  transition: transform 0.3s ease;

  &:hover {
    transform: translateY(-5px);
  }
`;

const StatValue = styled.div`
  font-size: 3rem;
  font-weight: bold;
  color: #667eea;
  margin-bottom: 0.5rem;
`;

const StatLabel = styled.div`
  font-size: 1.2rem;
  color: #4a5568;
`;

const Title = styled.h1`
  color: #2d3748;
  font-size: 2.5rem;
  margin: 0;
`;

const Statistics = () => {
  const { stats, cities } = useTravelContext();
  const navigate = useNavigate();
  
  // 计算总距离
  const calculateTotalDistance = () => {
    if (cities.length < 2) return 0;
    
    let totalDistance = 0;
    for (let i = 1; i < cities.length; i++) {
      const prev = cities[i - 1];
      const curr = cities[i];
      const R = 6371; // 地球半径（公里）
      const dLat = toRad(curr.coordinates.lat - prev.coordinates.lat);
      const dLon = toRad(curr.coordinates.lon - prev.coordinates.lon);
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(toRad(prev.coordinates.lat)) * Math.cos(toRad(curr.coordinates.lat)) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      totalDistance += R * c;
    }
    return Math.round(totalDistance);
  };

  // 计算访问的国家数量
  const calculateCountriesCount = () => {
    const countries = new Set(cities.map(city => city.country));
    return countries.size;
  };

  const toRad = (degrees) => {
    return degrees * (Math.PI / 180);
  };

  return (
    <StatisticsContainer>
      <Header>
        <BackButton onClick={() => navigate('/dashboard')}>
          <i className="fas fa-arrow-left"></i>
          返回地图
        </BackButton>
        <Title>旅行统计</Title>
        <div style={{ width: '100px' }}></div> {/* 为了保持标题居中 */}
      </Header>
      <StatsGrid>
        <StatCard>
          <StatValue>{stats.totalCities}</StatValue>
          <StatLabel>已访问城市</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{calculateCountriesCount()}</StatValue>
          <StatLabel>已访问国家</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{calculateTotalDistance()} km</StatValue>
          <StatLabel>总距离</StatLabel>
        </StatCard>
      </StatsGrid>
    </StatisticsContainer>
  );
};

export default Statistics; 