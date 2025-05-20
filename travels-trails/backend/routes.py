from fastapi import APIRouter, HTTPException, Request, status
from pydantic import BaseModel
from typing import List
import os
import json
import httpx
import traceback
from dotenv import load_dotenv
import logging

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

# 创建路由器
router = APIRouter()

# 数据模型
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

# 路由处理函数
@router.post("/recommendations", response_model=List[RecommendationResponse])
async def get_ai_recommendations(request: VisitedCitiesRequest):
    """调用 Deepseek API 获取旅行推荐"""
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

        # 获取 API 密钥
        api_key = os.getenv("DEEPSEEK_API_KEY")
        if not api_key:
            logger.error("API key not configured")
            raise HTTPException(status_code=500, detail="API key not configured")

        logger.info("Sending request to Deepseek API...")
        logger.info("API Key: %s...", api_key[:10])

        # 调用 Deepseek API
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    "https://chat.zju.edu.cn/api/ai/v1/chat/completions",
                    headers={
                        "Content-Type": "application/json",
                        "Authorization": f"Bearer {api_key}"
                    },
                    json={
                        "model": "deepseek-v3",
                        "messages": [
                            {"role": "system", "content": "You are a travel recommendation expert that outputs JSON only."},
                            {"role": "user", "content": prompt}
                        ],
                        "stream": False
                    },
                    timeout=60.0
                )
                
                logger.info("Deepseek API response status: %d", response.status_code)
                logger.info("Deepseek API response: %s", response.text)
                
                if response.status_code != 200:
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail=f"从 AI 服务获取推荐时出错: {response.text}"
                    )
                
                result = response.json()
                
                try:
                    content = result["choices"][0]["message"]["content"]
                    logger.info("AI response content: %s", content)
                    
                    # 提取 JSON 部分
                    import re
                    json_match = re.search(r'\[[\s\S]*\]', content)
                    if json_match:
                        content = json_match.group()
                    
                    # 解析 JSON
                    recommendations = json.loads(content)
                    return recommendations
                except (KeyError, json.JSONDecodeError) as e:
                    logger.error("Error parsing AI response: %s", str(e))
                    logger.error("Full response: %s", result)
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail=f"处理 AI 响应时出错: {str(e)}"
                    )
            except httpx.RequestError as e:
                logger.error("Request error: %s", str(e))
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"请求 AI 服务时出错: {str(e)}"
                )
    
    except Exception as e:
        logger.error("Unexpected error: %s", str(e))
        logger.error("Traceback: %s", traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取推荐时出错: {str(e)}"
        ) 