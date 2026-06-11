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
    current_battery_pct: float
    current_speed_kmh: float
    outside_temperature_c: float
    ac_status: int
    vehicle_weight_kg: float
    driving_mode: str
    weather_condition: str
    road_type: str

class RangePredictionResponse(BaseModel):
    predicted_range_km: float
