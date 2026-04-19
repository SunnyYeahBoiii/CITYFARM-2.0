from flask import Flask, request, jsonify
from google import genai
from google.genai import types
import base64
import os
import json
import io
import cv2
import numpy as np
import PIL.Image

app = Flask("Model API")

# 1. Khởi tạo Gemini Client
api_key = os.environ.get("GEMINI_API_KEY")

if api_key:
    print(f"[DEBUG-SYSTEM] Đã nhận được API Key từ Docker, bắt đầu bằng: {api_key[:5]}***")
else:
    print("[DEBUG-SYSTEM] CẢNH BÁO ĐỎ: Không tìm thấy GEMINI_API_KEY. Vui lòng kiểm tra lại file .env và cấu hình env_file trong docker-compose.yml!")

try:
    if api_key:
        client = genai.Client(api_key=api_key)
        ai_configured = True
    else:
        raise ValueError("Thiếu API Key")
except Exception as e:
    print(f"[SYSTEM WARNING] Không thể khởi tạo Gemini Client: {e}")
    client = None
    ai_configured = False

# Giữ lại route gốc để health check
@app.route("/")
def health_check():
    return jsonify({
        "status": "Model API is running", 
        "ai_configured": ai_configured
    }), 200

# 2. Endpoint xử lý AI Chat (RAG)
@app.route("/api/chat", methods=["POST"])
def chat_with_assistant():
    if not client:
        return jsonify({
            "success": False, 
            "error": "Gemini Client chưa được cấu hình. Kiểm tra lại GEMINI_API_KEY."
        }), 500

    try:
        # Nhận dữ liệu JSON từ NestJS (BFF) truyền sang
        data = request.get_json()
        
        if not data or "message" not in data:
            return jsonify({"success": False, "error": "Missing 'message' in payload"}), 400

        user_message = data["message"]
        ctx = data.get("context", {})
        history = data.get("history", [])

        # Trích xuất RAG Context siêu cấp từ NestJS
        user_info = ctx.get("user", {})
        species_info = ctx.get("species", {})
        plant_info = ctx.get("currentPlant", {})
        history_info = ctx.get("history", {})

        # Ràng buộc dữ liệu để tránh lỗi NoneType khi nối chuỗi
        display_name = user_info.get("displayName", "Người dùng")
        user_bio = user_info.get("bio", "Không có bio")
        user_location = user_info.get("location", "Chưa cập nhật")

        common_name = species_info.get("commonName", "Cây của bạn")
        scientific_name = species_info.get("scientificName", "Không rõ")
        difficulty = species_info.get("difficulty", "Chưa cập nhật")
        light_req = species_info.get("lightRequirement", "Chưa cập nhật")
        care_guide = species_info.get("careGuide", {})

        nickname = plant_info.get("nickname", common_name)
        zone_name = plant_info.get("zoneName", "Chưa xác định")
        growth_stage = plant_info.get("growthStage", "Chưa xác định")
        days_growing = plant_info.get("daysGrowing", 0)
        health = plant_info.get("health", "Chưa cập nhật")
        notes = plant_info.get("notes", "Không có ghi chú")

        recent_tasks = history_info.get("recentTasks", [])
        recent_journals = history_info.get("recentJournals", [])

        tasks_str = ", ".join(recent_tasks) if recent_tasks else "Chưa có hoạt động chăm sóc nào gần đây."
        journals_str = " | ".join(recent_journals) if recent_journals else "Chưa có nhật ký nào gần đây."

        # Xây dựng System Instruction (Ép ngữ cảnh RAG)
        system_instruction = f"""
Bạn là một chuyên gia nông nghiệp đô thị của ứng dụng CITYFARM. 
Nhiệm vụ của bạn là tư vấn cá nhân hóa dựa trên dữ liệu hệ thống (RAG) dưới đây:

[1. THÔNG TIN NGƯỜI DÙNG]
- Tên: {display_name} (Bio: {user_bio})
- Khu vực sống: {user_location} (Hãy lưu ý thời tiết đặc trưng tại khu vực này nếu cần)

[2. KIẾN THỨC VỀ LOÀI CÂY (KNOWLEDGE BASE)]
- Loài cây: {common_name} ({scientific_name})
- Độ khó: {difficulty} | Nắng yêu cầu: {light_req}
- Hướng dẫn tưới: {care_guide.get('watering', 'Không có hướng dẫn')}
- Lưu ý sâu bệnh: {care_guide.get('pests', 'Không có lưu ý')}

[3. TÌNH TRẠNG THỰC TẾ CỦA CÂY (CURRENT PLANT)]
- Biệt danh: {nickname} | Trồng tại: {zone_name}
- Giai đoạn: {growth_stage} ({days_growing} ngày tuổi)
- Sức khỏe hiện tại: {health}
- Ghi chú từ người dùng: {notes}

[4. LỊCH SỬ CHĂM SÓC GẦN NHẤT]
- Các lần chăm sóc (Task): {tasks_str}
- Nhật ký (Journal): {journals_str}

Quy tắc trả lời:
- Xưng hô thân thiện, gọi tên người dùng ({display_name}).
- Dựa CHÍNH XÁC vào dữ liệu trên để đưa ra lời khuyên (Ví dụ: Nếu sức khỏe là WARNING, hãy tập trung giải quyết).
- KHÔNG bịa ra lịch sử chăm sóc. Nếu không có dữ liệu, hãy hỏi thêm người dùng.
- Trả lời bằng văn bản thuần túy (PLAIN TEXT). TUYỆT ĐỐI KHÔNG SỬ DỤNG MARKDOWN (như dấu ** hay ##).
"""

        # Cấu hình API của SDK mới
        api_config = types.GenerateContentConfig(
            system_instruction=system_instruction,
            temperature=0.7 # Tinh chỉnh độ sáng tạo
        )

        # Xây dựng nội dung multi-turn từ lịch sử hội thoại
        contents = []
        for msg in history:
            role = msg.get("role", "user")
            # Gemini dùng 'model' cho assistant, 'user' cho user
            gemini_role = "model" if role == "assistant" else "user"
            content_text = msg.get("content", "")
            if content_text:
                contents.append(
                    types.Content(role=gemini_role, parts=[types.Part(text=content_text)])
                )
        # Thêm tin nhắn hiện tại của người dùng
        contents.append(
            types.Content(role="user", parts=[types.Part(text=user_message)])
        )

        response = client.models.generate_content(
            model='gemini-3.1-flash-lite-preview',
            contents=contents,
            config=api_config
        )

        # Trả về kết quả cho NestJS
        return jsonify({
            "success": True,
            "reply": response.text
        }), 200

    except Exception as e:
        print(f"[ERROR] Gemini API Error: {str(e)}")
        return jsonify({
            "success": False, 
            "error": "Lỗi nội bộ server khi xử lý AI", 
            "details": str(e)
        }), 500


