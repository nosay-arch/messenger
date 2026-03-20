from marshmallow import fields
from app.core.base.schema import BaseSchema


class ChatListItemSchema(BaseSchema):
    """Schema для элемента в списке чатов."""
    id = fields.Str()
    name = fields.Str()
    type = fields.Str()
    lastMessage = fields.Str(allow_none=True)
    lastTime = fields.Str(allow_none=True)
