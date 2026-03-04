from flask import Blueprint, render_template, request, jsonify, current_app
from flask_login import login_user, logout_user, login_required, current_user
from app.schemas import UserRegisterSchema, UserLoginSchema
from app.utils.decorators import handle_errors

bp = Blueprint('auth', __name__, url_prefix='/auth')

@bp.route('/login', methods=['GET'])
def login_page():
    return render_template('auth.html')

@bp.route('/login', methods=['POST'])
@handle_errors
def login():
    data = request.get_json()
    schema = UserLoginSchema()
    validated = schema.load(data)

    user_data = current_app.container.auth_service.login(
        username=validated['username'],
        password=validated['password'],
        ip=request.remote_addr
    )
    user = current_app.container.user_repo.get_by_id(user_data['id'])
    login_user(user)
    return jsonify(user_data), 200

@bp.route('/register', methods=['POST'])
@handle_errors
def register():
    data = request.get_json()
    schema = UserRegisterSchema()
    validated = schema.load(data)

    user_data = current_app.container.auth_service.register(
        username=validated['username'],
        password=validated['password'],
        ip=request.remote_addr
    )
    return jsonify(user_data), 201

@bp.route('/logout', methods=['POST'])
@login_required
@handle_errors
def logout():
    logout_user()
    return jsonify({"message": "Logged out"}), 200

@bp.route('/me', methods=['GET'])
@login_required
@handle_errors
def me():
    return jsonify({
        "id": current_user.id,
        "username": current_user.username
    }), 200
