from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from user_management import user_routes, travel_routes
from routes import router as ai_router
import logging

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# 配置 CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(user_routes.router, prefix="/api/users", tags=["users"])
app.include_router(travel_routes.router, prefix="/api/travel", tags=["travel"])
app.include_router(ai_router, prefix="/api/ai", tags=["ai"])

@app.get("/")
async def root():
    return {"message": "Welcome to Travel Trails API"}

@app.get("/test")
async def test():
    return {"message": "Test endpoint working"}

@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f"Request: {request.method} {request.url}")
    try:
        body = await request.body()
        if body:
            logger.info(f"Request body: {body.decode()}")
    except Exception as e:
        logger.error(f"Error reading request body: {str(e)}")
    
    response = await call_next(request)
    logger.info(f"Response status: {response.status_code}")
    return response

if __name__ == "__main__":
    import uvicorn
    # 打印所有可用的路由
    logger.info("Available routes:")
    for route in app.routes:
        logger.info(f"{route.methods} {route.path}")
    uvicorn.run(app, host="0.0.0.0", port=8000) 