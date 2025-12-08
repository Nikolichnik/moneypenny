"""
Document domain model.
"""

from datetime import datetime

from typing import Optional

from dataclasses import dataclass


@dataclass
class Document:
    """
    Represents a document.
    """

    name: str
    size: int
    content_type: str
    created_on: datetime
    modified_on: datetime
    content: Optional[bytes] = None
