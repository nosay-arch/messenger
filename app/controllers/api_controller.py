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
    search = request.args.get('q', '').strip()
    if len(search) < 2:
        return jsonify([]), 200
    
    users_list = current_app.container.user_service.search_users(current_user.id, search)
    return jsonify(users_list), 200

@bp.route('/users/<int:user_id>')
@login_required
def get_user(user_id):
    if user_id == current_user.id:
        user = current_app.container.user_service.get_user_by_id(user_id)
        if not user or not current_user.confirmed:
            return jsonify({'error': 'User not found'}), 404
        return jsonify(user), 200
    
    user = current_app.container.user_service.get_user_by_id(user_id)
    if not user or not user.get('confirmed'):
        return jsonify({'error': 'User not found'}), 404
    return jsonify({'id': user['id'], 'username': user['username']}), 200

@bp.route('/profile', methods=['GET'])
@login_required
def get_profile():
    try:
        profile = current_app.container.auth_service.get_profile(current_user.id)
        return jsonify(profile), 200
    except Exception as e:
        current_app.logger.exception("Get profile error")
        return jsonify({'error': 'Internal server error'}), 500

@bp.route('/profile', methods=['PUT'])
@login_required
def update_profile():
    data = request.get_json()
    try:
        profile = current_app.container.auth_service.update_profile(current_user.id, data)
        return jsonify(profile), 200
    except Exception as e:
        current_app.logger.exception("Update profile error")
        return jsonify({'error': 'Internal server error'}), 500
