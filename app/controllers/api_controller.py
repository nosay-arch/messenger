from flask import Blueprint, request, jsonify, current_app
from flask_login import login_required, current_user

bp = Blueprint('api', __name__, url_prefix='/api')

@bp.route('/me')
@login_required
def me():
    if not current_user.confirmed:
        return jsonify({'error': 'Email not confirmed'}), 403
    return jsonify({'id': current_user.id, 'username': current_user.username, 'confirmed': current_user.confirmed}), 200

@bp.route('/users')
@login_required
def users():
    search = request.args.get('q', '')
    users = current_app.container.user_service.search_users(current_user.id, search)
    return jsonify(users), 200
