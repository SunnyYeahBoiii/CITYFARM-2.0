# Model API - Hướng dẫn cài đặt Local

## Yêu cầu hệ thống

- Python 3.10 trở lên
- pip hoặc Poetry

## Cài đặt

### Cách 1: Dùng pip (khuyến nghị)

```bash
cd apps/model-api

# Tạo virtual environment
python3 -m venv .venv
source .venv/bin/activate  # macOS/Linux
# .venv\Scripts\activate   # Windows

# Cài đặt dependencies
pip install -r requirements.txt

# rembg cần tải model ONNX lần đầu
pip install onnxruntime
```

### Cách 2: Dùng Poetry

```bash
cd apps/model-api

poetry install
```

## Cấu hình

```bash
# Copy file môi trường mẫu
cp .env.example .env

# Mở .env và điền Gemini API key
# PORT=3003
# FLASK_DEBUG=false
# GEMINI_API_KEY=AIza...
```

Lấy Gemini API key tại: https://aistudio.google.com/apikey

## Chạy server

```bash
# Production
python src/main.py

# Development (tự reload khi sửa code)
FLASK_DEBUG=true python src/main.py
```

Server chạy tại `http://localhost:3003`

## Kiểm tra

```bash
curl http://localhost:3003/
# {"ai_configured":true,"status":"Model API is running"}
```

## API Endpoints

| Method | Path | Mô tả |
|--------|------|-------|
| GET | `/` | Health check |
| POST | `/api/chat` | AI chat với RAG context |
| POST | `/api/analyze-plant-health` | Phân tích sức khỏe cây (JSON hoặc multipart) |
| POST | `/api/analyze-plant` | Alias của analyze-plant-health |
| POST | `/api/analyze-space` | Phân tích không gian + gợi ý cây |
| POST | `/api/render-space-visualization` | Render ảnh cây vào không gian |

## Troubleshooting

- **`GEMINI_API_KEY` không có** → Server vẫn chạy nhưng AI không hoạt động
- **rembg import error** → Cài `onnxruntime` và đảm bảo có mạng lần đầu chạy
- **Port 3003 đã dùng** → Đổi `PORT` trong `.env`
