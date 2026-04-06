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

        parsed.append((window.start_time, window.end_time, start_m, end_m))

    parsed.sort(key=lambda x: x[2])

    # overlap kontrolü
    for i in range(len(parsed) - 1):
        if parsed[i][3] > parsed[i + 1][2]:
            raise HTTPException(status_code=400, detail="Availability windows cannot overlap")

    old_rows = (
        db.query(models.StudyAvailability)
        .filter(models.StudyAvailability.user_id == current_user.id)
        .all()
    )

    for row in old_rows:
        db.delete(row)

    for start_time, end_time, _, _ in parsed:
        db.add(
            models.StudyAvailability(
                user_id=current_user.id,
                start_time=start_time,
                end_time=end_time
            )
        )

    db.commit()

    return {
        "message": "Availabilities saved successfully",
        "windows": [
            {"start_time": p[0], "end_time": p[1]}
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
            {"id": r.id, "start_time": r.start_time, "end_time": r.end_time}
            for r in rows
        ]
    }