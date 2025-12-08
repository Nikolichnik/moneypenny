"""
Document repository for filesystem operations.
"""

from logging import getLogger

from typing import List, Optional

import mimetypes

from datetime import datetime

from pathlib import Path

from common.constants import APPLICATION_OCTET_STREAM

from domain.document import Document


logger = getLogger(__name__)


class DocumentRepository:
    """
    Repository for document filesystem operations.

    Handles low-level file operations for document management.
    """

    def __init__(self, base_path: str):
        """
        Initialize repository with base path.

        Args:
            base_path: Base directory path for documents
        """
        self.base_path = Path(base_path)

        if not self.base_path.exists():
            raise ValueError(f"Document base path does not exist: {base_path}")

    def list_documents(self) -> List[Document]:
        """
        List all documents in the base directory.

        Returns:
            List of Document objects with metadata
        """
        documents = []

        try:
            for file_path in self.base_path.iterdir():
                if file_path.is_file():
                    document = self._create_document_from_path(file_path)

                    if document:
                        documents.append(document)

            logger.debug("Found %d documents in %s", len(documents), self.base_path)

            return documents

        except Exception as e:
            logger.error("Error listing documents: %s", e, exc_info=True)
            raise

    def get_document(
        self,
        filename: str,
        include_content: bool = False,
    ) -> Optional[Document]:
        """
        Get a specific document by filename.

        Args:
            filename: Name of the file
            include_content: Whether to load file content

        Returns:
            Document object or None if not found
        """
        file_path = self.base_path / filename

        if not file_path.exists() or not file_path.is_file():
            logger.warning("Document not found: %s", filename)

            return None

        # Security check: ensure file is within base path
        if not self._is_safe_path(file_path):
            logger.warning("Attempted access to file outside base path: %s", filename)

            return None

        return self._create_document_from_path(file_path, include_content)

    def _create_document_from_path(
        self,
        file_path: Path,
        include_content: bool = False
    ) -> Optional[Document]:
        """
        Create Document object from file path.

        Args:
            file_path: Path to the file
            include_content: Whether to load file content

        Returns:
            Document object or None on error
        """
        try:
            stat = file_path.stat()
            content_type = mimetypes.guess_type(file_path)[0] or APPLICATION_OCTET_STREAM

            content = None
            if include_content:
                with open(file_path, "rb") as f:
                    content = f.read()

            return Document(
                name=file_path.name,
                size=stat.st_size,
                content_type=content_type,
                created_on=datetime.fromtimestamp(stat.st_ctime),
                modified_on=datetime.fromtimestamp(stat.st_mtime),
                content=content,
            )

        except Exception as e: # pylint: disable=broad-except
            logger.error("Error creating document from path %s: %s", file_path, e)

            return None

    def _is_safe_path(self, file_path: Path) -> bool:
        """
        Check if file path is within base directory (prevent path traversal).

        Args:
            file_path: Path to validate

        Returns:
            True if path is safe, False otherwise
        """
        try:
            resolved_path = file_path.resolve()
            resolved_base = self.base_path.resolve()

            return resolved_path.parent == resolved_base
        except Exception:  # pylint: disable=broad-except
            return False
