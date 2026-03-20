from typing import List, Dict, Optional

from app.core.exceptions.auth_errors import UserNotFoundError
from .repositories import UserRepository


class UserService:
    def __init__(self, user_repo: UserRepository):
        self.user_repo = user_repo

    def search_users(self, current_user_id: int, query: str) -> List[Dict]:
        users = self.user_repo.search_users(current_user_id, query)
        return [{'id': u.id, 'username': u.username} for u in users]

    def get_user_by_id(self, user_id: int) -> Optional[Dict]:
        user = self.user_repo.get_by_id(user_id)
        if not user:
            return None
        return {'id': user.id, 'username': user.username, 'confirmed': True}  # confirmed можно убрать, если нет


class ProfileService:
    def __init__(self, user_repo: UserRepository):
        self.user_repo = user_repo

    def get_profile(self, user_id: int) -> Dict:
        user = self.user_repo.get_by_id(user_id)
        if not user:
            raise UserNotFoundError("User not found")
        return {
            "id": user.id,
            "username": user.username,
            "bio": user.bio,
            "avatar_url": user.avatar_url,
            "profile_completed": user.profile_completed
        }

    def update_profile(self, user_id: int, updates: Dict) -> Dict:
        user = self.user_repo.get_by_id(user_id)
        if not user:
            raise UserNotFoundError("User not found")
        if 'bio' in updates:
            user.bio = updates['bio'][:500] if updates['bio'] else None
        if user.bio or user.avatar_url:
            user.profile_completed = True
        self.user_repo.session.commit()
        return self.get_profile(user_id)

    def get_profile_by_id(self, current_user_id: int, target_user_id: int) -> Dict:
        if current_user_id == target_user_id:
            return self.get_profile(current_user_id)
        user = self.user_repo.get_by_id(target_user_id)
        if not user:
            raise UserNotFoundError("User not found")
        return {
            "id": user.id,
            "username": user.username,
            "bio": user.bio or "",
            "avatar_url": user.avatar_url or ""
        }
