from flask import Flask, request, jsonify
from google import genai
from google.genai import types
import base64
import os
import json
import io
from pathlib import Path
import cv2
import numpy as np
import PIL.Image
from werkzeug.exceptions import HTTPException

try:
    from rembg import remove as rembg_remove
    rembg_import_error = None
except Exception as exc:
    rembg_remove = None
    rembg_import_error = exc

app = Flask("Model API")

def load_local_env():
    env_path = Path(__file__).resolve().parent.parent / ".env"

    if not env_path.exists():
        return

    for raw_line in env_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue

        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip()

        if not key:
            continue

        if len(value) >= 2 and value[0] == value[-1] and value[0] in {"'", '"'}:
            value = value[1:-1]

        os.environ.setdefault(key, value)


load_local_env()


def json_error(message, status_code=500, details=None):
    payload = {
        "success": False,
        "error": str(message).strip() or "Model API internal error.",
    }

    if details is not None:
        details_text = str(details).strip()
        if details_text:
            payload["details"] = details_text

    return jsonify(payload), status_code


def parse_json_body():
    data = request.get_json(silent=True)

    if data is None:
        return {}

    if not isinstance(data, dict):
        raise ValueError("Payload JSON phải là object.")

    return data


@app.errorhandler(Exception)
def handle_exception(error):
    if isinstance(error, HTTPException):
        return json_error(error.description or error.name, error.code or 500)

    print(f"[UNHANDLED ERROR] {type(error).__name__}: {error}")
    return json_error("Model API internal error.", 500, error)

# 1. Khởi tạo Gemini Client
api_key = os.environ.get("GEMINI_API_KEY")

if api_key:
    print(f"[DEBUG-SYSTEM] Đã nhận được GEMINI_API_KEY, bắt đầu bằng: {api_key[:5]}***")
