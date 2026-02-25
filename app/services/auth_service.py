from typing import Optional, Dict, Any
from datetime import datetime
import secrets
from redis import Redis
from werkzeug.security import generate_password_hash
from app.exceptions.auth_errors import (
    UserNotFoundError,
    UsernameAlreadyExistsError,
    RateLimitExceededError,
    ValidationError,
    PhoneAlreadyExistsError,
    InvalidCodeError,
    CodeExpiredError
)
from app.repositories.user_repository import UserRepository
from app.utils.constants import ValidationRules
from app.utils.validators import validate_username
from app.logging import log_user_registered, log_user_login

class AuthService:
    """Сервис для аутентификации по номеру телефона."""
    
    def __init__(
        self,
        user_repo: UserRepository,
        redis_client: Redis,
        config: Dict[str, Any],
        sms_provider: Any
    ) -> None:
        self.user_repo = user_repo
        self.redis = redis_client
        self.config = config
        self.sms_provider = sms_provider

    def _check_rate_limit(self, key: str, max_attempts: int, period: int) -> bool:
        """Проверка rate limit."""
        current = self.redis.get(key)
        if current and int(current) >= max_attempts:
            raise RateLimitExceededError("Слишком много попыток")
        pipe = self.redis.pipeline()
        pipe.incr(key)
        pipe.expire(key, period)
        pipe.execute()
        return False

    def send_code(self, phone: str, ip: Optional[str] = None) -> Dict[str, Any]:
        from app.utils.validators import validate_phone, normalize_phone
        
        phone_normalized = normalize_phone(phone)
        validate_phone(phone)
        
        ip_key = f"send_code_ip:{ip}" if ip else None
        phone_key = f"send_code_phone:{phone_normalized}"
        
        if ip_key:
            self._check_rate_limit(ip_key, 5, 3600)
        self._check_rate_limit(phone_key, 3, 3600)
        
        code = str(secrets.randbelow(1000000)).zfill(6)
        
        self.redis.setex(
            f"auth_code:{phone_normalized}",
            self.config.get('PHONE_CODE_EXPIRATION', 300),
            code
        )
        
        self.redis.setex(
            f"phone_session:{phone_normalized}",
            self.config.get('PHONE_SESSION_EXPIRATION', 1800),
            phone_normalized
        )
        
        self.sms_provider.send_code(phone_normalized, code)
        
        return {
            "message": "Код отправлен",
            "phone": phone_normalized,
            "masked_phone": self._mask_phone(phone_normalized)
        }
    
    def verify_code(self, phone: str, code: str, ip: Optional[str] = None) -> Dict[str, Any]:
        from app.utils.validators import normalize_phone
        
        phone_normalized = normalize_phone(phone)
        
        ip_key = f"verify_code_ip:{ip}" if ip else None
        phone_key = f"verify_code_phone:{phone_normalized}"
        
        if ip_key:
            self._check_rate_limit(ip_key, 10, 900)
        self._check_rate_limit(phone_key, 5, 900)
        
        stored_code = self.redis.get(f"auth_code:{phone_normalized}")
        if not stored_code:
            raise CodeExpiredError("Код истек, запросите новый")
        
        if stored_code.decode() != code:
            raise InvalidCodeError("Неверный код")
        
        self.redis.delete(f"auth_code:{phone_normalized}")
        
        user = self.user_repo.session.query(self.user_repo.model).filter(
            self.user_repo.model.phone_number == phone_normalized
        ).first()
        
        verified_key = f"phone_verified:{phone_normalized}"
        if user:
            self.redis.setex(verified_key, self.config.get('PHONE_SESSION_EXPIRATION', 1800), str(user.id))
            log_user_login(user.id, user.username, ip or "unknown")
            return {
                "exists": True,
                "user_id": user.id,
                "username": user.username,
                "phone": phone_normalized
            }
        else:
            self.redis.setex(verified_key, self.config.get('PHONE_SESSION_EXPIRATION', 1800), "new_user")
            return {
                "exists": False,
                "phone": phone_normalized,
                "message": "Требуется создание профиля"
            }
    
    def register_by_phone(self, phone: str, username: str) -> Dict[str, Any]:
        from app.utils.validators import normalize_phone
        
        phone_normalized = normalize_phone(phone)
        verified_key = f"phone_verified:{phone_normalized}"
        
        verified_status = self.redis.get(verified_key)
        if not verified_status or verified_status.decode() != "new_user":
            raise ValidationError("Телефон не верифицирован")
        
        if username.lower() in ValidationRules.RESERVED_USERNAMES:
            raise ValidationError("Это имя пользователя зарезервировано")
        
        validate_username(username)
        
        if self.user_repo.get_by_username_ci(username):
            raise UsernameAlreadyExistsError("Это имя пользователя уже занято")
        
        temp_user = self.user_repo.session.query(self.user_repo.model).filter(
            self.user_repo.model.phone_number == phone_normalized
        ).first()
        
        if temp_user:
            raise PhoneAlreadyExistsError("Этот номер телефона уже зарегистрирован")
        
        user = self.user_repo.model()
        user.phone_number = phone_normalized
        user.phone_verified = True
        user.phone_verified_at = datetime.utcnow()
        user.username = username
        user.email = f"phone_{phone_normalized}@local.app"
        user.password_hash = generate_password_hash(secrets.token_urlsafe(32))
        user.confirmed = True
        user.confirmed_at = datetime.utcnow()
        user.profile_completed = False
        
        self.user_repo.session.add(user)
        self.user_repo.session.commit()
        
        self.redis.delete(verified_key)
        self.redis.setex(f"phone_verified:{phone_normalized}", self.config.get('PHONE_SESSION_EXPIRATION', 1800), str(user.id))
        
        log_user_registered(user.id, user.username, phone_normalized)
        
        return {
            "id": user.id,
            "username": user.username,
            "phone": phone_normalized
        }
    
    def update_profile(self, user_id: int, updates: Dict[str, Any]) -> Dict[str, Any]:
        user = self.user_repo.get_by_id(user_id)
        if not user:
            raise UserNotFoundError("Пользователь не найден")
        
        if 'bio' in updates:
            user.bio = updates['bio'][:500] if updates['bio'] else None
        
        if 'avatar_url' in updates:
            user.avatar_url = updates['avatar_url'] if updates['avatar_url'] else None
        
        if any(k in updates for k in ['bio', 'avatar_url']):
            user.profile_completed = True
        
        self.user_repo.session.commit()
        
        return {
            "id": user.id,
            "username": user.username,
            "bio": user.bio,
            "avatar_url": user.avatar_url,
            "profile_completed": user.profile_completed
        }
    
    def get_profile(self, user_id: int) -> Dict[str, Any]:
        user = self.user_repo.get_by_id(user_id)
        if not user:
            raise UserNotFoundError("Пользователь не найден")
        
        return {
            "id": user.id,
            "username": user.username,
            "phone": user.phone_number,
            "bio": user.bio,
            "avatar_url": user.avatar_url,
            "profile_completed": user.profile_completed
        }
    
    def _mask_phone(self, phone: str) -> str:
        if len(phone) >= 10:
            return f"+{'*' * (len(phone) - 4)}{phone[-4:]}"
        return phone
