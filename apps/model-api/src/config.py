import os
import sys
from pathlib import Path
from google import genai

# Fix encoding cho Windows terminal
if sys.stdout.encoding and sys.stdout.encoding.lower() != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')


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


# Load env trước khi đọc bất kỳ biến nào
load_local_env()


# ────────────────────────────────────────────────
# 1. Gemini Client (dùng cho Chat và Plant Health)
# ────────────────────────────────────────────────
api_key = os.environ.get("GEMINI_API_KEY")

if api_key:
    print(f"[DEBUG-SYSTEM] GEMINI_API_KEY found, prefix: {api_key[:5]}***")
else:
    print("[DEBUG-SYSTEM] WARNING: GEMINI_API_KEY not found. Check your env or apps/model-api/.env!")

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


# ────────────────────────────────────────────────
# 2. Vertex AI / Gen AI Client (dùng cho Render/ Tính năng Scan không gian và ghép ảnh cây)
# ────────────────────────────────────────────────
gcp_project = os.environ.get("GCP_PROJECT_ID")
gcp_location = os.environ.get("GCP_LOCATION")
gcp_key_path = os.environ.get("GCP_KEY_PATH")
gcp_api_key = os.environ.get("GCP_API_KEY")  # API Key mới thiết lập

if gcp_key_path:
    key_abs_path = str(Path(__file__).resolve().parent.parent / gcp_key_path)
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = key_abs_path

vertex_configured = False
try:
    if gcp_project:
        # Ưu tiên dùng API Key nếu có, nếu không sẽ tự dùng ADC/Service Account Key qua biến môi trường
        genai_client = genai.Client(
            api_key=gcp_api_key,
            vertexai=True,
            project=gcp_project,
            location=gcp_location
        )
        vertex_configured = True
        auth_method = "API Key" if gcp_api_key else "Service Account"
        print(f"[SYSTEM] Google Gen AI initialized using {auth_method}: {gcp_project} in {gcp_location}")
    else:
        print("[SYSTEM WARNING] Missing GCP_PROJECT_ID. Vertex AI features disabled.")
        genai_client = None
except Exception as e:
    print(f"[SYSTEM ERROR] Failed to initialize Google Gen AI Client: {e}")
    genai_client = None
