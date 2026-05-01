import base64
import io
import cv2
import numpy as np
import PIL.Image

try:
    from rembg import remove as rembg_remove
    rembg_import_error = None
except Exception as exc:
    rembg_remove = None
    rembg_import_error = exc


# ────────────────────────────────────────────────
# BASE64 HELPERS
# ────────────────────────────────────────────────

def decode_base64_image(base64_string):
    if not base64_string:
        raise ValueError("Thiếu dữ liệu ảnh base64.")

    if "base64," in base64_string:
        base64_string = base64_string.split("base64,")[1]

    return base64.b64decode(base64_string)


def base64_to_cv2(base64_string, preserve_alpha=False):
    """Chuyển Base64 string thành ảnh OpenCV."""
    img_data = decode_base64_image(base64_string)
    nparr = np.frombuffer(img_data, np.uint8)
    read_mode = cv2.IMREAD_UNCHANGED if preserve_alpha else cv2.IMREAD_COLOR
    img_cv2 = cv2.imdecode(nparr, read_mode)
    if img_cv2 is None:
        raise ValueError("Không thể giải mã ảnh base64.")
    return img_cv2


def cv2_to_base64(img_cv2, ext=".jpg"):
    """Chuyển ảnh OpenCV (BGR) thành Base64 string có nén để giảm tải payload"""
    # Nén JPEG ở mức chất lượng 80% (tối ưu dung lượng và độ nét)
    encode_param = [int(cv2.IMWRITE_JPEG_QUALITY), 80]
    _, buffer = cv2.imencode(ext, img_cv2, encode_param)

    base64_str = base64.b64encode(buffer).decode("utf-8")
    return f"data:image/{ext.replace('.', '')};base64,{base64_str}"


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


# ────────────────────────────────────────────────
# OPENCV / ALPHA BLENDING HELPERS
# ────────────────────────────────────────────────

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
