from .base import AppError

class AuthError(AppError):
    pass

class ValidationError(AuthError):
    pass

class UserNotFoundError(AuthError):
    def __init__(self, message):
        super().__init__(message)

class InvalidCredentialsError(AuthError):
    pass

class UsernameAlreadyExistsError(AuthError):
    pass

class EmailAlreadyExistsError(AuthError):
    pass

class RateLimitExceededError(AuthError):
    pass

class PhoneAlreadyExistsError(AuthError):
    pass

class InvalidCodeError(AuthError):
    pass

class CodeExpiredError(AuthError):
    pass
