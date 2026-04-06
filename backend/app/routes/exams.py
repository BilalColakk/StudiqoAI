from datetime import date
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models
from ..schemas import ExamCreate, ExamUpdate
from ..services.dependencies import get_db, get_current_user

router = APIRouter(prefix="/exams", tags=["Exams"])

ALLOWED_EXAM_TYPES = {"quiz", "midterm", "final", "other"}
SINGLE_INSTANCE_TYPES = {"midterm", "final"}


@router.post("/")
def create_exam(
    exam: ExamCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if exam.exam_type not in ALLOWED_EXAM_TYPES:
        raise HTTPException(status_code=400, detail="Invalid exam_type")

    if exam.exam_date is not None and exam.exam_date < date.today():
        raise HTTPException(status_code=400, detail="Past exam dates are not allowed")

    course = (
        db.query(models.Course)
        .filter(
            models.Course.id == exam.course_id,
            models.Course.user_id == current_user.id
        )
        .first()
    )

    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    if exam.exam_type in SINGLE_INSTANCE_TYPES:
        existing_exam = (
            db.query(models.Exam)
            .filter(
                models.Exam.course_id == course.id,
                models.Exam.exam_type == exam.exam_type
            )
            .first()
        )

        if existing_exam:
            raise HTTPException(
                status_code=400,
                detail=f"This course already has an exam record for type '{exam.exam_type}'"
            )

    new_exam = models.Exam(
        course_id=exam.course_id,
        exam_date=exam.exam_date,
        exam_type=exam.exam_type
    )

    db.add(new_exam)
    db.commit()
    db.refresh(new_exam)

    return {
        "message": "Exam created successfully",
        "exam": {
            "id": new_exam.id,
            "course_id": new_exam.course_id,
            "exam_date": new_exam.exam_date,
            "exam_type": new_exam.exam_type
        }
    }


@router.get("/my-exams")
def get_my_exams(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    exams = (
        db.query(models.Exam, models.Course)
        .join(models.Course, models.Exam.course_id == models.Course.id)
        .filter(models.Course.user_id == current_user.id)
        .order_by(models.Exam.exam_date.asc())
        .all()
    )

    return {
        "exams": [
            {
                "exam_id": exam.id,
                "course_id": course.id,
                "course_name": course.course_name,
                "exam_date": exam.exam_date,
                "exam_type": exam.exam_type
            }
            for exam, course in exams
        ]
    }


@router.put("/{exam_id}")
def update_exam(
    exam_id: int,
    exam_data: ExamUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    result = (
        db.query(models.Exam, models.Course)
        .join(models.Course, models.Exam.course_id == models.Course.id)
        .filter(
            models.Exam.id == exam_id,
            models.Course.user_id == current_user.id
        )
        .first()
    )

    if not result:
        raise HTTPException(status_code=404, detail="Exam not found")

    exam, course = result

    if exam_data.exam_date is not None and exam_data.exam_date < date.today():
        raise HTTPException(status_code=400, detail="Past exam dates are not allowed")

    if exam_data.exam_type is not None:
        if exam_data.exam_type not in ALLOWED_EXAM_TYPES:
            raise HTTPException(status_code=400, detail="Invalid exam_type")

        if exam_data.exam_type in SINGLE_INSTANCE_TYPES:
            duplicate = (
                db.query(models.Exam)
                .filter(
                    models.Exam.course_id == course.id,
                    models.Exam.exam_type == exam_data.exam_type,
                    models.Exam.id != exam.id
                )
                .first()
            )

            if duplicate:
                raise HTTPException(
                    status_code=400,
                    detail=f"This course already has an exam record for type '{exam_data.exam_type}'"
                )

        exam.exam_type = exam_data.exam_type

    exam.exam_date = exam_data.exam_date
    db.commit()
    db.refresh(exam)

    return {
        "message": "Exam updated successfully",
        "exam": {
            "exam_id": exam.id,
            "course_id": course.id,
            "course_name": course.course_name,
            "exam_date": exam.exam_date,
            "exam_type": exam.exam_type
        }
    }


@router.delete("/{exam_id}")
def delete_exam(
    exam_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    result = (
        db.query(models.Exam, models.Course)
        .join(models.Course, models.Exam.course_id == models.Course.id)
        .filter(
            models.Exam.id == exam_id,
            models.Course.user_id == current_user.id
        )
        .first()
    )

    if not result:
        raise HTTPException(status_code=404, detail="Exam not found")

    exam, _ = result
    db.delete(exam)
    db.commit()

    return {"message": "Exam deleted successfully", "exam_id": exam_id}