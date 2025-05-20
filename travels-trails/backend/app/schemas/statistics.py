from pydantic import BaseModel
from typing import List

class MonthlyVisit(BaseModel):
    month: str
    count: int

class TransportStat(BaseModel):
    type: str
    count: int

class StatisticsResponse(BaseModel):
    totalCities: int
    countriesCount: int
    travelDistance: float
    monthlyVisits: List[MonthlyVisit]
    transportStats: List[TransportStat] 