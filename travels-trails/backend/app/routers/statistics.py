from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import matplotlib.pyplot as plt
import io
import base64
from datetime import datetime
import seaborn as sns
from ..database import get_db
from ..models import City, Travel
from ..schemas.statistics import StatisticsResponse

router = APIRouter()

def generate_chart_image(fig):
    buf = io.BytesIO()
    fig.savefig(buf, format='png', bbox_inches='tight')
    buf.seek(0)
    img_str = base64.b64encode(buf.read()).decode()
    plt.close(fig)
    return img_str

@router.get("/api/statistics", response_model=StatisticsResponse)
def get_statistics(db: Session = Depends(get_db)):
    # 获取基本统计数据
    total_cities = db.query(City).count()
    countries = db.query(City.country).distinct().all()
    countries_count = len(countries)
    
    # 计算总旅行距离
    travels = db.query(Travel).all()
    total_distance = sum(travel.distance for travel in travels)
    
    # 获取月度访问数据
    monthly_visits = db.query(
        func.date_trunc('month', Travel.visit_date).label('month'),
        func.count(Travel.id).label('count')
    ).group_by('month').all()
    
    # 获取交通方式统计
    transport_stats = db.query(
        Travel.transport_type,
        func.count(Travel.id).label('count')
    ).group_by(Travel.transport_type).all()
    
    return {
        "totalCities": total_cities,
        "countriesCount": countries_count,
        "travelDistance": total_distance,
        "monthlyVisits": [{"month": str(m.month), "count": m.count} for m in monthly_visits],
        "transportStats": [{"type": t.transport_type, "count": t.count} for t in transport_stats]
    }

@router.get("/api/statistics/country-chart")
def get_country_chart(db: Session = Depends(get_db)):
    # 获取国家访问统计
    country_stats = db.query(
        City.country,
        func.count(City.id).label('count')
    ).group_by(City.country).all()
    
    # 创建图表
    plt.figure(figsize=(10, 6))
    sns.barplot(x='country', y='count', data=country_stats)
    plt.title('国家访问分布')
    plt.xticks(rotation=45)
    plt.tight_layout()
    
    return generate_chart_image(plt.gcf())

@router.get("/api/statistics/monthly-chart")
def get_monthly_chart(db: Session = Depends(get_db)):
    # 获取月度访问数据
    monthly_data = db.query(
        func.date_trunc('month', Travel.visit_date).label('month'),
        func.count(Travel.id).label('count')
    ).group_by('month').all()
    
    # 创建图表
    plt.figure(figsize=(10, 6))
    sns.lineplot(x='month', y='count', data=monthly_data)
    plt.title('月度访问趋势')
    plt.xticks(rotation=45)
    plt.tight_layout()
    
    return generate_chart_image(plt.gcf())

@router.get("/api/statistics/transport-chart")
def get_transport_chart(db: Session = Depends(get_db)):
    # 获取交通方式统计
    transport_data = db.query(
        Travel.transport_type,
        func.count(Travel.id).label('count')
    ).group_by(Travel.transport_type).all()
    
    # 创建图表
    plt.figure(figsize=(10, 6))
    sns.pie(x='count', labels='transport_type', data=transport_data, autopct='%1.1f%%')
    plt.title('交通方式分布')
    plt.tight_layout()
    
    return generate_chart_image(plt.gcf())

@router.get("/api/statistics/distance-chart")
def get_distance_chart(db: Session = Depends(get_db)):
    # 获取旅行距离数据
    distances = db.query(Travel.distance).all()
    
    # 创建图表
    plt.figure(figsize=(10, 6))
    sns.histplot(distances, bins=20)
    plt.title('旅行距离分布')
    plt.xlabel('距离 (km)')
    plt.ylabel('频次')
    plt.tight_layout()
    
    return generate_chart_image(plt.gcf()) 