# backend/business_logic_layer/user_management_service.py
# 封装用户管理相关的核心业务规则

# from ..data_access_layer.user_management_dao import UserManagementDAO
# from ..data_access_layer.models import User # 假设 User 模型定义在 models.py

import uuid
import base64
from typing import Optional, Dict

# 从上级目录导入 DAO 和 schemas
from ..data_access_layer.user_management_dao import UserManagementDAO
# from ..data_access_layer.models import User # 如果 User 是 ORM 模型
from ..presentation_layer.schemas import UserCreateSchema, UserUpdateSchema, UserResponseSchema, TokenSchema
# 假设密码哈希和验证的函数 (后续应替换为更安全的库如 passlib)
# from werkzeug.security import generate_password_hash, check_password_hash

# 简化的密码处理 (生产环境强烈建议使用 passlib)
def verify_password(plain_password: str, hashed_password: str) -> bool:
    # TODO: 替换为安全的密码比较逻辑
    # 例如: return pwd_context.verify(plain_password, hashed_password)
    return plain_password == hashed_password # 当前为明文比较，不安全！

def get_password_hash(password: str) -> str:
    # TODO: 替换为安全的密码哈希逻辑
    # 例如: return pwd_context.hash(password)
    return password # 当前不哈希，不安全！

class UserManagementService:
    def __init__(self):
        self.user_dao = UserManagementDAO() 

    def create_user(self, user_create_data: UserCreateSchema) -> UserResponseSchema:
        """
        创建新用户。
        - 检查用户名和邮箱是否已存在。
        - 对密码进行哈希处理 (当前为占位符)。
        - 通过 DAO 保存用户。
        """
        existing_user_by_username = self.user_dao.find_user_by_username(user_create_data.username)
        if existing_user_by_username:
            raise ValueError(f"用户名 '{user_create_data.username}' 已存在。")
        
        existing_user_by_email = self.user_dao.find_user_by_email(user_create_data.email)
        if existing_user_by_email:
            raise ValueError(f"邮箱 '{user_create_data.email}' 已被使用。")

        # 密码哈希 (当前为占位符，实际应使用类似 passlib 的库)
        hashed_password = get_password_hash(user_create_data.password)
        
        user_data_to_save = {
            "username": user_create_data.username,
            "email": user_create_data.email,
            "password": hashed_password, # 存储哈希后的密码
            "disabled": False,
            "age": None, # UserCreateSchema 中没有 age，可以在 DAO 层或此处设默认值
            "travel_trails": [] # 新用户默认为空轨迹
        }
        
        # DAO 层应该处理实际的保存逻辑，并可能返回保存后的用户数据（包含ID等）
        # 这里假设 DAO 的 save_user 接受一个字典并返回一个字典
        saved_user_dict = self.user_dao.save_user(user_data_to_save) 
        
        return UserResponseSchema(**saved_user_dict)

    def login_user(self, username: str, password: str) -> TokenSchema:
        """
        用户登录。
        - 查找用户。
        - 验证密码 (当前为占位符)。
        - 生成 token (当前为简单实现)。
        """
        user_dict = self.user_dao.find_user_by_username(username)
        if not user_dict:
            raise ValueError("用户名或密码错误。")
        
        if user_dict.get("disabled", False):
            raise ValueError("账户已被禁用。")

        # 密码验证 (当前为明文比较，非常不安全！)
        if not verify_password(password, user_dict["password"]):
            raise ValueError("用户名或密码错误。")
        
        # 生成 token (与原 user_management/main.py 逻辑类似)
        token_data = f"{username}:{uuid.uuid4().hex}"
        access_token = base64.b64encode(token_data.encode('utf-8')).decode('ascii')
        
        return TokenSchema(
            access_token=access_token, 
            token_type="bearer",
            username=user_dict["username"],
            email=user_dict["email"]
        )

    def get_user_by_username(self, username: str) -> Optional[UserResponseSchema]:
        """
        根据用户名获取用户信息。
        """
        user_dict = self.user_dao.find_user_by_username(username)
        if user_dict:
            # 确保 DAO 返回的数据结构与 UserResponseSchema 兼容
            # password 字段不应返回给客户端
            user_info_for_response = user_dict.copy()
            user_info_for_response.pop("password", None) 
            return UserResponseSchema(**user_info_for_response)
        return None

    def update_user_profile(self, username: str, user_update_data: UserUpdateSchema) -> Optional[UserResponseSchema]:
        """
        更新用户资料。
        - 查找用户。
        - 如果提供了新密码，则进行哈希处理 (当前为占位符)。
        - 通过 DAO 更新用户信息。
        """
        current_user = self.user_dao.find_user_by_username(username)
        if not current_user:
            return None # 或抛出用户未找到的异常
        
        update_data_dict = user_update_data.dict(exclude_unset=True)

        if "password" in update_data_dict and update_data_dict["password"]:
            update_data_dict["password"] = get_password_hash(update_data_dict["password"])
        else:
            update_data_dict.pop("password", None) # 如果密码为空或未提供，则不更新

        updated_user_dict = self.user_dao.update_user(username, update_data_dict)
        if updated_user_dict:
            updated_user_info_for_response = updated_user_dict.copy()
            updated_user_info_for_response.pop("password", None)
            return UserResponseSchema(**updated_user_info_for_response)
        return None

    def delete_user_by_username(self, username: str) -> bool:
        """
        根据用户名删除用户。
        """
        # DAO 的 delete_user 方法应返回一个布尔值表示操作是否成功
        return self.user_dao.delete_user(username)

    # change_password 方法已合并到 update_user_profile 的逻辑中 (如果提供了密码)
    # 如果需要单独的 change_password 接口，可以实现类似原有的逻辑，但调用 DAO 更新。

# 注意：原 user_management/main.py 中的 load_users, save_users 函数的逻辑
# 已经假定被迁移到了 UserManagementDAO 中。

    def get_user_by_id(self, user_id: str):
        """
        根据 ID 获取用户信息。
        """
        # user = self.user_dao.find_user_by_id(user_id)
        # if not user:
        #     return None
        print(f"Fetching user with ID: {user_id}")
        if user_id == "user123":
            return {"id": "user123", "username": "testuser", "email": "test@example.com"}
        return None

    def change_password(self, user_id: str, old_password: str, new_password: str):
        """
        修改用户密码。
        """
        # TODO: 校验旧密码是否正确
        # TODO: 对新密码进行哈希处理
        # success = self.user_dao.update_password(user_id, hashed_new_password)
        print(f"Changing password for user {user_id}")
        if old_password == "oldpass": # 模拟密码验证
            return True
        return False 