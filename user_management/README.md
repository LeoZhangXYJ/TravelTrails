# Travel Trails - 旅行轨迹管理系统

## 项目简介

这是一个基于 FastAPI 和 React 开发的旅行轨迹管理系统，提供用户的创建、查询、更新、删除和登录功能，以及旅行轨迹记录功能。系统支持用户名、密码、邮箱和年龄的验证，并提供分页和过滤查询功能。用户可以记录他们的旅行轨迹，包括城市信息、照片和博客内容。

## 功能特点

- 用户注册：支持用户名、密码、邮箱和年龄的验证
- 用户更新：支持更新用户邮箱、密码和年龄
- 用户删除：支持删除指定用户
- 用户登录：验证用户名和密码
- 旅行轨迹：记录用户访问的城市、照片和旅行博客
- AI 智能推荐：基于用户旅行历史推荐新的目的地
- 地图可视化：使用 Cesium 展示旅行轨迹

## 技术栈

### 后端
- FastAPI：高性能 Web 框架
- Python 3.8+：编程语言
- Pydantic：数据验证和序列化
- SQLite/JSON：数据存储
- Deepseek AI API：智能推荐
- Uvicorn：ASGI 服务器

### 前端
- React 18：前端框架
- Cesium：3D 地图可视化
- Ant Design：UI 组件库
- Axios：HTTP 客户端
- React Router：路由管理
- Context API：状态管理

## 环境配置

### 1. 后端环境配置

#### 1.1 Python 环境
1. 安装 Python 3.8 或更高版本
   ```bash
   # 检查 Python 版本
   python --version
   ```

2. 创建并激活虚拟环境
   ```bash
   # Windows
   python -m venv venv
   .\venv\Scripts\activate

   # Linux/Mac
   python3 -m venv venv
   source venv/bin/activate
   ```

3. 安装依赖包
   ```bash
   # 更新 pip
   python -m pip install --upgrade pip

   # 安装依赖
   pip install -r requirements.txt
   ```

#### 1.2 环境变量配置
1. 在 `user_management` 目录下创建 `.env` 文件
   ```bash
   # Windows
   echo. > .env

   # Linux/Mac
   touch .env
   ```

2. 配置环境变量
   ```env
   # Deepseek API 配置
   DEEPSEEK_API_KEY=your_api_key_here

   # 数据库配置
   DATABASE_URL=sqlite:///./travel_trails.db

   # 服务器配置
   HOST=0.0.0.0
   PORT=8000

   # CORS 配置
   CORS_ORIGINS=http://localhost:3000
   ```

#### 1.3 数据库配置
1. JSON 存储（默认）
   - 系统会自动创建 `users.json` 文件
   - 无需额外配置

2. SQLite 数据库（可选）
   ```bash
   # 创建数据库
   sqlite3 travel_trails.db

   # 初始化数据库表
   python init_db.py
   ```

### 2. 前端环境配置

#### 2.1 Node.js 环境
1. 安装 Node.js 16+ 和 npm
   ```bash
   # 检查 Node.js 版本
   node --version

   # 检查 npm 版本
   npm --version
   ```

2. 安装依赖
   ```bash
   # 进入前端项目目录
   cd frontend

   # 安装依赖
   npm install
   ```

#### 2.2 前端环境变量
1. 在 `frontend` 目录下创建 `.env` 文件
   ```bash
   # Windows
   echo. > .env

   # Linux/Mac
   touch .env
   ```

2. 配置环境变量
   ```env
   # API 配置
   REACT_APP_API_URL=http://localhost:8000

   # Cesium 配置
   REACT_APP_CESIUM_TOKEN=your_cesium_token_here
   ```

## 运行项目

### 1. 启动后端服务
```bash
# 进入后端目录
cd user_management

# 启动服务
python main.py
```
服务将在 http://localhost:8000 运行

### 2. 启动前端服务
```bash
# 进入前端目录
cd frontend

# 启动开发服务器
npm start
```
前端将在 http://localhost:3000 运行

## API 文档

启动后端服务后，可以访问以下地址查看 API 文档：

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 常见问题

### 1. 环境变量问题
- 确保 `.env` 文件存在且格式正确
- 检查环境变量名称是否与代码中的一致
- 重启服务以使环境变量生效

### 2. 依赖安装问题
```bash
# 清除 pip 缓存
pip cache purge

# 重新安装依赖
pip install -r requirements.txt

# 如果还有问题，尝试指定版本
pip install fastapi==0.68.0 uvicorn==0.15.0
```

### 3. 端口占用问题
```bash
# Windows
netstat -ano | findstr :8000
taskkill /PID <进程ID> /F

# Linux/Mac
lsof -i :8000
kill -9 <进程ID>
```

### 4. CORS 问题
- 检查后端 CORS 配置是否正确
- 确保前端请求 URL 与后端 CORS 配置匹配
- 检查请求头是否包含正确的 Content-Type

### 5. 数据库问题
- 确保数据库文件有正确的读写权限
- 检查数据库连接字符串是否正确
- 验证数据库表结构是否完整

## 开发指南

### 添加新功能
1. 后端开发
   - 在 `travel_routes.py` 中添加新的路由
   - 在 `user_models.py` 中定义数据模型
   - 在 `crud.py` 中实现数据操作

2. 前端开发
   - 在 `src/components` 中创建新组件
   - 在 `src/services` 中添加 API 调用
   - 更新路由配置

### 代码规范
- 使用 Black 进行代码格式化
- 使用 isort 进行导入排序
- 遵循 PEP 8 编码规范
- 使用 ESLint 和 Prettier 格式化前端代码

## 部署

### 后端部署
1. 准备服务器环境
2. 配置 Nginx 反向代理
3. 使用 Gunicorn 运行 FastAPI 应用

### 前端部署
1. 构建生产版本
   ```bash
   npm run build
   ```
2. 配置 Nginx 托管静态文件
3. 设置 HTTPS 证书

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
