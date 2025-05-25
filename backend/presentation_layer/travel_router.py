from fastapi import APIRouter, HTTPException, Form, status, Depends
from typing import List

# 使用新的 schemas
from .schemas import CitySchema as City # Renamed from user_models
from .schemas import CityCreateSchema as CityCreate
from .schemas import CityUpdateSchema as CityUpdate
from .schemas import PhotoSchema # For photo data

# 导入 UserManagementDAO (暂时直接使用，理想情况下应通过服务层)
# 或者依赖一个 get_user_management_service
from ..business_logic_layer.user_management_service import UserManagementService
from ..data_access_layer.user_management_dao import UserManagementDAO # Direct DAO for now

# 依赖注入函数
def get_user_management_dao(): # Temporary direct DAO access
    return UserManagementDAO()

def get_user_management_service(): # For consistency, though some direct DAO calls remain for now
    return UserManagementService()


router = APIRouter(
    # prefix="/travel", # Prefix will be handled by how it's included in main or user_router
    tags=["User Travel Trails"]
)

# --- Helper functions adaptación ---
# 这些函数现在将使用 DAO
# 注意：直接在路由中使用 DAO 违反了严格的分层，这是一个临时的迁移步骤。
# 理想情况下，所有数据操作都应通过服务层。

def verify_and_get_user_for_travel(username: str, dao: UserManagementDAO = Depends(get_user_management_dao)):
    user = dao.find_user_by_username(username)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="用户不存在"
        )
    # 初始化 travel_trails 和 cities 如果它们不存在 (在DAO返回的字典上操作)
    if "travel_trails" not in user or not user["travel_trails"]:
        user["travel_trails"] = [{"cities": []}]
    elif "cities" not in user["travel_trails"][0]:
        user["travel_trails"][0]["cities"] = []
    return user

# --- Travel Routes ---

@router.get("/{username}/cities", response_model=List[City])
async def get_user_cities_route(username: str, dao: UserManagementDAO = Depends(get_user_management_dao)):
    user = verify_and_get_user_for_travel(username, dao)
    return user["travel_trails"][0]["cities"]

@router.post("/{username}/cities", response_model=City, status_code=status.HTTP_201_CREATED)
async def add_city_route(username: str, city_create: CityCreate, dao: UserManagementDAO = Depends(get_user_management_dao)):
    user = verify_and_get_user_for_travel(username, dao)
    
    new_city_data = city_create.dict()
    # Ensure photos and blog are initialized if not present in CityCreate schema
    new_city_data.setdefault("photos", [])
    new_city_data.setdefault("blog", "")
    
    # FastAPI/Pydantic 会自动校验 CityCreate，这里直接用
    user["travel_trails"][0]["cities"].append(new_city_data)
    dao.update_user(username, {"travel_trails": user["travel_trails"]}) # Save entire user object
    # 返回创建的城市数据，确保它符合City schema
    return City(**new_city_data)


@router.delete("/{username}/cities/{city_index}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_city_route(username: str, city_index: int, dao: UserManagementDAO = Depends(get_user_management_dao)):
    user = verify_and_get_user_for_travel(username, dao)
    cities = user["travel_trails"][0]["cities"]
    if not (0 <= city_index < len(cities)):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="城市索引无效")
    cities.pop(city_index)
    dao.update_user(username, {"travel_trails": user["travel_trails"]})
    return

@router.put("/{username}/cities/{city_index}/blog", response_model=City)
async def update_city_blog_route(username: str, city_index: int, city_update: CityUpdate, dao: UserManagementDAO = Depends(get_user_management_dao)):
    user = verify_and_get_user_for_travel(username, dao)
    cities = user["travel_trails"][0]["cities"]
    if not (0 <= city_index < len(cities)):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="城市索引无效")
    cities[city_index]["blog"] = city_update.blog
    dao.update_user(username, {"travel_trails": user["travel_trails"]})
    return City(**cities[city_index])

@router.post("/{username}/cities/{city_index}/photos", response_model=City, status_code=status.HTTP_201_CREATED)
async def add_photo_to_city_route(username: str, city_index: int, photo_data: str = Form(..., alias="data"), dao: UserManagementDAO = Depends(get_user_management_dao)):
    user = verify_and_get_user_for_travel(username, dao)
    cities = user["travel_trails"][0]["cities"]
    if not (0 <= city_index < len(cities)):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="城市索引无效")
    
    # 确保 photos 列表存在
    if "photos" not in cities[city_index] or cities[city_index]["photos"] is None:
        cities[city_index]["photos"] = []
        
    # photo_data is base64 string for the photo
    new_photo = PhotoSchema(data=photo_data)
    cities[city_index]["photos"].append(new_photo.dict())
    dao.update_user(username, {"travel_trails": user["travel_trails"]})
    return City(**cities[city_index])

@router.delete("/{username}/cities/{city_index}/photos/{photo_index}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_photo_from_city_route(username: str, city_index: int, photo_index: int, dao: UserManagementDAO = Depends(get_user_management_dao)):
    user = verify_and_get_user_for_travel(username, dao)
    cities = user["travel_trails"][0]["cities"]
    if not (0 <= city_index < len(cities)):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="城市索引无效")
    
    photos = cities[city_index].get("photos", [])
    if not photos or not (0 <= photo_index < len(photos)):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="照片索引无效")
        
    photos.pop(photo_index)
    dao.update_user(username, {"travel_trails": user["travel_trails"]})
    return 