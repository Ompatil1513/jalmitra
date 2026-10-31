from datetime import date
from typing import Optional
from pydantic import BaseModel, Field, field_validator, model_validator
from .agri import CROPS, SOILS, METHODS


class RegisterIn(BaseModel):
    name: str = Field(min_length=2, max_length=60)
    phone: str = Field(pattern=r"^\d{10}$")
    password: str = Field(min_length=6, max_length=64)
    language: str = "mr"


class LoginIn(BaseModel):
    phone: str
    password: str


class FarmIn(BaseModel):
    name: str = Field(min_length=2, max_length=60)
    area_acres: float = Field(gt=0, le=1000)
    location: str = Field(min_length=2, max_length=100)
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    soil: str
    crop: str
    irrigation_method: str = "flood"
    sowing_date: date
    water_capacity_l: float = Field(default=0, ge=0)
    water_available_l: float = Field(default=0, ge=0)

    @field_validator("soil")
    @classmethod
    def _soil(cls, v):
        if v not in SOILS: raise ValueError("unknown soil type")
        return v

    @field_validator("crop")
    @classmethod
    def _crop(cls, v):
        if v not in CROPS: raise ValueError("unknown crop")
        return v

    @field_validator("irrigation_method")
    @classmethod
    def _method(cls, v):
        if v not in METHODS: raise ValueError("unknown irrigation method")
        return v

    @model_validator(mode="after")
    def _water(self):
        if self.water_available_l > self.water_capacity_l:
            raise ValueError("available water cannot be more than capacity")
        return self


class MoistureIn(BaseModel):
    value: float = Field(ge=0, le=100)


class LevelIn(BaseModel):
    available_l: float = Field(ge=0)
    capacity_l: float = Field(ge=0)

    @model_validator(mode="after")
    def _ok(self):
        if self.available_l > self.capacity_l:
            raise ValueError("available water cannot be more than capacity")
        return self


class UsageIn(BaseModel):
    liters: float = Field(gt=0, le=10_000_000)
    day: Optional[date] = None
    note: str = Field(default="", max_length=100)


class ChatIn(BaseModel):
    message: str = Field(min_length=1, max_length=500)
    farm_id: Optional[int] = None
    lang: str = "mr"
