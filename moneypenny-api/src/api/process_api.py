"""
This module contains the Process API Blueprint.
"""

import json

from logging import getLogger

from quart import Blueprint, Response

from quart_schema import validate_request, tag

from common.constants import (
    KEY_PROMPT,
    KEY_DATA,
    TEXT_EVENT_STREAM,
    NEWLINE,
)
from common.exception import ObjectNotFoundException

from schema.process_schema import ProcessRequestSchema

from graph.process_graph import ProcessGraph

from util.api import handle_exception_impl


logger = getLogger(__file__)

process_blueprint = Blueprint("process", __name__, url_prefix="/process")


@process_blueprint.route("", methods=["POST"])
@tag(["Document Processing"])
@validate_request(ProcessRequestSchema)
async def process_documents(data: ProcessRequestSchema) -> tuple[Response, dict]:
    """
    Process documents using AI agent with natural language instructions.  

    This endpoint accepts a natural language prompt describing document operations
    and streams processing updates as Server-Sent Events (SSE). The AI agent uses
    Nutrient DWS tools to perform operations like watermarking, OCR, signing, and more.

    **Example prompts:**
    - "Add 'CONFIDENTIAL' watermark to all PDFs"
    - "Extract text from scanned documents using OCR"
    - "Convert all documents to PDF/A format"
    - "Apply digital signature to contracts"

    **Args:**
    - data: Request body containing the natural language prompt

    **Returns:**
    - Server-Sent Events (SSE) stream with processing updates.
    - Content-Type: text/event-stream
    - Each event contains JSON data with the current processing state:
    ```
    data: {
        "prompt": "...",
        "response": "..."
    }
    ```

    **Responses:**
    - 200: SSE stream with processing updates (text/event-stream)
    - 400: Invalid request or missing prompt
    - 500: Processing error
    """
    process_data = {
        KEY_PROMPT: data.prompt,
    }

    logger.debug("Initiating processing operation using data: %s", process_data)

    graph = ProcessGraph(process_data)

    async def event_stream():
        async for update in graph.stream():
            yield f"{KEY_DATA}: {json.dumps(update)}{NEWLINE}{NEWLINE}"

    return Response(event_stream(), content_type=TEXT_EVENT_STREAM)


@process_blueprint.errorhandler(ObjectNotFoundException)
def handle_exception(exception: Exception) -> tuple[dict, int]:
    """
    Handle exceptions thrown during execution.

    Args:
        exception (Exception): The exception that was thrown.

    Returns:
        tuple[dict, int]: The error response and the HTTP status code.
    """
    return handle_exception_impl(
        exception=exception,
        logger=logger,
    )
