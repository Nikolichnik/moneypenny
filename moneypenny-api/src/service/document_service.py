"""
Document service layer.
"""

from logging import getLogger

from typing import List

from common.exception import ObjectNotFoundException

from domain.document import Document

from repository.document_repository import DocumentRepository


logger = getLogger(__name__)


class DocumentService:
    """
    Service layer for document operations.

    Provides business logic for document management.
    """

    def __init__(self, repository: DocumentRepository):
        """
        Initialize service with repository.

        Args:
            repository: Document repository instance
        """
        self.repository = repository

    def list_documents(self) -> List[Document]:
        """
        Get list of all available documents.

        Returns:
            List of Document objects
        """
        logger.debug("Listing all documents")

        return self.repository.list_documents()

    def get_document(self, filename: str) -> Document:
        """
        Get specific document with content.

        Args:
            filename: Name of the document

        Returns:
            Document object with content

        Raises:
            ObjectNotFoundException: If document not found
        """
        logger.debug("Getting document: %s", filename)

        document = self.repository.get_document(filename, include_content=True)

        if not document:
            raise ObjectNotFoundException(f"Document not found: {filename}")

        return document

    def get_document_metadata(self, filename: str) -> Document:
        """
        Get document metadata without content.

        Args:
            filename: Name of the document

        Returns:
            Document object without content

        Raises:
            ObjectNotFoundException: If document not found
        """
        logger.debug("Getting document metadata: %s", filename)

        document = self.repository.get_document(filename, include_content=False)

        if not document:
            raise ObjectNotFoundException(f"Document not found: {filename}")

        return document

    def delete_document(self, filename: str) -> None:
        """
        Delete a document from the repository.

        Args:
            filename: Name of the document to delete

        Raises:
            ObjectNotFoundException: If document not found
        """
        logger.debug("Deleting document: %s", filename)

        # Check if document exists first
        document = self.repository.get_document(filename, include_content=False)

        if not document:
            raise ObjectNotFoundException(f"Document not found: {filename}")

        # Delete the document
        self.repository.delete_document(filename)

        logger.info("Document deleted successfully: %s", filename)
