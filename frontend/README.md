# Travel Trails - 旅行轨迹可视化系统

Travel Trails 是一个基于 React 和 Cesium 的 WebGIS 旅行轨迹记录应用。它允许用户记录他们的旅行轨迹，上传照片，并在地球上可视化他们的旅程。通过直观的 3D 界面，用户可以轻松管理和展示他们的旅行经历。

## 功能特点

- 互动式 3D 地球展示
  - 支持缩放、旋转和平移
  - 昼夜效果和大气层渲染
  - 自定义地图样式和底图切换
- 城市管理
  - 添加/删除城市
  - 指定交通方式
  - 城市信息编辑
- 轨迹可视化
  - 城市间连线
  - 动画飞行浏览
  - 自定义轨迹样式
- 媒体记录
  - 照片上传和管理
  - 照片围绕城市点展示
  - 照片预览和删除
- 旅行博客
  - 为每个城市记录旅行故事
  - Markdown 格式支持
  - 实时预览
- 旅行统计
  - 已访问城市数
  - 总旅行距离
  - 访问国家数量
  - 旅行时间线

## 技术栈

### 核心框架
- React 18：前端框架
- Cesium：3D 地图引擎
- Resium：React 的 Cesium 绑定库

### UI 组件
- Ant Design：UI 组件库
- Styled Components：样式管理
- React Icons：图标库

### 状态管理
- Context API：全局状态管理
- React Router：路由管理

### 工具库
- Axios：HTTP 客户端
- OpenStreetMap Nominatim API：地理编码服务
- date-fns：日期处理
- react-markdown：Markdown 渲染

## 环境配置

### 1. 开发环境要求
- Node.js 16+
- npm 8+ 或 yarn 1.22+
- 现代浏览器（Chrome、Firefox、Safari、Edge）

### 2. 安装步骤

1. 克隆项目
   ```bash
   git clone <repository-url>
   cd travels-trails
   ```

2. 安装依赖
   ```bash
   # 使用 npm
   npm install

   # 或使用 yarn
   yarn install
   ```

3. 配置环境变量
   ```bash
   # 创建 .env 文件
   cp .env.example .env
   ```
   
   编辑 `.env` 文件：
   ```env
   # API 配置
   REACT_APP_API_URL=http://localhost:8000

   # Cesium 配置
   REACT_APP_CESIUM_TOKEN=your_cesium_token_here

   # 地图服务配置
   REACT_APP_MAP_TILE_URL=https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png
   ```

4. 启动开发服务器
   ```bash
   npm start
   # 或
   yarn start
   ```

## 使用指南

### 1. 添加城市
1. 在搜索框中输入城市名称
2. 从下拉列表中选择正确的城市
3. 选择到达该城市的交通方式
4. 点击"添加城市"按钮

### 2. 管理城市
1. 在城市列表中查看所有添加的城市
2. 点击城市名称查看详情
3. 使用编辑按钮修改城市信息
4. 使用删除按钮移除城市

### 3. 照片管理
1. 选择目标城市
2. 点击"上传照片"按钮
3. 选择要上传的图片文件
4. 等待上传完成
5. 在照片库中查看和管理照片

### 4. 旅行博客
1. 选择要记录的城市
2. 点击"编辑博客"按钮
3. 使用 Markdown 编辑器编写内容
4. 点击"保存"按钮

### 5. 轨迹浏览
1. 确保至少添加了两个城市
2. 点击"开始浏览"按钮
3. 使用控制面板调整浏览速度
4. 点击"停止"按钮结束浏览

## 开发指南

### 项目结构
```
src/
  ├── components/     # 组件目录
  ├── context/       # Context 定义
  ├── hooks/         # 自定义 Hooks
  ├── services/      # API 服务
  ├── styles/        # 样式文件
  ├── utils/         # 工具函数
  └── App.js         # 应用入口
```

### 添加新功能
1. 在 `components` 目录创建新组件
2. 在 `services` 目录添加 API 调用
3. 在 `context` 目录更新状态管理
4. 更新路由配置

### 代码规范
- 使用 ESLint 进行代码检查
- 使用 Prettier 进行代码格式化
- 遵循 React 最佳实践
- 编写组件文档和测试

## 常见问题

### 1. 地图加载问题
- 检查网络连接
- 验证 Cesium token 是否正确
- 清除浏览器缓存

### 2. 照片上传失败
- 检查文件大小限制
- 确认文件格式支持
- 验证网络连接

### 3. 性能优化
- 使用 React.memo 优化组件
- 实现虚拟滚动
- 优化图片加载

## 部署

### 1. 构建生产版本
```bash
npm run build
# 或
yarn build
```

### 2. 部署步骤
1. 配置 Nginx 服务器
2. 设置 HTTPS 证书
3. 配置反向代理
4. 部署静态文件

## 贡献指南

1. Fork 项目
2. 创建特性分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 许可证

MIT License

## 联系方式

如有问题或建议，请提交 Issue 或联系项目维护者。
