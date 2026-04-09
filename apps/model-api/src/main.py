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