import base64
from flask import jsonify
from google.genai import types

from utils.http_utils import json_error, parse_json_body
from utils.image_utils import (
    load_pil_image_from_payload,
    base64_to_cv2,
    cv2_to_base64,
    prepare_plant_overlay_image,
    overlay_transparent_plant,
    decode_base64_image,
)
from utils.normalize import (
    parse_json_response_text,
    normalize_best_location,
    normalized_box_to_pixels,
)


def analyze_space(client):
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

        # 2. Xây dựng Prompt (Gộp cả phân tích, gợi ý và lấy tọa độ + mô tả vị trí)
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
        Viết một mô tả ngắn gọn (placement_description) bằng tiếng Việt để hướng dẫn AI sinh ảnh ghép chậu cây vào đúng vị trí đó.
        LƯU Ý: Câu mô tả PHẢI bao gồm tên cây của Top 1.
        Ví dụ: "Đặt một chậu cây Thai Basil ở góc phải lan can, cạnh chiếc ghế gỗ, đảm bảo hứng được ánh sáng từ cửa sổ."

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
          "placement_description": "<Mô tả vị trí đặt cây bằng tiếng Việt>"
        }}"""

        # 3. Gọi Gemini API
        print("Đang gọi Gemini API để phân tích không gian...")
        config = types.GenerateContentConfig(
            temperature=0.1,
            response_mime_type="application/json"
        )

        response = client.models.generate_content(
            model='gemini-3.1-flash-lite-preview',
            contents=[img_pil, prompt],
            config=config
        )

        # 4. Parse JSON
        result_json = parse_json_response_text(response.text)
        placement_desc = result_json.get("placement_description") or "Đặt cây tại vị trí phù hợp trong không gian."

        # 5. Trả kết quả phân tích về cho NestJS, bước render sẽ gọi route riêng
        return jsonify({
            "success": True,
            "analysis": result_json.get("analysis"),
            "recommendations": result_json.get("recommendations"),
            "placement_description": placement_desc,
        }), 200


    except Exception as e:
        print(f"[ERROR] Space Analysis API Error: {str(e)}")
        return json_error(str(e), 500)


def render_space_visualization(client):
    if not client:
        return json_error("Gemini Client chưa sẵn sàng")

    try:
        data = parse_json_body()
        space_image_base64 = data.get("space_image_base64")
        plant_image_base64 = data.get("plant_image_base64")
        placement_description = data.get("placement_description")

        if not space_image_base64 or not plant_image_base64:
            return json_error("Thiếu ảnh không gian hoặc ảnh cây", 400)

        # 1. Chuẩn bị dữ liệu cho Nano Banana (Image-to-Image)
        # Gemini 3.1 Flash Image Preview yêu cầu bytes
        space_bytes = decode_base64_image(space_image_base64)
        plant_bytes = decode_base64_image(plant_image_base64)

        prompt = f"Hãy đặt chậu cây này vào không gian một cách chân thực nhất. Vị trí: {placement_description or 'vị trí phù hợp'}. YÊU CẦU QUAN TRỌNG: Hãy tự động điều chỉnh kích thước (scale) chậu cây sao cho tỉ lệ hài hòa và thực tế với các đồ vật xung quanh trong không gian. Giữ nguyên hình dạng chậu cây, xử lý ánh sáng và bóng đổ photorealistic."

        print(f"Đang gọi Nano Banana Image Preview để render: {placement_description[:50]}...")
        
        contents = [
            prompt,
            types.Part.from_bytes(data=space_bytes, mime_type="image/jpeg"),
            types.Part.from_bytes(data=plant_bytes, mime_type="image/png")
        ]

        # 2. Gọi model đặc biệt hỗ trợ Image Output
        response = client.models.generate_content(
            model='gemini-3.1-flash-image-preview',
            contents=contents
        )

        # 3. Trích xuất ảnh từ Part.inline_data
        for part in response.candidates[0].content.parts:
            if part.inline_data:
                # Chuyển bytes ảnh trực tiếp thành base64 string
                img_data = part.inline_data.data
                base64_str = base64.b64encode(img_data).decode("utf-8")
                visualized_image = f"data:image/png;base64,{base64_str}"
                
                return jsonify({
                    "success": True,
                    "visualizedImage": visualized_image,
                }), 200

        return json_error("AI không trả về dữ liệu ảnh. Hãy kiểm tra lại prompt.", 500)

    except Exception as e:
        print(f"[ERROR] Space Visualization API Error: {str(e)}")
        return json_error(str(e), 500)
