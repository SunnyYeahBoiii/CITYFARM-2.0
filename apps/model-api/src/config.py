import os
import sys
import json
import base64
import binascii
import tempfile
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
gcp_api_key = os.environ.get("GCP_API_KEY")

explicit_credentials_path = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")
service_account_json = os.environ.get("MODEL_API_SECRET_KEY_JSON")
service_account_json_b64 = os.environ.get("MODEL_API_SECRET_KEY_JSON_B64")

if not explicit_credentials_path and (service_account_json or service_account_json_b64):
    decoded_json = service_account_json

    if not decoded_json and service_account_json_b64:
        try:
            decoded_json = base64.b64decode(service_account_json_b64).decode("utf-8")
        except (binascii.Error, UnicodeDecodeError):
            print("[SYSTEM ERROR] MODEL_API_SECRET_KEY_JSON_B64 is not valid base64 UTF-8 data.")

    if decoded_json:
        try:
            json.loads(decoded_json)
            with tempfile.NamedTemporaryFile(
                mode="w",
                suffix=".json",
                prefix="cityfarm-gcp-sa-",
                delete=False,
                encoding="utf-8",
            ) as credentials_file:
                credentials_file.write(decoded_json)
                explicit_credentials_path = credentials_file.name

            os.chmod(explicit_credentials_path, 0o600)
            os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = explicit_credentials_path
            print("[SYSTEM] Loaded Google credentials from .env secret JSON.")
        except json.JSONDecodeError:
            print("[SYSTEM ERROR] MODEL_API_SECRET_KEY_JSON is not valid JSON.")
        except OSError as exc:
            explicit_credentials_path = None
            print(f"[SYSTEM ERROR] Failed to materialize .env service-account JSON: {exc}")

client = None
ai_configured = False
vertex_configured = False
credentials_ready = True

if explicit_credentials_path:
    credentials_file = Path(explicit_credentials_path)
    credentials_ready = credentials_file.is_file() and os.access(credentials_file, os.R_OK)
    if not credentials_ready:
        print(f"[SYSTEM ERROR] GOOGLE_APPLICATION_CREDENTIALS is not readable: {explicit_credentials_path}")

try:
    if gcp_project and credentials_ready:
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
        if not gcp_project:
            print("[SYSTEM WARNING] Missing GCP_PROJECT_ID. Vertex AI features disabled.")
        elif not credentials_ready:
            print("[SYSTEM WARNING] Vertex AI features disabled because service-account credentials are unavailable.")
except Exception as e:
    print(f"[SYSTEM ERROR] Failed to initialize Unified Vertex AI Client: {e}")
