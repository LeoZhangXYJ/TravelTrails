import React from 'react';
import { Card, Switch, Space, Tooltip } from 'antd';
import { FaGlobe, FaMoon, FaMapMarkedAlt, FaMap, FaMapSigns, FaHome } from 'react-icons/fa';

const LayerSwitcher = ({ onSwitchLayer, currentLayer }) => {
  // 图层配置
  const layers = [
    { id: 'tianditu-vector', name: '天地图-矢量', icon: <FaMap />, description: '天地图矢量地图服务' },
    { id: 'nightEarth', name: '夜间灯光图', icon: <FaMoon />, description: '夜间地球灯光图层' },
    { id: 'tianditu', name: '天地图-影像', icon: <FaGlobe />, description: '天地图影像地图服务' },
    { id: 'gaode', name: '高德地图', icon: <FaMapSigns />, description: '高德地图路网图层' }
  ];

  // 处理图层切换
  const handleLayerChange = (checked, layerId) => {
    if (checked) {
      onSwitchLayer(layerId);
    }
  };

  return (
    <Card title="底图切换" style={{ marginBottom: '16px' }}>
      <Space direction="vertical" style={{ width: '100%' }}>
        {layers.map(layer => (
          <div key={layer.id} style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            padding: '4px 0'
          }}>
            <Tooltip title={layer.description}>
              <Space>
                <span style={{ fontSize: '18px', color: '#1890ff' }}>{layer.icon}</span>
                <span style={{ fontSize: '14px' }}>{layer.name}</span>
              </Space>
            </Tooltip>
            <Switch 
              checked={currentLayer === layer.id}
              onChange={(checked) => handleLayerChange(checked, layer.id)}
              size="small"
            />
          </div>
        ))}
      </Space>
    </Card>
  );
};

export default LayerSwitcher; 