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

# Mở .env và điền Vertex AI project/service-account config
# PORT=3003
# FLASK_DEBUG=false
# GCP_PROJECT_ID=cityfarm-494909
# GCP_LOCATION=global
# MODEL_API_SECRET_KEY_JSON={"type":"service_account","project_id":"..."}
```

Model API ưu tiên đọc service-account trực tiếp từ `.env` qua `MODEL_API_SECRET_KEY_JSON` (hoặc `MODEL_API_SECRET_KEY_JSON_B64`). Trong môi trường Docker/VPS, vẫn có thể dùng `GOOGLE_APPLICATION_CREDENTIALS` nếu credentials được mount sẵn.

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

curl http://localhost:3003/ready
# 200 khi Vertex AI credential đã sẵn sàng, 503 nếu thiếu/sai credential
```

## API Endpoints

| Method | Path | Mô tả |
|--------|------|-------|
| GET | `/` | Health check |
| GET | `/ready` | Readiness check cho Vertex AI credential |
| POST | `/api/chat` | AI chat với RAG context |
| POST | `/api/analyze-plant-health` | Phân tích sức khỏe cây (JSON hoặc multipart) |
| POST | `/api/analyze-plant` | Alias của analyze-plant-health |
| POST | `/api/analyze-space` | Phân tích không gian + gợi ý cây |
| POST | `/api/render-space-visualization` | Render ảnh cây vào không gian |

## Troubleshooting

- **`/ready` trả 503** → Kiểm tra `GCP_PROJECT_ID`, `GCP_LOCATION` và biến `MODEL_API_SECRET_KEY_JSON`/`GOOGLE_APPLICATION_CREDENTIALS`
- **rembg import error** → Cài `onnxruntime` và đảm bảo có mạng lần đầu chạy
- **Port 3003 đã dùng** → Đổi `PORT` trong `.env`
