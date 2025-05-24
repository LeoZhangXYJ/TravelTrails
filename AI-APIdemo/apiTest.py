from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import httpx
import json
import os
from typing import List, Optional
from dotenv import load_dotenv
from geopy.geocoders import Nominatim
from geopy.extra.rate_limiter import RateLimiter
import asyncio
from fastapi.middleware.cors import CORSMiddleware

# 加载环境变量
load_dotenv()

# 获取 Deepseek API 密钥
DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY")
if not DEEPSEEK_API_KEY:
    raise ValueError("缺少 DEEPSEEK_API_KEY 环境变量。请创建 .env 文件并添加您的 API 密钥。")

# 创建 FastAPI 应用
app = FastAPI(title="Travel AI API 测试")

# 配置 CORS
origins = [
    "http://localhost:3000",  # 允许来自前端的请求
    "http://localhost:3001",  # 如果前端也可能在3001端口
    # 根据需要可以添加更多源
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],  # 允许所有方法 (GET, POST, etc.)
    allow_headers=["*"],  # 允许所有头部
)

# 定义数据模型
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
    latitude: Optional[float] = None
    longitude: Optional[float] = None

# 读取 JSON 文件的函数
def read_visited_cities():
    with open("visitCity3.json", "r", encoding="utf-8") as f:
        data = json.load(f)
    return data

# 预定义的推荐列表，用于没有历史记录时
PREDEFINED_RECOMMENDATIONS = [
    {
        "city": "巴黎",
        "country": "法国",
        "inferred_preferences": ["浪漫", "艺术", "历史"],
        "reason": "浪漫之都，拥有埃菲尔铁塔和卢浮宫等著名景点。",
        "latitude": 48.8566,
        "longitude": 2.3522
    },
    {
        "city": "东京",
        "country": "日本",
        "inferred_preferences": ["现代", "文化", "美食"],
        "reason": "现代与传统交织的繁华都市，美食与购物的天堂。",
        "latitude": 35.6895,
        "longitude": 139.6917
    },
    {
        "city": "罗马",
        "country": "意大利",
        "inferred_preferences": ["历史", "文化", "古迹"],
        "reason": "永恒之城，遍布古罗马遗址和文艺复兴时期的艺术杰作。",
        "latitude": 41.9028,
        "longitude": 12.4964
    },
    {
        "city": "巴厘岛", # 注意：巴厘岛是岛屿，地理编码可能指向中心区域
        "country": "印度尼西亚",
        "inferred_preferences": ["海滩", "自然", "休闲"],
        "reason": "美丽的度假胜地，拥有迷人的海滩、火山和稻田景观。",
        "latitude": -8.3405,
        "longitude": 115.0920
    },
    {
        "city": "纽约",
        "country": "美国",
        "inferred_preferences": ["都市", "文化", "多元"],
        "reason": "世界之都，充满活力的国际大都市，景点和活动丰富多样。",
        "latitude": 40.7128,
        "longitude": -74.0060
    }
]

# 初始化地理编码器
geolocator = Nominatim(user_agent="travel_recommender_app") # 替换为你的应用名称
# 为了尊重 Nominatim 的使用策略，添加速率限制器，每秒最多1个请求
geocode_with_limiter = RateLimiter(geolocator.geocode, min_delay_seconds=1)

