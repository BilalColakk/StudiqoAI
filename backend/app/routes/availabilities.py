from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models
from ..schemas import AvailabilityBulkCreate
from ..services.dependencies import get_db, get_current_user

router = APIRouter(prefix="/availabilities", tags=["Availabilities"])


def parse_time_to_minutes(value: str) -> int:
    try:
        hour, minute = value.split(":")
        hour = int(hour)
        minute = int(minute)
    except Exception:
        raise HTTPException(status_code=400, detail=f"Invalid time format: {value}")

    if hour == 24 and minute == 0:
        return 24 * 60

    if hour < 0 or hour > 23 or minute not in [0, 15, 30, 45]:
        raise HTTPException(status_code=400, detail=f"Invalid time value: {value}")

    return hour * 60 + minute


@router.post("/set")
def set_availabilities(
    payload: AvailabilityBulkCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if not payload.windows:
        raise HTTPException(status_code=400, detail="At least one availability window is required")

    parsed = []
    for window in payload.windows:
        start_m = parse_time_to_minutes(window.start_time)
        end_m = parse_time_to_minutes(window.end_time)

        if end_m <= start_m:
            raise HTTPException(status_code=400, detail="end_time must be later than start_time")

        if window.day_of_week < 0 or window.day_of_week > 6:
            raise HTTPException(status_code=400, detail="day_of_week must be between 0 and 6")

        parsed.append((window.day_of_week, window.start_time, window.end_time, start_m, end_m))

    # overlap kontrolü gün bazlı yapılmalı
    by_day = {}
    for p in parsed:
        day = p[0]
        if day not in by_day:
            by_day[day] = []
        by_day[day].append(p)
    
    for day, day_parsed in by_day.items():
        day_parsed.sort(key=lambda x: x[3])
        for i in range(len(day_parsed) - 1):
            if day_parsed[i][4] > day_parsed[i + 1][3]:
                raise HTTPException(status_code=400, detail="Availability windows cannot overlap on the same day")

    old_rows = (
        db.query(models.StudyAvailability)
        .filter(models.StudyAvailability.user_id == current_user.id)
        .all()
    )

    for row in old_rows:
        db.delete(row)

    for day, start_time, end_time, _, _ in parsed:
        db.add(
            models.StudyAvailability(
                user_id=current_user.id,
                day_of_week=day,
                start_time=start_time,
                end_time=end_time
            )
        )

    db.commit()

    return {
        "message": "Availabilities saved successfully",
        "windows": [
            {"day_of_week": p[0], "start_time": p[1], "end_time": p[2]}
            for p in parsed
        ]
    }


@router.get("/my")
def get_my_availabilities(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    rows = (
        db.query(models.StudyAvailability)
        .filter(models.StudyAvailability.user_id == current_user.id)
        .all()
    )

    return {
        "windows": [
            {"id": r.id, "day_of_week": r.day_of_week, "start_time": r.start_time, "end_time": r.end_time}
            for r in rows
        ]
    }