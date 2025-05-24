from fastapi import APIRouter, HTTPException, Form, status
from typing import List
from user_models import City, CityCreate, CityUpdate
import json
from pydantic import BaseModel
import os
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

router = APIRouter(tags=["travel"])

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
            detail=f"保存用户数据失败: {str(e)}"
        )

def get_user(username: str):
    """获取用户数据"""
    users = load_users()
    if username not in users:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="用户不存在"
        )
    return users[username]

def update_user_data(username: str, user_data):
    """更新用户数据"""
    users = load_users()
    if username not in users:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="用户不存在"
        )
    users[username] = user_data
    save_users(users)

# 简单的用户验证函数
def verify_user(username: str):
    users = load_users()
    if username not in users:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户不存在"
        )
    return users[username]

# 获取用户的所有城市
@router.get("/{username}/cities", response_model=List[City])
def get_user_cities(username: str):
    """获取用户的所有城市"""
    verify_user(username)
    user = get_user(username)
    if not user.get("travel_trails") or not user["travel_trails"][0].get("cities"):
        return []
    return user["travel_trails"][0]["cities"]

# 添加城市
@router.post("/{username}/cities", status_code=201)
def add_city(username: str, city: CityCreate):
    """添加新城市到用户的旅行轨迹"""
    verify_user(username)
    user = get_user(username)
    
    # 确保用户有travel_trails字段
    if "travel_trails" not in user:
        user["travel_trails"] = [{"cities": []}]
    elif not user["travel_trails"]:
        user["travel_trails"] = [{"cities": []}]
    elif "cities" not in user["travel_trails"][0]:
        user["travel_trails"][0]["cities"] = []
    
    # 添加新城市
    new_city = city.model_dump()
    new_city["photos"] = []
    new_city["blog"] = ""
    user["travel_trails"][0]["cities"].append(new_city)
    
    # 更新用户数据
    update_user_data(username, user)
    return {"status": "success", "message": "城市添加成功"}

# 删除城市
@router.delete("/{username}/cities/{city_index}")
def remove_city(username: str, city_index: int):
    """删除指定索引的城市"""
    verify_user(username)
    user = get_user(username)
    
    if not user.get("travel_trails") or not user["travel_trails"][0].get("cities"):
        raise HTTPException(status_code=404, detail="未找到旅行轨迹数据")
    
    cities = user["travel_trails"][0]["cities"]
    if city_index < 0 or city_index >= len(cities):
        raise HTTPException(status_code=404, detail="城市索引无效")
    
    # 删除城市
    cities.pop(city_index)
    update_user_data(username, user)
    return {"status": "success", "message": "城市删除成功"}

# 更新城市博客
@router.put("/{username}/cities/{city_index}/blog")
def update_city_blog(username: str, city_index: int, city_update: CityUpdate):
    """更新城市的博客内容"""
    verify_user(username)
    user = get_user(username)
    
    if not user.get("travel_trails") or not user["travel_trails"][0].get("cities"):
        raise HTTPException(status_code=404, detail="未找到旅行轨迹数据")
    
    cities = user["travel_trails"][0]["cities"]
    if city_index < 0 or city_index >= len(cities):
        raise HTTPException(status_code=404, detail="城市索引无效")
    
    # 更新博客内容
    cities[city_index]["blog"] = city_update.blog
    update_user_data(username, user)
    return {"status": "success", "message": "博客更新成功"}

# 上传照片到城市
@router.post("/{username}/cities/{city_index}/photos")
async def add_photo_to_city(username: str, city_index: int, photo: str = Form(...)):
    """为指定城市添加照片"""
    verify_user(username)
    user = get_user(username)
    
    if not user.get("travel_trails") or not user["travel_trails"][0].get("cities"):
        raise HTTPException(status_code=404, detail="未找到旅行轨迹数据")
    
    cities = user["travel_trails"][0]["cities"]
    if city_index < 0 or city_index >= len(cities):
        raise HTTPException(status_code=404, detail="城市索引无效")
    
    # 确保城市有photos字段
    if "photos" not in cities[city_index]:
        cities[city_index]["photos"] = []
    
    # 添加照片
    cities[city_index]["photos"].append({"data": photo})
    update_user_data(username, user)
    return {"status": "success", "message": "照片添加成功"}

# 删除城市照片
@router.delete("/{username}/cities/{city_index}/photos/{photo_index}")
def remove_photo_from_city(username: str, city_index: int, photo_index: int):
    """删除指定城市的指定照片"""
    verify_user(username)
    user = get_user(username)
    
    if not user.get("travel_trails") or not user["travel_trails"][0].get("cities"):
        raise HTTPException(status_code=404, detail="未找到旅行轨迹数据")
    
    cities = user["travel_trails"][0]["cities"]
    if city_index < 0 or city_index >= len(cities):
        raise HTTPException(status_code=404, detail="城市索引无效")
    
    if "photos" not in cities[city_index] or photo_index < 0 or photo_index >= len(cities[city_index]["photos"]):
        raise HTTPException(status_code=404, detail="照片索引无效")
    
    # 删除照片
    cities[city_index]["photos"].pop(photo_index)
    update_user_data(username, user)
    return {"status": "success", "message": "照片删除成功"}
