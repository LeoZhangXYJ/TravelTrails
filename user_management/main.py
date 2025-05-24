from fastapi import FastAPI, HTTPException, status, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from typing import Optional
import json
import os
import uvicorn
import uuid
import base64
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

# 导入本地模块
from travel_routes import router as travel_router

app = FastAPI(
    title="Travel Trails API",
    description="旅行轨迹管理系统API",
    version="1.0.0"
)

# CORS配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 数据模型
class UserBase(BaseModel):
    username: str
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserUpdate(UserBase):
    password: Optional[str] = None

# 用户数据文件路径
USERS_FILE = "users.json"

def load_users():
    """加载用户数据"""
    if os.path.exists(USERS_FILE):
        try:
            with open(USERS_FILE, "r", encoding='utf-8') as f:
                data = json.load(f)
                return data if isinstance(data, dict) else {}
        except (json.JSONDecodeError, FileNotFoundError):
            return {}
    return {}

def save_users(users):
    """保存用户数据"""
    try:
        with open(USERS_FILE, "w", encoding='utf-8') as f:
            json.dump(users, f, indent=2, ensure_ascii=False)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save user data: {str(e)}"
        )

# 包含旅行轨迹路由
app.include_router(travel_router, prefix="/travel", tags=["travel"])

@app.get("/")
def root():
    """API根路径"""
    return {"message": "欢迎使用Travel Trails API", "version": "1.0.0"}

@app.post("/auth/register", response_model=UserBase)
async def register(user: UserCreate):
    """用户注册"""
    users = load_users()
    if user.username in users:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="用户名已存在"
        )
    
    # 检查邮箱是否已被使用
    for existing_user in users.values():
        if existing_user.get("email") == user.email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="邮箱已被使用"
            )
    
    user_dict = {
        "username": user.username,
        "email": user.email,
        "password": user.password,  # 注意：生产环境应该加密存储
        "disabled": False
    }
    
    users[user.username] = user_dict
    save_users(users)
    return UserBase(username=user.username, email=user.email)

@app.post("/auth/login")
async def login(username: str = Form(...), password: str = Form(...)):
    """用户登录"""
    users = load_users()
    if username not in users:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户名或密码错误"
        )
    
    user = users[username]
    if user.get("disabled", False):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="账户已被禁用"
        )
    
    if user["password"] != password:  # 注意：生产环境应该比较加密后的密码
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户名或密码错误"
        )
    
    # 生成ASCII安全的token
    token_data = f"{username}:{uuid.uuid4().hex}"
    # 使用base64编码确保token是ASCII安全的
    access_token = base64.b64encode(token_data.encode('utf-8')).decode('ascii')
    
    return {
        "username": username,
        "email": user["email"],
        "access_token": access_token,
        "token_type": "bearer"
    }

@app.get("/users/me", response_model=UserBase)
async def read_users_me(username: str):
    """获取当前用户信息"""
    users = load_users()
    if username not in users:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="用户不存在"
        )
    user = users[username]
    return UserBase(username=username, email=user["email"])

@app.put("/users/me", response_model=UserBase)
async def update_user(user_update: UserUpdate, username: str):
    """更新用户信息"""
    users = load_users()
    if username not in users:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="用户不存在"
        )
    
    user_dict = users[username]
    if user_update.password:
        user_dict["password"] = user_update.password
    user_dict["email"] = user_update.email
    
    users[username] = user_dict
    save_users(users)
    
    return UserBase(username=username, email=user_update.email)

@app.delete("/users/me")
async def delete_user(username: str):
    """删除用户"""
    users = load_users()
    if username in users:
        del users[username]
        save_users(users)
        return {"message": "用户删除成功"}
    else:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="用户不存在"
        )

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    print(f"启动Travel Trails API服务...")
    print(f"服务地址: http://{host}:{port}")
    print(f"API文档: http://{host}:{port}/docs")
    uvicorn.run(app, host=host, port=port)
