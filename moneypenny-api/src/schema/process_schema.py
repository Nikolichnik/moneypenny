"""Process schema for Quart."""

from dataclasses import dataclass
from typing import Optional


@dataclass
class ProcessRequestSchema:
    """
    Request schema for document processing.
    
    The prompt should describe what document operations you want to perform.
    Supported operations include:
    - Adding watermarks (text or image)
    - OCR processing
    - Digital signing
    - Redaction (create and apply)
    - Format conversion (PDF, PDF/A, images, Office formats, HTML, Markdown)
    - Page rotation and manipulation
    """

    prompt: str = None

    def __post_init__(self):
        """
        Validate that prompt is provided.
        """
        if not self.prompt:
            raise ValueError("Prompt is required.")


@dataclass
class ProcessResponseSchema:
    """
    Server-Sent Event (SSE) stream response schema.

    Each event in the stream contains the current state of the processing workflow.
    Events are sent in JSON format with `data:` prefix following SSE specification.
    """

    response: Optional[str] = None
    prompt: Optional[str] = None
