from typing import Optional
from app.core.base.repository import BaseRepository
from app.models.last_read import LastRead


class LastReadRepository(BaseRepository):
    def get_for_user(self, user_id: int, chat_id: str) -> Optional[LastRead]:
        return self.session.query(LastRead).filter_by(user_id=user_id, chat_id=chat_id).first()

    def update_or_create(self, user_id: int, chat_id: str, message_id: int):
        last_read = self.get_for_user(user_id, chat_id)
        if last_read:
            last_read.last_message_id = message_id
        else:
            last_read = LastRead(user_id=user_id, chat_id=chat_id, last_message_id=message_id)
            self.session.add(last_read)
        self.session.flush()
        return last_read
