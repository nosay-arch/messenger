import argparse
import eventlet
eventlet.monkey_patch()

from app import create_app
from app.extensions import socketio

app = create_app()


def parse_args():
    p = argparse.ArgumentParser(description='Run messanger app')
    p.add_argument('--debug', '-d', action='store_true', help='Включить режим отладки')
    p.add_argument('--host', default='127.0.0.1', help='Хост для запуска (по умолчанию 127.0.0.1)')
    p.add_argument('--port', type=int, default=1488, help='Порт для запуска (по умолчанию 1488)')
    return p.parse_args()


if __name__ == '__main__':
    args = parse_args()
    socketio.run(app, debug=args.debug, host=args.host, port=args.port)
