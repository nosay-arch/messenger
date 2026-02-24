from .base import AppError

class AuthError(AppError):
    pass

class ValidationError(AuthError):
    pass

class UserNotFoundError(AuthError):
    def __init__(self, message, not_confirmed=False, email=None):
        super().__init__(message)
        self.not_confirmed = not_confirmed
        self.email = email

class InvalidCredentialsError(AuthError):
    pass

class UsernameAlreadyExistsError(AuthError):
    pass

class EmailAlreadyExistsError(AuthError):
    pass

class RateLimitExceededError(AuthError):
    pass
