from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form, status
from typing import List, Optional
import base64
from user_models import User, City, Photo, CityCreate, CityUpdate
import crud
import json
from pydantic import BaseModel
import httpx
import os
from dotenv import load_dotenv
from database import get_db
from sqlalchemy.orm import Session
import traceback

# 加载环境变量
load_dotenv()

# 获取 Deepseek API 密钥
DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY")
if not DEEPSEEK_API_KEY:
    raise ValueError("缺少 DEEPSEEK_API_KEY 环境变量。请创建 .env 文件并添加您的 API 密钥。")

router = APIRouter(tags=["travel"])

# 简单的用户验证函数
def verify_user(username: str):
    users = crud.load_users()
    if username not in users:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    return users[username]

# 获取用户的所有城市
@router.get("/{username}/cities", response_model=List[City])
def get_user_cities(username: str):
    verify_user(username)
    user = crud.get_user(username)
    if not user or not user.get("travel_trails") or not user["travel_trails"][0].get("cities"):
        return []
    return user["travel_trails"][0]["cities"]

# 添加城市
@router.post("/{username}/cities", status_code=201)
def add_city(username: str, city: CityCreate):
    verify_user(username)
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
    verify_user(username)
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
    verify_user(username)
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
    verify_user(username)
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
    verify_user(username)
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

# AI 推荐相关的数据模型
class City(BaseModel):
    city: str
    country: str

class VisitedCitiesRequest(BaseModel):
    visitedCities: List[City]

class RecommendationResponse(BaseModel):
    city: str
    country: str
    inferred_preferences: List[str]
    reason: str

@router.post("/ai/recommendations", response_model=List[RecommendationResponse])
async def get_ai_recommendations(request: VisitedCitiesRequest):
    """获取基于已访问城市的 AI 旅行推荐"""
    try:
        # 打印接收到的请求数据
        print("Received request data:", request.dict())
        
        # 构建请求提示
        cities_prompt = "\n".join([f"- {city.city}, {city.country}" for city in request.visitedCities])
        
        prompt = f"""
        你是一位资深旅行推荐专家（Travel Recommendation Expert）。
        用户已访问城市列表如下（Visited Cities）：
        {cities_prompt}

        请先根据以下维度，自动从已访问城市中推断用户的旅行偏好（Preferences）：
        1. 地理区域（Region）：例如欧洲／亚太／美洲偏好
        2. 文化类型（Culture）：历史古迹／现代艺术／宗教遗迹等
        3. 活动属性（Activities）：如自然风光／城市漫游／夜生活等
        4. 季节气候（Seasonality）：避暑／滑雪／樱花季等
        5. 出行风格（Style）：深度慢游／打卡速览／美食探索

        然后，基于上述推断出的偏好，推荐5个新的旅游城市。
        输出请采用 JSON 数组，每项包含以下字段：
        ```json
        [
          {{
            "city": "推荐城市名称",
            "country": "所属国家",
            "inferred_preferences": ["推断偏好项1", "推断偏好项2"],
            "reason": "简要推荐理由（不超30字）"
          }},
          ...
        ]
        ```
        请直接返回JSON，不要包含任何其他解释文字。
        """

        print("Sending request to Deepseek API...")
        print("API Key:", DEEPSEEK_API_KEY[:10] + "..." if DEEPSEEK_API_KEY else "Not found")

        # 调用 Deepseek API
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    "https://chat.zju.edu.cn/api/ai/v1/chat/completions",  # 更新为学校内部 API 端点
                    headers={
                        "Content-Type": "application/json",
                        "Authorization": f"Bearer {DEEPSEEK_API_KEY}"
                    },
                    json={
                        "model": "deepseek-v3",  # 更新为正确的模型名称
                        "messages": [
                            {"role": "system", "content": "You are a travel recommendation expert that outputs JSON only."},
                            {"role": "user", "content": prompt}
                        ],
                        "stream": False  # 非流式响应
                    },
                    timeout=60.0
                )
                
                print("Deepseek API response status:", response.status_code)
                print("Deepseek API response:", response.text)
                
                if response.status_code != 200:
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail=f"从 AI 服务获取推荐时出错: {response.text}"
                    )
                
                result = response.json()
                
                try:
                    content = result["choices"][0]["message"]["content"]
                    print("AI response content:", content)
                    
                    # 提取 JSON 部分
                    import re
                    json_match = re.search(r'\[[\s\S]*\]', content)
                    if json_match:
                        content = json_match.group()
                    
                    # 解析 JSON
                    recommendations = json.loads(content)
                    return recommendations
                except (KeyError, json.JSONDecodeError) as e:
                    print("Error parsing AI response:", str(e))
                    print("Full response:", result)
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail=f"处理 AI 响应时出错: {str(e)}"
                    )
            except httpx.RequestError as e:
                print("Request error:", str(e))
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"请求 AI 服务时出错: {str(e)}"
                )
    
    except Exception as e:
        print("Unexpected error:", str(e))
        print("Traceback:", traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取推荐时出错: {str(e)}"
        )
