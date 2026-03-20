import os
from dotenv import load_dotenv
from sqlalchemy.pool import StaticPool

load_dotenv()

basedir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))

class BaseConfig:
    """Базовая конфигурация, общая для всех окружений."""
    default_db_path = os.path.join(basedir, 'instance', 'messenger.db')
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL",
        f"sqlite:///{default_db_path}"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_size": 10,
        "pool_recycle": 3600,
        "pool_pre_ping": True,
        "connect_args": (
            {"check_same_thread": False}
            if "sqlite" in (os.getenv("DATABASE_URL", "sqlite:///instance/messenger.db"))
            else {}
        ),
    }

    SECRET_KEY = os.getenv("SECRET_KEY") or "none"

    BASE_URL = os.getenv("BASE_URL") or "http://localhost:5000"

    REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

    SESSION_COOKIE_SECURE = os.getenv("SESSION_COOKIE_SECURE", "True").lower() == "true"
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = "Strict"

    CORS_ORIGINS = [
        origin.strip()
        for origin in os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
    ]

    WTF_CSRF_ENABLED = True
    WTF_CSRF_TIME_LIMIT = None

    RATE_LIMITS = {
        "new_message": 4,
        "create_private_chat": 1,
        "join_chat": 3,
        "typing": 2,
        "mark_read": 5,
    }
    LOGIN_RATE_LIMIT_ATTEMPTS = 10
    LOGIN_RATE_LIMIT_PERIOD = 900


class DevelopmentConfig(BaseConfig):
    """Конфигурация для разработки."""

    DEBUG = True
    TESTING = False
    SESSION_COOKIE_SECURE = False

    CORS_ORIGINS = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5000",
        "http://127.0.0.1:5000"
    ]


class TestingConfig(BaseConfig):
    """Конфигурация для тестирования."""

    DEBUG = False
    TESTING = True

    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    SQLALCHEMY_ENGINE_OPTIONS = {
        "connect_args": {"check_same_thread": False},
        "poolclass": StaticPool,
    }

    WTF_CSRF_ENABLED = False
    SESSION_COOKIE_SECURE = False
    REDIS_URL = os.getenv("REDIS_URL_TEST", "redis://localhost:6379/15")


class ProductionConfig(BaseConfig):
    """Конфигурация для продакшена."""

    DEBUG = False
    TESTING = False
    SESSION_COOKIE_SECURE = True
    SESSION_COOKIE_SAMESITE = "Strict"
