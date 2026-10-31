from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Date, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from .database import Base


class Farmer(Base):
    __tablename__ = "farmers"
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    phone = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    language = Column(String, default="mr")
    farms = relationship("Farm", cascade="all,delete-orphan")


class Farm(Base):
    __tablename__ = "farms"
    id = Column(Integer, primary_key=True)
    farmer_id = Column(Integer, ForeignKey("farmers.id"), nullable=False)
    name = Column(String, nullable=False)
    area_acres = Column(Float, nullable=False)
    location = Column(String, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    soil = Column(String, nullable=False)
    crop = Column(String, nullable=False)
    sowing_date = Column(Date, nullable=False)
    irrigation_method = Column(String, default="flood")
    # soil moisture = % of plant-available water (0 = wilting point, 100 = field capacity)
    soil_moisture = Column(Float, default=70.0)
    moisture_source = Column(String, default="assumed")  # manual | simulated | estimated | assumed | sample
    moisture_updated = Column(DateTime, default=datetime.now)
    water_capacity_l = Column(Float, default=0)
    water_available_l = Column(Float, default=0)
    usages = relationship("WaterUsage", cascade="all,delete-orphan")
    irrigations = relationship("IrrigationLog", cascade="all,delete-orphan")
    weather = relationship("WeatherRecord", cascade="all,delete-orphan")


class WaterUsage(Base):
    __tablename__ = "water_usage"
    id = Column(Integer, primary_key=True)
    farm_id = Column(Integer, ForeignKey("farms.id"), nullable=False)
    day = Column(Date, nullable=False)
    liters = Column(Float, nullable=False)
    note = Column(String, default="")


class IrrigationLog(Base):
    __tablename__ = "irrigation_history"
    id = Column(Integer, primary_key=True)
    farm_id = Column(Integer, ForeignKey("farms.id"), nullable=False)
    day = Column(Date, nullable=False)
    liters = Column(Float, nullable=False)
    mm = Column(Float, default=0)
    note = Column(String, default="")
    source = Column(String, default="manual")  # manual | sample


class WeatherRecord(Base):
    __tablename__ = "weather_records"
    id = Column(Integer, primary_key=True)
    farm_id = Column(Integer, ForeignKey("farms.id"), nullable=False)
    day = Column(Date, nullable=False)
    tmax = Column(Float)
    tmin = Column(Float)
    humidity = Column(Float)
    rain = Column(Float)
    rain_prob = Column(Float)
    et0 = Column(Float)
    source = Column(String)  # live | demo
    note = Column(String, default="")
    fetched_at = Column(DateTime, default=datetime.now)
