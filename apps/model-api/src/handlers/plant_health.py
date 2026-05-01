import json
from flask import request, jsonify
from google.genai import types

from utils.http_utils import json_error
from utils.image_utils import load_pil_image_from_payload
from utils.normalize import (
    parse_optional_json,
    parse_json_response_text,
    normalize_plant_health_analysis,
)


def extract_plant_health_request():
    """Support both JSON base64 payloads and multipart form uploads."""
    payload = request.get_json(silent=True) if request.is_json else None
    payload = payload or {}

    if request.files:
        image_file = request.files.get("image") or request.files.get("file") or request.files.get("photo")
        form_data = request.form.to_dict(flat=True)
        raw_context = (
            form_data.pop("plantContext", None)
            or form_data.pop("plant_context", None)
            or form_data.pop("context", None)
        )
        parsed_context = parse_optional_json(raw_context)

        if parsed_context is None:
            parsed_context = form_data or {}

        return {
            "image_base64": None,
            "image_file": image_file,
            "plant_context": parsed_context if isinstance(parsed_context, dict) else {"notes": str(parsed_context)},
        }

    raw_context = payload.get("plantContext")
    if raw_context is None:
        raw_context = payload.get("plant_context")
    if raw_context is None:
        raw_context = payload.get("context")

    parsed_context = parse_optional_json(raw_context)
    if parsed_context is None:
        parsed_context = {}

    if not isinstance(parsed_context, dict):
        parsed_context = {"notes": str(parsed_context)}

    return {
        "image_base64": payload.get("image_base64") or payload.get("imageBase64") or payload.get("image"),
        "image_file": None,
        "plant_context": parsed_context,
    }


def analyze_plant_health(client):
    if not client:
        return json_error("Gemini Client chưa sẵn sàng")

    try:
        req_data = extract_plant_health_request()
        if not req_data.get("image_base64") and not req_data.get("image_file"):
            return json_error("Thiếu ảnh cây để phân tích", 400)

        plant_context = req_data.get("plant_context") or {}
        img_pil = load_pil_image_from_payload(
            image_base64=req_data.get("image_base64"),
            image_file=req_data.get("image_file"),
        )

        context_block = (
            json.dumps(plant_context, ensure_ascii=False, indent=2)
            if plant_context else "Không có ngữ cảnh bổ sung từ hệ thống hoặc người dùng."
        )

        prompt = f"""Bạn là chuyên gia chẩn đoán sức khỏe cây trồng cho CITYFARM. Hãy quan sát ảnh cây và kết hợp với ngữ cảnh để đánh giá tình trạng thực tế của cây.

[NGỮ CẢNH BỔ SUNG]
{context_block}

[YÊU CẦU PHÂN TÍCH]
1. Đánh giá tình trạng sức khỏe tổng thể và bắt buộc chọn CHÍNH XÁC 1 giá trị healthStatus trong [UNKNOWN, HEALTHY, WARNING, CRITICAL].
2. Chỉ nêu những dấu hiệu nhìn thấy được hoặc suy luận hợp lý từ ảnh và ngữ cảnh. Nếu ảnh không đủ rõ, nói rõ điều đó và giảm confidenceScore.
3. Tìm các vấn đề có khả năng cao nhất như úng nước, thiếu nước, cháy lá, thiếu dinh dưỡng, sâu bệnh, nấm bệnh, sốc nhiệt hoặc cây vẫn khỏe mạnh.
4. Đưa ra hành động ưu tiên ngắn gọn, an toàn, thực tế cho người trồng tại nhà. Không đề xuất dùng hóa chất nguy hiểm.
5. Nếu ảnh mờ hoặc thiếu thông tin để chẩn đoán chắc chắn, bật requiresHumanReview = true.

[TRẢ VỀ JSON THUẦN TÚY]
Không bọc markdown. Trả về đúng schema sau:
{{
  "healthStatus": "UNKNOWN|HEALTHY|WARNING|CRITICAL",
  "confidenceScore": 0.0,
  "diagnosisSummary": "Tóm tắt ngắn gọn bằng tiếng Việt",
  "recommendationSummary": "Khuyến nghị ngắn gọn bằng tiếng Việt",
  "observedSymptoms": ["triệu chứng 1", "triệu chứng 2"],
  "likelyIssues": ["vấn đề khả năng cao 1", "vấn đề khả năng cao 2"],
  "immediateActions": ["việc cần làm ngay 1", "việc cần làm ngay 2"],
  "followUpCare": ["theo dõi tiếp theo 1", "theo dõi tiếp theo 2"],
  "urgency": "LOW|MEDIUM|HIGH",
  "inspectionNotes": "ghi chú về chất lượng ảnh hoặc yếu tố chưa chắc chắn",
  "requiresHumanReview": false
}}"""

        print("Đang gọi Gemini API để phân tích sức khỏe cây...")
        config = types.GenerateContentConfig(
            temperature=0.1,
            response_mime_type="application/json"
        )

        response = client.models.generate_content(
            model='gemini-3.1-flash-lite-preview',
            contents=[img_pil, prompt],
            config=config
        )

        result_json = parse_json_response_text(response.text)
        analysis = normalize_plant_health_analysis(result_json, plant_context)

        return jsonify({
            "success": True,
            "healthStatus": analysis["healthStatus"],
            "confidenceScore": analysis["confidenceScore"],
            "diagnosisSummary": analysis["diagnosisSummary"],
            "recommendationSummary": analysis["recommendationSummary"],
            "analysis": analysis,
        }), 200

    except Exception as e:
        print(f"[ERROR] Plant Health Analysis API Error: {str(e)}")
        return json_error(str(e), 500)
