from flask import request, jsonify
from werkzeug.exceptions import HTTPException


def json_error(message, status_code=500, details=None):
    payload = {
        "success": False,
        "error": str(message).strip() or "Model API internal error.",
    }

    if details is not None:
        details_text = str(details).strip()
        if details_text:
            payload["details"] = details_text

    return jsonify(payload), status_code


def parse_json_body():
    data = request.get_json(silent=True)

    if data is None:
        return {}

    if not isinstance(data, dict):
        raise ValueError("Payload JSON phải là object.")

    return data


def register_error_handler(app):
    @app.errorhandler(Exception)
    def handle_exception(error):
        if isinstance(error, HTTPException):
            return json_error(error.description or error.name, error.code or 500)

        print(f"[UNHANDLED ERROR] {type(error).__name__}: {error}")
        return json_error("Model API internal error.", 500, error)
