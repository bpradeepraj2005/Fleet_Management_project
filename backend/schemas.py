from pydantic import BaseModel, EmailStr
from typing import Optional

class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str
    role: str
    driver_id: Optional[str] = None

class UserLogin(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    role: str
    driver_id: Optional[str] = None

    class Config:
        orm_mode = True

class Token(BaseModel):
    access_token: str
    token_type: str

class RangePredictionRequest(BaseModel):
    current_battery_percent: float
    current_speed_kmph: float
    air_conditioning_usage: int
    outside_temperature_c: float
    avg_gradient_percent: float
    road_type: str
    driver_behavior_score: float

class RangePredictionResponse(BaseModel):
    predicted_range_km: float
