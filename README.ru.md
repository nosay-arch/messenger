
[![English](https://img.shields.io/badge/English-README-blue)](README.md)

# Messenger App

Приложение для обмена сообщениями с личными и групповыми чатами, доставкой сообщений в реальном времени,
отслеживанием присутствия и поддержкой аватаров.
Построено как модульное, сервис-ориентированное приложение на Flask.

## Технологический стек

**Backend:** Flask, Flask-SocketIO, Flask-Login, Flask-WTF, SQLAlchemy, Marshmallow  
**База данных:** SQLite (разработка), PostgreSQL (продакшен)  
**Кэш и реальное время:** Redis (хранение сессий, ограничение частоты запросов, присутствие, очередь сообщений)

## Быстрый старт

### Требования

- Python 3.9+
- Node.js 18+ и npm (для сборки фронтенда)
- Docker (рекомендуется для Redis) или локально установленный Redis

### Установка и настройка

#### Шаг 1: Клонирование и настройка окружения

```bash
git clone https://github.com/nosay-arch/messenger.git
cd messenger/project

# Создание виртуального окружения
python -m venv venv
source venv/bin/activate  # На Windows: venv\Scripts\activate

# Установка зависимостей Python
pip install -r requirements.txt
```

#### Шаг 2: Настройка переменных окружения

Создайте файл `.env` в директории `project/` (или скопируйте из `.env.example`):

```bash
cp .env.example .env
```

Отредактируйте `.env` по своему усмотрению:

```env
# Конфигурация Flask
FLASK_ENV=development
SECRET_KEY=your_secret_key_here_min_32_chars_long
BASE_URL=http://localhost:5000

# База данных (SQLite для разработки)
# Используйте абсолютный путь для SQLite или PostgreSQL для продакшена
DATABASE_URL=sqlite:////absolute/path/to/instance/messenger.db

# Redis
REDIS_URL=redis://localhost:6379/0

# Безопасность (установите False для разработки, True для продакшена)
SESSION_COOKIE_SECURE=False

# CORS-источники (через запятую)
CORS_ORIGINS=http://localhost:3000,http://localhost:5000
```

#### Шаг 3: Запуск Redis

**Вариант A: с использованием Docker (рекомендуется)**

```bash
docker pull redis:latest
docker run --name messenger-redis -p 6379:6379 -d redis
```

**Вариант B: локальная установка**

```bash
# На macOS с Homebrew
brew install redis
redis-server

# На Linux
sudo apt-get install redis-server
redis-server

# На Windows через WSL
wsl
sudo apt-get install redis-server
redis-server
```

Чтобы остановить Redis:

```bash
# Docker
docker stop messenger-redis
docker rm messenger-redis

# Локальная установка
# Нажмите Ctrl+C в терминале, где запущен redis-server
```

#### Шаг 4: Проверка директории базы данных

Приложение создаёт базу данных SQLite в `project/instance/messenger.db`.
Убедитесь, что директория `instance/` существует:

```bash
mkdir -p instance
```

#### Шаг 5: Запуск бэкенда

```bash
cd project
python run.py
```

Сервер запустится на `http://localhost:5000` в режиме отладки.

Опции командной строки:

```bash
python run.py --help

# Запуск на определённом хосте/порту
python run.py --host 0.0.0.0 --port 8000

# Запуск в режиме отладки
python run.py -d
```

#### Шаг 6: Сборка и запуск фронтенда (опционально)

В отдельном терминале:

```bash
cd frontend
npm install
npm start  # для разработки с webpack
# или
npm run build  # для сборки production-версии
```

Фронтенд будет доступен на `http://localhost:3000` (если настроен webpack dev server).

## Устранение неполадок

### «unable to open database file»

**Проблема:** SQLite не может создать файл базы данных

**Решение:**
```bash
# Убедитесь, что директория instance существует
mkdir -p project/instance

# Проверьте DATABASE_URL в .env: используйте абсолютный путь
DATABASE_URL=sqlite:////full/path/to/instance/messenger.db
```

### «Redis is NOT available»

**Проблема:** при запуске не удаётся подключиться к Redis

**Решение:**
```bash
# Проверьте, работает ли Redis
redis-cli ping  # Должен ответить PONG

# Если не работает, запустите его
docker run -p 6379:6379 -d redis

# Или при локальной установке
redis-server
```

Чтобы запустить без проверок Redis (не рекомендуется):
- Удалите вызов `check_redis()` из `run.py`

### «Connection refused» на localhost:5000

**Проблема:** порт 5000 уже используется

**Решение:**
```bash
# Используйте другой порт
python run.py --port 8000

# Или найдите и завершите процесс, использующий порт 5000
lsof -i :5000  # на macOS/Linux
netstat -ano | findstr :5000  # на Windows
```

### «ModuleNotFoundError»

**Проблема:** зависимости не установлены

**Решение:**
```bash
pip install -r requirements.txt
```

### «CORS errors» в консоли браузера

**Проблема:** фронтенд не может обратиться к API бэкенда

**Решение:** Обновите `CORS_ORIGINS` в `.env`:
```env
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```
Затем перезапустите Flask-приложение.

### Проблемы со сборкой фронтенда

**Проблема:** `npm install` не работает или модуль не найден

**Решение:**
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm start
```

## Конфигурация

### Справочник переменных окружения

| Переменная | Значение по умолчанию | Описание |
|------------|----------------------|----------|
| `FLASK_ENV` | development | Режим окружения Flask |
| `SECRET_KEY` | dev-insecure-... | Секретный ключ Flask (измените в продакшене!) |
| `DATABASE_URL` | sqlite:// | Строка подключения к БД |
| `REDIS_URL` | redis://localhost:6379/0 | Строка подключения к Redis |
| `BASE_URL` | http://localhost:5000 | Базовый URL приложения |
| `SESSION_COOKIE_SECURE` | False | HTTPS-куки (True в продакшене) |
| `CORS_ORIGINS` | http://localhost:3000 | Разрешённые источники для CORS |

### Настройка базы данных

**Разработка:** используется SQLite (создаётся автоматически из моделей)

**Продакшен:** установите `DATABASE_URL` на PostgreSQL:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/messenger_prod
```

Затем создайте таблицы:
```bash
python -c "from app import create_app; app = create_app(); app.app_context().push(); from app.core.extensions import db; db.create_all()"
```

## Запуск тестов

```bash
pytest tests/
pytest tests/ --cov=app  # с отчётом о покрытии
```

## Документация по API

Основные эндпоинты:

- `POST /api/auth/register` – регистрация нового пользователя
- `POST /api/auth/login` – вход пользователя
- `GET /api/chats` – список чатов пользователя
- `POST /api/chats` – создание личного чата
- `WebSocket /socket.io` – обмен сообщениями в реальном времени

Подробную документацию API смотрите в маршрутах `app/modules/*/routes.py`.

## Структура проекта

```
project/
├── app/
│   ├── core/           # Основная конфигурация и настройка приложения
│   ├── models/         # Модели SQLAlchemy
│   ├── modules/        # Функциональные модули (auth, chats, messages и т.д.)
│   └── socket/         # Обработчики WebSocket
├── frontend/           # React фронтенд (TypeScript)
├── templates/          # HTML-шаблоны Jinja2
├── static/             # CSS, JS сборки
├── tests/              # Набор тестов pytest
├── instance/           # База данных SQLite (создаётся во время выполнения)
└── run.py              # Точка входа в приложение
```

## Контакты и поддержка

По вопросам и проблемам, пожалуйста, откройте issue на GitHub.

## Дополнительные опции командной строки

```
--debug          Включить режим отладки
--host 0.0.0.0   Привязаться ко всем интерфейсам (по умолчанию: 127.0.0.1)
--port 8080      Пользовательский порт (по умолчанию: 5000)
--unsafe         Разрешить перезагрузчик Werkzeug в продакшене
```

Приложение будет доступно по адресу `http://localhost:5000`.

## Ограничения частоты запросов (запросов в секунду, заданы в коде)

- `new_message` – 4 в секунду
- `create_private_chat` – 1 в секунду
- `join_chat` – 3 в секунду
- `typing` – 2 в секунду
- `mark_read` – 5 в секунду
- попытки входа – 10 за 15 минут с одного IP

## Возможности

- Аутентификация по имени пользователя / паролю с сессионными куками
- Ограничение частоты попыток входа по IP (Redis)
- Личные чаты (один-на-один, создаются автоматически при первом сообщении)
- Групповые чаты с управлением участниками создателем
- Доставка сообщений в реальном времени через Socket.IO (WebSocket)
- Индикаторы набора текста, рассылаемые участникам чата
- Редактирование и мягкое удаление сообщений в течение 5 минут
- Счётчики непрочитанных сообщений по каждому чату
- Присутствие пользователя (онлайн / офлайн) отслеживается через TTL Redis
- Поиск пользователей по префиксу имени
- Загрузка аватаров (PNG, JPG, GIF; макс. 10 МБ)
- Биография пользователя / страница профиля
- CSRF-защита на всех HTTP-маршрутах, изменяющих состояние
- Структурированный аудит действий (вход, регистрация, редактирование/удаление сообщений)
- Пользовательские JSON-ответы об ошибках для всех исключений приложения
- DI-контейнер для чистого управления зависимостями между сервисами

## Развёртывание в продакшене

1. Установите `FLASK_ENV=production` в окружении.
2. Используйте настоящий `SECRET_KEY` (длинная случайная строка).
3. Установите `DATABASE_URL` на строку подключения PostgreSQL.
4. Установите `SESSION_COOKIE_SECURE=True` (уже по умолчанию в продакшене).
5. Запускайте через Gunicorn + eventlet или gevent для асинхронной поддержки Socket.IO:
   ```bash
   gunicorn -k eventlet -w 1 "app:create_app()"
   ```

## Лицензия

GPLv3
