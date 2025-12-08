"""
The process graph state schema module.
"""

from typing import TypedDict


class ProcessGraphState(TypedDict):
    """
    The Process Graph State Schema.

    Attributes:
        prompt: The prompt.
        response: The response.
    """

    prompt: str
    response: str
