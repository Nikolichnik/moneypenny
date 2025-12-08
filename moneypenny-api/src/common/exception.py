"""
Custom exceptions for the application.
"""

class BaseMoneypennyException(Exception):
    """
    Base exception for the project.
    """
    def __init__(
        self,
        message: str = "An error occurred.",
        error_code: int = 500,
        **detail_kwargs
    ):
        super().__init__(message)

        self.error_code = error_code

        if detail_kwargs and isinstance(detail_kwargs, dict):
            self.detail = detail_kwargs


class ClientException(BaseMoneypennyException):
    """
    Exception class for when there is an error with the client.
    """

    def __init__(self, message: str = "Client error."):
        super().__init__(message, 400)


class ServerException(BaseMoneypennyException):
    """
    Exception class for when there is an error with the server.
    """

    def __init__(self, message: str = "Server error."):
        super().__init__(message, 500)


class ObjectNotFoundException(BaseMoneypennyException):
    """
    Exception raised when an object is not found.
    """

    def __init__(self, message: str = "Object not found."):
        super().__init__(message, 404)
