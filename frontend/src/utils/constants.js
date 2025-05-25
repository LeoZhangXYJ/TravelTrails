// 侧边栏宽度常量
export const SIDEBAR_EXPANDED_WIDTH = 380;
export const SIDEBAR_COLLAPSED_WIDTH = 80;

// 地图相关常量
export const TARGET_CITY_HEIGHT = 50000;
export const TARGET_CITY_PITCH = -0.5;

// 照片展示常量
export const AUTOPLAY_DELAY = 3000;

// API相关常量
export const API_BASE_URL = 'http://localhost:8000';

// 交通方式选项
export const TRANSPORT_MODES = {
  plane: { label: '飞机', icon: 'fas fa-plane' },
  train: { label: '火车', icon: 'fas fa-train' },
  car: { label: '汽车', icon: 'fas fa-car' },
  bus: { label: '巴士', icon: 'fas fa-bus' },
  boat: { label: '轮船/渡轮', icon: 'fas fa-ship' },
  bicycle: { label: '自行车', icon: 'fas fa-bicycle' },
  walk: { label: '步行', icon: 'fas fa-walking' },
  other: { label: '其他', icon: 'fas fa-question' },
  home: { label: '起点', icon: 'fas fa-home' }
}; 