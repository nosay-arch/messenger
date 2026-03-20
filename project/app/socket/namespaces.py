from flask_socketio import Namespace, emit, join_room, leave_room
from flask import request
from flask_login import current_user
from flask import current_app
from app.core.utils.decorators import socket_authenticated
from app.core.utils.rate_limit import rate_limit_socket


class ChatNamespace(Namespace):
    def on_connect(self):
        if not current_user.is_authenticated:
            return False
        # Можно добавить логику при подключении

    @socket_authenticated
    def on_join_chat(self, data):
        chat_id = data['chat_id']
        if not current_app.container.chat_service.user_in_chat(current_user.id, chat_id):
            emit('error', {'message': 'Access denied'})
            return
        join_room(chat_id)
        messages = current_app.container.message_service.get_chat_history(
            chat_id, current_user.id, limit=100, offset=0
        )
        emit('chat_history', {'chat_id': chat_id, 'messages': messages})

    @socket_authenticated
    @rate_limit_socket('new_message')
    def on_new_message(self, data):
        chat_id = data['chat_id']
        text = data['text']
        msg = current_app.container.message_service.send_message(
            current_user.id, chat_id, text
        )
        emit('new_message', msg, room=chat_id, include_self=False)
        # Обновить список чатов для всех участников (можно отправить событие chat_list)
        # Для простоты пока только сообщение

    @socket_authenticated
    def on_typing(self, data):
        chat_id = data['chat_id']
        typing = data['typing']
        emit('typing', {
            'chat_id': chat_id,
            'username': current_user.username,
            'typing': typing
        }, room=chat_id, include_self=False)

    @socket_authenticated
    def on_mark_read(self, data):
        chat_id = data['chat_id']
        current_app.container.message_service.mark_read(current_user.id, chat_id)
        # Можно оповестить других, но пока необязательно

    @socket_authenticated
    def on_edit_message(self, data):
        message_id = data['message_id']
        chat_id = data['chat_id']
        new_text = data['text']
        edited = current_app.container.message_service.edit_message(
            current_user.id, message_id, chat_id, new_text
        )
        emit('message_edited', edited, room=chat_id)

    @socket_authenticated
    def on_delete_message(self, data):
        message_id = data['message_id']
        chat_id = data['chat_id']
        result = current_app.container.message_service.delete_message(
            current_user.id, message_id, chat_id
        )
        emit('message_deleted', {'chat_id': chat_id, 'message_id': message_id}, room=chat_id)

    @socket_authenticated
    def on_create_private_chat(self, data):
        username = data['username']
        chat_info, other_dto = current_app.container.group_service.create_private_chat(
            current_user.id, username
        )
        # Присоединить текущего пользователя к комнате чата
        join_room(chat_info['id'])
        emit('chat_created', chat_info)
        # Если чат только что создан, можно отправить информацию о собеседнике (опционально)

    @socket_authenticated
    def on_get_chat_list(self, data=None):
        chats = current_app.container.chat_service.get_user_chats(current_user.id)
        emit('chat_list', chats)
        unread = current_app.container.chat_service.get_unread_counts(current_user.id)
        emit('unread_counts', unread)


class PresenceNamespace(Namespace):
    def on_connect(self):
        if current_user.is_authenticated:
            current_app.container.presence_service.user_connected(
                current_user.id, current_user.username, request.sid
            )
            # Оповестить участников общих чатов (можно реализовать позже)
        return True

    def on_disconnect(self):
        if current_user.is_authenticated:
            current_app.container.presence_service.user_disconnected(current_user.username)
            # Оповестить


class GroupNamespace(Namespace):
    @socket_authenticated
    def on_create_group(self, data):
        name = data['name']
        description = data.get('description', '')
        member_ids = data['member_ids']
        group_info = current_app.container.group_service.create_group(
            name, description, current_user.id, member_ids
        )
        # Присоединить создателя к комнате группы
        join_room(group_info['id'])
        emit('group_created', group_info, room=group_info['id'])
        # Можно отправить chat_list всем участникам, но пока ограничимся

    @socket_authenticated
    def on_get_group_info(self, data):
        chat_id = data['chat_id']
        info = current_app.container.group_service.get_group_info(chat_id, current_user.id)
        if info:
            emit('group_info', info)
        else:
            emit('error', {'message': 'Group not found or access denied'})

    @socket_authenticated
    def on_add_to_group(self, data):
        chat_id = data['chat_id']
        user_id = data['user_id']
        result = current_app.container.group_service.add_user_to_group(
            chat_id, user_id, current_user.id
        )
        # Добавить нового участника в комнату (на клиенте он должен сам присоединиться)
        emit('group_info_updated', result, room=chat_id)

    @socket_authenticated
    def on_remove_from_group(self, data):
        chat_id = data['chat_id']
        user_id = data['user_id']
        result = current_app.container.group_service.remove_user_from_group(
            chat_id, user_id, current_user.id
        )
        emit('removed_from_group', result, room=chat_id)
        # Также отправить событие удалённому пользователю (можно через его личную комнату)

    @socket_authenticated
    def on_leave_group(self, data):
        chat_id = data['chat_id']
        result = current_app.container.group_service.remove_user_from_group(
            chat_id, current_user.id, current_user.id
        )
        leave_room(chat_id)
        emit('left_group', {'chat_id': chat_id}, room=chat_id)
