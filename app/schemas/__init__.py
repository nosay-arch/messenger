"""Schemas для приложения."""
from .user_schema import (
    UserRegisterSchema,
    UserLoginSchema,
    UserResponseSchema,
    UserSearchSchema,
    UserSimpleSchema,
)
from .chat_schema import (
    ChatMessageSchema,
    ChatListItemSchema,
    ChatParticipantSchema,
    CreatePrivateChatSchema,
    CreateGroupSchema,
    GroupInfoSchema,
    AddUserToGroupSchema,
    RemoveUserFromGroupSchema,
    SendMessageSchema,
    EditMessageSchema,
    DeleteMessageSchema,
    MarkReadSchema
)

__all__ = [
    "UserRegisterSchema",
    "UserLoginSchema",
    "UserResponseSchema",
    "UserSearchSchema",
    "UserSimpleSchema",
    "ChatMessageSchema",
    "ChatListItemSchema",
    "ChatParticipantSchema",
    "CreatePrivateChatSchema",
    "CreateGroupSchema",
    "GroupInfoSchema",
    "AddUserToGroupSchema",
    "RemoveUserFromGroupSchema",
    "SendMessageSchema",
    "EditMessageSchema",
    "DeleteMessageSchema",
    "MarkReadSchema"
]
