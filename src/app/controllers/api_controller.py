import os
import uuid
from flask import Blueprint, request, jsonify, current_app
from flask_login import login_required, current_user

from app.utils.decorators import handle_errors
from app.utils.constants import ValidationRules
from app.exceptions.auth_errors import UserNotFoundError

bp = Blueprint("api", __name__, url_prefix="/api")

def allowed_file(filename: str) -> bool:
    """Проверяет, разрешён ли тип файла по расширению."""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ValidationRules.ALLOWED_EXTENSIONS


def save_avatar_file(file_storage) -> str:
    """ Сохраняет файл аватара в папку static/uploads """
    ext = file_storage.filename.rsplit('.', 1)[1].lower()
    filename = f"{uuid.uuid4().hex}.{ext}"
    upload_folder = os.path.join(current_app.static_folder, 'uploads')
    os.makedirs(upload_folder, exist_ok=True)
    file_path = os.path.join(upload_folder, filename)
    file_storage.save(file_path)
    return f"/static/uploads/{filename}"


def get_user_or_404(user_id: int, require_confirmed: bool = True):
    """
    Возвращает пользователя по ID или None, если не найден или не подтверждён.
    Используется внутри маршрутов для единообразной проверки.
    """
    user = current_app.container.user_service.get_user_by_id(user_id)
    if not user or (require_confirmed and not user.get('confirmed')):
        return None
    return user


@bp.route("/me")
@login_required
def me():
    """Возвращает информацию о текущем пользователе."""
    return jsonify({
        "id": current_user.id,
        "username": current_user.username,
    }), 200


@bp.route("/users")
@login_required
def users():
    """Поиск пользователей по подстроке (минимум 2 символа)."""
    search = request.args.get("q", "").strip()
    if len(search) < 2:
        return jsonify([]), 200

    users_list = current_app.container.user_service.search_users(current_user.id, search)
    return jsonify(users_list), 200


@bp.route("/users/<int:user_id>")
@login_required
def get_user(user_id):
    """ Возвращает данные пользователя. """
    if user_id == current_user.id:
        user = get_user_or_404(user_id, require_confirmed=False)
        if not user or not current_user.confirmed:
            return jsonify({"error": "User not found"}), 404
        return jsonify(user), 200

    user = get_user_or_404(user_id, require_confirmed=True)
    if not user:
        return jsonify({"error": "User not found"}), 404
    return jsonify({"id": user["id"], "username": user["username"]}), 200


@bp.route("/users/by-username/<username>")
@login_required
def get_user_by_username(username):
    """Возвращает минимальную информацию о пользователе по имени."""
    user = current_app.container.user_repo.get_by_username(username)
    if not user:
        return jsonify({"error": "User not found"}), 404
    return jsonify({"id": user.id, "username": user.username}), 200


@bp.route("/users/<int:user_id>/profile")
@login_required
def get_user_profile(user_id):
    """Возвращает профиль другого пользователя."""
    try:
        profile = current_app.container.auth_service.get_profile_by_id(
            current_user.id, user_id
        )
        return jsonify(profile), 200
    except UserNotFoundError as e:
        return jsonify({"error": str(e)}), 404
    except Exception:
        current_app.logger.exception("Get user profile error")
        return jsonify({"error": "Internal server error"}), 500


@bp.route("/profile", methods=["GET"])
@login_required
def get_profile():
    """Возвращает профиль текущего пользователя."""
    try:
        profile = current_app.container.auth_service.get_profile(current_user.id)
        return jsonify(profile), 200
    except Exception:
        current_app.logger.exception("Get profile error")
        return jsonify({"error": "Internal server error"}), 500


@bp.route("/profile", methods=["PUT"])
@login_required
@handle_errors
def update_profile():
    """Обновляет bio текущего пользователя."""
    data = request.get_json() or {}
    if 'bio' in data:
        profile = current_app.container.auth_service.update_profile(
            current_user.id,
            {'bio': data['bio']}
        )
    else:
        profile = current_app.container.auth_service.get_profile(current_user.id)
    return jsonify(profile), 200


@bp.route("/profile/avatar", methods=["POST"])
@login_required
@handle_errors
def upload_avatar():
    """Загружает и сохраняет аватар текущего пользователя."""
    if 'avatar' not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files['avatar']
    if file.filename == '':
        return jsonify({"error": "Empty filename"}), 400

    if not allowed_file(file.filename):
        return jsonify({"error": "File type not allowed"}), 400

    avatar_url = save_avatar_file(file)

    user = current_app.container.user_repo.get_by_id(current_user.id)
    user.avatar_url = avatar_url
    if user.bio:
        user.profile_completed = True
    current_app.container.user_repo.session.commit()

    return jsonify({"avatar_url": avatar_url}), 200
