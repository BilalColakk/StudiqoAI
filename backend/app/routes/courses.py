from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models
from ..schemas import CourseCreate, CourseUpdate
from ..services.dependencies import get_db, get_current_user

router = APIRouter(prefix="/courses", tags=["Courses"])


@router.post("/")
def create_course(
    course: CourseCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if not 1 <= course.difficulty <= 10:
        raise HTTPException(status_code=400, detail="Difficulty must be between 1 and 10")

    if not 1 <= course.credit <= 10:
        raise HTTPException(status_code=400, detail="Credit must be between 1 and 10")

    new_course = models.Course(
        user_id=current_user.id,
        course_name=course.course_name,
        difficulty=course.difficulty,
        credit=course.credit
    )

    db.add(new_course)
    db.commit()
    db.refresh(new_course)

    return {
        "message": "Course created successfully",
        "course": {
            "id": new_course.id,
            "course_name": new_course.course_name,
            "difficulty": new_course.difficulty,
            "credit": new_course.credit,
            "user_id": new_course.user_id
        }
    }


@router.get("/my-courses")
def get_my_courses(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    courses = (
        db.query(models.Course)
        .filter(models.Course.user_id == current_user.id)
        .all()
    )

    return {
        "user_email": current_user.email,
        "total_courses": len(courses),
        "courses": [
            {
                "id": c.id,
                "course_name": c.course_name,
                "difficulty": c.difficulty,
                "credit": c.credit
            }
            for c in courses
        ]
    }


@router.put("/{course_id}/difficulty")
def update_course_difficulty(
    course_id: int,
    course_data: CourseUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if not 1 <= course_data.difficulty <= 10:
        raise HTTPException(status_code=400, detail="Difficulty must be between 1 and 10")

    course = (
        db.query(models.Course)
        .filter(
            models.Course.id == course_id,
            models.Course.user_id == current_user.id
        )
        .first()
    )

    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    course.difficulty = course_data.difficulty
    db.commit()
    db.refresh(course)

    return {
        "message": "Course difficulty updated successfully",
        "course": {
            "id": course.id,
            "course_name": course.course_name,
            "difficulty": course.difficulty,
            "credit": course.credit
        }
    }


@router.delete("/{course_id}")
def delete_course(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    course = (
        db.query(models.Course)
        .filter(
            models.Course.id == course_id,
            models.Course.user_id == current_user.id
        )
        .first()
    )

    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    exam = db.query(models.Exam).filter(models.Exam.course_id == course.id).first()
    if exam:
        db.delete(exam)

    db.delete(course)
    db.commit()

    return {"message": "Course deleted successfully", "course_id": course_id}