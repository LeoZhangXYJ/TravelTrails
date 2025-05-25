import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import Slider from 'react-slick';
import { FaArrowLeft, FaPlusCircle, FaSpinner, FaExclamationTriangle, FaPlane, FaTrain, FaCar, FaBus, FaShip, FaBicycle, FaWalking, FaCalendarAlt } from 'react-icons/fa';
import { MdOutlineQuestionMark } from "react-icons/md";
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

// 交通方式选择模态框样式
const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 12px;
  padding: 2rem;
  max-width: 400px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
`;

const ModalTitle = styled.h3`
  margin-bottom: 1.5rem;
  color: #333;
  text-align: center;
`;

const TransportGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const TransportOption = styled.button`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: #007bff;
    background: #f8f9ff;
  }
  
  &.selected {
    border-color: #007bff;
    background: #e6f3ff;
  }
  
  svg {
    font-size: 1.5rem;
    color: #007bff;
  }
  
  span {
    font-size: 0.9rem;
    color: #333;
  }
`;

const ModalButtons = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
`;

const ModalButton = styled.button`
  padding: 0.6rem 1.2rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s ease;
  
  &.confirm {
    background: #28a745;
    color: white;
    
    &:hover {
      background: #218838;
    }
  }
  
  &.cancel {
    background: #6c757d;
    color: white;
    
    &:hover {
      background: #545b62;
    }
  }
`;

// 日期选择相关样式
const DateSection = styled.div`
  margin: 1.5rem 0;
`;

const DateSectionTitle = styled.h4`
  margin-bottom: 1rem;
  color: #333;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  svg {
    color: #007bff;
  }
`;

const DateInputGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
`;

const DateInput = styled.input`
  padding: 0.75rem;
  border: 2px solid #e2e8f0;
  border-radius: 6px;
  font-size: 0.9rem;
  transition: border-color 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: #007bff;
  }
  
  &:invalid {
    border-color: #dc3545;
  }
`;

const DateLabel = styled.label`
  font-size: 0.85rem;
  color: #666;
  margin-bottom: 0.25rem;
  display: block;
