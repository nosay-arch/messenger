"""Контейнер зависимостей приложения."""
from typing import Any, Dict
from sqlalchemy.orm import Session
from redis import Redis

from app.modules.users.repositories import UserRepository
from app.modules.chats.repositories import ChatRepository
from app.modules.messages.repositories import MessageRepository, LastReadRepository
from app.modules.auth.services import AuthService
from app.modules.users.services import UserService, ProfileService
from app.modules.messages.services import MessageService
from app.modules.groups.services import GroupService
from app.modules.presence.services import PresenceService
from app.modules.chats.services import ChatService


class Container:
    """DI контейнер с управлением всеми зависимостями."""

    def __init__(self, db_session: Session, redis_client: Redis, config: Dict[str, Any]) -> None:
        self.db_session = db_session
        self.redis_client = redis_client
        self.config = config

        self.user_repo = UserRepository(db_session)
        self.chat_repo = ChatRepository(db_session)
        self.message_repo = MessageRepository(db_session)
        self.last_read_repo = LastReadRepository(db_session)

        self.auth_service = AuthService(
            user_repo=self.user_repo,
            redis_client=self.redis_client,
            config=self.config
        )
        self.user_service = UserService(
            user_repo=self.user_repo
        )
        self.profile_service = ProfileService(
            user_repo=self.user_repo
        )
        self.message_service = MessageService(
            user_repo=self.user_repo,
            message_repo=self.message_repo,
            last_read_repo=self.last_read_repo,
            chat_repo=self.chat_repo,
            redis_client=self.redis_client,
            config=self.config
        )
        self.group_service = GroupService(
            user_repo=self.user_repo,
            chat_repo=self.chat_repo,
            message_repo=self.message_repo,
            last_read_repo=self.last_read_repo,
            redis_client=self.redis_client,
            config=self.config
        )
        self.presence_service = PresenceService(
            redis_client=self.redis_client,
            chat_repo=self.chat_repo,
            user_repo=self.user_repo
        )
        self.chat_service = ChatService(
            chat_repo=self.chat_repo,
            message_repo=self.message_repo,
            user_repo=self.user_repo,
            redis_client=self.redis_client
        )
