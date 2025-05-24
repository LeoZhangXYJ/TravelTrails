import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import Slider from 'react-slick';
import { FaArrowLeft, FaPlusCircle, FaSpinner, FaExclamationTriangle } from 'react-icons/fa';
import { useTravelContext } from '../context/TravelContext';

// 导入 slick-carousel 的 CSS 文件，确保全局引入
// import 'slick-carousel/slick/slick.css'; // 已在 index.js 引入
// import 'slick-carousel/slick/slick-theme.css'; // 已在 index.js 引入

// 页面主容器
const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - 5rem); /* 减去 Navbar 高度 */
  padding: 2rem;
  padding-top: 7rem; /* 为 Navbar 留出空间 */
  background-color: #f0f2f5;
`;

// 页面头部
const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  width: 100%;
`;

// 页面标题
const Title = styled.h1`
  font-size: 2rem;
  color: #333;
  text-align: center;
  flex-grow: 1; /* 让标题占据剩余空间，实现居中 */
`;

// 返回按钮
const BackButton = styled.button`
  background-color: #f1f5f9;
  border: 1px solid #e2e8f0;
  color: #4a5568;
  font-size: 1rem;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.75rem; /* 增加图标和文字的间距 */
  transition: background-color 0.3s ease;

  &:hover {
    background-color: #e2e8f0;
  }
`;

// 轮播容器的包装器，用于控制最大宽度和居中
const SliderWrapper = styled.div`
  width: 100%;
  max-width: 1200px; /* 限制轮播最大宽度 */
  margin: 0 auto; /* 水平居中 */
  padding: 0 50px; /* 为轮播箭头预留更多空间 */
  box-sizing: border-box;
  position: relative; /* 添加position relative确保箭头定位正确 */

  @media (max-width: 768px) {
    padding: 0 20px; /* 移动端减少padding */
  }
`;

// 自定义轮播组件样式
const StyledSlider = styled(Slider)`
  .slick-list {
    margin: 0 -10px; /* 调整内边距以适应卡片间距 */
    overflow: hidden; /* 确保溢出内容被隐藏 */
  }

  .slick-track {
    display: flex !important; /* 强制使用flex布局确保水平排列 */
    align-items: stretch; /* 让所有卡片高度一致 */
  }

  .slick-slide {
    height: inherit !important; /* 继承父容器高度 */

    > div {
      padding: 0 10px; /* 卡片之间的水平间距 */
      box-sizing: border-box;
      height: 100%; /* 确保内容填满高度 */
    }
  }

  .slick-dots {
    bottom: -40px; /* 调整分页圆点位置 */
    li button:before {
      font-size: 12px;
      color: #007bff;
    }
    li.slick-active button:before {
      color: #0056b3;
    }
  }

  .slick-prev,
  .slick-next {
    width: 40px;
    height: 40px;
    z-index: 2;
    &:before {
      font-size: 30px;
      color: #007bff;
      opacity: 0.8;
    }
    &:hover:before {
      opacity: 1;
    }
  }

  .slick-prev {
    left: -45px; /* 调整左箭头位置 */
  }

  .slick-next {
    right: -45px; /* 调整右箭头位置 */
  }

  @media (max-width: 768px) {
    .slick-prev,
    .slick-next {
        display: none !important;
    }

    .slick-list {
      margin: 0 -5px; /* 移动端减少间距 */
    }

    .slick-slide > div {
      padding: 0 5px; /* 移动端减少卡片间距 */
    }
  }
`;

// 推荐卡片
const RecommendationCard = styled.div`
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 300px; /* 固定卡片高度 */
  box-sizing: border-box;
`;

const CardHeader = styled.h3`
  font-size: 1.3rem;
  color: #007bff;
  margin-bottom: 0.75rem;
`;

const CardText = styled.p`
  font-size: 0.9rem;
  color: #555;
  line-height: 1.5;
  margin-bottom: 0.5rem;
  flex-grow: 1;
  overflow-y: auto; /* 内容过多时允许滚动 */
`;

const CardSubText = styled.p`
  font-size: 0.8rem;
  color: #777;
  margin-bottom: 1rem;
`;

const AddButton = styled.button`
  background-color: #28a745;
  color: white;
  border: none;
  padding: 0.6rem 1rem;
  border-radius: 5px;
  cursor: pointer;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: background-color 0.2s ease-in-out;
  width: 100%;

  &:hover {
    background-color: #218838;
  }
  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
`;

