from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import date


class UserCreate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone_number: Optional[str] = None
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone_number: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None

class UserResponse(BaseModel):
    id: int
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone_number: Optional[str] = None
    email: EmailStr
    is_verified: bool
    streak_count: int
    badges: Optional[str] = "[]"

    class Config:
        from_attributes = True

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

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
    study_days: Optional[List[int]] = None  # [0, 1, 2, 3, 4, 5, 6] -> Mon-Sun

class EntryCompleteRequest(BaseModel):
    focus_score: float
