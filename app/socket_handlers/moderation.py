from flask_socketio import emit
from flask_login import current_user
from app.exceptions.chat_errors import AccessDeniedError, MessageNotFoundError, MessageEditTimeExpiredError
import logging

logger = logging.getLogger(__name__)

def register_moderation_handlers(socketio, container):
    message_service = container.message_service
    redis_client = container.redis_client
    chat_repo = container.chat_repo

    @socketio.on('delete_message')
    def handle_delete_message(data):
        chat_id = data.get('chat_id')
        message_id = data.get('message_id')
        chat_service = container.chat_service
        try:
            result = message_service.delete_message(current_user.id, message_id, chat_id)
            emit('message_deleted', result, room=chat_id)
            # Обновляем списки чатов для участников
            participants = chat_repo.get_participants(chat_id)
            for user in participants:
                sid = redis_client.get(f"online:{user.username}")
                if sid:
                    chats = chat_service.get_user_chats(user.id)
                    socketio.emit('chat_list', chats, room=sid)
                    counts = chat_service.get_unread_counts(user.id)
                    socketio.emit('unread_counts', counts, room=sid)
        except AccessDeniedError as e:
            emit('error', {'message': str(e)})
        except MessageNotFoundError as e:
            emit('error', {'message': str(e)})
        except MessageEditTimeExpiredError as e:
            emit('error', {'message': str(e)})
        except Exception as e:
            logger.exception("Error in delete_message")
            emit('error', {'message': 'Internal error'})

    @socketio.on('edit_message')
    def handle_edit_message(data):
        chat_id = data.get('chat_id')
        message_id = data.get('message_id')
        new_text = data.get('text', '').strip()
        chat_service = container.chat_service
        try:
            updated = message_service.edit_message(current_user.id, message_id, chat_id, new_text)
            emit('message_edited', updated, room=chat_id)
            # Обновляем списки чатов для участников
            participants = chat_repo.get_participants(chat_id)
            for user in participants:
                sid = redis_client.get(f"online:{user.username}")
                if sid:
                    chats = chat_service.get_user_chats(user.id)
                    socketio.emit('chat_list', chats, room=sid)
                    counts = chat_service.get_unread_counts(user.id)
                    socketio.emit('unread_counts', counts, room=sid)
        except Exception as e:
            logger.exception("Error in edit_message")
            emit('error', {'message': str(e)})
