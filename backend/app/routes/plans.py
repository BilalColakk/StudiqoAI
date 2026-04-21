from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timezone, date
import json

from .. import models, schemas
from ..schemas import PlanRequest, EntryCompleteRequest
from ..services.dependencies import get_db, get_current_user
from ..services.planner import (
    calculate_priority,
    distribute_weekly_hours,
    build_smart_weekly_plan,
    build_course_performance_map,
    apply_adaptive_boost
)
from ..services.achievements import update_streak, check_and_award_badges, BADGES_LIST

router = APIRouter(prefix="/plans", tags=["Plans"])


def get_relevant_exam_for_course(db: Session, course_id: int):
    """
    Önce en yakın gelecek sınavı bulur.
    Gelecek sınav yoksa en son geçmiş sınavı döndürür.
    """
    future_exam = (
        db.query(models.Exam)
        .filter(
            models.Exam.course_id == course_id,
            models.Exam.exam_date.isnot(None),
            models.Exam.exam_date >= date.today()
        )
        .order_by(models.Exam.exam_date.asc())
        .first()
    )

    if future_exam:
        return future_exam

    past_exam = (
        db.query(models.Exam)
        .filter(
            models.Exam.course_id == course_id,
            models.Exam.exam_date.isnot(None)
        )
        .order_by(models.Exam.exam_date.desc())
        .first()
    )

    return past_exam


def get_user_availability_windows(db: Session, user_id: int):
    rows = (
        db.query(models.StudyAvailability)
        .filter(models.StudyAvailability.user_id == user_id)
        .all()
    )

    return [
        {"day_of_week": r.day_of_week, "start_time": r.start_time, "end_time": r.end_time}
        for r in rows
    ]


def calculate_weekly_hours_from_windows(windows):
    total_minutes = 0

    for w in windows:
        sh, sm = map(int, w["start_time"].split(":"))
        eh, em = map(int, w["end_time"].split(":"))
        total_minutes += (eh * 60 + em) - (sh * 60 + sm)

    return total_minutes // 60


def delete_existing_active_plan(db: Session, user_id: int):
    """
    Sadece aktif planı ve entry'lerini siler.
    """
    active_plans = (
        db.query(models.StudyPlan)
        .filter(
            models.StudyPlan.user_id == user_id,
            models.StudyPlan.is_active.is_(True)
        )
        .all()
    )

    for plan in active_plans:
        entries = (
            db.query(models.StudyPlanEntry)
            .filter(models.StudyPlanEntry.study_plan_id == plan.id)
            .all()
        )

        for entry in entries:
            db.delete(entry)

        db.delete(plan)

    db.commit()


def get_latest_or_active_plan(db: Session, user_id: int):
    """
    Önce aktif planı bulmaya çalışır.
    Bulamazsa kullanıcıya ait en son planı fallback olarak döndürür.
    """
    active_plan = (
        db.query(models.StudyPlan)
        .filter(
            models.StudyPlan.user_id == user_id,
            models.StudyPlan.is_active.is_(True)
        )
        .order_by(models.StudyPlan.created_at.desc())
        .first()
    )

    if active_plan:
        return active_plan

    latest_plan = (
        db.query(models.StudyPlan)
        .filter(models.StudyPlan.user_id == user_id)
        .order_by(models.StudyPlan.created_at.desc())
        .first()
    )

    return latest_plan


def save_weekly_plan_entries(db: Session, plan_id: int, weekly_plan: list):
    """
    weekly_plan formatı beklenen yapıda değilse çökmesin diye korumalı kayıt fonksiyonu.
    """
    for day in weekly_plan:
        if not isinstance(day, dict):
            continue

        day_date = day.get("date")
        day_entries = day.get("entries", [])

        if not day_date:
            continue

        entry_date = datetime.strptime(day_date, "%Y-%m-%d").date()

        for entry in day_entries:
            if not isinstance(entry, dict):
                continue

            db.add(
                models.StudyPlanEntry(
                    study_plan_id=plan_id,
                    entry_date=entry_date,
                    entry_type=entry.get("type"),
                    course_name=entry.get("course_name"),
                    study_hours=entry.get("study_hours"),
                    duration_minutes=entry.get("duration_minutes", 0),
                    start_time=entry.get("start_time", ""),
                    end_time=entry.get("end_time", ""),
                    priority=entry.get("priority"),
                    difficulty=entry.get("difficulty"),
                    credit=entry.get("credit"),
                    exam_date=entry.get("exam_date"),
                    exam_type=entry.get("exam_type"),
                    daily_cap=entry.get("daily_cap"),
                    status="pending"
                )
            )

    db.commit()


