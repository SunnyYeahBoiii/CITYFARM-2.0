import json
from flask import jsonify
from google.genai import types

from utils.http_utils import json_error, parse_json_body


def chat_with_assistant(client):
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
        request_mode = data.get("mode", "") or ""
        journal_image_asset_id = data.get("journalImageAssetId", "") or ""

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

        # Tool calling instructions (JSON envelope format)
        tool_instruction = ""
        if tools and len(tools) > 0:
            tools_json = json.dumps(tools, ensure_ascii=False, indent=2)
            if request_mode == "journal_upload":
                tool_instruction = f"""
[5. KHẢ NĂNG ĐIỀU CHỈNH TASK TỪ JOURNAL UPLOAD]
Trong journal_upload, hệ thống đã tự tạo PlantJournalEntry sau khi phân tích ảnh.
Nhiệm vụ của bạn là chỉ điều chỉnh care tasks đang chờ cho người dùng.

Bạn có thể thao tác task chăm sóc bằng các function:
- create_care_task: Tạo task đang chờ.
- update_care_task: Chỉnh sửa task đang chờ (đổi tiêu đề, đổi lịch, đổi ghi chú, đổi loại task).
- delete_care_task: Xoá task đang chờ.

QUY TẮC BẮT BUỘC (journal_upload):
1. KHÔNG gọi log_journal_entry (đã được ghi vào DB bởi endpoint journal upload).
2. Sử dụng danh sách PENDING_TASKS trong tin nhắn (đã được hệ thống nhúng sẵn). KHÔNG gọi get_pending_tasks.
3. Nếu phân tích cho thấy cần sâu bệnh/kiểm tra: dùng create_care_task (taskType PEST_CHECK hoặc CUSTOM) hoặc update_care_task nếu đã có task PENDING phù hợp (dùng đúng taskId lấy từ PENDING_TASKS).
4. Nếu phân tích cho thấy không cần thiết: dùng delete_care_task (dùng đúng taskId lấy từ PENDING_TASKS).
5. Khi gọi create_care_task/update_care_task/delete_care_task, hãy đặt journalImageAssetId (nếu có) để liên kết daily task history với đúng ảnh journal vừa upload.
   journalImageAssetId hiện tại: {journal_image_asset_id or "(chưa có)"}

Plant ID hiện tại: {plant_id}

CÁC FUNCTION KHẢ DỤNG:
{tools_json}

ĐỊNH DẠNG TOOL CALL JSON (KHI CẦN GỌI TOOL):
- Nếu cần gọi tool, trả về DUY NHẤT một JSON object, không thêm văn bản ngoài JSON:
{{
  "type": "tool_call",
  "assistant_message": "câu thông báo ngắn cho người dùng",
  "tool_calls": [
    {{
      "id": "tool-1",
      "name": "create_care_task",
      "arguments": {{
        "plantId": "{plant_id}",
        "taskType": "WATERING",
        "title": "Tưới nước cho cây"
      }}
    }}
  ]
}}
- Không bọc markdown.
- Chỉ dùng đúng tool name và tham số đã khai báo.
"""
            else:
                tool_instruction = f"""
[5. KHẢ NĂNG TẠO TASK VÀ JOURNAL]
Bạn có khả năng thao tác task chăm sóc và ghi journal cho người dùng bằng các function:
- create_care_task: Tạo task tưới, bón, tỉa, kiểm tra sâu bệnh, thu hoạch.
- update_care_task: Chỉnh sửa task đang chờ (đổi tiêu đề, đổi lịch, đổi ghi chú, đổi loại task).
- delete_care_task: Xoá task đang chờ.
- log_journal_entry: Ghi nhật ký sức khỏe cây.
- get_pending_tasks: Lấy danh sách task đang chờ.

Khi người dùng yêu cầu tạo task hoặc ghi nhật ký, hãy sử dụng function phù hợp.
Plant ID hiện tại: {plant_id}

QUY TẮC SỬ DỤNG FUNCTION:
1. Khi người dùng nói "tạo task", "lên lịch", "nhắc tôi tưới", "đặt lịch bón", hãy gọi create_care_task.
2. Khi người dùng nói "đổi lịch task", "sửa task", "chỉnh task", hãy gọi update_care_task.
3. Khi người dùng nói "xoá task", "hủy task", "xóa nhắc việc", hãy gọi delete_care_task.
4. Khi người dùng nói "ghi nhật ký", "cập nhật sức khỏe", "ghi chú tình trạng", hãy gọi log_journal_entry.
   Nếu nội dung journal có dấu hiệu sâu bệnh/thuốc cần xịt (ví dụ: "cây bị sâu", "cần xịt thuốc", "sâu bệnh", "côn trùng", "nấm"),
   thì đồng thời hãy gọi create_care_task để tạo task PEST_CHECK hoặc CUSTOM (tùy ngữ cảnh).
5. Khi người dùng hỏi "task còn gì", "còn gì cần làm", hãy gọi get_pending_tasks.
6. Bạn có thể trả về NHIỀU tool_calls trong cùng 1 response khi cần (ví dụ: vừa log journal vừa tạo task).
7. Sau khi gọi function, hãy trả lời ngắn gọn xác nhận đã thực hiện.

CÁC FUNCTION KHẢ DỤNG:
{tools_json}

ĐỊNH DẠNG TOOL CALL JSON (KHI CẦN GỌI TOOL):
- Nếu cần gọi tool, trả về DUY NHẤT một JSON object, không thêm văn bản ngoài JSON:
{{
  "type": "tool_call",
  "assistant_message": "câu thông báo ngắn cho người dùng",
  "tool_calls": [
    {{
      "id": "tool-1",
      "name": "create_care_task",
      "arguments": {{
        "plantId": "{plant_id}",
        "taskType": "WATERING",
        "title": "Tưới nước cho cây"
      }}
    }}
  ]
}}
- Không bọc markdown.
- Chỉ dùng đúng tool name và tham số đã khai báo.
"""

        tool_result_instruction = ""
        if tool_results and len(tool_results) > 0:
            tool_result_instruction = """
[6. SAU KHI NHẬN KẾT QUẢ TOOL]
- Bạn đã có kết quả thực thi tool từ hệ thống.
- Bây giờ chỉ trả về câu trả lời cuối cùng cho người dùng bằng văn bản thuần túy.
- TUYỆT ĐỐI KHÔNG trả về JSON tool_call nữa.
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
{tool_result_instruction}
Quy tắc trả lời:
- Xưng hô thân thiện, gọi tên người dùng ({display_name}).
- Dựa CHÍNH XÁC vào dữ liệu trên để đưa ra lời khuyên (Ví dụ: Nếu sức khỏe là WARNING, hãy tập trung giải quyết).
- KHÔNG bịa ra lịch sử chăm sóc. Nếu không có dữ liệu, hãy hỏi thêm người dùng.
- Trả lời bằng văn bản thuần túy (PLAIN TEXT). TUYỆT ĐỐI KHÔNG SỬ DỤNG MARKDOWN (như dấu ** hay ##).
"""

        # Cấu hình API của SDK mới
        api_config = types.GenerateContentConfig(
            system_instruction=system_instruction,
            temperature=0.7,  # Tinh chỉnh độ sáng tạo
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
                tool_name = tr.get("name", "")
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
                        name=tool_name if tool_name else "tool_response",
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

        # Trả về kết quả cho NestJS
        return jsonify({
            "success": True,
            "reply": response.text
        }), 200

    except Exception as e:
        print(f"[ERROR] Gemini API Error: {str(e)}")
        return json_error("Lỗi nội bộ server khi xử lý AI", 500, e)