# API 测试端点
@app.post("/test-api", response_model=List[RecommendationResponse])
async def test_ai_api(request: VisitedCitiesRequest):
    """测试调用 Deepseek API 获取旅行推荐"""
    
    if not request.visitedCities:
        return PREDEFINED_RECOMMENDATIONS
    
    try:
        # 使用请求中提供的城市数据
        visited_cities = request.visitedCities
        
        # 构建请求提示
        cities_prompt = "\n".join([f"- {city.city}, {city.country}" for city in visited_cities])
        
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

        # 调用 Deepseek API
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://chat.zju.edu.cn/api/ai/v1/chat/completions",
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {DEEPSEEK_API_KEY}"
                },
                json={
                    "model": "deepseek-v3",  # Deepseek模型
                    "messages": [
                        {"role": "system", "content": "You are a travel recommendation expert that outputs JSON only."},
                        {"role": "user", "content": prompt}
                    ],
                    "stream": False  # 非流式响应
                },
                timeout=60.0  # 增加超时时间
            )
            
            # 检查响应状态
            if response.status_code != 200:
                print(f"Deepseek API 错误: {response.text}")
                raise HTTPException(status_code=500, detail=f"从 AI 服务获取推荐时出错: {response.text}")
            
            # 解析响应
            result = response.json()
            
            # Deepseek API 的响应结构可能与 OpenAI 不同，需要调整
            # 假设响应格式类似于 OpenAI
            try:
                content = result["choices"][0]["message"]["content"]
                
                # 提取 JSON 部分
                import re
                json_match = re.search(r'\[[\s\S]*\]', content)
                if json_match:
                    content = json_match.group()
                
                # 解析 JSON
                recommendations_from_ai = json.loads(content)
                
                # 为每个推荐的城市获取经纬度
                recommendations_with_coords = []
                for rec in recommendations_from_ai:
                    try:
                        location_query = f'{rec["city"]}, {rec["country"]}'
                        location = await asyncio.to_thread(geocode_with_limiter, location_query, timeout=15)
                        if location:
                            rec["latitude"] = location.latitude
                            rec["longitude"] = location.longitude
                        else:
                            rec["latitude"] = None
                            rec["longitude"] = None
                            print(f"地理编码未找到: {location_query}")
                    except Exception as geo_e:
                        print(f"地理编码错误 for {rec.get('city')}: {geo_e}")
                        rec["latitude"] = None
                        rec["longitude"] = None
                    recommendations_with_coords.append(RecommendationResponse(**rec))
                
                return recommendations_with_coords
            except KeyError as e:
                print(f"API响应结构错误: {e}")
                print(f"响应内容: {result}")
                # 尝试直接从响应中提取内容
                if "choices" in result and len(result["choices"]) > 0:
                    if "message" in result["choices"][0]:
                        content = result["choices"][0]["message"].get("content", "")
                    else:
                        content = str(result["choices"][0])
                else:
                    content = str(result)
                
                # 再次尝试提取JSON
                json_match = re.search(r'\[[\s\S]*\]', content)
                if json_match:
                    content = json_match.group()
                    try:
                        recommendations_from_ai = json.loads(content)
                        # 为每个推荐的城市获取经纬度 (同样需要在这里处理)
                        recommendations_with_coords = []
                        for rec in recommendations_from_ai:
                            try:
                                location_query = f'{rec["city"]}, {rec["country"]}'
                                location = await asyncio.to_thread(geocode_with_limiter, location_query, timeout=15)
                                if location:
                                    rec["latitude"] = location.latitude
                                    rec["longitude"] = location.longitude
                                else:
                                    rec["latitude"] = None
                                    rec["longitude"] = None
                                    print(f"地理编码未找到: {location_query}")
                            except Exception as geo_e:
                                print(f"地理编码错误 for {rec.get('city')}: {geo_e}")
                                rec["latitude"] = None
                                rec["longitude"] = None
                            recommendations_with_coords.append(RecommendationResponse(**rec))
                        return recommendations_with_coords
                    except json.JSONDecodeError:
                        pass
                
                raise HTTPException(status_code=500, detail="无法从 AI 响应中提取推荐")
            except json.JSONDecodeError as e:
                print(f"JSON 解析错误: {e}")
                print(f"内容: {content}")
                raise HTTPException(status_code=500, detail="无法解析 AI 响应")
    
    except Exception as e:
        print(f"错误: {e}")
        raise HTTPException(status_code=500, detail=f"处理请求时出错: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="localhost", port=8001)