"""
This module is the entry point for the API service. It sets up
the Flask app, registers the blueprints, and runs the app.
"""

import os

import warnings

from pathlib import Path

from quart import Quart

from quart_schema import QuartSchema

from quart_cors import cors

from common.constants import ENV_CORS_ORIGIN
from common.setup import get_config_settings, set_up_logging

from api.process_api import process_blueprint


warnings.filterwarnings("ignore", message="Multiple schemas resolved to the name ")

app = Quart(__name__)

# Load configuration from Dynaconf
settings = get_config_settings()

for key in dir(settings):
    if key.isupper() and not key.startswith('_'):
        app.config[key] = getattr(settings, key)

set_up_logging(Path(app.root_path).parent / "logger_config.yaml")

# Enable CORS for a specific domain with any port
cors_origin = os.environ.get(ENV_CORS_ORIGIN, "http://localhost:*")
app = cors(app, allow_origin=cors_origin)

# Configure QuartSchema with OpenAPI documentation
QuartSchema(
    app,
    info={
        "title": "Moneypenny API",
        "description": "AI-powered document processing API using LangGraph and Nutrient DWS. "
                       "Supports watermarking, OCR, redaction, signing, format conversion and more.",
        "version": "0.0.1",
        "contact": {
            "name": "API Support",
        },
        "license": {
            "name": "MIT",
        },
    },
    tags=[
        {
            "name": "Document Processing",
            "description": "Operations for processing documents with AI agents",
        }
    ],
)

app.register_blueprint(process_blueprint)

asgi_app = app

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