// 加载和错误状态的容器
const StatusContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex-grow: 1; /* 占据剩余空间 */
  text-align: center;
  color: #555;
  padding: 2rem 0;

  svg {
    margin-bottom: 1rem;
  }
`;

// 手动触发获取推荐的按钮（如果需要的话）
const FetchButton = styled.button`
  background-color: #007bff;
  color: white;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  border-radius: 5px;
  cursor: pointer;
  margin-bottom: 2rem; // 与轮播内容隔开
  border: none;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: #0056b3;
  }

  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
`;

const AIRecommendations = () => {
  const navigate = useNavigate();
  const { cities, addCity, showNotification } = useTravelContext();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false); // 初始不加载，等待按钮点击或useEffect触发
  const [error, setError] = useState(null);
  const [initialFetchDone, setInitialFetchDone] = useState(false);

  const fetchRecommendationsFunction = async () => {
    console.log("fetchRecommendationsFunction CALLED"); // 日志1：函数是否被调用
    setLoading(true);
    setError(null);
    try {
      // 过滤和验证城市数据，确保只发送有效的数据
      const validCities = cities.filter(c => 
        c && 
        typeof c.name === 'string' && 
        c.name.trim() !== '' && 
        typeof c.country === 'string' && 
        c.country.trim() !== ''
      );
      
      console.log("Original cities:", cities);
      console.log("Valid cities after filtering:", validCities);
      
      if (validCities.length === 0) {
        throw new Error('没有有效的城市数据来生成推荐');
      }
      
      const visitedCitiesForAPI = validCities.map(c => ({ 
        city: c.name.trim(), 
        country: c.country.trim() 
      }));
      
      console.log("Sending to API:", visitedCitiesForAPI); // 日志2：发送到API的数据
      console.log("Each city detail:", visitedCitiesForAPI.map((c, i) => `${i}: city="${c.city}" (${typeof c.city}), country="${c.country}" (${typeof c.country})`));

      const requestBody = { visitedCities: visitedCitiesForAPI };
      console.log("Full request body:", JSON.stringify(requestBody, null, 2));

      const response = await fetch('http://localhost:8001/test-api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
      console.log("API Response Status:", response.status); // 日志3：API响应状态

      if (!response.ok) {
        const errData = await response.json().catch(() => ({ detail: "API returned non-JSON error" }));
        console.error("API Error Data:", errData); // 日志4：API错误详情
        
        // 特别处理422验证错误
        if (response.status === 422 && errData.detail && Array.isArray(errData.detail)) {
          console.error("Validation errors:", errData.detail);
          const validationErrors = errData.detail.map(err => `${err.loc?.join('.')} - ${err.msg}`).join('; ');
          throw new Error(`数据验证失败: ${validationErrors}`);
        }
        
        throw new Error(errData.detail || `API request failed: ${response.status}`);
      }

      const data = await response.json();
      console.log("Data from API:", data); // 日志5：从API获取的数据
      setRecommendations(data || []);
    } catch (err) {
      console.error("Failed to fetch AI recommendations:", err); // 日志6：捕获到的错误
      setError(err.message);
      setRecommendations([]);
    } finally {
      setLoading(false);
      setInitialFetchDone(true); // 标记首次获取已尝试
      console.log("Fetching finished. Loading:", false, "Error:", error); // 日志7：获取结束状态
    }
  };

  // 如果希望页面加载时自动获取一次，或者基于cities变化获取
  useEffect(() => {
    // console.log("useEffect for fetching triggered. Cities length:", cities.length);
    // fetchRecommendationsFunction(); // 如果cities变化也重新获取，或者首次加载时获取
    // 为了明确按钮的作用，这里注释掉，仅通过按钮手动获取
  }, [cities]); // 依赖项，可以根据需求调整

  const handleAddCityToTravel = (rec) => {
    if (rec.latitude != null && rec.longitude != null) {
      const newCity = {
        name: rec.city,
        country: rec.country,
        coordinates: { lat: rec.latitude, lon: rec.longitude },
        notes: `AI Recommendation: ${rec.reason}`,
        photos: [],
        transportMode: 'plane',
        startDate: null,
        endDate: null
      };
      addCity(newCity.name, newCity.country, newCity.coordinates.lat, newCity.coordinates.lon, newCity.notes, newCity.photos, newCity.transportMode, newCity.startDate, newCity.endDate);
      if (showNotification) {
        showNotification(`${rec.city} added to your travel itinerary!`, 'success');
      } else {
        alert(`${rec.city} added to your travel itinerary!`);
      }
    } else {
      const message = `Cannot add ${rec.city}, location information is missing.`;
      if (showNotification) {
        showNotification(message, 'error');
      } else {
        alert(message);
      }
      console.warn("Cannot add city, missing latitude/longitude:", rec);
    }
  };

  const sliderSettings = {
    dots: true,
    infinite: recommendations.length > 3,
    speed: 500,
    slidesToShow: Math.min(3, recommendations.length),
    slidesToScroll: 1,
    swipeToSlide: true,
    adaptiveHeight: false,
    arrows: true,
    centerMode: false,
    variableWidth: false,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: Math.min(2, recommendations.length),
          slidesToScroll: 1,
        },
      },
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
          arrows: false,
          centerMode: true,
          centerPadding: '20px',
        },
      },
    ],
  };

  return (
    <PageContainer>
      <Header>
        <BackButton onClick={() => navigate('/dashboard')}><FaArrowLeft /> 返回地图</BackButton>
        <Title>AI Travel Recommendations</Title>
        <div style={{ width: '130px' }} /> {/* 调整占位符宽度以更好地居中标题 */}
      </Header>

      <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
        <FetchButton onClick={fetchRecommendationsFunction} disabled={loading}>
          {loading ? <FaSpinner className="fa-spin" /> : 'Get AI Recommendations'}
        </FetchButton>
      </div>

      {loading && !initialFetchDone && (
        null // 或者 <></>，如果条件满足但不渲染任何内容，则返回null
         // 首次加载时，按钮旁边的 spinner 已足够，这里可以不显示大的loading
         // 如果需要，可以加一个轻量级的提示，比如 <p>Loading recommendations...</p>
      )}

      {!loading && error && (
        <StatusContainer>
          <FaExclamationTriangle size={50} color="red" />
          <p>Sorry, there was an issue fetching recommendations:</p>
          <p>{error}</p>
        </StatusContainer>
      )}

      {!loading && !error && initialFetchDone && recommendations.length === 0 && (
        <StatusContainer>
          <p>No recommendations available at the moment. Try exploring more cities!</p>
        </StatusContainer>
      )}

      {recommendations.length > 0 && (
        <SliderWrapper>
          {recommendations.length === 1 ? (
            // 如果只有一个推荐，直接显示卡片而不使用轮播
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div style={{ width: '100%', maxWidth: '400px', padding: '0 10px' }}>
                <RecommendationCard>
                  <CardHeader>{recommendations[0].city}, {recommendations[0].country}</CardHeader>
                  <CardText>{recommendations[0].reason}</CardText>
                  {recommendations[0].inferred_preferences && recommendations[0].inferred_preferences.length > 0 && (
                    <CardSubText>Based on: {recommendations[0].inferred_preferences.join(', ')}</CardSubText>
                  )}
                  <AddButton
                    onClick={() => handleAddCityToTravel(recommendations[0])}
                    disabled={recommendations[0].latitude == null || recommendations[0].longitude == null}
                    title={recommendations[0].latitude == null || recommendations[0].longitude == null ? "Missing location info" : "Add to my travel"}
                  >
                    <FaPlusCircle />
                    {recommendations[0].latitude == null || recommendations[0].longitude == null ? "Cannot Add" : "Add to Travel"}
                  </AddButton>
                </RecommendationCard>
              </div>
            </div>
          ) : (
            // 多个推荐时使用轮播
            <StyledSlider {...sliderSettings}>
              {recommendations.map((rec, index) => (
                <div key={`recommendation-${index}-${rec.city?.replace(/\s+/g, '-')}`}>
                  <RecommendationCard>
                    <CardHeader>{rec.city}, {rec.country}</CardHeader>
                    <CardText>{rec.reason}</CardText>
                    {rec.inferred_preferences && rec.inferred_preferences.length > 0 && (
                      <CardSubText>Based on: {rec.inferred_preferences.join(', ')}</CardSubText>
                    )}
                    <AddButton
                      onClick={() => handleAddCityToTravel(rec)}
                      disabled={rec.latitude == null || rec.longitude == null}
                      title={rec.latitude == null || rec.longitude == null ? "Missing location info" : "Add to my travel"}
                    >
                      <FaPlusCircle />
                      {rec.latitude == null || rec.longitude == null ? "Cannot Add" : "Add to Travel"}
                    </AddButton>
                  </RecommendationCard>
                </div>
              ))}
            </StyledSlider>
          )}
        </SliderWrapper>
      )}
    </PageContainer>
  );
};

export default AIRecommendations;