from flask import jsonify
from google.genai import types

from utils.http_utils import json_error, parse_json_body
from utils.image_utils import (
    load_pil_image_from_payload,
    base64_to_cv2,
    cv2_to_base64,
    prepare_plant_overlay_image,
    overlay_transparent_plant,
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
            model='gemini-3.1-flash-lite-preview',  # Dùng model flash-lite cho tốc độ
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
