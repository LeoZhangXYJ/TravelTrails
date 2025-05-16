# 用户管理系统 API

## 项目简介

这是一个基于FastAPI开发的用户管理系统API，提供用户的创建、查询、更新、删除和登录功能，以及旅行轨迹记录功能。系统支持用户名、密码、邮箱和年龄的验证，并提供分页和过滤查询功能。用户可以记录他们的旅行轨迹，包括城市信息、照片和博客内容。

## 功能特点

- 用户注册：支持用户名、密码、邮箱和年龄的验证
- 用户更新：支持更新用户邮箱、密码和年龄
- 用户删除：支持删除指定用户
- 用户登录：验证用户名和密码
- 旅行轨迹：记录用户访问的城市、照片和旅行博客


## 技术栈

- FastAPI：高性能Web框架
- Pydantic：数据验证和序列化
- JSON：数据存储

## 安装和运行

1. 安装依赖：
```bash
pip install fastapi uvicorn pydantic email-validator
```

2. 运行应用：
```bash
python main.py
```

应用将在 http://127.0.0.1:8000 启动

## API 接口

### 1. 欢迎页面
- **GET /** - 返回欢迎信息

### 2. 用户管理
- **POST /users/** - 创建新用户
- **GET /users/{username}** - 获取指定用户信息
- **GET /users** - 获取用户列表，支持分页和年龄过滤
- **PUT /users/{username}** - 更新用户信息
- **DELETE /users/{username}** - 删除用户

### 3. 用户登录
- **POST /login** - 用户登录验证

### 4. 旅行轨迹管理
- **GET /travel/{username}/cities** - 获取用户的所有城市
- **POST /travel/{username}/cities** - 添加新城市
- **DELETE /travel/{username}/cities/{city_index}** - 删除城市
- **PUT /travel/{username}/cities/{city_index}/blog** - 更新城市博客
- **POST /travel/{username}/cities/{city_index}/photos** - 上传照片到城市
- **DELETE /travel/{username}/cities/{city_index}/photos/{photo_index}** - 删除城市照片

## 数据验证规则

- **用户名**：3-50个字符，支持字母、数字、下划线和中文
- **密码**：至少8个字符，必须包含至少一个大写字母和一个数字
- **邮箱**：标准邮箱格式验证
- **年龄**：必须为正整数

## 示例

### 创建用户
```json
POST /users/
{
  "username": "张三",
  "email": "zhangsan@example.com",
  "password": "Password123",
  "age": 25
}
```

### 查询用户列表（带过滤）
```
GET /users?offset=0&limit=10&min_age=18&max_age=30
```

### 添加城市
```json
POST /travel/张三/cities
{
  "city": "北京",
  "country": "中国",
  "latitude": 39.9042,
  "longitude": 116.4074,
  "transport_mode": "飞机"
}
```

### 更新城市博客
```json
PUT /travel/张三/cities/0/blog
{
  "blog": "北京是一座历史悠久的城市，有着丰富的文化遗产..."
}
```

## 文档

启动应用后，访问 http://127.0.0.1:8000/docs 可查看自动生成的API文档。
