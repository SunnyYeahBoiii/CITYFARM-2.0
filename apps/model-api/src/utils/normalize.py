import json


def parse_optional_json(value):
    """Parse JSON string/object if possible; otherwise keep the original value."""
    if value is None:
        return None
    if isinstance(value, (dict, list)):
        return value
    if isinstance(value, str):
        text = value.strip()
        if not text:
            return None
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            return value
    return value


def parse_json_response_text(raw_text):
    cleaned = (raw_text or "").replace("```json", "").replace("```", "").strip()
    if not cleaned:
        raise ValueError("AI không trả về dữ liệu.")
    return json.loads(cleaned)


def normalize_best_location(value):
    if not isinstance(value, list) or len(value) != 4:
        raise ValueError("best_location phải là mảng gồm 4 phần tử.")

    coordinates = []
    for entry in value:
        try:
            coordinates.append(int(float(entry)))
        except (TypeError, ValueError):
            raise ValueError("best_location chứa giá trị không hợp lệ.")

    ymin, xmin, ymax, xmax = [max(0, min(1000, point)) for point in coordinates]
    if ymax <= ymin or xmax <= xmin:
        raise ValueError("best_location không tạo thành bounding box hợp lệ.")

    return [ymin, xmin, ymax, xmax]


def normalized_box_to_pixels(best_location, img_width, img_height):
    ymin_1000, xmin_1000, ymax_1000, xmax_1000 = normalize_best_location(best_location)

    ymin = int((ymin_1000 / 1000.0) * img_height)
    xmin = int((xmin_1000 / 1000.0) * img_width)
    ymax = int((ymax_1000 / 1000.0) * img_height)
    xmax = int((xmax_1000 / 1000.0) * img_width)

    if ymax <= ymin or xmax <= xmin:
        raise ValueError("Bounding box quy đổi sang pixel không hợp lệ.")

    return ymin, xmin, ymax, xmax


def normalize_confidence_score(value):
    try:
        score = float(value)
    except (TypeError, ValueError):
        return 0.0

    if score > 1.0 and score <= 100.0:
        score = score / 100.0

    return max(0.0, min(score, 1.0))


def normalize_string_list(value, limit=5):
    if not isinstance(value, list):
        return []

    result = []
    for item in value:
        if isinstance(item, dict):
            text = item.get("name") or item.get("issue") or item.get("symptom") or item.get("action")
        else:
            text = item

        if text is None:
            continue

        text = str(text).strip()
        if text:
            result.append(text)

        if len(result) >= limit:
            break

    return result


def normalize_health_status(value):
    normalized = str(value or "").strip().upper()
    alias_map = {
        "GOOD": "HEALTHY",
        "NORMAL": "HEALTHY",
        "OK": "HEALTHY",
        "STRESSED": "WARNING",
        "MONITOR": "WARNING",
        "SEVERE": "CRITICAL",
        "URGENT": "CRITICAL",
    }
    normalized = alias_map.get(normalized, normalized)
    return normalized if normalized in {"UNKNOWN", "HEALTHY", "WARNING", "CRITICAL"} else "UNKNOWN"


def normalize_urgency(value):
    normalized = str(value or "").strip().upper()
    alias_map = {
        "NONE": "LOW",
        "NORMAL": "LOW",
        "MODERATE": "MEDIUM",
        "SEVERE": "HIGH",
        "URGENT": "HIGH",
    }
    normalized = alias_map.get(normalized, normalized)
    return normalized if normalized in {"LOW", "MEDIUM", "HIGH"} else "MEDIUM"


def normalize_bool(value):
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        return value.strip().lower() in {"1", "true", "yes", "y"}
    return bool(value)


def normalize_plant_health_analysis(result_json, plant_context):
    diagnosis_summary = (
        result_json.get("diagnosisSummary")
        or result_json.get("summary")
        or "Chưa đủ dữ liệu để kết luận rõ ràng."
    )
    recommendation_summary = (
        result_json.get("recommendationSummary")
        or result_json.get("recommendation")
        or "Theo dõi thêm trong 24-48 giờ và chụp lại ảnh rõ hơn nếu tình trạng không cải thiện."
    )

    analysis = {
        "healthStatus": normalize_health_status(result_json.get("healthStatus")),
        "confidenceScore": normalize_confidence_score(result_json.get("confidenceScore")),
        "diagnosisSummary": str(diagnosis_summary).strip(),
        "recommendationSummary": str(recommendation_summary).strip(),
        "observedSymptoms": normalize_string_list(result_json.get("observedSymptoms")),
        "likelyIssues": normalize_string_list(result_json.get("likelyIssues")),
        "immediateActions": normalize_string_list(result_json.get("immediateActions")),
        "followUpCare": normalize_string_list(result_json.get("followUpCare")),
        "urgency": normalize_urgency(result_json.get("urgency")),
        "inspectionNotes": str(result_json.get("inspectionNotes") or "").strip(),
        "requiresHumanReview": normalize_bool(result_json.get("requiresHumanReview", False)),
        "plantContextUsed": plant_context,
    }

    return analysis
