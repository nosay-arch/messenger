from typing import Optional, List, Dict
from sqlalchemy.orm import joinedload
from sqlalchemy import func, or_
from .base import BaseRepository
from app.models.message import Message
from app.models.last_read import LastRead

class MessageRepository(BaseRepository):
    def create(self, chat_id: str, user_id: int, text: str) -> Message:
        message = Message(chat_id=chat_id, user_id=user_id, text=text)
        self.session.add(message)
        self.session.flush()
        return message

    def get_by_id(self, message_id: int) -> Optional[Message]:
        return self.session.get(Message, message_id)

    def get_last_message(self, chat_id: str) -> Optional[Message]:
        return self.session.query(Message).filter_by(chat_id=chat_id).order_by(Message.id.desc()).first()

    def get_chat_history(self, chat_id: str) -> List[Message]:
        return self.session.query(Message).filter_by(chat_id=chat_id).options(
            joinedload(Message.user)
        ).order_by(Message.timestamp).all()

    def count_unread_for_user(self, user_id: int, chat_ids: List[str]) -> Dict[str, int]:
        if not chat_ids:
            return {}
        last_reads = self.session.query(LastRead.chat_id, LastRead.last_message_id).filter(
            LastRead.user_id == user_id,
            LastRead.chat_id.in_(chat_ids)
        ).all()
        last_read_dict = {chat_id: last_id for chat_id, last_id in last_reads}
        conditions = []
        for chat_id in chat_ids:
            last_id = last_read_dict.get(chat_id, 0)
            conditions.append((Message.chat_id == chat_id) & (Message.id > last_id))
        if not conditions:
            return {}
        results = self.session.query(
            Message.chat_id,
            func.count(Message.id)
        ).filter(or_(*conditions)).group_by(Message.chat_id).all()
        return dict(results)

    def delete_message(self, message_id: int) -> bool:
        message = self.get_by_id(message_id)
        if not message:
            return False
        message.is_deleted = True
        self.session.flush()
        return True

    def edit_message(self, message_id: int, new_text: str) -> Optional[Message]:
        message = self.get_by_id(message_id)
        if not message or message.is_deleted:
            return None
        message.text = new_text
        message.edited = True
        self.session.flush()
        return message