else:
    print("[DEBUG-SYSTEM] CẢNH BÁO ĐỎ: Không tìm thấy GEMINI_API_KEY. Vui lòng kiểm tra lại biến môi trường hoặc file apps/model-api/.env!")

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
        return json_error("Gemini Client chưa được cấu hình. Kiểm tra lại GEMINI_API_KEY.")

    try:
        # Nhận dữ liệu JSON từ NestJS (BFF) truyền sang
        data = parse_json_body()

        if not data or "message" not in data:
            return json_error("Missing 'message' in payload", 400)

        user_message = data["message"]
        ctx = data.get("context", {})
        history = data.get("history", [])
        tools = data.get("tools", [])
        tool_results = data.get("tool_results", [])
        plant_id = data.get("plantId", "")

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

        # Tool calling instructions (added to system instruction if tools provided)
        tool_instruction = ""
        if tools and len(tools) > 0:
            tool_names = [t.get("name", "") for t in tools]
            tool_instruction = f"""
[5. KHẢ NĂNG TẠO TASK VÀ JOURNAL]
Bạn có khả năng tạo task chăm sóc và ghi journal cho người dùng bằng các function:
- create_care_task: Tạo task tưới, bón, tỉa, kiểm tra sâu bệnh, thu hoạch.
- log_journal_entry: Ghi nhật ký sức khỏe cây.
- get_pending_tasks: Lấy danh sách task đang chờ.

Khi người dùng yêu cầu tạo task hoặc ghi nhật ký, hãy sử dụng function phù hợp.
Plant ID hiện tại: {plant_id}

QUY TẮC SỬ DỤNG FUNCTION:
1. Khi người dùng nói "tạo task", "lên lịch", "nhắc tôi tưới", "đặt lịch bón", hãy gọi create_care_task.
2. Khi người dùng nói "ghi nhật ký", "cập nhật sức khỏe", "ghi chú tình trạng", hãy gọi log_journal_entry.
3. Khi người dùng hỏi "task còn gì", "còn gì cần làm", hãy gọi get_pending_tasks.
4. Sau khi gọi function, hãy trả lời ngắn gọn xác nhận đã thực hiện.

CÁC FUNCTION KHẢ DỤNG:
{json.dumps(tools, ensure_ascii=False, indent=2)}
"""

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
{tool_instruction}
Quy tắc trả lời:
- Xưng hô thân thiện, gọi tên người dùng ({display_name}).
- Dựa CHÍNH XÁC vào dữ liệu trên để đưa ra lời khuyên (Ví dụ: Nếu sức khỏe là WARNING, hãy tập trung giải quyết).
- KHÔNG bịa ra lịch sử chăm sóc. Nếu không có dữ liệu, hãy hỏi thêm người dùng.
- Trả lời bằng văn bản thuần túy (PLAIN TEXT). TUYỆT ĐỐI KHÔNG SỬ DỤNG MARKDOWN (như dấu ** hay ##).
"""

        # Build Gemini function declarations if tools provided
        gemini_tools = None
        if tools and len(tools) > 0:
            function_declarations = []
            for tool in tools:
                props = tool.get("parameters", {}).get("properties", {})
                required = tool.get("parameters", {}).get("required", [])

                # Build Schema for Gemini
                schema_properties = {}
                for prop_name, prop_def in props.items():
                    prop_schema = {"type": prop_def.get("type", "STRING")}
                    if "description" in prop_def:
                        prop_schema["description"] = prop_def["description"]
                    if "enum" in prop_def:
                        prop_schema["enum"] = prop_def["enum"]
                    schema_properties[prop_name] = prop_schema

                function_declarations.append(
                    types.FunctionDeclaration(
                        name=tool.get("name", ""),
                        description=tool.get("description", ""),
                        parameters=types.Schema(
                            type=types.Type.OBJECT,
                            properties=schema_properties,
                            required=required,
                        )
                    )
                )

            gemini_tools = types.Tool(function_declarations=function_declarations)

        # Cấu hình API của SDK mới
        api_config = types.GenerateContentConfig(
            system_instruction=system_instruction,
            temperature=0.7,  # Tinh chỉnh độ sáng tạo
            tools=[gemini_tools] if gemini_tools else None,
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

        # If tool_results provided, add them as function response parts
        if tool_results and len(tool_results) > 0:
            for tr in tool_results:
                tool_call_id = tr.get("tool_call_id", "")
                success = tr.get("success", False)
                result = tr.get("result", {})
                error = tr.get("error", "")

                response_data = {
                    "success": success,
                    "result": result,
                    "error": error if error else None,
                }

                # Add function response part
                function_response_part = types.Part(
                    function_response=types.FunctionResponse(
                        id=tool_call_id,
                        name="",  # Gemini may not require name in response
                        response=response_data,
                    )
                )
                contents.append(
                    types.Content(role="user", parts=[function_response_part])
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

        # Check for function calls in response
        tool_calls = []
        if response.function_calls:
            for fc in response.function_calls:
                tool_calls.append({
                    "id": fc.id or f"tool-{len(tool_calls)}",
                    "name": fc.name,
                    "arguments": dict(fc.args) if fc.args else {},
                })

            # Return tool_calls for backend to execute
            return jsonify({
                "success": True,
                "tool_calls": tool_calls,
                "reply": None,
            }), 200

        # Trả về kết quả cho NestJS
        return jsonify({
            "success": True,
            "reply": response.text
        }), 200

    except Exception as e:
        print(f"[ERROR] Gemini API Error: {str(e)}")
        return json_error("Lỗi nội bộ server khi xử lý AI", 500, e)


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

def decode_base64_image(base64_string):
    if not base64_string:
        raise ValueError("Thiếu dữ liệu ảnh base64.")

    if "base64," in base64_string:
        base64_string = base64_string.split("base64,")[1]

    return base64.b64decode(base64_string)

def ensure_bgra(img_cv2):
    if img_cv2 is None:
        raise ValueError("Không thể giải mã ảnh OpenCV.")

    if len(img_cv2.shape) == 2:
        return cv2.cvtColor(img_cv2, cv2.COLOR_GRAY2BGRA)

    channels = img_cv2.shape[2]
    if channels == 4:
        return img_cv2
    if channels == 3:
        return cv2.cvtColor(img_cv2, cv2.COLOR_BGR2BGRA)
    if channels == 1:
        return cv2.cvtColor(img_cv2, cv2.COLOR_GRAY2BGRA)

    raise ValueError("Định dạng ảnh không được hỗ trợ để ghép.")

def base64_to_cv2(base64_string, preserve_alpha=False):
    """Chuyển Base64 string thành ảnh OpenCV."""
    img_data = decode_base64_image(base64_string)
    nparr = np.frombuffer(img_data, np.uint8)
    read_mode = cv2.IMREAD_UNCHANGED if preserve_alpha else cv2.IMREAD_COLOR
    img_cv2 = cv2.imdecode(nparr, read_mode)
    if img_cv2 is None:
        raise ValueError("Không thể giải mã ảnh base64.")
    return img_cv2

def has_meaningful_alpha(img_cv2):
    if len(img_cv2.shape) != 3 or img_cv2.shape[2] != 4:
        return False

    alpha_channel = img_cv2[:, :, 3]
    return bool(np.any(alpha_channel < 250))

def prepare_plant_overlay_image(plant_image_base64):
    original_image = ensure_bgra(base64_to_cv2(plant_image_base64, preserve_alpha=True))

    if has_meaningful_alpha(original_image):
        return original_image

    if not rembg_remove:
        if rembg_import_error:
            print(f"[WARN] rembg chưa khả dụng, dùng ảnh cây gốc: {rembg_import_error}")
        return original_image

    try:
        removed_bytes = rembg_remove(decode_base64_image(plant_image_base64))
        removed_array = np.frombuffer(removed_bytes, np.uint8)
        removed_image = cv2.imdecode(removed_array, cv2.IMREAD_UNCHANGED)
        return ensure_bgra(removed_image)
    except Exception as exc:
        print(f"[WARN] Tách nền cây thất bại, fallback ảnh gốc: {exc}")
        return original_image

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

    img_bytes = decode_base64_image(image_base64)
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


@app.route("/api/analyze-plant-health", methods=["POST"])
@app.route("/api/analyze-plant", methods=["POST"])
def analyze_plant_health():
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


@app.route("/api/analyze-space", methods=["POST"])
def analyze_space():
    if not client:
        return json_error("Gemini Client chưa sẵn sàng")

    try:
        data = parse_json_body()
        image_base64 = data.get("image_base64")
        plant_catalog = data.get("plantCatalogText")

        if not image_base64 or not plant_catalog:
            return json_error("Thiếu dữ liệu ảnh hoặc danh mục cây", 400)

        # 1. Chuyển đổi ảnh Base64 -> PIL Image cho Gemini
        img_pil = load_pil_image_from_payload(image_base64=image_base64)

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
        result_json = parse_json_response_text(response.text)
        best_location = normalize_best_location(result_json.get("best_location"))

        # 5. Trả kết quả phân tích về cho NestJS, bước render sẽ gọi route riêng
        return jsonify({
            "success": True,
            "analysis": result_json.get("analysis"),
            "recommendations": result_json.get("recommendations"),
            "best_location": best_location,
        }), 200

    except Exception as e:
        print(f"[ERROR] Space Analysis API Error: {str(e)}")
        return json_error(str(e), 500)


@app.route("/api/render-space-visualization", methods=["POST"])
def render_space_visualization():
    try:
        data = parse_json_body()
        space_image_base64 = data.get("space_image_base64")
        plant_image_base64 = data.get("plant_image_base64")
        best_location = data.get("best_location")

        if not space_image_base64 or not plant_image_base64 or best_location is None:
            return json_error("Thiếu ảnh không gian, ảnh cây hoặc best_location", 400)

        background_img = base64_to_cv2(space_image_base64)
        plant_img = prepare_plant_overlay_image(plant_image_base64)
        img_height, img_width = background_img.shape[:2]
        ymin, xmin, ymax, xmax = normalized_box_to_pixels(
            best_location,
            img_width,
            img_height,
        )

        print(f"Tọa độ render: [ymin:{ymin}, xmin:{xmin}, ymax:{ymax}, xmax:{xmax}]")

        img_final_result = overlay_transparent_plant(
            background_img=background_img.copy(),
            plant_img=plant_img,
            xmin=xmin,
            ymin=ymin,
            xmax=xmax,
            ymax=ymax,
        )

        return jsonify({
            "success": True,
            "visualizedImage": cv2_to_base64(img_final_result),
        }), 200
    except Exception as e:
        print(f"[ERROR] Space Visualization API Error: {str(e)}")
        return json_error(str(e), 500)



if __name__ == "__main__":
    port = int(os.environ.get("PORT", 3003))
    debug_mode = os.environ.get("FLASK_DEBUG", "").lower() == "true"
    print(f"[SYSTEM] Starting Python Flask Server on port {port}...")
    print(f"[SYSTEM] AI configured: {ai_configured}")
    app.run(host="0.0.0.0", port=port, debug=debug_mode)
