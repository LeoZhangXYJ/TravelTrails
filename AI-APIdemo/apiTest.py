from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import httpx
import json
import os
from typing import List, Optional
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

# 获取 Deepseek API 密钥
DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY")
if not DEEPSEEK_API_KEY:
    raise ValueError("缺少 DEEPSEEK_API_KEY 环境变量。请创建 .env 文件并添加您的 API 密钥。")

# 创建 FastAPI 应用
app = FastAPI(title="Travel AI API 测试")

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

# 读取 JSON 文件的函数
def read_visited_cities():
    with open("visitCity3.json", "r", encoding="utf-8") as f:
        data = json.load(f)
    return data

# API 测试端点
@app.post("/test-api", response_model=List[RecommendationResponse])
async def test_ai_api(request: VisitedCitiesRequest):
    """测试调用 Deepseek API 获取旅行推荐"""
    
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
                recommendations = json.loads(content)
                return recommendations
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
                        recommendations = json.loads(content)
                        return recommendations
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
    uvicorn.run(app, host="localhost", port=8000)