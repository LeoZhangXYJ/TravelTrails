# backend/dependencies.py
# 此文件用于定义 FastAPI 的依赖项，例如获取当前认证用户等。

from fastapi import Depends, HTTPException, status
# from fastapi.security import OAuth2PasswordBearer # 如果使用 OAuth2
# from jose import JWTError, jwt # 如果使用 JWT
# from pydantic import BaseModel

# from .config import SECRET_KEY, ALGORITHM
# from .presentation_layer.schemas import UserResponseSchema # 或一个更简单的 UserInDB schema
# from .business_logic_layer.user_management_service import UserManagementService

# oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login") # tokenUrl 指向登录接口

# class TokenData(BaseModel):
#     username: Optional[str] = None

# def get_db(): # 示例：获取数据库会话的依赖 (如果使用 SQLAlchemy)
#     from .data_access_layer.models import SessionLocal
#     db = SessionLocal()
#     try:
#         yield db
#     finally:
#         db.close()

async def get_current_user_placeholder(token: str = Depends(lambda x: None)):
    """
    占位符依赖：模拟从 token 获取用户。
    在实际应用中，这里会解析 token (例如 JWT)，
    然后从数据库中获取用户信息并验证。
    为了当前能够运行，这个函数暂时什么都不做，也不强制token。
    依赖它的路由将无法真正获取到认证用户，除非我们修改它。
    """
    # print(f"Received token (placeholder): {token}")
    # if not token:
    #     # 在实际应用中，如果 token 是必须的，没有 token 应该抛出异常
    #     # raise HTTPException(
    #     #     status_code=status.HTTP_401_UNAUTHORIZED,
    #     #     detail="Not authenticated",
    #     #     headers={"WWW-Authenticate": "Bearer"},
    #     # )
    # # 模拟从 token 解析用户名
    # fake_username_from_token = "testuser_from_token" 
    # return UserResponseSchema(username=fake_username_from_token, email="test@example.com") # 模拟返回
    # 或者，如果仅仅是为了让 Depends 生效而不实际使用 user:
    # return None
    # 或者，如果希望未认证时路由仍可访问（但不执行认证相关的逻辑），则直接返回None
    # 如果希望强制认证，当 token 无效或缺失时，这里应该抛出 HTTPException
    
    # 为了让使用了此依赖的路由能够被调用（即使没有实际token传递或验证），
    # 我们暂时不抛出异常，也不返回固定用户。
    # 这意味着依赖它的路由如果尝试访问 current_user.username 等会出错，
    # 除非路由自身逻辑允许 current_user 为 None 或进行相应处理。
    # 为了测试 /users/me 等路由，我们在路由层面暂时改用 query parameter `username_param`
    # 而不是依赖这个 `get_current_active_user`。
    pass

async def get_current_active_user(
    # current_user: UserResponseSchema = Depends(get_current_user_placeholder)
    # 为了让 /users/me 能在没有真实认证的情况下工作（通过 username_param）,
    # 这个依赖暂时什么都不做。
    # 如果要启用真实认证，请取消下面的注释并实现 JWT 逻辑。
):
    """
    占位符：用于表示需要认证用户。
    实际应用中，这里会依赖于一个解析和验证 JWT token 的函数，
    并返回当前活动用户。如果用户未激活或 token 无效，则抛出异常。
    """
    # if not current_user:
    #     raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user or bad token")
    # if current_user.disabled: # 假设 UserResponseSchema 或 UserInDB 有 disabled 字段
    #     raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user")
    # return current_user
    # print("get_current_active_user (placeholder) called")
    # 返回一个虚拟用户对象或 None，取决于路由如何处理
    # return UserBaseSchema(username="dummy_user_for_dependency", email="dummy@example.com") 
    # 为了让路由不因缺失 current_user 对象而出错，但又不强制实际认证
    return None # 路由需要能处理 current_user 为 None 的情况 