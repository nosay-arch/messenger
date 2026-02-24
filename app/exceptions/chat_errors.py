from .base import AppError

class ChatError(AppError):
    pass

class ChatNotFoundError(ChatError):
    pass

class AccessDeniedError(ChatError):
    pass

class MessageNotFoundError(ChatError):
    pass

class MessageEditTimeExpiredError(ChatError):
    pass
