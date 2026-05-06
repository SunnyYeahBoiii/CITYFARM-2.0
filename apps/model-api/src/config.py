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


load_local_env()


# ────────────────────────────────────────────────
# 1. Google Gen AI Client (Vertex AI)
# ────────────────────────────────────────────────
gcp_project = os.environ.get("GCP_PROJECT_ID")
gcp_location = os.environ.get("GCP_LOCATION")
gcp_key_path = os.environ.get("GCP_KEY_PATH")
gcp_api_key = os.environ.get("GCP_API_KEY")
model_api_google_credentials = os.environ.get("MODEL_API_GOOGLE_APPLICATION_CREDENTIALS")
google_application_credentials = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")

# Priority:
# 1) GOOGLE_APPLICATION_CREDENTIALS (already exported by runtime)
# 2) MODEL_API_GOOGLE_APPLICATION_CREDENTIALS (deploy-specific convenience key)
# 3) GCP_KEY_PATH (local relative file, backward compatibility)
if not google_application_credentials and model_api_google_credentials:
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = model_api_google_credentials
elif not google_application_credentials and gcp_key_path:
    key_abs_path = str(Path(__file__).resolve().parent.parent / gcp_key_path)
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = key_abs_path

client = None
ai_configured = False
vertex_configured = False

try:
    if gcp_project:
        client = genai.Client(
            api_key=gcp_api_key,
            vertexai=True,
            project=gcp_project,
            location=gcp_location
        )
        ai_configured = True
        vertex_configured = True
        auth_method = "API Key" if gcp_api_key else "Service Account/ADC"
        print(f"[SYSTEM] Unified Vertex AI Client initialized using {auth_method}: {gcp_project} in {gcp_location}")
    else:
        print("[SYSTEM WARNING] Missing GCP_PROJECT_ID. Vertex AI features disabled.")
except Exception as e:
    print(f"[SYSTEM ERROR] Failed to initialize Unified Vertex AI Client: {e}")

