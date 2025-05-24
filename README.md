# Travel Trails - 旅行轨迹管理系统

一个现代化的旅行轨迹管理系统，支持城市记录、照片管理、博客编写和AI智能推荐。

## 🌟 功能特性

- 🗺️ **3D地图展示**: 基于Cesium的3D地球展示旅行轨迹
- 📸 **照片管理**: 为每个城市添加和管理照片
- ✍️ **博客记录**: 记录每个城市的旅行体验
- 🤖 **AI推荐**: 基于已访问城市的智能旅行推荐
- 📊 **数据统计**: 旅行数据的可视化统计
- 👤 **用户管理**: 完整的用户注册、登录系统

## 🔧 技术栈

### 前端
- React 18
- Cesium (3D地图)
- Ant Design (UI组件)
- Axios (HTTP客户端)
- React Router (路由管理)

### 后端
- FastAPI (Python Web框架)
- Pydantic (数据验证)
- JSON文件存储 (简化数据管理)
- Deepseek AI API (智能推荐)

## 🚀 快速开始

### 环境要求
- Python 3.8+
- Node.js 16+
- Windows环境 (其他系统请使用等效命令)

### 一键测试项目
```bash
# 运行项目测试脚本
test_project.bat
```

### 分步骤安装

#### 1. 后端服务
```bash
# 方式1: 使用启动脚本 (推荐)
start_backend.bat

# 方式2: 手动启动
cd user_management
pip install -r requirements.txt
python main.py
```

#### 2. 前端服务
```bash
# 方式1: 使用启动脚本 (推荐)  
start_frontend.bat

# 方式2: 手动启动
cd frontend
npm install
npm start
```

#### 3. 访问应用
- 前端应用: http://localhost:3000
- 后端API: http://localhost:8001
- API文档: http://localhost:8001/docs

## ⚙️ 配置说明

### AI推荐功能配置
1. 在 `user_management` 目录下创建 `.env` 文件
2. 添加Deepseek API密钥:
   ```env
   DEEPSEEK_API_KEY=your_api_key_here
   ```
3. 如果不配置API密钥，AI推荐功能将不可用，但不影响其他功能

### 端口配置
- 后端默认端口: 8001
- 前端默认端口: 3000
- 可通过环境变量 `PORT` 和 `HOST` 修改后端配置

## 📁 项目结构

```
TravelTrails/
├── frontend/                 # React前端应用
│   ├── src/
│   │   ├── components/      # React组件
│   │   ├── pages/          # 页面组件
│   │   ├── services/       # API服务
│   │   └── context/        # React Context
│   └── package.json
├── user_management/         # FastAPI后端
│   ├── main.py             # 主应用文件
│   ├── travel_routes.py    # 旅行相关API
│   ├── user_models.py      # 数据模型
│   ├── users.json          # 用户数据存储
│   └── requirements.txt    # Python依赖
├── demo/                   # 演示项目
├── AI-APIdemo/            # AI API测试
├── start_backend.bat      # 后端启动脚本
├── start_frontend.bat     # 前端启动脚本
├── test_project.bat       # 项目测试脚本
└── README.md
```

## 🔗 API 接口

### 认证相关
- `POST /auth/register` - 用户注册
- `POST /auth/login` - 用户登录

### 旅行管理
- `GET /travel/{username}/cities` - 获取用户城市列表
- `POST /travel/{username}/cities` - 添加新城市
- `PUT /travel/{username}/cities/{city_index}/blog` - 更新城市博客
- `DELETE /travel/{username}/cities/{city_index}` - 删除城市

### 照片管理
- `POST /travel/{username}/cities/{city_index}/photos` - 添加照片
- `DELETE /travel/{username}/cities/{city_index}/photos/{photo_index}` - 删除照片

### AI推荐
- `POST /travel/ai/recommendations` - 获取AI推荐

## 📝 使用说明

1. **注册账户**: 访问前端应用，创建新用户账户
2. **添加城市**: 在地图上添加访问过的城市
3. **上传照片**: 为每个城市添加旅行照片
4. **编写博客**: 记录每个城市的旅行体验
5. **查看统计**: 浏览旅行数据统计图表
6. **AI推荐**: 基于访问历史获取新的旅行推荐

## 🐛 故障排除

### 常见问题

1. **后端启动失败**
   - 检查Python版本是否为3.8+
   - 确保已安装所有依赖: `pip install -r requirements.txt`
   - 检查端口8001是否被占用

2. **前端启动失败**
   - 检查Node.js版本是否为16+
   - 删除 `node_modules` 文件夹并重新运行 `npm install`
   - 检查端口3000是否被占用

3. **API连接失败**
   - 确保后端服务已启动并运行在8001端口
   - 检查防火墙设置
   - 查看浏览器控制台是否有CORS错误

4. **AI推荐不工作**
   - 检查是否正确配置了 `DEEPSEEK_API_KEY`
   - 验证API密钥是否有效
   - 查看后端控制台的错误日志

## 📈 项目状态

- ✅ 核心功能完成
- ✅ 用户认证系统
- ✅ 城市和照片管理
- ✅ AI推荐功能
- 🔄 正在开发: 交通方式可视化
- 🔄 正在开发: 统计页面增强

## 🤝 贡献

欢迎提交Issue和Pull Request来改进项目！

## 📄 许可证

MIT License