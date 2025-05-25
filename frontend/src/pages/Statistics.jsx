import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTravelContext } from '../context/TravelContext';
import styled from 'styled-components';
import { Select, Card } from 'antd';
import { Line, WordCloud } from '@ant-design/charts';
import { format, parseISO } from 'date-fns';

const { Option } = Select;

// PageWrapper (identisch zu dem in AIRecommendations, könnte ausgelagert werden)
const PageWrapper = styled.div`
  padding-top: 5rem; /* Platz für die Navbar */
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const StatisticsContainer = styled.div`
  padding: 2rem;
  max-width: 1200px;
  width: 100%; // Stellt sicher, dass es die Breite innerhalb des PageWrappers nutzt
  margin: 1.5rem auto; // Vertikales Margin hinzugefügt, horizontales auto beibehalten
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
  min-width: 130px;

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

const TimelineContainer = styled.div`
  margin-top: 3rem;
  background: white;
  border-radius: 15px;
  padding: 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const TimelineTitle = styled.h2`
  color: #2d3748;
  font-size: 1.8rem;
  margin-bottom: 1.5rem;
  text-align: center;
`;

const TimelineList = styled.ul`
  list-style: none;
  padding: 0;
`;

const TimelineItem = styled.li`
  display: flex;
  align-items: center;
  padding: 1rem 0;
  border-bottom: 1px solid #e2e8f0;
  &:last-child {
    border-bottom: none;
  }
`;

const TimelineCityName = styled.span`
  font-size: 1.1rem;
  color: #4a5568;
  margin-left: 1rem;
`;

const TimelineCityOrder = styled.span`
  background-color: #667eea;
  color: white;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
`;

const Statistics = () => {
  const { stats, cities } = useTravelContext();
  const navigate = useNavigate();
  const [timeDimension, setTimeDimension] = useState('month');
  
  const toRad = (degrees) => degrees * (Math.PI / 180);
  const calculateDistanceBetweenCities = (city1, city2) => {
    if (!city1 || !city2 || !city1.coordinates || !city2.coordinates) return 0;
    const R = 6371;
    const dLat = toRad(city2.coordinates.lat - city1.coordinates.lat);
    const dLon = toRad(city2.coordinates.lon - city1.coordinates.lon);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(city1.coordinates.lat)) *
        Math.cos(toRad(city2.coordinates.lat)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const calculateTotalDistance = () => {
    if (cities.length < 2) return 0;
    let totalDistance = 0;
    for (let i = 1; i < cities.length; i++) {
      totalDistance += calculateDistanceBetweenCities(cities[i-1], cities[i]);
    }
    return Math.round(totalDistance);
  };

  const calculateCountriesCount = () => {
    const countries = new Set(cities.map(city => city.country));
    return countries.size;
  };

  const aggregatedDistanceData = useMemo(() => {
    if (!cities || cities.length < 2) return [];

    const dailyDistances = {};

    for (let i = 1; i < cities.length; i++) {
      const prevCity = cities[i-1];
      const currentCity = cities[i];
      
      if (currentCity.startDate) {
        const distance = calculateDistanceBetweenCities(prevCity, currentCity);
        const arrivalDate = parseISO(currentCity.startDate);
        let dateKey;

        if (timeDimension === 'day') {
          dateKey = format(arrivalDate, 'yyyy-MM-dd');
        } else if (timeDimension === 'month') {
          dateKey = format(arrivalDate, 'yyyy-MM');
        } else { 
          dateKey = format(arrivalDate, 'yyyy');
        }

        if (dateKey) {
          dailyDistances[dateKey] = (dailyDistances[dateKey] || 0) + distance;
        }
      }
    }
    
    return Object.entries(dailyDistances)
      .map(([date, distance]) => ({ date, distance: Math.round(distance) }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()); 

  }, [cities, timeDimension]);

  const lineChartConfig = {
    data: aggregatedDistanceData,
    xField: 'date',
    yField: 'distance',
    height: 300,
    smooth: true,
    point: {
      size: 5,
      shape: 'diamond',
    },
    label: {
      style: {
        fill: '#aaa',
      },
    },
    tooltip: {
      formatter: (datum) => {
        return { name: '里程', value: (datum.distance || 0) + ' km' };
      },
    }
  };

  const wordCloudData = useMemo(() => {
    if (!cities || cities.length === 0) return [];
    const words = {};
    cities.forEach(city => {
      if (city.name) {
        const cityName = city.name.toLowerCase();
        words[cityName] = (words[cityName] || 0) + 1;
      }
      if (city.country) {
        const countryName = city.country.toLowerCase();
        words[countryName] = (words[countryName] || 0) + 1;
      }
    });
    return Object.entries(words).map(([text, value]) => ({ text, value }));
  }, [cities]);

  const wordCloudConfig = {
    data: wordCloudData,
    wordField: 'text',
    weightField: 'value',
    colorField: 'text',
    height: 300,
    wordStyle: {
      fontFamily: 'Verdana',
      fontSize: [12, 40],
      rotation: 0,
    },
    random: () => 0.5,
  };

  return (
    <PageWrapper>
      <StatisticsContainer>
        <Header>
          <BackButton onClick={() => navigate('/dashboard')}>
            <i className="fas fa-arrow-left"></i>
            返回地图
          </BackButton>
          <Title>旅行统计</Title>
          <div style={{ width: '130px' }}></div>
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

        <Card title="里程统计" style={{ marginTop: '3rem' }}>
          <div style={{ marginBottom: '20px', textAlign: 'right' }}>
            <span style={{ marginRight: '10px' }}>时间维度:</span>
            <Select 
              value={timeDimension} 
              style={{ width: 120 }} 
              onChange={(value) => setTimeDimension(value)}
            >
              <Option value="day">按日</Option>
              <Option value="month">按月</Option>
              <Option value="year">按年</Option>
            </Select>
          </div>
          {aggregatedDistanceData.length > 0 ? (
             <Line {...lineChartConfig} />
          ) : (
            <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed #ccc', background: '#f9f9f9' }}>
              暂无足够数据生成里程图或未选择有效日期。
            </div>
          )}
        </Card>

        {cities && cities.length > 0 && (
          <TimelineContainer>
            <TimelineTitle>旅行足迹</TimelineTitle>
            <TimelineList>
              {cities.map((city, index) => (
                <TimelineItem key={city.id || index}>
                  <TimelineCityOrder>{index + 1}</TimelineCityOrder>
                  <TimelineCityName>
                    {city.name}{city.country && `, ${city.country}`}
                  </TimelineCityName>
                </TimelineItem>
              ))}
            </TimelineList>
          </TimelineContainer>
        )}

        <Card title="地点词云" style={{ marginTop: '3rem' }}>
          {wordCloudData.length > 0 ? (
            <WordCloud {...wordCloudConfig} />
          ) : (
            <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed #ccc', background: '#f9f9f9' }}>
              暂无数据生成词云图。
            </div>
          )}
        </Card>

      </StatisticsContainer>
    </PageWrapper>
  );
};

export default Statistics; 