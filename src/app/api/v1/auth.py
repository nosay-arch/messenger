"""API v1 endpoints для аутентификации."""
from typing import Any, Tuple
from flask import Blueprint, jsonify
from flask_login import logout_user, login_required, current_user

from app.schemas import (
    UserResponseSchema,
)
from app.utils.decorators import handle_errors
from app.utils.logging import log_user_logout

bp = Blueprint("api_v1_auth", __name__, url_prefix="/api/v1/auth")

@bp.route("/logout", methods=["POST"])
@login_required
@handle_errors
def logout() -> Tuple[Any, int]:
    """Выход пользователя."""
    log_user_logout(current_user.id, current_user.username)
    logout_user()
    return jsonify({"success": True}), 200


@bp.route("/me", methods=["GET"])
@login_required
def me() -> Tuple[Any, int]:
    """Получить информацию текущего пользователя."""
    schema = UserResponseSchema()
    return jsonify(schema.dump(current_user)), 200
