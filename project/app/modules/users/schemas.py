from marshmallow import fields, validate, validates, ValidationError as MarshmallowValidationError

from app.core.base.schema import BaseSchema
from app.core.utils.constants import ValidationRules


class UserRegisterSchema(BaseSchema):
    username = fields.Str(
        required=True,
        validate=[
            validate.Length(min=ValidationRules.USERNAME_MIN_LEN, max=ValidationRules.USERNAME_MAX_LEN),
            validate.Regexp(r"^[a-zA-Z0-9_]+$", error="Username can only contain letters, digits and underscore")
        ]
    )
    password = fields.Str(required=True, validate=validate.Length(min=8))

    @validates("username")
    def validate_username_reserved(self, value):
        if value.lower() in ValidationRules.RESERVED_USERNAMES:
            raise MarshmallowValidationError("This username is reserved")


class UserLoginSchema(BaseSchema):
    username = fields.Str(required=True)
    password = fields.Str(required=True)


class UserResponseSchema(BaseSchema):
    id = fields.Int(dump_only=True)
    username = fields.Str()
    bio = fields.Str(allow_none=True)
    avatar_url = fields.Str(allow_none=True)
    profile_completed = fields.Bool()


class UserSearchSchema(BaseSchema):
    id = fields.Int()
    username = fields.Str()


class UserSimpleSchema(BaseSchema):
    id = fields.Int()
    username = fields.Str()
