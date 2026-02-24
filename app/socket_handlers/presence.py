from flask_socketio import emit, disconnect
from flask_login import current_user
from functools import wraps
from flask import request
import logging

logger = logging.getLogger(__name__)

def authenticated_only(f):
    @wraps(f)
    def wrapped(*args, **kwargs):
        if not current_user.is_authenticated:
            disconnect()
            return
        return f(*args, **kwargs)
    return wrapped

def register_presence_handlers(socketio, container):
    presence_service = container.presence_service
    chat_service = container.chat_service  # или group_service для списка чатов

    @socketio.on('connect')
    @authenticated_only
    def handle_connect():
        try:
            presence_service.user_connected(current_user.id, current_user.username, request.sid)
            logger.info(f"User connected: {current_user.username}")

            # Отправляем список чатов и непрочитанные
            chats = container.chat_service.get_user_chats(current_user.id)  # нужен метод
            emit('chat_list', chats)
            counts = container.message_service.get_unread_counts(current_user.id)  # нужен метод
            emit('unread_counts', counts)

            # Уведомляем других участников общих чатов о нашем онлайн-статусе
            online_users = presence_service.get_online_users_in_chats(current_user.id)
            for username in online_users:
                sid = container.redis_client.get(f"online:{username}")
                if sid:
                    socketio.emit('user_online', {'username': current_user.username}, room=sid)
        except Exception as e:
            logger.exception("Error in connect handler")
            emit('error', {'message': 'Connection error'})
            disconnect()

    @socketio.on('disconnect')
    @authenticated_only
    def handle_disconnect():
        try:
            username = current_user.username
            presence_service.user_disconnected(username)
            logger.info(f"User disconnected: {username}")

            # Уведомляем других
            online_users = presence_service.get_online_users_in_chats(current_user.id)
            for other_username in online_users:
                sid = container.redis_client.get(f"online:{other_username}")
                if sid:
                    socketio.emit('user_offline', {'username': username}, room=sid)

            # Останавливаем печатание
            user_chat_ids = container.chat_repo.get_user_chat_ids(current_user.id)
            for chat_id in user_chat_ids:
                socketio.emit('typing', {
                    'username': username,
                    'typing': False,
                    'chat_id': chat_id
                }, room=chat_id)
        except Exception as e:
            logger.exception("Error in disconnect handler")
