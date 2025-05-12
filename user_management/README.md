# 用户管理系统 API

## 项目简介

这是一个基于FastAPI开发的用户管理系统API，提供用户的创建、查询、更新、删除和登录功能。系统支持用户名、密码、邮箱和年龄的验证，并提供分页和过滤查询功能。

## 功能特点

- 用户注册：支持用户名、密码、邮箱和年龄的验证
- 用户查询：支持单个用户查询和批量查询
- 用户更新：支持更新用户邮箱、密码和年龄
- 用户删除：支持删除指定用户
- 用户登录：验证用户名和密码
- 数据过滤：支持按年龄范围过滤用户
- 分页功能：支持分页查询用户列表

## 技术栈

- FastAPI：高性能Web框架
- Pydantic：数据验证和序列化
- JSON：数据存储

## 安装和运行

1. 安装依赖：
```bash
pip install fastapi uvicorn pydantic
```
同时在课堂下载包的基础上还需要下载emailStr相关包
pip install email-validator

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

## 文档

启动应用后，访问 http://127.0.0.1:8000/docs 可查看自动生成的API文档。