`;

const AIRecommendations = () => {
  const navigate = useNavigate();
  const { cities, addCity, checkDateConflict, getDisabledDates } = useTravelContext();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false); // 初始不加载，等待按钮点击或useEffect触发
  const [error, setError] = useState(null);
  const [initialFetchDone, setInitialFetchDone] = useState(false);
  
  // 交通方式选择相关状态
  const [showTransportModal, setShowTransportModal] = useState(false);
  const [selectedCity, setSelectedCity] = useState(null);
  const [selectedTransport, setSelectedTransport] = useState('plane');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // 交通方式选项
  const transportOptions = [
    { value: 'plane', label: '飞机', icon: FaPlane },
    { value: 'train', label: '火车', icon: FaTrain },
    { value: 'car', label: '汽车', icon: FaCar },
    { value: 'bus', label: '巴士', icon: FaBus },
    { value: 'boat', label: '轮船', icon: FaShip },
    { value: 'bicycle', label: '自行车', icon: FaBicycle },
    { value: 'walk', label: '步行', icon: FaWalking },
    { value: 'other', label: '其他', icon: MdOutlineQuestionMark },
  ];

  const fetchRecommendationsFunction = async () => {
    console.log("fetchRecommendationsFunction CALLED");
    setLoading(true);
    setError(null);
    
    // 创建一个超时控制器
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000); // 120秒超时
    
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
      
      // 修复：前端使用'name'属性，但后端期望'city'属性
      const visitedCitiesForAPI = validCities.map(c => ({ 
        city: c.name.trim(),  // 前端city对象使用'name'属性
        country: c.country.trim() 
      }));
      
      console.log("Sending to API:", visitedCitiesForAPI);
      console.log("Each city detail:", visitedCitiesForAPI.map((c, i) => `${i}: city="${c.city}" (${typeof c.city}), country="${c.country}" (${typeof c.country})`));

      const requestBody = { visitedCities: visitedCitiesForAPI };
      console.log("Full request body:", JSON.stringify(requestBody, null, 2));

      const response = await fetch('http://localhost:8000/ai/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: controller.signal, // 添加abort信号
      });
      
      // 清除超时定时器
      clearTimeout(timeoutId);
      
      console.log("API Response Status:", response.status);

      if (!response.ok) {
        const errData = await response.json().catch(() => ({ detail: "API returned non-JSON error" }));
        console.error("API Error Data:", errData);
        
        // 特别处理422验证错误
        if (response.status === 422 && errData.detail && Array.isArray(errData.detail)) {
          console.error("Validation errors:", errData.detail);
          const validationErrors = errData.detail.map(err => `${err.loc?.join('.')} - ${err.msg}`).join('; ');
          throw new Error(`数据验证失败: ${validationErrors}`);
        }
        
        throw new Error(errData.detail || `API request failed: ${response.status}`);
      }

      const data = await response.json();
      console.log("Data from API:", data);
      setRecommendations(data || []);
    } catch (err) {
      // 清除超时定时器
      clearTimeout(timeoutId);
      
      console.error("Failed to fetch AI recommendations:", err);
      
      if (err.name === 'AbortError') {
        setError('请求超时，AI推荐需要较长时间处理，请稍后重试');
      } else {
        setError(err.message);
      }
      setRecommendations([]);
    } finally {
      setLoading(false);
      setInitialFetchDone(true);
      console.log("Fetching finished. Loading:", false, "Error:", error);
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
      setSelectedCity(rec);
      setSelectedTransport('plane'); // 默认选择飞机
      // 设置默认日期为明天和后天（因为是推荐，必须是未来）
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfterTomorrow = new Date();
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
      
      setStartDate(tomorrow.toISOString().split('T')[0]);
      setEndDate(dayAfterTomorrow.toISOString().split('T')[0]);
      setShowTransportModal(true);
    } else {
      const message = `无法添加 ${rec.city}，缺少位置信息。`;
      alert(message);
      console.warn("Cannot add city, missing latitude/longitude:", rec);
    }
  };

  const handleConfirmAddCity = () => {
    if (selectedCity) {
      // 验证日期
      if (!startDate || !endDate) {
        alert('请选择旅行日期');
        return;
      }
      
      const today = new Date().toISOString().split('T')[0];
      if (startDate <= today) {
        alert('推荐城市的开始日期必须是未来日期');
        return;
      }
      
      if (endDate < startDate) {
        alert('结束日期不能早于开始日期');
        return;
      }
      
      // 检查日期冲突
      const conflictResult = checkDateConflict(
        new Date(startDate).toISOString(),
        new Date(endDate).toISOString()
      );
      
      if (conflictResult && conflictResult.conflict) {
        alert(
          `选择的日期与 "${conflictResult.conflictCity}" 的旅行时间冲突！\n` +
          `冲突日期：${conflictResult.conflictStart.toLocaleDateString()} - ${conflictResult.conflictEnd.toLocaleDateString()}`
        );
        return;
      }
      
      const newCityData = {
        name: selectedCity.city,
        country: selectedCity.country,
        coordinates: { lat: selectedCity.latitude, lon: selectedCity.longitude },
        notes: `AI Recommendation: ${selectedCity.reason}`,
        photos: [],
        transportMode: selectedTransport,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
      };
      
      addCity(newCityData);
      alert(`${selectedCity.city} 已添加到您的旅行计划！`);
      
      setShowTransportModal(false);
      setSelectedCity(null);
    }
  };

  const handleCancelAddCity = () => {
    setShowTransportModal(false);
    setSelectedCity(null);
    setSelectedTransport('plane');
    setStartDate('');
    setEndDate('');
  };

  // 获取禁用日期的字符串格式
  const getDisabledDatesForInput = () => {
    const disabledDates = getDisabledDates();
    return disabledDates.map(date => date.toISOString().split('T')[0]);
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
        <Title>AI 旅行推荐</Title>
        <div style={{ width: '130px' }} /> {/* 调整占位符宽度以更好地居中标题 */}
      </Header>

      <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
        <FetchButton onClick={fetchRecommendationsFunction} disabled={loading}>
          {loading ? <FaSpinner className="fa-spin" /> : '获取 AI 推荐'}
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
          <p>抱歉，获取推荐时出现问题：</p>
          <p>{error}</p>
        </StatusContainer>
      )}

      {!loading && !error && initialFetchDone && recommendations.length === 0 && (
        <StatusContainer>
          <p>暂时没有可用的推荐。请尝试探索更多城市！</p>
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
                    <CardSubText>基于偏好：{recommendations[0].inferred_preferences.join('、')}</CardSubText>
                  )}
                  <AddButton
                    onClick={() => handleAddCityToTravel(recommendations[0])}
                    disabled={recommendations[0].latitude == null || recommendations[0].longitude == null}
                    title={recommendations[0].latitude == null || recommendations[0].longitude == null ? "缺少位置信息" : "添加到我的旅行"}
                  >
                    <FaPlusCircle />
                    {recommendations[0].latitude == null || recommendations[0].longitude == null ? "无法添加" : "添加到旅行"}
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
                      <CardSubText>基于偏好：{rec.inferred_preferences.join('、')}</CardSubText>
                    )}
                    <AddButton
                      onClick={() => handleAddCityToTravel(rec)}
                      disabled={rec.latitude == null || rec.longitude == null}
                      title={rec.latitude == null || rec.longitude == null ? "缺少位置信息" : "添加到我的旅行"}
                    >
                      <FaPlusCircle />
                      {rec.latitude == null || rec.longitude == null ? "无法添加" : "添加到旅行"}
                    </AddButton>
                  </RecommendationCard>
                </div>
              ))}
            </StyledSlider>
          )}
        </SliderWrapper>
      )}
      
      {/* 交通方式选择模态框 */}
      {showTransportModal && (
        <Modal onClick={handleCancelAddCity}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalTitle>添加 {selectedCity?.city} 到旅行计划</ModalTitle>
            
            <TransportGrid>
              {transportOptions.map((option) => {
                const IconComponent = option.icon;
                return (
                  <TransportOption
                    key={option.value}
                    className={selectedTransport === option.value ? 'selected' : ''}
                    onClick={() => setSelectedTransport(option.value)}
                  >
                    <IconComponent />
                    <span>{option.label}</span>
                  </TransportOption>
                );
              })}
            </TransportGrid>
            
            <DateSection>
              <DateSectionTitle>
                <FaCalendarAlt />
                选择旅行日期（必须是未来日期）
              </DateSectionTitle>
              <DateInputGrid>
                <div>
                  <DateLabel>开始日期</DateLabel>
                  <DateInput
                    type="date"
                    value={startDate}
                    min={new Date(Date.now() + 86400000).toISOString().split('T')[0]} // 明天
                    onChange={(e) => {
                      const selectedDate = e.target.value;
                      const disabledDates = getDisabledDatesForInput();
                      if (disabledDates.includes(selectedDate)) {
                        alert('该日期已被其他旅行计划占用，请选择其他日期');
                        return;
                      }
                      setStartDate(selectedDate);
                    }}
                    required
                  />
                </div>
                <div>
                  <DateLabel>结束日期</DateLabel>
                  <DateInput
                    type="date"
                    value={endDate}
                    min={startDate || new Date(Date.now() + 86400000).toISOString().split('T')[0]}
                    onChange={(e) => {
                      const selectedDate = e.target.value;
                      const disabledDates = getDisabledDatesForInput();
                      if (disabledDates.includes(selectedDate)) {
                        alert('该日期已被其他旅行计划占用，请选择其他日期');
                        return;
                      }
                      setEndDate(selectedDate);
                    }}
                    required
                  />
                </div>
              </DateInputGrid>
            </DateSection>
            
            <ModalButtons>
              <ModalButton className="cancel" onClick={handleCancelAddCity}>
                取消
              </ModalButton>
              <ModalButton className="confirm" onClick={handleConfirmAddCity}>
                确认添加
              </ModalButton>
            </ModalButtons>
          </ModalContent>
        </Modal>
      )}
    </PageContainer>
  );
};

export default AIRecommendations;