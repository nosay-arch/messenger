from typing import Optional, List
from sqlalchemy import func
from .base import BaseRepository
from app.models.user import User

class UserRepository(BaseRepository):
    def get_by_username(self, username: str) -> Optional[User]:
        return self.session.query(User).filter_by(username=username).first()

    def get_by_username_ci(self, username: str) -> Optional[User]:
        return self.session.query(User).filter(func.lower(User.username) == func.lower(username)).first()

    def get_by_confirmation_token(self, token: str) -> Optional[User]:
        return self.session.query(User).filter_by(confirmation_token=token).first()

    def get_by_email(self, email: str) -> Optional[User]:
        return self.session.query(User).filter_by(email=email).first()

    def get_by_email_ci(self, email: str) -> Optional[User]:
        return self.session.query(User).filter(func.lower(User.email) == func.lower(email)).first()

    def get_by_id(self, user_id: int) -> Optional[User]:
        return self.session.get(User, user_id)

    def get_by_ids(self, user_ids: List[int]) -> List[User]:
        return self.session.query(User).filter(User.id.in_(user_ids)).all()

    def search_users(self, current_user_id: int, query: str) -> List[User]:
        q = self.session.query(User).filter(User.id != current_user_id)
        if query:
            q = q.filter(User.username.ilike(f'%{query}%'))
        return q.limit(20).all()

    def create(self, username: str, email: str, password_hash: str) -> User:
        user = User(username=username, email=email, password_hash=password_hash)
        self.session.add(user)
        return user
