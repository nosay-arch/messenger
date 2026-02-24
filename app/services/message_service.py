from typing import Optional, Dict, List
from datetime import datetime, timedelta
from app.repositories import UserRepository, MessageRepository, LastReadRepository, ChatRepository
from app.exceptions.chat_errors import (
    ChatNotFoundError,
    AccessDeniedError,
    MessageNotFoundError,
    MessageEditTimeExpiredError
)
from app.utils.validators import validate_message_text

class MessageService:
    def __init__(self, user_repo, message_repo, last_read_repo, chat_repo, redis_client, config):
        self.user_repo = user_repo
        self.message_repo = message_repo
        self.last_read_repo = last_read_repo
        self.chat_repo = chat_repo
        self.redis = redis_client
        self.config = config

    def _check_user_in_chat(self, user_id: int, chat_id: str) -> bool:
        return self.chat_repo.user_in_chat(user_id, chat_id)

    def send_message(self, user_id: int, chat_id: str, text: str) -> Dict:
        if not self._check_user_in_chat(user_id, chat_id):
            raise AccessDeniedError("You are not in this chat")

        validate_message_text(text)  # может бросить ValidationError

        message = self.message_repo.create(chat_id, user_id, text)
        # Коммит
        self.message_repo.session.commit()

        user = self.user_repo.get_by_id(user_id)
        return {
            'id': message.id,
            'nickname': user.username,
            'text': message.text,
            'timestamp': message.timestamp.isoformat(),
            'chat_id': chat_id,
            'user_id': user_id,
            'is_deleted': False,
            'edited': False
        }

    def get_chat_history(self, chat_id: str, user_id: int) -> List[Dict]:
        if not self._check_user_in_chat(user_id, chat_id):
            raise AccessDeniedError("You are not in this chat")

        messages = self.message_repo.get_chat_history(chat_id)
        return [{
            'id': m.id,
            'nickname': m.user.username,
            'text': m.text,
            'timestamp': m.timestamp.isoformat(),
            'chat_id': chat_id,
            'is_deleted': m.is_deleted,
            'edited': m.edited,
            'user_id': m.user_id
        } for m in messages]

    def mark_read(self, user_id: int, chat_id: str):
        if not self._check_user_in_chat(user_id, chat_id):
            raise AccessDeniedError()
        last_msg = self.message_repo.get_last_message(chat_id)
        if last_msg:
            self.last_read_repo.update_or_create(user_id, chat_id, last_msg.id)
            self.last_read_repo.session.commit()

    def delete_message(self, user_id: int, message_id: int, chat_id: str) -> Dict:
        # Проверка доступа
        if not self._check_user_in_chat(user_id, chat_id):
            raise AccessDeniedError()

        message = self.message_repo.get_by_id(message_id)
        if not message or message.chat_id != chat_id:
            raise MessageNotFoundError()

        if message.user_id != user_id:
            raise AccessDeniedError("Cannot delete another user's message")

        # Проверка времени (5 минут)
        if datetime.utcnow() - message.timestamp > timedelta(minutes=5):
            raise MessageEditTimeExpiredError("Cannot delete messages older than 5 minutes")

        success = self.message_repo.delete_message(message_id)
        if not success:
            raise MessageNotFoundError()
        self.message_repo.session.commit()

        return {"chat_id": chat_id, "message_id": message_id}

    def edit_message(self, user_id: int, message_id: int, chat_id: str, new_text: str) -> Dict:
        if not self._check_user_in_chat(user_id, chat_id):
            raise AccessDeniedError()

        validate_message_text(new_text)

        message = self.message_repo.get_by_id(message_id)
        if not message or message.chat_id != chat_id:
            raise MessageNotFoundError()

        if message.user_id != user_id:
            raise AccessDeniedError("Cannot edit another user's message")

        if datetime.utcnow() - message.timestamp > timedelta(minutes=5):
            raise MessageEditTimeExpiredError("Cannot edit messages older than 5 minutes")

        edited = self.message_repo.edit_message(message_id, new_text)
        if not edited:
            raise MessageNotFoundError()
        self.message_repo.session.commit()

        user = self.user_repo.get_by_id(user_id)
        return {
            'id': edited.id,
            'nickname': user.username,
            'text': edited.text,
            'timestamp': edited.timestamp.isoformat(),
            'chat_id': chat_id,
            'user_id': user_id,
            'is_deleted': False,
            'edited': True
        }
