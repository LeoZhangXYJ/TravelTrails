# backend/data_access_layer/user_management_dao.py
# 隔离用户管理相关的数据操作

# from .models import User, get_db # 假设 User 模型和数据库会话获取函数在 models.py
# from werkzeug.security import generate_password_hash, check_password_hash # 用于密码哈希

import json
import os
from typing import Optional, Dict, List, Any

# --- 修改 USERS_FILE 路径 --- 
# 获取当前 DAO 文件所在的目录
_DAO_DIR = os.path.dirname(os.path.abspath(__file__))
# 定义 users.json 文件相对于 DAO 文件目录的位置
USERS_FILE = os.path.join(_DAO_DIR, "users.json")

class UserManagementDAO:
    def __init__(self):
        # self.db_session = next(get_db()) # 如果使用数据库
        # 确保 users.json 文件存在，如果不存在则创建一个空的
        if not os.path.exists(USERS_FILE):
            self._save_users_to_file({}) # 创建空文件
        pass

    def _load_users_from_file(self) -> Dict[str, Dict]:
        """从 JSON 文件加载用户数据。"""
        if not os.path.exists(USERS_FILE):
            # 如果在 init 时检查并创建了，这里理论上不应该再需要判断不存在的情况
            # 但作为健壮性保留
            return {}
        try:
            with open(USERS_FILE, "r", encoding='utf-8') as f:
                data = json.load(f)
                return data if isinstance(data, dict) else {}
        except (json.JSONDecodeError, FileNotFoundError):
             # 如果文件为空或者不是有效的JSON，也返回空字典
            return {}
        except Exception as e:
            print(f"Error loading users from {USERS_FILE}: {e}") # 添加日志
            return {}

    def _save_users_to_file(self, users: Dict[str, Dict]):
        """将用户数据保存到 JSON 文件。"""
        try:
            with open(USERS_FILE, "w", encoding='utf-8') as f:
                json.dump(users, f, indent=2, ensure_ascii=False)
        except Exception as e:
            # 在实际应用中，这里应该有更健壮的错误处理和日志记录
            print(f"DAO Error: Failed to save user data to {USERS_FILE}: {e}")
            # raise PersistError(f"Failed to save user data: {str(e)}") # 自定义异常
            raise IOError(f"Failed to save user data to {USERS_FILE}: {str(e)}")

    def find_user_by_username(self, username: str) -> Optional[Dict[str, Any]]:
        """通过用户名查找用户。"""
        users = self._load_users_from_file()
        return users.get(username)

    def find_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """通过邮箱查找用户。"""
        users = self._load_users_from_file()
        for user_data in users.values():
            if user_data.get("email") == email:
                return user_data
        return None

    def save_user(self, user_data_to_save: Dict[str, Any]) -> Dict[str, Any]:
        """保存新用户或更新现有用户信息 (基于 username 作为 key)。"""
        users = self._load_users_from_file()
        username = user_data_to_save.get("username")
        if not username:
            raise ValueError("Username is required to save a user.")
        
        # 原 user_management/main.py 使用 username 作为 users 字典的键
        users[username] = user_data_to_save
        self._save_users_to_file(users)
        # 返回保存的数据，模拟数据库返回包含ID等的情况 (此处username即ID)
        return user_data_to_save 

    def update_user(self, username: str, update_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """更新指定用户名的用户信息。"""
        users = self._load_users_from_file()
        if username in users:
            users[username].update(update_data)
            self._save_users_to_file(users)
            return users[username]
        return None

    def delete_user(self, username: str) -> bool:
        """通过用户名删除用户。"""
        users = self._load_users_from_file()
        if username in users:
            del users[username]
            self._save_users_to_file(users)
            return True
        return False

    # find_user_by_id 如果需要，可以实现，但当前 users.json 是以 username 为主键
    # def find_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
    #     users = self._load_users_from_file()
    #     # 遍历查找，因为 ID 可能不是主键
    #     for username, user_data in users.items():
    #         if user_data.get("id_field_if_exists") == user_id: # 假设有个 id 字段
    #             return user_data
    #     return None

# 注意：原 UserManagementDAO 中的示例代码已被替换为基于 JSON 文件的实现。
# 密码哈希的职责已移至服务层，DAO 只负责存储和检索数据。

    def find_user_by_id(self, user_id: int):
        """
        通过 ID 查找用户。
        """
        # user = self.db_session.query(User).filter(User.id == user_id).first()
        print(f"DAO: Finding user by ID: {user_id}")
        if user_id == 123: # 模拟查找
            return {"id": 123, "username": "testuser", "email": "test@example.com"}
        return None

    def update_password(self, user_id: int, new_password_hash: str):
        """
        更新用户密码。
        """
        # user = self.find_user_by_id(user_id)
        # if user:
        #     user.password_hash = new_password_hash
        #     self.db_session.commit()
        #     return True
        # return False
        print(f"DAO: Updating password for user {user_id}")
        return True

    # 其他用户相关的数据访问方法... 