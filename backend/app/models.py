from sqlalchemy import Column, Integer, String, Date, Boolean, ForeignKey, DateTime, Float
from sqlalchemy.sql import func
from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)


class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    course_name = Column(String, nullable=False)
    difficulty = Column(Integer, nullable=False)
    credit = Column(Integer, nullable=False)


class Exam(Base):
    __tablename__ = "exams"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    exam_date = Column(Date, nullable=True)
    exam_type = Column(String, nullable=False, default="other")  # quiz, midterm, final, other


class StudyAvailability(Base):
    __tablename__ = "study_availabilities"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    start_time = Column(String, nullable=False)
    end_time = Column(String, nullable=False)


class StudyPlan(Base):
    __tablename__ = "study_plans"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    daily_study_hours = Column(Integer, nullable=False)
    preferred_block_hours = Column(Integer, nullable=False, default=2)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class StudyPlanEntry(Base):
    __tablename__ = "study_plan_entries"

    id = Column(Integer, primary_key=True, index=True)
    study_plan_id = Column(Integer, ForeignKey("study_plans.id"), nullable=False)
    entry_date = Column(Date, nullable=False)
    entry_type = Column(String, nullable=False)  # study | break
    course_name = Column(String, nullable=True)
    study_hours = Column(Float, nullable=True)
    duration_minutes = Column(Integer, nullable=False)
    start_time = Column(String, nullable=False)
    end_time = Column(String, nullable=False)
    priority = Column(Integer, nullable=True)
    difficulty = Column(Integer, nullable=True)
    credit = Column(Integer, nullable=True)
    exam_date = Column(String, nullable=True)
    exam_type = Column(String, nullable=True)
    daily_cap = Column(Integer, nullable=True)
    status = Column(String, default="pending", nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)