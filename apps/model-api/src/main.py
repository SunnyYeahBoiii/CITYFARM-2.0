from flask import Flask, request, jsonify
from google import genai
from google.genai import types
import os

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

# 2. Endpoint xử lý AI Chat
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

        # Trích xuất Context (Khớp 100% với các trường từ Frontend gửi lên)
        plant_name = ctx.get("name", "cây của bạn")
        plant_type = ctx.get("type", "Không rõ loại")
        plant_health = ctx.get("health", "Không rõ tình trạng")
        days_growing = ctx.get("daysGrowing", 0)
        plant_note = ctx.get("note", "Không có ghi chú")

        # Xây dựng System Instruction (Ép ngữ cảnh chuyên gia)
        system_instruction = (
            "Bạn là một chuyên gia nông nghiệp đô thị nhiệt tình của ứng dụng CITYFARM. "
            f"Bạn đang tư vấn cho người dùng về cây {plant_name} (Loại: {plant_type}). "
            f"Tình trạng hiện tại: Sức khỏe {plant_health}, đã trồng được {days_growing} ngày. "
            f"Ghi chú thực tế từ vườn: {plant_note}. "
            "Dựa vào thông tin trên, hãy trả lời câu hỏi của người dùng một cách ngắn gọn, "
            "súc tích, chuyên nghiệp và thân thiện bằng tiếng Việt."
        )

        # Cấu hình API của SDK mới
        api_config = types.GenerateContentConfig(
            system_instruction=system_instruction,
            temperature=0.7 # Tinh chỉnh độ sáng tạo
        )

        response = client.models.generate_content(
            model='gemini-3.1-flash-lite-preview',
            contents=user_message,
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


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 3002))
    print(f"[SYSTEM] Starting Python Flask Server on port {port}...")
    app.run(host="0.0.0.0", port=port, debug=True)