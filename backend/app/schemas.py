from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import date


class UserCreate(BaseModel):
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class CourseCreate(BaseModel):
    course_name: str
    difficulty: int
    credit: int


class CourseUpdate(BaseModel):
    difficulty: int


class ExamCreate(BaseModel):
    course_id: int
    exam_date: Optional[date] = None
    exam_type: str = "other"


class ExamUpdate(BaseModel):
    exam_date: Optional[date] = None
    exam_type: Optional[str] = None


class AvailabilityCreate(BaseModel):
    start_time: str
    end_time: str


class AvailabilityBulkCreate(BaseModel):
    windows: List[AvailabilityCreate]


class PlanRequest(BaseModel):
    preferred_block_hours: int = 2