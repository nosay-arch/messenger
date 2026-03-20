from marshmallow import fields, validate, validates, ValidationError as MarshmallowValidationError
from app.core.base.schema import BaseSchema
from app.core.utils.constants import ValidationRules


class CreateGroupSchema(BaseSchema):
    """Schema для создания группы."""
    name = fields.Str(
        required=True,
        validate=validate.Length(min=1, max=ValidationRules.GROUP_NAME_MAX_LEN)
    )
    description = fields.Str(
        required=False,
        allow_none=True,
        validate=validate.Length(max=ValidationRules.DESCRIPTION_MAX_LEN)
    )
    member_ids = fields.List(fields.Int(), required=True)

    @validates("member_ids")
    def validate_member_ids(self, value):
        """Проверка списка участников."""
        if not value or len(value) < 2:
            raise MarshmallowValidationError("Group must have at least 2 members")


class GroupInfoSchema(BaseSchema):
    """Schema информации о группе."""
    id = fields.Str(dump_only=True)
    name = fields.Str()
    type = fields.Str()
    description = fields.Str(allow_none=True)
    created_by = fields.Int()
    member_count = fields.Int()
    members = fields.List(fields.Dict())  # Можно уточнить позже


class AddUserToGroupSchema(BaseSchema):
    """Schema для добавления пользователя в группу."""
    chat_id = fields.Str(required=True)
    user_id = fields.Int(required=True)


class RemoveUserFromGroupSchema(BaseSchema):
    """Schema для удаления пользователя из группы."""
    chat_id = fields.Str(required=True)
    user_id = fields.Int(required=True)


class CreatePrivateChatSchema(BaseSchema):
    """Schema для создания приватного чата."""
    username = fields.Str(required=True, validate=validate.Length(min=1))
