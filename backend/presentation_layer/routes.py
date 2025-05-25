# backend/presentation_layer/routes.py
# 此处定义 API 路由，例如使用 Flask 或 FastAPI

from fastapi import APIRouter, HTTPException, Depends, Body, status, Form
from typing import List, Optional

# 从上级目录导入服务和 schemas
from ..business_logic_layer.ai_recommendation_service import AIRecommendationService
from ..business_logic_layer.user_management_service import UserManagementService
from .schemas import (
    VisitedCitiesRequestSchema, 
    RecommendationResponseSchema,
    UserCreateSchema, 
    UserResponseSchema, 
    UserUpdateSchema,
    TokenSchema,
    UserBaseSchema
)
from ..dependencies import get_current_active_user

def get_ai_recommendation_service():
    return AIRecommendationService()

def get_user_management_service():
    return UserManagementService()

# 为 AI 推荐功能创建一个 APIRouter
ai_router = APIRouter(
    prefix="/ai",
    tags=["AI Recommendations"]
)

@ai_router.post("/recommendations", response_model=List[RecommendationResponseSchema])
async def get_ai_recommendations(
    request: VisitedCitiesRequestSchema, 
    ai_service: AIRecommendationService = Depends(get_ai_recommendation_service)
):
    """接收用户已访问城市列表，返回 AI 推荐结果。"""
    print(f"[AI_ROUTE_DEBUG] AI recommendations route called with request: {request}")
    print(f"[AI_ROUTE_DEBUG] Visited cities: {request.visitedCities}")
    
    try:
        recommendations = await ai_service.get_recommendations(request.visitedCities)
        if not recommendations: # 虽然服务层本身会返回预定义推荐，但以防万一
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="未能生成推荐。")
        print(f"[AI_ROUTE_DEBUG] Successfully generated {len(recommendations)} recommendations")
        return recommendations
    except Exception as e:
        # 更细致的错误处理可以根据 service 层抛出的具体异常类型来做
        print(f"Error in AI recommendation route: {e}") # 记录日志
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

# --- 用户管理路由 ---
user_router = APIRouter(
    prefix="/users",
    tags=["User Management"]
)

auth_router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)

@auth_router.post("/register", response_model=UserResponseSchema, status_code=status.HTTP_201_CREATED)
async def register_user(
    user_create: UserCreateSchema, 
    service: UserManagementService = Depends(get_user_management_service)
):
    """用户注册"""
    try:
        created_user = service.create_user(user_create_data=user_create)
        return created_user
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e: # 其他意外错误
        print(f"Error in register_user route: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="注册用户时发生内部错误。")

@auth_router.post("/login", response_model=TokenSchema)
async def login_for_access_token(
    username: str = Form(...), 
    password: str = Form(...),
    service: UserManagementService = Depends(get_user_management_service)
):
    """用户登录，返回 JWT Token。"""
    try:
        token = service.login_user(username=username, password=password)
        return token
    except ValueError as ve: # Service 层可能抛出 ValueError 表示认证失败或用户问题
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(ve),
            headers={"WWW-Authenticate": "Bearer"}, # 虽然简单token不一定用Bearer, 但保留
        )
    except Exception as e:
        print(f"Error in login_for_access_token route: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="登录时发生内部错误。")

# 以下 /users/me 路由通常需要身份验证
# 我们会添加一个虚拟的 Depends(get_current_active_user) 来表示这一点
# 实际实现 get_current_active_user 会涉及解析 token 和验证用户

@user_router.get("/me", response_model=UserResponseSchema)
async def read_current_user(
    username_param: str, # Query parameter for now, or path parameter if preferred
    service: UserManagementService = Depends(get_user_management_service)
):
    """获取当前登录用户的信息。 (目前通过查询参数username模拟)"""
    user = service.get_user_by_username(username_param)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="用户未找到。")
    return user

@user_router.put("/me", response_model=UserResponseSchema)
async def update_current_user(
    user_update: UserUpdateSchema,
    username_param: str, 
    service: UserManagementService = Depends(get_user_management_service)
):
    """更新当前登录用户的信息。 (目前通过查询参数username模拟)"""
    try:
        updated_user = service.update_user_profile(username=username_param, user_update_data=user_update)
        if not updated_user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="用户未找到或更新失败。")
        return updated_user
    except ValueError as ve: # Service 层可能因数据问题抛出 ValueError
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        print(f"Error in update_current_user route: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="更新用户信息时发生内部错误。")

@user_router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
async def delete_current_user(
    username_param: str, 
    service: UserManagementService = Depends(get_user_management_service)
):
    """删除当前登录用户。 (目前通过查询参数username模拟)"""
    success = service.delete_user_by_username(username_param)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="用户未找到或删除失败。")
    return # 返回 204 No Content

# 注意：原 user_management/main.py 中的 travel_routes 需要单独处理。
# 它们可能需要自己的 router 或整合到 user_router 下，并可能需要认证。
# 另外，一个 get_current_active_user 依赖项需要被创建在 backend/dependencies.py 文件中用于实际的JWT认证。
# 我会先创建一个 backend/dependencies.py 的占位符。

# 注意：原 routes.py 中的 example_route 可以移除或保留为通用测试
# def example_route():
#     return {"message": "This is a placeholder route in the presentation layer for general testing"}

# 注意：原 AI_rmd.py 中的 FastAPI app 实例和 CORS 中间件配置
# 将在新的顶层 main.py 文件中处理。

# 示例：如果使用 Flask
# from flask import Blueprint, jsonify, request
# bp = Blueprint('api', __name__, url_prefix='/api')
#
# @bp.route('/recommendations', methods=['POST'])
# def get_recommendations():
#     data = request.get_json()
#     # user_id = data.get('user_id')
#     # 调用 AI 推荐业务逻辑
#     # recommendations = ai_recommendation_service.get_recommendations_for_user(user_id)
#     # return jsonify(recommendations)
#
# @bp.route('/users', methods=['POST'])
# def create_user():
#     data = request.get_json()
#     # 调用用户管理业务逻辑
#     # user = user_management_service.create_user(data)
#     # return jsonify(user.to_dict()), 201 