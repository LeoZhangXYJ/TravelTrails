import React from 'react';
import { Card, Switch, Space, Tooltip } from 'antd';
import { FaGlobe, FaMoon, FaMapMarkedAlt, FaMap, FaMapSigns } from 'react-icons/fa';

const LayerSwitcher = ({ onSwitchLayer, currentLayer }) => {  // 图层配置
  const layers = [
    { id: 'BingMapsRoad', name: 'Bing 道路地图', icon: <FaMap />, description: '微软 Bing 地图道路图层' },
    { id: 'nightEarth', name: '夜间灯光图', icon: <FaMoon />, description: '夜间地球灯光图层' },
    { id: 'onlylabel', name: '标签地图', icon: <FaMapMarkedAlt />, description: '仅显示地名标签的地图' },
    { id: 'tianditu', name: '天地图', icon: <FaGlobe />, description: '中国国家地理信息公共服务平台' },
    { id: 'gaode', name: '高德地图', icon: <FaMapSigns />, description: '高德地图路网图层' }
  ];
  // 处理图层切换
  const handleLayerChange = (checked, layerId) => {    if (checked) {
      onSwitchLayer(layerId);    }
  };
  return (    <Card title="底图切换" style={{ marginBottom: '16px' }}>
      <Space direction="vertical" style={{ width: '100%' }}>        {layers.map(layer => (
          <div key={layer.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>            <Tooltip title={layer.description}>
              <Space>                <span style={{ fontSize: '18px' }}>{layer.icon}</span>
                <span>{layer.name}</span>              </Space>
            </Tooltip>            <Switch 
              checked={currentLayer === layer.id}              onChange={(checked) => handleLayerChange(checked, layer.id)}
            />          </div>
        ))}      </Space>
    </Card>  );
};

export default LayerSwitcher;























