import importlib
import os
import sys
import tempfile
import types
import unittest
from pathlib import Path
from unittest.mock import patch


CONFIG_MODULE = "config"
MODEL_API_SRC = Path(__file__).resolve().parents[1] / "src"


class FakeGenAiClient:
    calls = []

    def __init__(self, **kwargs):
        self.kwargs = kwargs
        FakeGenAiClient.calls.append(kwargs)


class ConfigCredentialTests(unittest.TestCase):
    def setUp(self):
        FakeGenAiClient.calls = []
        self.original_path = list(sys.path)
        sys.path.insert(0, str(MODEL_API_SRC))
        sys.modules.pop(CONFIG_MODULE, None)

        google_module = types.ModuleType("google")
        google_module.genai = types.SimpleNamespace(Client=FakeGenAiClient)
        self.google_patch = patch.dict(
            sys.modules,
            {
                "google": google_module,
                "google.genai": google_module.genai,
            },
        )
        self.google_patch.start()

    def tearDown(self):
        self.google_patch.stop()
        sys.modules.pop(CONFIG_MODULE, None)
        sys.path = self.original_path

    def import_config(self, env):
        keys = {
            "GCP_PROJECT_ID",
            "GCP_LOCATION",
            "GCP_API_KEY",
            "GOOGLE_APPLICATION_CREDENTIALS",
            "MODEL_API_SECRET_KEY_JSON",
            "MODEL_API_SECRET_KEY_JSON_B64",
        }
        with patch.dict(os.environ, {key: "" for key in keys}, clear=False):
            for key in keys:
                os.environ.pop(key, None)
            with patch.dict(os.environ, env, clear=False):
                config = importlib.import_module(CONFIG_MODULE)
                return config, os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")

    def test_missing_service_account_file_disables_ai_client(self):
        missing_path = "/tmp/cityfarm-missing-service-account.json"

        config, _credentials_path = self.import_config(
            {
                "GCP_PROJECT_ID": "cityfarm-prod",
                "GCP_LOCATION": "global",
                "GOOGLE_APPLICATION_CREDENTIALS": missing_path,
            }
        )

        self.assertIsNone(config.client)
        self.assertFalse(config.ai_configured)
        self.assertFalse(config.vertex_configured)
        self.assertEqual(FakeGenAiClient.calls, [])

    def test_existing_google_application_credentials_path_is_used(self):
        with tempfile.NamedTemporaryFile() as key_file:
            config, credentials_path = self.import_config(
                {
                    "GCP_PROJECT_ID": "cityfarm-prod",
                    "GCP_LOCATION": "global",
                    "GOOGLE_APPLICATION_CREDENTIALS": key_file.name,
                }
            )

        self.assertIsNotNone(config.client)
        self.assertTrue(config.ai_configured)
        self.assertTrue(config.vertex_configured)
        self.assertEqual(credentials_path, key_file.name)
        self.assertEqual(
            FakeGenAiClient.calls,
            [
                {
                    "api_key": None,
                    "vertexai": True,
                    "project": "cityfarm-prod",
                    "location": "global",
                }
            ],
        )

    def test_service_account_json_from_env_is_materialized(self):
        service_account_json = """{
  "type": "service_account",
  "project_id": "cityfarm-prod",
  "private_key_id": "fake",
  "private_key": "-----BEGIN PRIVATE KEY-----\\nfake\\n-----END PRIVATE KEY-----\\n",
  "client_email": "cityfarm@cityfarm-prod.iam.gserviceaccount.com",
  "client_id": "12345"
}"""

        config, credentials_path = self.import_config(
            {
                "GCP_PROJECT_ID": "cityfarm-prod",
                "GCP_LOCATION": "global",
                "MODEL_API_SECRET_KEY_JSON": service_account_json,
            }
        )

        self.assertIsNotNone(config.client)
        self.assertTrue(config.ai_configured)
        self.assertTrue(config.vertex_configured)
        self.assertTrue(credentials_path)
        self.assertTrue(Path(credentials_path).is_file())
        self.assertEqual(
            Path(credentials_path).read_text(encoding="utf-8"),
            service_account_json,
        )
        self.assertEqual(
            FakeGenAiClient.calls,
            [
                {
                    "api_key": None,
                    "vertexai": True,
                    "project": "cityfarm-prod",
                    "location": "global",
                }
            ],
        )


if __name__ == "__main__":
    unittest.main()
