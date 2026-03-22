from typing import List
from datetime import datetime
from app.modules.chats.repositories import ChatRepository
from app.modules.users.repositories import UserRepository
from app.core.utils.helpers import utcnow


class PresenceService:
    def __init__(self, redis_client, chat_repo: ChatRepository, user_repo: UserRepository):
        self.redis = redis_client
        self.chat_repo = chat_repo
        self.user_repo = user_repo

    def user_connected(self, user_id: int, username: str, sid: str):
        user = self.user_repo.get_by_id(user_id)
        if user:
            user.last_seen = utcnow()
            self.user_repo.session.commit()
        self.redis.setex(f"online:{username}", 3600, sid)

    def user_disconnected(self, user_id: int, username: str):
        self.redis.delete(f"online:{username}")
        user = self.user_repo.get_by_id(user_id)
        if user:
            user.last_seen = utcnow()
            self.user_repo.session.commit()

    def is_online(self, username: str) -> bool:
        return self.redis.exists(f"online:{username}")

    def get_online_users_in_chats(self, user_id: int) -> List[str]:
        chat_ids = self.chat_repo.get_user_chat_ids(user_id)
        if not chat_ids:
            return []
        users = self.chat_repo.get_common_users(user_id, chat_ids)
        online = []
        for u in users:
            if self.is_online(u.username):
                online.append(u.username)
        return online

    def get_last_seen(self, username: str) -> datetime:
        user = self.user_repo.get_by_username(username)
        if user and user.last_seen:
            return user.last_seen
        return utcnow()
