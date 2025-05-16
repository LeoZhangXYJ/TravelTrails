from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from typing import List, Optional
import base64
from user_models import User, City, Photo, CityCreate, CityUpdate
import crud
import json

router = APIRouter(prefix="/travel", tags=["travel"])

# 获取用户的所有城市
@router.get("/{username}/cities", response_model=List[City])
def get_user_cities(username: str):
    user = crud.get_user(username)
    if not user or not user.get("travel_trails") or not user["travel_trails"][0].get("cities"):
        return []
    return user["travel_trails"][0]["cities"]

# 添加城市
@router.post("/{username}/cities", status_code=201)
def add_city(username: str, city: CityCreate):
    user = crud.get_user(username)
    
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
    crud.update_user_data(username, user)
    return {"status": "success", "message": "城市添加成功"}

# 删除城市
@router.delete("/{username}/cities/{city_index}")
def remove_city(username: str, city_index: int):
    user = crud.get_user(username)
    
    if not user.get("travel_trails") or not user["travel_trails"][0].get("cities"):
        raise HTTPException(status_code=404, detail="未找到旅行轨迹数据")
    
    cities = user["travel_trails"][0]["cities"]
    if city_index < 0 or city_index >= len(cities):
        raise HTTPException(status_code=404, detail="城市索引无效")
    
    # 删除城市
    cities.pop(city_index)
    crud.update_user_data(username, user)
    return {"status": "success", "message": "城市删除成功"}

# 更新城市博客
@router.put("/{username}/cities/{city_index}/blog")
def update_city_blog(username: str, city_index: int, city_update: CityUpdate):
    user = crud.get_user(username)
    
    if not user.get("travel_trails") or not user["travel_trails"][0].get("cities"):
        raise HTTPException(status_code=404, detail="未找到旅行轨迹数据")
    
    cities = user["travel_trails"][0]["cities"]
    if city_index < 0 or city_index >= len(cities):
        raise HTTPException(status_code=404, detail="城市索引无效")
    
    # 更新博客内容
    cities[city_index]["blog"] = city_update.blog
    crud.update_user_data(username, user)
    return {"status": "success", "message": "博客更新成功"}

# 上传照片到城市
@router.post("/{username}/cities/{city_index}/photos")
async def add_photo_to_city(username: str, city_index: int, photo: str = Form(...)):
    user = crud.get_user(username)
    
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
    crud.update_user_data(username, user)
    return {"status": "success", "message": "照片添加成功"}

# 删除城市照片
@router.delete("/{username}/cities/{city_index}/photos/{photo_index}")
def remove_photo_from_city(username: str, city_index: int, photo_index: int):
    user = crud.get_user(username)
    
    if not user.get("travel_trails") or not user["travel_trails"][0].get("cities"):
        raise HTTPException(status_code=404, detail="未找到旅行轨迹数据")
    
    cities = user["travel_trails"][0]["cities"]
    if city_index < 0 or city_index >= len(cities):
        raise HTTPException(status_code=404, detail="城市索引无效")
    
    if "photos" not in cities[city_index] or photo_index < 0 or photo_index >= len(cities[city_index]["photos"]):
        raise HTTPException(status_code=404, detail="照片索引无效")
    
    # 删除照片
    cities[city_index]["photos"].pop(photo_index)
    crud.update_user_data(username, user)
    return {"status": "success", "message": "照片删除成功"}
