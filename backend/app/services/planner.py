from datetime import date, timedelta
import math


EXAM_TYPE_WEIGHTS = {
    "quiz": 1,
    "midterm": 3,
    "final": 6,
    "other": 2,
}


def get_exam_type_weight(exam_type):
    if exam_type is None:
        return 0
    return EXAM_TYPE_WEIGHTS.get(exam_type, 2)


def calculate_priority(course, exam_date=None, exam_type="other"):
    base_score = course.difficulty + course.credit
    exam_type_weight = get_exam_type_weight(exam_type)

    if exam_date is not None:
        days_until_exam = (exam_date - date.today()).days
        if days_until_exam < 1:
            days_until_exam = 1
        exam_urgency = max(1, 15 - days_until_exam)
        return base_score + exam_urgency + exam_type_weight

    return base_score


def distribute_weekly_hours(prioritized_courses, daily_study_hours):
    weekly_total_hours = daily_study_hours * 7
    total_priority = sum(item["priority"] for item in prioritized_courses)

    if total_priority == 0:
        return prioritized_courses

    for item in prioritized_courses:
        raw_hours = weekly_total_hours * (item["priority"] / total_priority)
        item["weekly_allocated_hours"] = max(1, round(raw_hours))

    current_total = sum(item["weekly_allocated_hours"] for item in prioritized_courses)

    while current_total > weekly_total_hours:
        adjustable = [x for x in prioritized_courses if x["weekly_allocated_hours"] > 1]
        if not adjustable:
            break
        max_item = max(adjustable, key=lambda x: x["weekly_allocated_hours"])
        max_item["weekly_allocated_hours"] -= 1
        current_total -= 1

    while current_total < weekly_total_hours:
        min_item = min(
            prioritized_courses,
            key=lambda x: (x["weekly_allocated_hours"], -x["priority"])
        )
        min_item["weekly_allocated_hours"] += 1
        current_total += 1

    return prioritized_courses


def parse_time_to_minutes(value: str) -> int:
    hour, minute = value.split(":")
    hour = int(hour)
    minute = int(minute)
    if hour == 24 and minute == 0:
        return 24 * 60
    return hour * 60 + minute


def minutes_to_hhmm(total_minutes: int) -> str:
    hour = total_minutes // 60
    minute = total_minutes % 60
    return f"{hour:02d}:{minute:02d}"


def has_active_exam_courses(prioritized_courses, day_date):
    for item in prioritized_courses:
        exam_date = item.get("exam_date_obj")
        if exam_date is not None and exam_date >= day_date:
            return True
    return False


def get_exam_closeness_boost(exam_date, day_date, active_exam_exists):
    if exam_date is None:
        return 0

    days_until_exam = (exam_date - day_date).days

    if days_until_exam < 0:
        if active_exam_exists:
            return -100
        return -8

    if days_until_exam <= 1:
        return 10
    if days_until_exam <= 3:
        return 7
    if days_until_exam <= 5:
        return 5
    if days_until_exam <= 7:
        return 3

    return 1


def get_no_exam_penalty(exam_date, active_exam_exists):
    if exam_date is None and active_exam_exists:
        return -2
    return 0


def get_recency_penalty(course_name, recent_days_courses):
    penalty = 0
    if len(recent_days_courses) >= 1 and course_name in recent_days_courses[-1]:
        penalty += 4
    if len(recent_days_courses) >= 2 and course_name in recent_days_courses[-2]:
        penalty += 2
    if len(recent_days_courses) >= 3 and course_name in recent_days_courses[-3]:
        penalty += 1
    return penalty


def get_rotation_boost(item):
    allocated = item.get("weekly_allocated_hours", 0)
    if allocated <= 1:
        return 3
    if allocated <= 2:
        return 2
    return 0


def get_dynamic_daily_course_cap(course_priority, total_priority, daily_study_hours):
    if total_priority <= 0:
        return min(2, daily_study_hours)

    ratio = course_priority / total_priority
    raw_cap = math.ceil(daily_study_hours * ratio * 1.8)

    upper_bound = min(4, daily_study_hours)
    return max(1, min(raw_cap, upper_bound))


def get_break_minutes(study_hours):
    if study_hours <= 1:
        return 10
    if study_hours <= 2:
        return 15
    if study_hours <= 3:
        return 20
    return 25


