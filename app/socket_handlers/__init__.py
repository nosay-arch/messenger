from .presence import register_presence_handlers
from .messaging import register_messaging_handlers
from .groups import register_groups_handlers
from .moderation import register_moderation_handlers

def register_socket_handlers(socketio, container):
    register_presence_handlers(socketio, container)
    register_messaging_handlers(socketio, container)
    register_groups_handlers(socketio, container)
    register_moderation_handlers(socketio, container)
