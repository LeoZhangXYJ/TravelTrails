from fastapi import FastAPI, Depends, HTTPException, status, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from typing import Optional
import json
import os
import uvicorn
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

# 导入本地模块
import validator
import crud
from travel_routes import router as travel_router

app = FastAPI(title="Travel Trails API")

# CORS配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
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
    if os.path.exists(USERS_FILE):
        try:
            with open(USERS_FILE, "r", encoding='utf-8') as f:
                data = json.load(f)
                if isinstance(data, dict):
                    return data
                return {}
        except json.JSONDecodeError:
            return {}
    return {}

def save_users(users):
    with open(USERS_FILE, "w", encoding='utf-8') as f:
        json.dump(users, f, indent=2, ensure_ascii=False)

# 包含旅行轨迹路由
app.include_router(travel_router, prefix="/travel", tags=["travel"])

@app.get("/")
def root():
    return {"message": "欢迎使用Travel Trails API"}

@app.post("/auth/register", response_model=UserBase)
async def register(user: UserCreate):
    users = load_users()
    if user.username in users:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    
    user_dict = {
        "username": user.username,
        "email": user.email,
        "password": user.password,  # 注意：实际应用中应该加密存储
        "disabled": False
    }
    
    users[user.username] = user_dict
    save_users(users)
    return UserBase(username=user.username, email=user.email)

@app.post("/auth/login")
async def login(username: str = Form(...), password: str = Form(...)):
    users = load_users()
    if username not in users:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )
    
    user = users[username]
    if user["password"] != password:  # 注意：实际应用中应该比较加密后的密码
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )
    
    return {
        "username": username,
        "email": user["email"],
        "access_token": "dummy_token",  # 临时添加，后续可以移除
        "token_type": "bearer"
    }

@app.get("/users/me", response_model=UserBase)
async def read_users_me(username: str):
    users = load_users()
    if username not in users:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    user = users[username]
    return UserBase(username=username, email=user["email"])

@app.put("/users/me", response_model=UserBase)
async def update_user(user_update: UserUpdate, username: str):
    users = load_users()
    if username not in users:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
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
    users = load_users()
    if username in users:
        del users[username]
        save_users(users)
    return {"message": "User deleted successfully"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
