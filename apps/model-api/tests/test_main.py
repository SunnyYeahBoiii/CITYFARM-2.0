import importlib
import sys
import types
import unittest
from pathlib import Path
from unittest.mock import patch


MAIN_MODULE = "main"
MODEL_API_SRC = Path(__file__).resolve().parents[1] / "src"


def handler_response(_client):
    return {"ok": True}


class MainReadinessTests(unittest.TestCase):
    def setUp(self):
        self.original_path = list(sys.path)
        sys.path.insert(0, str(MODEL_API_SRC))
        sys.modules.pop(MAIN_MODULE, None)

    def tearDown(self):
        sys.modules.pop(MAIN_MODULE, None)
        sys.path = self.original_path

    def import_main(self, ai_configured, vertex_configured):
        fake_config = types.ModuleType("config")
        fake_config.client = object()
        fake_config.ai_configured = ai_configured
        fake_config.vertex_configured = vertex_configured

        fake_http_utils = types.ModuleType("utils.http_utils")
        fake_http_utils.register_error_handler = lambda _app: None

        fake_chat = types.ModuleType("handlers.chat")
        fake_chat.chat_with_assistant = handler_response

        fake_plant_health = types.ModuleType("handlers.plant_health")
        fake_plant_health.analyze_plant_health = handler_response

        fake_space = types.ModuleType("handlers.space")
        fake_space.analyze_space = handler_response
        fake_space.render_space_visualization = handler_response

        with patch.dict(
            sys.modules,
            {
                "config": fake_config,
                "utils.http_utils": fake_http_utils,
                "handlers.chat": fake_chat,
                "handlers.plant_health": fake_plant_health,
                "handlers.space": fake_space,
            },
        ):
            return importlib.import_module(MAIN_MODULE)

    def test_ready_fails_when_vertex_ai_is_not_configured(self):
        main = self.import_main(ai_configured=False, vertex_configured=False)

        response = main.app.test_client().get("/ready")

        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.get_json()["ready"], False)

    def test_ready_passes_when_vertex_ai_is_configured(self):
        main = self.import_main(ai_configured=True, vertex_configured=True)

        response = main.app.test_client().get("/ready")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()["ready"], True)


if __name__ == "__main__":
    unittest.main()
