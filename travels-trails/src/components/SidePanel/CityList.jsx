import React, { useState } from 'react';
import { useTravelContext } from '../../context/TravelContext';

// 假设你有一个地理编码的辅助函数
async function geocodeCity(cityName) {
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cityName)}`);
    const data = await response.json();
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon),
        country: data[0].display_name.split(',').pop().trim()
      };
    }
    throw new Error('未找到城市');
  } catch (error) {
    console.error('地理编码错误:', error);
    alert('地理编码错误: ' + error.message);
    return null;
  }
}

const CityList = () => {
  const [cityName, setCityName] = useState('');
  const [transportMode, setTransportMode] = useState('飞机');
  // 确保从 context 中解构了 addCityToContext 和 setCurrentCityIndex
  const { addCityToContext, setCurrentCityIndex, cities } = useTravelContext();

  const handleAddCity = async () => {
    if (!cityName.trim()) {
      alert('请输入城市名称');
      return;
    }
    try {
      const location = await geocodeCity(cityName);
      if (location) {
        const newCity = {
          id: Date.now(), // 简单唯一ID
          name: cityName,
          transportMode: transportMode,
          coordinates: { lon: location.lon, lat: location.lat },
          country: location.country,
          photos: [],
          blog: ''
        };
        addCityToContext(newCity); // 使用从 context 获取的 addCityToContext 函数
        setCurrentCityIndex(cities.length); // 更新当前城市索引为新添加的城市
                                            // 注意: cities.length 此时是添加前的长度，所以新索引是 cities.length
                                            // 如果 addCityToContext 是异步更新的，这里可能需要调整或在useEffect中处理
        setCityName(''); // 清空输入框
      }
      // GeocodeCity 内部已经处理了 alert，所以这里不需要额外的 else
    } catch (error) {
      // 这个 catch 主要用于捕获 geocodeCity 内部未处理的意外错误，或 addCityToContext 可能抛出的错误
      console.error('添加城市操作失败:', error);
      alert('添加城市操作失败: ' + error.message);
    }
  };

  return (
    <div className="controls">
      <input
        type="text"
        id="cityInput"
        placeholder="输入城市名称"
        value={cityName}
        onChange={(e) => setCityName(e.target.value)}
      />
      <select 
        id="transportMode" 
        value={transportMode} 
        onChange={(e) => setTransportMode(e.target.value)}
      >
        <option value="飞机">飞机</option>
        <option value="火车">火车</option>
        <option value="汽车">汽车</option>
        <option value="轮船">轮船</option>
      </select>
      <button id="addCity" onClick={handleAddCity}>添加城市</button>
    </div>
  );
};

export default CityList;