def build_day_candidates(prioritized_courses, remaining_hours, day_date, recent_days_courses):
    active_exam_exists = has_active_exam_courses(prioritized_courses, day_date)

    candidates = []

    for item in prioritized_courses:
        course_name = item["course_name"]
        if remaining_hours[course_name] <= 0:
            continue

        exam_date_obj = item.get("exam_date_obj")
        closeness_boost = get_exam_closeness_boost(exam_date_obj, day_date, active_exam_exists)
        no_exam_penalty = get_no_exam_penalty(exam_date_obj, active_exam_exists)
        recency_penalty = get_recency_penalty(course_name, recent_days_courses)
        rotation_boost = get_rotation_boost(item)

        dynamic_score = (
            item["priority"]
            + closeness_boost
            + no_exam_penalty
            + rotation_boost
            - recency_penalty
        )

        candidates.append({
            **item,
            "dynamic_score": dynamic_score
        })

    candidates.sort(
        key=lambda x: (
            x["dynamic_score"],
            x["difficulty"],
            x["credit"]
        ),
        reverse=True
    )
    return candidates


def build_day_blocks(candidates, remaining_hours, daily_study_hours, preferred_block_hours):
    total_priority = sum(item["priority"] for item in candidates) or 1
    remaining_daily = daily_study_hours
    selected = []
    used_today = {}

    while remaining_daily > 0:
        progress_made = False

        for item in candidates:
            if remaining_daily <= 0:
                break

            course_name = item["course_name"]
            remaining_for_course = remaining_hours[course_name]
            if remaining_for_course <= 0:
                continue

            daily_cap_for_course = get_dynamic_daily_course_cap(
                course_priority=item["priority"],
                total_priority=total_priority,
                daily_study_hours=daily_study_hours
            )

            used_so_far = used_today.get(course_name, 0)
            remaining_cap_today = daily_cap_for_course - used_so_far

            if remaining_cap_today <= 0:
                continue

            block_hours = min(
                preferred_block_hours,
                remaining_for_course,
                remaining_cap_today,
                remaining_daily
            )

            if block_hours <= 0:
                continue

            selected.append({
                "course_name": course_name,
                "study_hours": block_hours,
                "duration_minutes": block_hours * 60,
                "priority": item["priority"],
                "difficulty": item["difficulty"],
                "credit": item["credit"],
                "exam_date": item["exam_date"],
                "exam_type": item.get("exam_type"),
                "dynamic_score": item["dynamic_score"],
                "daily_cap": daily_cap_for_course
            })

            used_today[course_name] = used_so_far + block_hours
            remaining_hours[course_name] -= block_hours
            remaining_daily -= block_hours
            progress_made = True

        if not progress_made:
            break

    return selected


def place_entries_into_windows(selected_blocks, windows):
    entries = []

    if not windows:
        return entries

    window_index = 0
    current_ptr = windows[0]["start"]

    for index, block in enumerate(selected_blocks):
        duration = block["duration_minutes"]

        while True:
            if window_index >= len(windows):
                return entries

            window = windows[window_index]

            if current_ptr < window["start"]:
                current_ptr = window["start"]

            available_minutes = window["end"] - current_ptr

            # Blok pencereye tam sığıyorsa direkt yerleştir
            if available_minutes >= duration:
                start_time = current_ptr
                end_time = current_ptr + duration

                entries.append({
                    "type": "study",
                    "course_name": block["course_name"],
                    "study_hours": block["study_hours"],
                    "duration_minutes": block["duration_minutes"],
                    "start_time": minutes_to_hhmm(start_time),
                    "end_time": minutes_to_hhmm(end_time),
                    "priority": block["priority"],
                    "difficulty": block["difficulty"],
                    "credit": block["credit"],
                    "dynamic_score": block["dynamic_score"],
                    "daily_cap": block["daily_cap"],
                    "exam_date": block["exam_date"],
                    "exam_type": block["exam_type"]
                })

                current_ptr = end_time

                # Son blok değilse mola koymayı dene
                if index < len(selected_blocks) - 1:
                    break_minutes = get_break_minutes(block["study_hours"])

                    if current_ptr + break_minutes <= window["end"]:
                        break_start = current_ptr
                        break_end = current_ptr + break_minutes

                        entries.append({
                            "type": "break",
                            "duration_minutes": break_minutes,
                            "start_time": minutes_to_hhmm(break_start),
                            "end_time": minutes_to_hhmm(break_end)
                        })

                        current_ptr = break_end
                    else:
                        window_index += 1
                        if window_index < len(windows):
                            current_ptr = windows[window_index]["start"]

                break

            # Tam sığmıyorsa, pencereye sığan minimum 60 dk'lık kısaltılmış blok deneyelim
            elif available_minutes >= 30:
                fitted_duration = available_minutes
                fitted_hours = fitted_duration / 30

                start_time = current_ptr
                end_time = current_ptr + fitted_duration

                entries.append({
                    "type": "study",
                    "course_name": block["course_name"],
                    "study_hours": fitted_hours,
                    "duration_minutes": fitted_duration,
                    "start_time": minutes_to_hhmm(start_time),
                    "end_time": minutes_to_hhmm(end_time),
                    "priority": block["priority"],
                    "difficulty": block["difficulty"],
                    "credit": block["credit"],
                    "dynamic_score": block["dynamic_score"],
                    "daily_cap": block["daily_cap"],
                    "exam_date": block["exam_date"],
                    "exam_type": block["exam_type"]
                })

                current_ptr = end_time

                if index < len(selected_blocks) - 1:
                    window_index += 1
                    if window_index < len(windows):
                        current_ptr = windows[window_index]["start"]

                break

            # Bu pencereye sığmıyorsa sonraki pencereye geç
            else:
                window_index += 1
                if window_index < len(windows):
                    current_ptr = windows[window_index]["start"]
                else:
                    return entries

    return entries


