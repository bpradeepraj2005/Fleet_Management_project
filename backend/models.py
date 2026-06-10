from sqlalchemy import Column, Integer, String
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(String) # 'admin' or 'driver'
    driver_id = Column(String, nullable=True) # E.g. USR_DRV_01 for mapping to CSV