@router.post("/generate")
def generate_plan(
    request: PlanRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    availability_windows = get_user_availability_windows(db, current_user.id)

    if not availability_windows:
        raise HTTPException(
            status_code=400,
            detail="Please define availability windows first"
        )

    weekly_total_hours = calculate_weekly_hours_from_windows(availability_windows)

    if weekly_total_hours < 1 or weekly_total_hours > 84:
        raise HTTPException(
            status_code=400,
            detail="Derived weekly study hours must be between 1 and 84"
        )

    if request.preferred_block_hours < 1 or request.preferred_block_hours > 4:
        raise HTTPException(
            status_code=400,
            detail="preferred_block_hours must be between 1 and 4"
        )

    all_courses = (
        db.query(models.Course)
        .filter(models.Course.user_id == current_user.id)
        .all()
    )

    if not all_courses:
        raise HTTPException(
            status_code=404,
            detail="No courses found for current user"
        )

    prioritized_courses = []

    for course in all_courses:
        exam = get_relevant_exam_for_course(db, course.id)
        exam_date = exam.exam_date if exam and exam.exam_date else None
        exam_type = exam.exam_type if exam else None

        priority = calculate_priority(
            course,
            exam_date,
            exam_type or "other"
        )

        prioritized_courses.append({
            "course_id": course.id,
            "course_name": course.course_name,
            "difficulty": course.difficulty,
            "credit": course.credit,
            "exam_date": str(exam_date) if exam_date else None,
            "exam_date_obj": exam_date,
            "exam_type": exam_type,
            "priority": priority
        })

    prioritized_courses.sort(key=lambda x: x["priority"], reverse=True)
    prioritized_courses = distribute_weekly_hours(
        prioritized_courses,
        weekly_total_hours
    )

    weekly_plan = build_smart_weekly_plan(
        prioritized_courses,
        weekly_total_hours,
        availability_windows,
        request.preferred_block_hours,
        study_days=request.study_days
    )


    delete_existing_active_plan(db, current_user.id)

    new_plan = models.StudyPlan(
        user_id=current_user.id,
        daily_study_hours=weekly_total_hours // 7 if weekly_total_hours > 7 else 1,
        preferred_block_hours=request.preferred_block_hours,
        is_active=True
    )
    db.add(new_plan)
    db.commit()
    db.refresh(new_plan)

    new_plan.is_active = True
    db.commit()
    db.refresh(new_plan)

    save_weekly_plan_entries(db, new_plan.id, weekly_plan)

    return {
        "message": "Plan generated successfully",
        "plan_id": new_plan.id,
        "weekly_total_hours": weekly_total_hours,
        "preferred_block_hours": new_plan.preferred_block_hours,
        "availability_windows": availability_windows,
        "courses_summary": prioritized_courses,
        "weekly_plan": weekly_plan
    }


@router.get("/latest")
def get_latest_plan(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    latest_plan = get_latest_or_active_plan(db, current_user.id)

    if not latest_plan:
        raise HTTPException(status_code=404, detail="No plan found")

    entries = (
        db.query(models.StudyPlanEntry)
        .filter(models.StudyPlanEntry.study_plan_id == latest_plan.id)
        .order_by(
            models.StudyPlanEntry.entry_date.asc(),
            models.StudyPlanEntry.start_time.asc()
        )
        .all()
    )

    grouped = {}
    for entry in entries:
        key = str(entry.entry_date)

        if key not in grouped:
            grouped[key] = []

        item = {
            "id": entry.id,
            "type": entry.entry_type,
            "duration_minutes": entry.duration_minutes,
            "start_time": entry.start_time,
            "end_time": entry.end_time,
            "status": entry.status
        }

        if entry.entry_type == "study":
            item.update({
                "course_name": entry.course_name,
                "study_hours": entry.study_hours,
                "priority": entry.priority,
                "difficulty": entry.difficulty,
                "credit": entry.credit,
                "exam_date": entry.exam_date,
                "exam_type": entry.exam_type,
                "daily_cap": entry.daily_cap
            })

        grouped[key].append(item)

    weekly_plan = [
        {"date": d, "entries": grouped[d]}
        for d in sorted(grouped.keys())
    ]

    return {
        "plan_id": latest_plan.id,
        "daily_study_hours": latest_plan.daily_study_hours,
        "preferred_block_hours": latest_plan.preferred_block_hours,
        "is_active": latest_plan.is_active,
        "weekly_plan": weekly_plan
    }


@router.patch("/entries/{entry_id}/complete")
def complete_plan_entry(
    entry_id: int,
    request: EntryCompleteRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    entry = (
        db.query(models.StudyPlanEntry, models.StudyPlan)
        .join(models.StudyPlan, models.StudyPlanEntry.study_plan_id == models.StudyPlan.id)
        .filter(
            models.StudyPlanEntry.id == entry_id,
            models.StudyPlan.user_id == current_user.id
        )
        .first()
    )

    if not entry:
        raise HTTPException(status_code=404, detail="Plan entry not found")

    plan_entry, _ = entry

    if plan_entry.entry_type != "study":
        raise HTTPException(
            status_code=400,
            detail="Only study entries can be completed"
        )

    plan_entry.status = "completed"
    plan_entry.completed_at = datetime.now(timezone.utc)
    plan_entry.focus_score = request.focus_score
    if request.notes:
        plan_entry.notes = request.notes

    # Seri ve Rozet Güncelleme
    update_streak(db, current_user)
    new_badges = check_and_award_badges(db, current_user, plan_entry)

    db.commit()

    return {
        "message": "Entry completed",
        "new_badges": new_badges,
        "streak_count": current_user.streak_count
    }


@router.patch("/entries/{entry_id}/skip")
def skip_plan_entry(
    entry_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    entry = (
        db.query(models.StudyPlanEntry, models.StudyPlan)
        .join(models.StudyPlan, models.StudyPlanEntry.study_plan_id == models.StudyPlan.id)
        .filter(
            models.StudyPlanEntry.id == entry_id,
            models.StudyPlan.user_id == current_user.id
        )
        .first()
    )

    if not entry:
        raise HTTPException(status_code=404, detail="Plan entry not found")

    plan_entry, _ = entry

    if plan_entry.entry_type != "study":
        raise HTTPException(
            status_code=400,
            detail="Only study entries can be skipped"
        )

    plan_entry.status = "skipped"
    plan_entry.completed_at = None

    db.commit()

    return {"message": "Entry skipped"}


@router.get("/progress/latest")
def get_latest_plan_progress(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    latest_plan = get_latest_or_active_plan(db, current_user.id)

    if not latest_plan:
        raise HTTPException(status_code=404, detail="No plan found")

    entries = (
        db.query(models.StudyPlanEntry)
        .filter(models.StudyPlanEntry.study_plan_id == latest_plan.id)
        .all()
    )

    study_entries = [e for e in entries if e.entry_type == "study"]
    completed = [e for e in study_entries if e.status == "completed"]
    skipped = [e for e in study_entries if e.status == "skipped"]
    pending = [e for e in study_entries if e.status == "pending"]

    completion_rate = 0
    if study_entries:
        completion_rate = round((len(completed) / len(study_entries)) * 100, 2)

    return {
        "plan_id": latest_plan.id,
        "completed_entries": len(completed),
        "skipped_entries": len(skipped),
        "pending_entries": len(pending),
        "completion_rate_percent": completion_rate
    }


@router.post("/regenerate-adaptive")
def regenerate_adaptive_plan(
    request: PlanRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    availability_windows = get_user_availability_windows(db, current_user.id)

    if not availability_windows:
        raise HTTPException(
            status_code=400,
            detail="Please define availability windows first"
        )

    weekly_total_hours = calculate_weekly_hours_from_windows(availability_windows)

    if request.preferred_block_hours < 1 or request.preferred_block_hours > 4:
        raise HTTPException(
            status_code=400,
            detail="preferred_block_hours must be between 1 and 4"
        )

    all_courses = (
        db.query(models.Course)
        .filter(models.Course.user_id == current_user.id)
        .all()
    )

    if not all_courses:
        raise HTTPException(
            status_code=404,
            detail="No courses found for current user"
        )

    latest_plan = get_latest_or_active_plan(db, current_user.id)

    latest_entries = []
    if latest_plan:
        latest_entries = (
            db.query(models.StudyPlanEntry)
            .filter(models.StudyPlanEntry.study_plan_id == latest_plan.id)
            .all()
        )

    performance_map = build_course_performance_map(latest_entries)

    prioritized_courses = []

    for course in all_courses:
        exam = get_relevant_exam_for_course(db, course.id)
        exam_date = exam.exam_date if exam and exam.exam_date else None
        exam_type = exam.exam_type if exam else None

        priority = calculate_priority(
            course,
            exam_date,
            exam_type or "other"
        )

        prioritized_courses.append({
            "course_id": course.id,
            "course_name": course.course_name,
            "difficulty": course.difficulty,
            "credit": course.credit,
            "exam_date": str(exam_date) if exam_date else None,
            "exam_date_obj": exam_date,
            "exam_type": exam_type,
            "priority": priority
        })

    prioritized_courses = apply_adaptive_boost(prioritized_courses, performance_map)
    prioritized_courses.sort(key=lambda x: x["priority"], reverse=True)
    prioritized_courses = distribute_weekly_hours(
        prioritized_courses,
        weekly_total_hours
    )

    weekly_plan = build_smart_weekly_plan(
        prioritized_courses,
        weekly_total_hours,
        availability_windows,
        request.preferred_block_hours,
        study_days=request.study_days
    )


    delete_existing_active_plan(db, current_user.id)

    new_plan = models.StudyPlan(
        user_id=current_user.id,
        daily_study_hours=weekly_total_hours // 7 if weekly_total_hours > 7 else 1, # DB daily_study_hours uyumluluğu için basit bir avg alındı (şimdilik)
        preferred_block_hours=request.preferred_block_hours,
        is_active=True
    )
    db.add(new_plan)
    db.commit()
    db.refresh(new_plan)

    new_plan.is_active = True
    db.commit()
    db.refresh(new_plan)

    save_weekly_plan_entries(db, new_plan.id, weekly_plan)

    return {
        "message": "Adaptive plan generated successfully",
        "plan_id": new_plan.id,
        "performance_map": performance_map,
        "weekly_total_hours": weekly_total_hours,
        "preferred_block_hours": new_plan.preferred_block_hours,
        "availability_windows": availability_windows,
        "courses_summary": prioritized_courses,
        "weekly_plan": weekly_plan
    }

@router.get("/stats/productivity")
def get_productivity_stats(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Son 30 günlük veriler
    from datetime import timedelta
    since = datetime.now() - timedelta(days=30)
    
    entries = (
        db.query(models.StudyPlanEntry)
        .join(models.StudyPlan)
        .filter(
            models.StudyPlan.user_id == current_user.id,
            models.StudyPlanEntry.entry_date >= since.date()
        )
        .all()
    )
    
    heatmap = {} # date: count
    scores = [] # {date, score}
    course_performance = {} # course_name: {completed_hours, skipped_hours, pending_hours}
    
    for e in entries:
        if e.status == "completed":
            d_str = str(e.entry_date)
            heatmap[d_str] = heatmap.get(d_str, 0) + 1
            if e.focus_score is not None:
                scores.append({"date": d_str, "score": e.focus_score})

        if e.entry_type == "study" and e.course_name:
            if e.course_name not in course_performance:
                course_performance[e.course_name] = {
                    "completed_hours": 0,
                    "skipped_hours": 0,
                    "pending_hours": 0
                }
            h = e.study_hours or 0
            if e.status == "completed":
                course_performance[e.course_name]["completed_hours"] += h
            elif e.status == "skipped":
                course_performance[e.course_name]["skipped_hours"] += h
            else:
                course_performance[e.course_name]["pending_hours"] += h

    # Round to 1 decimal
    for c in course_performance.values():
        for k in ("completed_hours", "skipped_hours", "pending_hours"):
            c[k] = round(c[k], 1)
                
    return {
        "heatmap": heatmap,
        "focus_scores": scores,
        "streak": current_user.streak_count,
        "badges": json.loads(current_user.badges or "[]"),
        "all_badges_meta": BADGES_LIST,
        "course_performance": course_performance
    }