"""Document API schemas for request/response validation."""

from dataclasses import dataclass
from typing import List


@dataclass
class DocumentMetadataSchema:
    """
    Document metadata response schema.

    Contains information about a document without its binary content.
    """

    name: str
    size: int
    content_type: str
    created_on: str  # ISO 8601 format
    modified_on: str  # ISO 8601 format
    path: str


@dataclass
class DocumentListResponseSchema:
    """
    Response schema for listing documents.

    Returns a collection of document metadata objects.
    """

    documents: List[DocumentMetadataSchema]
    total: int


@dataclass
class DocumentErrorSchema:
    """
    Error response schema for document operations.
    """

    error: str
    message: str
    status_code: int
