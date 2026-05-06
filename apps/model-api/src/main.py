import os
from flask import Flask, jsonify

# Load env và khởi tạo AI clients
import config
from config import client, ai_configured, vertex_configured

# Đăng ký error handler và các tiện ích
from utils.http_utils import register_error_handler

# Import handlers
from handlers.chat import chat_with_assistant as _chat_handler
from handlers.plant_health import analyze_plant_health as _plant_health_handler
from handlers.space import (
    analyze_space as _space_handler,
    render_space_visualization as _render_handler,
)

app = Flask("Model API")

# Đăng ký global error handler
register_error_handler(app)


# ────────────────────────────────────────────────
# ROUTES
# ────────────────────────────────────────────────

@app.route("/")
def health_check():
    return jsonify({
        "status": "Model API is running",
        "ai_configured": ai_configured,
        "vertex_configured": vertex_configured
    }), 200


@app.route("/ready")
def readiness_check():
    ready = ai_configured and vertex_configured
    return jsonify({
        "ready": ready,
        "ai_configured": ai_configured,
        "vertex_configured": vertex_configured
    }), 200 if ready else 503


@app.route("/api/chat", methods=["POST"])
def chat_with_assistant():
    return _chat_handler(client)


@app.route("/api/analyze-plant-health", methods=["POST"])
@app.route("/api/analyze-plant", methods=["POST"])
def analyze_plant_health():
    return _plant_health_handler(client)


@app.route("/api/analyze-space", methods=["POST"])
def analyze_space():
    return _space_handler(client)


@app.route("/api/render-space-visualization", methods=["POST"])
def render_space_visualization():
    return _render_handler(client)


# ────────────────────────────────────────────────
# STARTUP
# ────────────────────────────────────────────────

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 3003))
    debug_mode = os.environ.get("FLASK_DEBUG", "").lower() == "true"
    print(f"[SYSTEM] Starting Python Flask Server on port {port}...")
    print(f"[SYSTEM] AI configured: {ai_configured}")
    app.run(host="0.0.0.0", port=port, debug=debug_mode)
