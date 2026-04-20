import os

from dotenv import load_dotenv
from flask import Flask, jsonify

load_dotenv()


def create_app() -> Flask:
    app = Flask("CITYFARM Model API")

    @app.get("/")
    def hello_world():
        return jsonify({"service": "model-api", "status": "ok"})

    @app.get("/healthz")
    def healthz():
        return jsonify({"status": "healthy"}), 200

    @app.get("/hello")
    def hello():
        return jsonify({"message": "Hello, World! from hello"})

    return app


def run_dev_server() -> None:
    app = create_app()
    port = int(os.getenv("PORT", "3002"))
    debug = os.getenv("FLASK_DEBUG", "0") == "1"
    app.run(host="0.0.0.0", port=port, debug=debug)


if __name__ == "__main__":
    run_dev_server()
