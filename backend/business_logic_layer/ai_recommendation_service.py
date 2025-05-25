# backend/business_logic_layer/ai_recommendation_service.py
# 封装 AI 推荐相关的核心业务规则

# from ..data_access_layer.ai_recommendation_dao import AIRecommendationDAO

import httpx
import json
import os
import asyncio
import re
from typing import List, Optional, Dict

from geopy.geocoders import Nominatim
from geopy.extra.rate_limiter import RateLimiter

# 从同级或上级目录导入配置和 schemas
from ..config import DEEPSEEK_API_KEY, AI_MODEL_ENDPOINT # 假设API端点也在config中
from ..presentation_layer.schemas import RecommendationResponseSchema, CityInputSchema

# 预定义的推荐列表，用于没有历史记录时 (与 AI_rmd.py 中一致)
PREDEFINED_RECOMMENDATIONS_DATA = [
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
        "city": "巴厘岛",
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

class AIRecommendationService:
    def __init__(self):
        # 打印从 config.py 模块导入的实际值
        print(f"[SERVICE_INIT_DEBUG] AI_MODEL_ENDPOINT from config: '{AI_MODEL_ENDPOINT}'")
        print(f"[SERVICE_INIT_DEBUG] DEEPSEEK_API_KEY from config (last 5 chars): '{DEEPSEEK_API_KEY[-5:] if DEEPSEEK_API_KEY else 'None'}'")
        
        # 允许在没有API密钥时继续运行，但会使用预定义推荐
        if not DEEPSEEK_API_KEY:
            print("[SERVICE_INIT_WARNING] 缺少 DEEPSEEK_API_KEY，将使用预定义推荐")
            self.use_ai_service = False
        else:
            self.use_ai_service = True
            
        if not AI_MODEL_ENDPOINT:
            print("[SERVICE_INIT_WARNING] 缺少 AI_MODEL_ENDPOINT，将使用预定义推荐")
            self.use_ai_service = False

        self.geolocator = Nominatim(user_agent="travel_recommender_app_backend") 
        self.geocode_with_limiter = RateLimiter(self.geolocator.geocode, min_delay_seconds=1)
        # self.ai_dao = AIRecommendationDAO() # 如果有DAO

    async def get_recommendations(self, visited_cities: List[CityInputSchema]) -> List[RecommendationResponseSchema]:
        """
        根据用户访问过的城市获取旅行推荐。
        如果用户没有访问历史，则返回预定义推荐。
        否则，调用外部 AI 服务获取推荐，并补充地理信息。
        """
        # 如果没有访问过的城市或者AI服务不可用，返回预定义推荐
        if not visited_cities or not self.use_ai_service:
            print("[AI_SERVICE] 使用预定义推荐")
            return [RecommendationResponseSchema(**rec) for rec in PREDEFINED_RECOMMENDATIONS_DATA]
        
        try:
            cities_prompt = "\n".join([f"- {city.city}, {city.country}" for city in visited_cities])
            prompt = self._build_prompt(cities_prompt)

            request_headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {DEEPSEEK_API_KEY}"
            }
            request_payload = {
                "model": "deepseek-v3",
                "messages": [
                    {"role": "system", "content": "You are a travel recommendation expert that outputs JSON only."},
                    {"role": "user", "content": prompt}
                ],
                "stream": False
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    AI_MODEL_ENDPOINT,
                    headers=request_headers,
                    json=request_payload,
                    timeout=60.0
                )
            
            response.raise_for_status()
            
            result = response.json()
            recommendations_from_ai = self._parse_ai_response(result)
            
            recommendations_with_coords = []
            for rec_data in recommendations_from_ai:
                if not isinstance(rec_data, dict):
                    print(f"Skipping non-dict item from AI: {rec_data}")
                    continue
                try:
                    location_query = f'{rec_data.get("city", "")}, {rec_data.get("country", "")}'
                    location = await asyncio.to_thread(self.geocode_with_limiter, location_query, timeout=15)
                    if location:
                        rec_data["latitude"] = location.latitude
                        rec_data["longitude"] = location.longitude
                    else:
                        rec_data["latitude"] = None
                        rec_data["longitude"] = None
                        print(f"地理编码未找到: {location_query}")
                except Exception as geo_e:
                    print(f"地理编码错误 for {rec_data.get('city')}: {geo_e}")
                    rec_data["latitude"] = None
                    rec_data["longitude"] = None
                
                try:
                    recommendations_with_coords.append(RecommendationResponseSchema(**rec_data))
                except Exception as pydantic_e:
                    print(f"Pydantic 模型转换错误 for {rec_data}: {pydantic_e}")
            return recommendations_with_coords

        except httpx.HTTPStatusError as e:
            error_detail = f"AI 服务通讯失败: {e.response.status_code}"
            try:
                response_data = e.response.json()
                detail_from_response = response_data.get("error", {}).get("message") or response_data.get("detail")
                if detail_from_response:
                    error_detail += f" - {detail_from_response}"
                else:
                    error_detail += f" - {e.response.text[:200]}..."
            except json.JSONDecodeError:
                error_detail += f" - {e.response.text[:200]}..."
            except Exception:
                pass
            print(f"AI 服务 HTTP 错误: {error_detail}")
            print("[AI_SERVICE] AI服务失败，回退到预定义推荐")
            return [RecommendationResponseSchema(**rec) for rec in PREDEFINED_RECOMMENDATIONS_DATA]
        except httpx.RequestError as e:
            print(f"AI 服务请求错误: {e}")
            print("[AI_SERVICE] AI服务连接失败，回退到预定义推荐")
            return [RecommendationResponseSchema(**rec) for rec in PREDEFINED_RECOMMENDATIONS_DATA]
        except json.JSONDecodeError as e:
            print(f"AI 服务响应 JSON 解析错误: {e}")
            print("[AI_SERVICE] AI服务响应解析失败，回退到预定义推荐")
            return [RecommendationResponseSchema(**rec) for rec in PREDEFINED_RECOMMENDATIONS_DATA]
        except ValueError as ve:
            print(f"AI 服务处理 ValueError: {ve}")
            print("[AI_SERVICE] AI服务处理失败，回退到预定义推荐")
            return [RecommendationResponseSchema(**rec) for rec in PREDEFINED_RECOMMENDATIONS_DATA]
        except Exception as e:
            print(f"获取 AI 推荐时发生未知错误: {type(e).__name__} - {e}")
            print("[AI_SERVICE] AI服务发生未知错误，回退到预定义推荐")
            return [RecommendationResponseSchema(**rec) for rec in PREDEFINED_RECOMMENDATIONS_DATA]

    def _build_prompt(self, cities_prompt: str) -> str:
        return f"""
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

    def _parse_ai_response(self, result: Dict) -> List[Dict]:
        """解析来自 AI 服务的 JSON 响应。"""
        try:
            content = result["choices"][0]["message"]["content"]
            
            # 提取 JSON 部分 (原有的 re.search 逻辑)
            json_match = re.search(r'\[[\s\S]*\]', content)
            if json_match:
                json_str = json_match.group()
            else: # 如果没有找到严格的 [...] 结构，尝试直接解析 content
                json_str = content 
                # 进一步处理：AI 可能返回被额外引号包裹的JSON字符串
                if json_str.startswith('"') and json_str.endswith('"'):
                    json_str = json_str[1:-1].replace('\"', '"')
            
            # 确保 json_str 是有效的 JSON 字符串
            # 有时 AI 返回的 JSON 字符串本身可能被转义或包含在另一个字符串中
            try:
                parsed_json = json.loads(json_str)
            except json.JSONDecodeError:
                # 如果直接解析失败，尝试去除可能的外部引号和转义
                try:
                    parsed_json = json.loads(json.loads(f'"{json_str}"')) # 尝试双重解码，处理 "[..."..."...]" 类似情况
                except json.JSONDecodeError as e:
                    print(f"AI 响应 JSON 解析最终失败: {json_str} - {e}")
                    raise ValueError(f"AI 响应中无法解析的 JSON 内容: {json_str[:200]}...")
            
            if not isinstance(parsed_json, list):
                 # 如果解析后不是列表，尝试从字典中查找可能的列表键
                if isinstance(parsed_json, dict) and parsed_json.get("recommendations"): # 假设列表可能在 'recommendations' 键下
                    parsed_json = parsed_json["recommendations"]
                elif isinstance(parsed_json, dict) and len(parsed_json.values()) == 1 and isinstance(list(parsed_json.values())[0], list):
                    # 如果字典只有一个值且该值是列表
                    parsed_json = list(parsed_json.values())[0]
                else:
                    raise ValueError(f"AI 响应解析后非列表格式: {type(parsed_json)}")

            return parsed_json
        
        except KeyError as e:
            # 处理预期之外的响应结构
            print(f"AI API 响应结构键错误: {e}")
            print(f"原始响应内容: {result}")
            # 尝试从响应中提取 content (与 AI_rmd.py 中类似的备用逻辑)
            content_fallback = ""
            if "choices" in result and len(result["choices"]) > 0:
                if "message" in result["choices"][0]:
                    content_fallback = result["choices"][0]["message"].get("content", "")
                else:
                    content_fallback = str(result["choices"][0])
            else:
                content_fallback = str(result)
            
            json_match_fallback = re.search(r'\[[\s\S]*\]', content_fallback)
            if json_match_fallback:
                try:
                    return json.loads(json_match_fallback.group())
                except json.JSONDecodeError as je:
                    print(f"备用 JSON 解析失败: {je}")
                    raise ValueError("AI 服务返回了无法解析的推荐内容 (备用逻辑失败)。")
            raise ValueError("AI 服务返回了非预期的响应结构。")
        except json.JSONDecodeError as e:
            print(f"解析 AI 响应中的 JSON 内容时出错: {e}")
            print(f"原始 content: {content if 'content' in locals() else 'Content not extracted'}")
            raise ValueError(f"AI 服务返回了无法解析的 JSON 内容 (原始 content): { (content[:200] + '...') if 'content' in locals() else 'Content not extracted'}")
        except Exception as e: # 其他解析时可能出现的错误
            print(f"解析 AI 响应时发生未知错误: {type(e).__name__} - {e}")
            print(f"原始 result: {result}")
            raise ValueError(f"解析 AI 响应时发生未知错误: {str(e)}")

    def record_user_feedback(self, user_id: str, item_id: str, feedback: str):
        """
        记录用户对推荐结果的反馈。
        """
        # TODO: 将反馈信息存储到数据库 (通过 DAO)
        # self.ai_dao.save_user_feedback(user_id, item_id, feedback)
        print(f"SERVICE: User {user_id} gave feedback '{feedback}' for item {item_id}")
        return True

# 注意：原 AI_rmd.py 中的 read_visited_cities() 函数读取本地 JSON 文件，
# 这部分逻辑如果仍然需要，应该由 DAO 层处理，或者作为服务层的一个辅助方法（如果它不直接访问持久化存储）。
# 目前的 get_recommendations 方法期望 visited_cities 作为参数传入。

# 注意：原 AI_rmd.py 中的 _process_recommendations 方法，
# 这部分逻辑如果仍然需要，应该由服务层实现，因为它涉及到业务逻辑的处理。
# 目前的 _process_recommendations 方法只是一个占位符，实际实现需要根据业务需求来确定。 