def build_smart_weekly_plan(prioritized_courses, daily_study_hours, availability_windows, preferred_block_hours, study_days=None):
    current_date = date.today()

    remaining_hours = {
        item["course_name"]: item["weekly_allocated_hours"]
        for item in prioritized_courses
    }

    weekly_plan = []
    recent_days_courses = []

    parsed_windows = [
        {
            "start": parse_time_to_minutes(w["start_time"]),
            "end": parse_time_to_minutes(w["end_time"]),
        }
        for w in availability_windows
    ]

    for day_index in range(7):
        day_date = current_date + timedelta(days=day_index)
        
        # Gün seçimi kontrolü (0=Pazartesi, 6=Pazar)
        if study_days is not None and day_date.weekday() not in study_days:
            weekly_plan.append({
                "date": str(day_date),
                "entries": []
            })
            recent_days_courses.append([])
            continue

        candidates = build_day_candidates(
            prioritized_courses,
            remaining_hours,
            day_date,
            recent_days_courses
        )

        selected_blocks = build_day_blocks(
            candidates,
            remaining_hours,
            daily_study_hours,
            preferred_block_hours
        )

        selected_blocks.sort(
            key=lambda x: (
                x["difficulty"],
                x["dynamic_score"],
                x["priority"]
            ),
            reverse=True
        )

        day_entries = place_entries_into_windows(selected_blocks, parsed_windows)
        today_courses = [block["course_name"] for block in selected_blocks]

        weekly_plan.append({
            "date": str(day_date),
            "entries": day_entries
        })

        recent_days_courses.append(today_courses)

    return weekly_plan


def build_course_performance_map(latest_plan_entries):
    performance = {}

    for entry in latest_plan_entries:
        if entry.entry_type != "study" or not entry.course_name:
            continue

        if entry.course_name not in performance:
            performance[entry.course_name] = {
                "completed_hours": 0,
                "skipped_hours": 0,
                "pending_hours": 0
            }

        study_hours = entry.study_hours or 0

        if entry.status == "completed":
            performance[entry.course_name]["completed_hours"] += study_hours
        elif entry.status == "skipped":
            performance[entry.course_name]["skipped_hours"] += study_hours
        else:
            performance[entry.course_name]["pending_hours"] += study_hours

    return performance

def get_fittable_duration_minutes(preferred_duration, available_minutes, minimum_block_minutes=60):
    """
    Tercih edilen blok süresi pencereye sığmıyorsa,
    pencereye sığan ama minimum blok süresinden küçük olmayan süreyi döndürür.
    """
    if available_minutes >= preferred_duration:
        return preferred_duration

    if available_minutes >= minimum_block_minutes:
        return available_minutes

    return 0


def duration_to_hours(duration_minutes):
    """
    90 dakika -> 1.5 saat
    120 dakika -> 2 saat
    """
    return duration_minutes / 60

def apply_adaptive_boost(prioritized_courses, performance_map):
    updated = []

    for item in prioritized_courses:
        course_name = item["course_name"]
        perf = performance_map.get(course_name, None)

        adaptive_boost = 0
        if perf:
            adaptive_boost += perf["skipped_hours"] * 2
            adaptive_boost += perf["pending_hours"] * 1

        new_item = {**item}
        new_item["adaptive_boost"] = adaptive_boost
        new_item["priority"] = new_item["priority"] + adaptive_boost
        updated.append(new_item)

    return updated