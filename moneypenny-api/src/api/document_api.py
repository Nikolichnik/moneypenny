"""
Document API Blueprint.
"""

from logging import getLogger

import os

from io import BytesIO

from quart import Blueprint, Response, send_file

from quart_schema import tag, validate_response

from common.constants import (
    ENV_DOCUMENT_BASE_PATH,
    VALUE_DOCUMENT_BASE_PATH_DEFAULT,
)
from common.exception import ObjectNotFoundException

from schema.document_schema import DocumentListResponseSchema

from repository.document_repository import DocumentRepository

from service.document_service import DocumentService

from util.api import handle_exception_impl


logger = getLogger(__name__)

document_base_path = os.getenv(ENV_DOCUMENT_BASE_PATH, VALUE_DOCUMENT_BASE_PATH_DEFAULT)

repository = DocumentRepository(document_base_path)
document_service = DocumentService(repository)

document_blueprint = Blueprint("document", __name__, url_prefix="/documents")


@document_blueprint.route("", methods=["GET"])
@tag(["Document Management"])
@validate_response(DocumentListResponseSchema, 200)
async def list_documents() -> tuple[dict, int]:
    """
    List all available documents.

    Returns a collection of document metadata including name, size, content type,
    and timestamps. Does not include document content for performance reasons.

    **Use cases:**
    - Display document library in frontend
    - Get list of available documents for processing
    - Check document availability

    Returns:
        List of document metadata objects

    Responses:
        200: Successfully retrieved document list
        500: Server error while accessing documents
    """
    logger.debug("Listing documents")

    documents = document_service.list_documents()

    document_schemas = [
        {
            "name": doc.name,
            "size": doc.size,
            "content_type": doc.content_type,
            "created_on": doc.created_on.isoformat(),
            "modified_on": doc.modified_on.isoformat(),
            "path": f"/documents/{doc.name}",
        }
        for doc in documents
    ]

    response = {
        "documents": document_schemas,
        "total": len(document_schemas),
    }

    return response, 200


@document_blueprint.route("/<string:filename>", methods=["GET"])
@tag(["Document Management"])
async def get_document(filename: str) -> Response:
    """
    Stream document content for viewing or downloading.

    Returns the binary content of the requested document with appropriate
    Content-Type header. Supports inline viewing in browsers for PDFs and images.

    **Use cases:**
    - Display PDF in browser viewer
    - Download document files
    - Preview images and documents

    **Security:**
    - Path traversal protection enabled
    - Only files within document directory are accessible

    Args:
        filename: Name of the document file

    Returns:
        Binary file content with appropriate Content-Type header

    Responses:
        200: Document content (application/pdf, image/*, etc.)
        404: Document not found
        403: Access denied (path traversal attempt)
        500: Server error while reading document
    """
    logger.debug("Streaming document: %s", filename)

    document = document_service.get_document(filename)

    # Create in-memory file for streaming
    file_stream = BytesIO(document.content)
    file_stream.seek(0)

    return await send_file(
        file_stream,
        mimetype=document.content_type,
        as_attachment=False,
        attachment_filename=document.name,
    )


@document_blueprint.errorhandler(ObjectNotFoundException)
async def handle_exception(exception: Exception) -> tuple[dict, int]:
    """
    Handle general exceptions during document operations.

    Args:
        exception: The exception that was thrown

    Returns:
        Error response with appropriate status code
    """
    return handle_exception_impl(
        exception=exception,
        logger=logger,
    )