# ------------------- GHEP ANH--------------------
def overlay_transparent_plant(background_img, plant_img, xmin, ymin, xmax, ymax):
    """
    Ghép ảnh cây (plant_img đã đọc bằng cv2) vào ảnh nền.
    Đã fix lỗi thoát sớm và tối ưu hóa Alpha Blending bằng numpy.
    """
    # Xử lý kênh Alpha nếu thiếu
    if plant_img.shape[2] != 4:
        plant_img = cv2.cvtColor(plant_img, cv2.COLOR_BGR2BGRA)

    box_width = xmax - xmin
    box_height = ymax - ymin
    
    if box_width <= 0 or box_height <= 0:
        return background_img
        
    orig_h, orig_w = plant_img.shape[:2]

    # Tính toán tỉ lệ scale giữ nguyên Aspect Ratio
    scale = min(box_width / orig_w, box_height / orig_h)
    new_w, new_h = int(orig_w * scale), int(orig_h * scale)

    if new_w <= 0 or new_h <= 0:
        return background_img

    plant_resized = cv2.resize(plant_img, (new_w, new_h), interpolation=cv2.INTER_AREA)

    # Tính toán vị trí (Canh giữa trục X, Đáy cây nằm ở tâm trục Y của Bounding Box)
    offset_x = (box_width - new_w) // 2 
    start_x = xmin + offset_x
    end_x = start_x + new_w
    
    center_y = ymin + (box_height // 2)
    end_y = center_y          
    start_y = end_y - new_h   
    
    bg_h, bg_w = background_img.shape[:2]
    
    # Tính toán vùng giao nhau (Intersection) để tránh lỗi tràn viền (Out of bounds)
    bg_start_x, bg_start_y = max(0, start_x), max(0, start_y)
    bg_end_x, bg_end_y = min(bg_w, end_x), min(bg_h, end_y)
    
    plant_start_x = bg_start_x - start_x
    plant_start_y = bg_start_y - start_y
    plant_end_x = plant_start_x + (bg_end_x - bg_start_x)
    plant_end_y = plant_start_y + (bg_end_y - bg_start_y)
    
    if bg_end_x <= bg_start_x or bg_end_y <= bg_start_y:
        return background_img
        
    # Lấy ra phần ảnh cây và vùng nền tương ứng
    plant_crop = plant_resized[plant_start_y:plant_end_y, plant_start_x:plant_end_x]
    roi = background_img[bg_start_y:bg_end_y, bg_start_x:bg_end_x]

    # Tối ưu hóa Alpha Blending
    alpha_plant = plant_crop[:, :, 3] / 255.0
    alpha_bg = 1.0 - alpha_plant

    plant_colors = plant_crop[:, :, 0:3]

    for c in range(0, 3):
        roi[:, :, c] = (alpha_plant * plant_colors[:, :, c] + alpha_bg * roi[:, :, c])

    background_img[bg_start_y:bg_end_y, bg_start_x:bg_end_x] = roi

    return background_img

def create_mock_plant_image():
    """Tạo một ảnh màu đen có kênh alpha (trong suốt) để test ghép ảnh."""
    # Tạo ảnh 200x400 RGBA, nền trong suốt
    mock_img = np.zeros((400, 200, 4), dtype=np.uint8)
    # Vẽ một hình chữ nhật đen (giả làm cây) ở giữa
    cv2.rectangle(mock_img, (50, 50), (150, 350), (0, 0, 0, 255), -1) 
    return mock_img

def base64_to_cv2(base64_string):
    """Chuyển Base64 string thành ảnh OpenCV (BGR)"""
    if "base64," in base64_string:
        base64_string = base64_string.split("base64,")[1]
    img_data = base64.b64decode(base64_string)
    nparr = np.frombuffer(img_data, np.uint8)
    img_cv2 = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    return img_cv2

def cv2_to_base64(img_cv2, ext=".jpg"):
    """Chuyển ảnh OpenCV (BGR) thành Base64 string có nén để giảm tải payload"""
    # Nén JPEG ở mức chất lượng 80% (tối ưu dung lượng và độ nét)
    encode_param = [int(cv2.IMWRITE_JPEG_QUALITY), 80]
    _, buffer = cv2.imencode(ext, img_cv2, encode_param)
    
    base64_str = base64.b64encode(buffer).decode("utf-8")
    return f"data:image/{ext.replace('.', '')};base64,{base64_str}"


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


def load_pil_image_from_payload(image_base64=None, image_file=None):
    """Load an uploaded or base64-encoded image into PIL."""
    if image_file:
        file_bytes = image_file.read()
        image_file.seek(0)
        return PIL.Image.open(io.BytesIO(file_bytes)).convert("RGB")

    if not image_base64:
        raise ValueError("Thiếu dữ liệu ảnh để phân tích.")

    clean_b64 = image_base64.split("base64,")[1] if "base64," in image_base64 else image_base64
    img_bytes = base64.b64decode(clean_b64)
    return PIL.Image.open(io.BytesIO(img_bytes)).convert("RGB")


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


def parse_json_response_text(raw_text):
    cleaned = (raw_text or "").replace("```json", "").replace("```", "").strip()
    if not cleaned:
        raise ValueError("AI không trả về dữ liệu.")
    return json.loads(cleaned)


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


@app.route("/api/analyze-plant-health", methods=["POST"])
@app.route("/api/analyze-plant", methods=["POST"])
def analyze_plant_health():
    if not client:
        return jsonify({"success": False, "error": "Gemini Client chưa sẵn sàng"}), 500

    try:
        req_data = extract_plant_health_request()
        if not req_data.get("image_base64") and not req_data.get("image_file"):
            return jsonify({"success": False, "error": "Thiếu ảnh cây để phân tích"}), 400

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
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/analyze-space", methods=["POST"])
def analyze_space():
    if not client:
        return jsonify({"success": False, "error": "Gemini Client chưa sẵn sàng"}), 500

    data = request.get_json()
    image_base64 = data.get("image_base64")
    plant_catalog = data.get("plantCatalogText")

    if not image_base64 or not plant_catalog:
        return jsonify({"success": False, "error": "Thiếu dữ liệu ảnh hoặc danh mục cây"}), 400

    try:
        # 1. Chuyển đổi ảnh Base64 -> PIL Image (cho Gemini) và OpenCV (để ghép)
        if "base64," in image_base64:
            clean_b64 = image_base64.split("base64,")[1]
        else:
            clean_b64 = image_base64
            
        img_bytes = base64.b64decode(clean_b64)
        img_pil = PIL.Image.open(io.BytesIO(img_bytes))
        img_cv2_original = base64_to_cv2(clean_b64)
        img_height, img_width = img_cv2_original.shape[:2]

        # 2. Xây dựng Prompt (Gộp cả phân tích, gợi ý và lấy tọa độ)
        prompt = f"""Bạn là một Kiến trúc sư Nông nghiệp Đô thị cấp cao. Hãy phân tích bức ảnh không gian ban công/sân thượng hoặc trong nhà này và đối chiếu với CƠ SỞ DỮ LIỆU CÂY TRỒNG để đưa ra đánh giá.

        [BƯỚC 1: PHÂN TÍCH KHÔNG GIAN QUA ẢNH]
        1. Đánh giá Mức độ ánh sáng (lightLevel): Phải chọn CHÍNH XÁC 1 trong 5 giá trị [LOW, PARTIAL_SHADE, PARTIAL_SUN, FULL_SUN, INDOOR_GROW_LIGHT].
        2. Chấm Điểm ánh sáng (lightScore): Thang điểm 0-100 dựa trên độ hắt nắng và bóng râm trong ảnh.
        3. Diện tích khả dụng (availableAreaSqm): Ước lượng diện tích mặt sàn/lan can có thể đặt chậu tính bằng m2 (Ví dụ: 1.5, 2.0).
        4. Nhiệt độ & Môi trường (climate): Dự đoán nhiệt độ trung bình dựa vào độ thoáng gió và bóng râm (ví dụ: 28-32°C).

        [BƯỚC 2: TÌM KIẾM VÀ GỢI Ý CÂY (MATCHING)]
        Tìm ra ĐÚNG 3 loại cây phù hợp nhất từ CƠ SỞ DỮ LIỆU dưới đây. Quy tắc chấm điểm khớp (matchScore):
        - Cây được chọn PHẢI có 'Yêu cầu sáng' khớp với 'lightLevel' của không gian. Hoặc 'lightScore' của không gian phải nằm trong khoảng 'Điểm sáng' của cây.
        - 'availableAreaSqm' của không gian PHẢI LỚN HƠN HOẶC BẰNG 'Diện tích tối thiểu' của cây.
        - Bỏ qua các cây yêu cầu nhiệt độ quá thấp nếu không gian trông có vẻ nắng gắt.

        [BƯỚC 3: ĐỊNH VỊ CHẬU CÂY TOP 1]
        Hãy tìm MỘT vị trí tốt nhất trong ảnh (trên mặt sàn trống, kệ, hoặc lan can) để đặt chậu cây Top 1 vừa gợi ý. Vị trí này phải có ánh sáng và không cản lối đi.
        Xác định Bounding Box (khung bao) cho vị trí này. 
        Lưu ý: Các giá trị [ymin, xmin, ymax, xmax] PHẢI là số nguyên nằm trong hệ tọa độ chuẩn hóa từ 0 đến 1000.

        [CƠ SỞ DỮ LIỆU CÂY TRỒNG]
        {plant_catalog}

        [BƯỚC 4: TRẢ VỀ KẾT QUẢ JSON THUẦN TÚY (TUYỆT ĐỐI KHÔNG BỌC TRONG MARKDOWN ```json)]
        {{
          "analysis": {{
            "lightLevel": "<Ghi chính xác Enum>",
            "lightScore": <số nguyên>,
            "areaSize": "<số float> m²",
            "climate": "<Mô tả ngắn gọn thời tiết ước lượng>",
            "capacity": "<Ước lượng sức chứa, VD: 3 chậu lớn>"
          }},
          "recommendations": [ 
            {{ 
              "id": "<Copy chính xác ID từ DB>", 
              "name": "<Copy chính xác Tên từ DB>", 
              "scientificName": "<Copy chính xác Tên khoa học>", 
              "difficulty": "<Copy chính xác Độ khó>", 
              "harvestDays": "<Thu hoạch từ DB>", 
              "matchScore": <Số nguyên 0-100>, 
              "reason": "<Giải thích ngắn gọn>", 
              "imageUrl": "", 
              "sunlight": "<Copy Yêu cầu sáng từ DB>", 
              "water": "<Gợi ý tần suất tưới>", 
              "climate": "<Sự tương thích nhiệt độ>" 
            }} 
          ],
          "best_location": [ymin, xmin, ymax, xmax]
        }}"""

        # 3. Gọi Gemini API
        print("Đang gọi Gemini API để phân tích không gian...")
        config = types.GenerateContentConfig(
            temperature=0.1, 
            response_mime_type="application/json" 
        )
        
        response = client.models.generate_content(
            model='gemini-3.1-flash-lite-preview', # Dùng model flash-lite cho tốc độ
            contents=[img_pil, prompt],
            config=config
        )

        # 4. Parse JSON
        raw_text = response.text.replace("```json", "").replace("```", "").strip()
        result_json = json.loads(raw_text)
        
        box_1000 = result_json.get('best_location')
        if not box_1000 or len(box_1000) != 4:
            raise ValueError("AI không trả về Bounding Box hợp lệ.")
            
        ymin_1000, xmin_1000, ymax_1000, xmax_1000 = box_1000

        # 5. Xử lý OpenCV (Ghép ảnh)
        # Mapping Tọa Độ sang pixel thực tế
        ymin = int((ymin_1000 / 1000.0) * img_height)
        xmin = int((xmin_1000 / 1000.0) * img_width)
        ymax = int((ymax_1000 / 1000.0) * img_height)
        xmax = int((xmax_1000 / 1000.0) * img_width)

        print(f"Tọa độ thực tế: [ymin:{ymin}, xmin:{xmin}, ymax:{ymax}, xmax:{xmax}]")

        # Lấy ảnh giả lập (đen)
        mock_plant_img = create_mock_plant_image()

        # Thực hiện ghép cây vào bản sao ảnh gốc
        img_final_result = overlay_transparent_plant(
            background_img=img_cv2_original.copy(), 
            plant_img=mock_plant_img, 
            xmin=xmin, ymin=ymin, xmax=xmax, ymax=ymax
        )

        # Chuyển ảnh đã ghép thành Base64
        visualized_image_base64 = cv2_to_base64(img_final_result)

        # 6. Trả kết quả về cho NestJS
        return jsonify({
            "success": True,
            "analysis": result_json.get("analysis"),
            "recommendations": result_json.get("recommendations"),
            "visualizedImage": visualized_image_base64
        }), 200

    except Exception as e:
        print(f"[ERROR] Space Analysis API Error: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500



if __name__ == "__main__":
    port = int(os.environ.get("PORT", 3002))
    debug_mode = os.environ.get("FLASK_DEBUG", "").lower() == "true"
    print(f"[SYSTEM] Starting Python Flask Server on port {port}...")
    app.run(host="0.0.0.0", port=port, debug=debug_mode)
