import json
from datetime import date, timedelta
from sqlalchemy.orm import Session
from .. import models

BADGES_LIST = [
    {"id": "first_step", "name": "İlk Adım", "desc": "İlk çalışma bloğunu tamamla."},
    {"id": "weekly_warrior", "name": "Haftalık Savaşçı", "desc": "7 günlük seri (streak) yap."},
    {"id": "early_bird", "name": "Erken Kalkan", "desc": "Sabah 08:00'den önce bir seans bitir."},
    {"id": "night_owl", "name": "Gece Kuşu", "desc": "Gece 00:00'dan sonra bir seans bitir."},
    {"id": "focus_master", "name": "Odak Ustası", "desc": "Bir seansı %95+ odak skoruyla bitir."},
    {"id": "plan_loyalist", "name": "Plan Sadığı", "desc": "Bir haftalık planın %100'ünü tamamla."}
]

def check_and_award_badges(db: Session, user: models.User, entry: models.StudyPlanEntry):
    current_badges = json.loads(user.badges or "[]")
    new_badges = []

    # 1. İlk Adım
    if "first_step" not in current_badges:
        new_badges.append("first_step")

    # 2. Haftalık Savaşçı
    if user.streak_count >= 7 and "weekly_warrior" not in current_badges:
        new_badges.append("weekly_warrior")

    # 3. Erken Kalkan (08:00 öncesi)
    try:
        start_hour = int(entry.start_time.split(":")[0])
        if start_hour < 8 and "early_bird" not in current_badges:
            new_badges.append("early_bird")
    except: pass

    # 4. Gece Kuşu (00:00 sonrası)
    try:
        start_hour = int(entry.start_time.split(":")[0])
        if start_hour < 4 and "night_owl" not in current_badges: # 00:00-04:00
            new_badges.append("night_owl")
    except: pass

    # 5. Odak Ustası
    if (entry.focus_score or 0) >= 95 and "focus_master" not in current_badges:
        new_badges.append("focus_master")

    if new_badges:
        current_badges.extend(new_badges)
        user.badges = json.dumps(current_badges)
        db.commit()
    
    return new_badges

def update_streak(db: Session, user: models.User):
    today = date.today()
    if user.last_study_date == today:
        return # Bugün zaten sayıldı
    
    if user.last_study_date == today - timedelta(days=1):
        user.streak_count += 1
    else:
        # Seri bozuldu ama bugün çalışıldıysa 1'den başlar
        user.streak_count = 1
    
    user.last_study_date = today
    db.commit()
