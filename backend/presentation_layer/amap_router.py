from fastapi import APIRouter, HTTPException, Query
from typing import Dict, List, Optional
import httpx
import asyncio
from pydantic import BaseModel

router = APIRouter(
    prefix="/amap",
    tags=["高德地图API"]
)

AMAP_API_KEY = '495943a667b9794bfb3bcb4918f3ccad'
AMAP_BASE_URL = 'https://restapi.amap.com/v3'

class RouteRequest(BaseModel):
    start_lon: float
    start_lat: float
    end_lon: float
    end_lat: float
    transport_mode: str

class BatchRouteRequest(BaseModel):
    routes: List[RouteRequest]

@router.get("/route")
async def get_route(
    start_lon: float = Query(..., description="起点经度"),
    start_lat: float = Query(..., description="起点纬度"),
    end_lon: float = Query(..., description="终点经度"),
    end_lat: float = Query(..., description="终点纬度"),
    transport_mode: str = Query(..., description="交通方式")
):
    """获取两点之间的真实路径"""
    try:
        route_data = await get_real_route(
            {"lon": start_lon, "lat": start_lat},
            {"lon": end_lon, "lat": end_lat},
            transport_mode
        )
        return {"success": True, "data": route_data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取路径失败: {str(e)}")

@router.post("/batch-routes")
async def get_batch_routes(request: BatchRouteRequest):
    """批量获取多个路径"""
    try:
        results = {}
        tasks = []
        
        for i, route_req in enumerate(request.routes):
            task = get_real_route(
                {"lon": route_req.start_lon, "lat": route_req.start_lat},
                {"lon": route_req.end_lon, "lat": route_req.end_lat},
                route_req.transport_mode
            )
            tasks.append((i, task))
        
        # 并发执行所有请求
        for i, task in tasks:
            try:
                route_data = await task
                results[str(i)] = route_data
            except Exception as e:
                print(f"路径 {i} 获取失败: {e}")
                # 失败时使用直线路径
                results[str(i)] = [
                    [request.routes[i].start_lon, request.routes[i].start_lat],
                    [request.routes[i].end_lon, request.routes[i].end_lat]
                ]
        
        return {"success": True, "data": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"批量获取路径失败: {str(e)}")

async def get_real_route(start_coord: Dict, end_coord: Dict, transport_mode: str):
    """获取真实路径的核心函数"""
    try:
        route_data = None
        
        if transport_mode == 'car':
            route_data = await get_driving_route(start_coord, end_coord)
        elif transport_mode == 'walk':
            route_data = await get_walking_route(start_coord, end_coord)

        elif transport_mode == 'bus':
            print(f"巴士路径使用驾车路径规划: {start_coord} -> {end_coord}")
            route_data = await get_driving_route(start_coord, end_coord)  # 巴士使用驾车路径
        else:
            # 对于火车、飞机、轮船等长距离交通，使用直线路径
            return [
                [start_coord["lon"], start_coord["lat"]],
                [end_coord["lon"], end_coord["lat"]]
            ]
        
        return route_data or [
            [start_coord["lon"], start_coord["lat"]],
            [end_coord["lon"], end_coord["lat"]]
        ]
    except Exception as e:
        print(f"获取真实路径失败: {e}")
        # 失败时返回直线路径
        return [
            [start_coord["lon"], start_coord["lat"]],
            [end_coord["lon"], end_coord["lat"]]
        ]

async def get_driving_route(start_coord: Dict, end_coord: Dict):
    """获取驾车路线"""
    url = f"{AMAP_BASE_URL}/direction/driving"
    params = {
        'key': AMAP_API_KEY,
        'origin': f"{start_coord['lon']},{start_coord['lat']}",
        'destination': f"{end_coord['lon']},{end_coord['lat']}",
        'extensions': 'all',
        'output': 'json',
        'strategy': 0
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.get(url, params=params, timeout=30.0)
        data = response.json()
        
        if data.get('status') == '1' and data.get('route') and data['route'].get('paths'):
            path = data['route']['paths'][0]
            coordinates = []
            
            if path.get('steps'):
                for step in path['steps']:
                    if step.get('polyline'):
                        step_coords = parse_polyline(step['polyline'])
                        coordinates.extend(step_coords)
            
            return coordinates
    
    return None

async def get_walking_route(start_coord: Dict, end_coord: Dict):
    """获取步行路线（距离限制约50公里）"""
    # 计算距离，如果超过50公里就返回None，使用直线路径
    import math
    def calculate_distance(lat1, lon1, lat2, lon2):
        R = 6371  # 地球半径
        dLat = math.radians(lat2 - lat1)
        dLon = math.radians(lon2 - lon1)
        a = (math.sin(dLat/2) * math.sin(dLat/2) + 
             math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * 
             math.sin(dLon/2) * math.sin(dLon/2))
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
        return R * c
    
    distance = calculate_distance(start_coord['lat'], start_coord['lon'], 
                                end_coord['lat'], end_coord['lon'])
    
    if distance > 50:  # 步行路径规划距离限制
        print(f"步行距离{distance:.1f}km超出限制，使用直线路径")
        return None
    
    url = f"{AMAP_BASE_URL}/direction/walking"
    params = {
        'key': AMAP_API_KEY,
        'origin': f"{start_coord['lon']},{start_coord['lat']}",
        'destination': f"{end_coord['lon']},{end_coord['lat']}",
        'output': 'json'
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.get(url, params=params, timeout=30.0)
        data = response.json()
        
        if data.get('status') == '1' and data.get('route') and data['route'].get('paths'):
            path = data['route']['paths'][0]
            coordinates = []
            
            if path.get('steps'):
                for step in path['steps']:
                    if step.get('polyline'):
                        step_coords = parse_polyline(step['polyline'])
                        coordinates.extend(step_coords)
            
            return coordinates
    
    return None

async def get_bicycle_route(start_coord: Dict, end_coord: Dict):
    """获取骑行路线（距离限制约100公里）"""
    # 计算距离，如果超过100公里就返回None，使用直线路径
    import math
    def calculate_distance(lat1, lon1, lat2, lon2):
        R = 6371  # 地球半径
        dLat = math.radians(lat2 - lat1)
        dLon = math.radians(lon2 - lon1)
        a = (math.sin(dLat/2) * math.sin(dLat/2) + 
             math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * 
             math.sin(dLon/2) * math.sin(dLon/2))
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
        return R * c
    
    distance = calculate_distance(start_coord['lat'], start_coord['lon'], 
                                end_coord['lat'], end_coord['lon'])
    
    if distance > 100:  # 骑行路径规划距离限制
        print(f"骑行距离{distance:.1f}km超出限制，使用直线路径")
        return None
    
    url = f"{AMAP_BASE_URL}/direction/bicycling"
    params = {
        'key': AMAP_API_KEY,
        'origin': f"{start_coord['lon']},{start_coord['lat']}",
        'destination': f"{end_coord['lon']},{end_coord['lat']}",
        'output': 'json'
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.get(url, params=params, timeout=30.0)
        data = response.json()
        
        if data.get('status') == '1' and data.get('route') and data['route'].get('paths'):
            path = data['route']['paths'][0]
            coordinates = []
            
            if path.get('steps'):
                for step in path['steps']:
                    if step.get('polyline'):
                        step_coords = parse_polyline(step['polyline'])
                        coordinates.extend(step_coords)
            
            return coordinates
    
    return None

async def get_transit_route(start_coord: Dict, end_coord: Dict):
    """获取公交路线（仅支持城市内短距离）"""
    # 公交路径规划主要适用于城市内，距离过远使用直线
    import math
    def calculate_distance(lat1, lon1, lat2, lon2):
        R = 6371  # 地球半径
        dLat = math.radians(lat2 - lat1)
        dLon = math.radians(lon2 - lon1)
        a = (math.sin(dLat/2) * math.sin(dLat/2) + 
             math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * 
             math.sin(dLon/2) * math.sin(dLon/2))
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
        return R * c
    
    distance = calculate_distance(start_coord['lat'], start_coord['lon'], 
                                end_coord['lat'], end_coord['lon'])
    
    if distance > 50:  # 公交路径规划适用于城市内短距离
        print(f"公交距离{distance:.1f}km超出城市范围，使用直线路径")
        return None
    
    url = f"{AMAP_BASE_URL}/direction/transit/integrated"
    params = {
        'key': AMAP_API_KEY,
        'origin': f"{start_coord['lon']},{start_coord['lat']}",
        'destination': f"{end_coord['lon']},{end_coord['lat']}",
        'city': '北京',  # 改为具体城市，而不是"全国"
        'output': 'json',
        'strategy': 0
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.get(url, params=params, timeout=30.0)
        data = response.json()
        
        if data.get('status') == '1' and data.get('route') and data['route'].get('transits'):
            transit = data['route']['transits'][0]
            coordinates = []
            
            if transit.get('segments'):
                for segment in transit['segments']:
                    # 处理步行路段
                    if segment.get('walking') and segment['walking'].get('steps'):
                        for step in segment['walking']['steps']:
                            if step.get('polyline'):
                                step_coords = parse_polyline(step['polyline'])
                                coordinates.extend(step_coords)
                    
                    # 处理公交路段
                    if segment.get('bus') and segment['bus'].get('buslines'):
                        for busline in segment['bus']['buslines']:
                            if busline.get('polyline'):
                                bus_coords = parse_polyline(busline['polyline'])
                                coordinates.extend(bus_coords)
            
            return coordinates
    
    return None

def parse_polyline(polyline_str: str):
    """解析高德API返回的polyline格式"""
    if not polyline_str:
        return []
    
    coordinates = []
    for point in polyline_str.split(';'):
        try:
            lon, lat = point.split(',')
            coordinates.append([float(lon), float(lat)])
        except (ValueError, IndexError):
            continue
    
    return coordinates 