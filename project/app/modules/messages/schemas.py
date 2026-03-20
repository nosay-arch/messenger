from marshmallow import fields, validate
from app.core.base.schema import BaseSchema, TimestampField
from app.core.utils.constants import ValidationRules


class ChatMessageSchema(BaseSchema):
    """Schema для сообщения в чате."""
    id = fields.Int(dump_only=True)
    chat_id = fields.Str()
    user_id = fields.Int()
    nickname = fields.Str()
    text = fields.Str()
    timestamp = TimestampField()
    edited = fields.Bool()
    edited_at = TimestampField(allow_none=True)
    is_deleted = fields.Bool()


class SendMessageSchema(BaseSchema):
    """Schema для отправки сообщения."""
    chat_id = fields.Str(required=True)
    text = fields.Str(
        required=True,
        validate=validate.Length(min=1, max=ValidationRules.MESSAGE_MAX_LEN)
    )


class EditMessageSchema(BaseSchema):
    """Schema для редактирования сообщения."""
    message_id = fields.Int(required=True)
    chat_id = fields.Str(required=True)
    text = fields.Str(
        required=True,
        validate=validate.Length(min=1, max=ValidationRules.MESSAGE_MAX_LEN)
    )


class DeleteMessageSchema(BaseSchema):
    """Schema для удаления сообщения."""
    message_id = fields.Int(required=True)
    chat_id = fields.Str(required=True)


class MarkReadSchema(BaseSchema):
    """Schema для отметки чата как прочитанного."""
    chat_id = fields.Str(required=True)
