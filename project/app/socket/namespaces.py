from flask_socketio import Namespace, emit, join_room, leave_room
from flask import request
from flask_login import current_user
from flask import current_app
from app.core.utils.decorators import socket_authenticated, socket_handle_errors
from app.core.utils.rate_limit import rate_limit_socket as rate_limit_socket_func


class ChatNamespace(Namespace):
    def on_connect(self):
        if not current_user.is_authenticated:
            return False
        try:
            chats = current_app.container.chat_service.get_user_chats(current_user.id)
            emit('chat_list', chats)
            unread = current_app.container.chat_service.get_unread_counts(current_user.id)
            emit('unread_counts', unread)
        except Exception as e:
            current_app.logger.exception("Error in ChatNamespace.on_connect")
            emit('error', {'message': 'Failed to load initial data'})
        return True

    @socket_authenticated
    @socket_handle_errors
    def on_join_chat(self, data):
        chat_id = data.get('chat_id')
        if not chat_id:
            emit('error', {'message': 'chat_id required'})
            return
        if not current_app.container.chat_service.user_in_chat(current_user.id, chat_id):
            emit('error', {'message': 'Access denied'})
            return
        join_room(chat_id)
        messages = current_app.container.message_service.get_chat_history(
            chat_id, current_user.id, limit=100, offset=0
        )
        emit('chat_history', {'chat_id': chat_id, 'messages': messages})

    @socket_authenticated
    @socket_handle_errors
    def on_load_more_history(self, data):
        chat_id = data.get('chat_id')
        offset = data.get('offset', 0)
        if not chat_id:
            emit('error', {'message': 'chat_id required'})
            return
        if not current_app.container.chat_service.user_in_chat(current_user.id, chat_id):
            emit('error', {'message': 'Access denied'})
            return
        limit = 50
        messages = current_app.container.message_service.get_chat_history(
            chat_id, current_user.id, limit=limit, offset=offset
        )
        has_more = len(messages) == limit
        emit('chat_history_more', {
            'chat_id': chat_id,
            'messages': messages,
            'offset': offset,
            'has_more': has_more
        })

    @socket_authenticated
    @socket_handle_errors
    @rate_limit_socket_func('new_message')
    def on_new_message(self, data):
        chat_id = data.get('chat_id')
        text = data.get('text')
        if not chat_id or not text:
            emit('error', {'message': 'chat_id and text required'})
            return
        msg = current_app.container.message_service.send_message(
            current_user.id, chat_id, text
        )
        emit('new_message', msg, room=chat_id)

    @socket_authenticated
    @socket_handle_errors
    def on_typing(self, data):
        chat_id = data.get('chat_id')
        typing = data.get('typing')
        if not chat_id:
            return
        if not current_app.container.chat_service.user_in_chat(current_user.id, chat_id):
            return
        emit('typing', {
            'chat_id': chat_id,
            'username': current_user.username,
            'typing': typing
        }, room=chat_id, include_self=False)

    @socket_authenticated
    @socket_handle_errors
    def on_mark_read(self, data):
        chat_id = data.get('chat_id')
        if not chat_id:
            return
        current_app.container.message_service.mark_read(current_user.id, chat_id)
        unread = current_app.container.chat_service.get_unread_counts(current_user.id)
        emit('unread_counts', unread)

    @socket_authenticated
    @socket_handle_errors
    @rate_limit_socket_func('edit_message')
    def on_edit_message(self, data):
        message_id = data.get('message_id')
        chat_id = data.get('chat_id')
        new_text = data.get('text')
        if not all([message_id, chat_id, new_text]):
            emit('error', {'message': 'message_id, chat_id and text required'})
            return
        edited = current_app.container.message_service.edit_message(
            current_user.id, message_id, chat_id, new_text
        )
        emit('message_edited', edited, room=chat_id)

    @socket_authenticated
    @socket_handle_errors
    @rate_limit_socket_func('delete_message')
    def on_delete_message(self, data):
        message_id = data.get('message_id')
        chat_id = data.get('chat_id')
        if not message_id or not chat_id:
            emit('error', {'message': 'message_id and chat_id required'})
            return
        current_app.container.message_service.delete_message(
            current_user.id, message_id, chat_id
        )
        emit('message_deleted', {'chat_id': chat_id, 'message_id': message_id}, room=chat_id)

    @socket_authenticated
    @socket_handle_errors
    @rate_limit_socket_func('create_private_chat')
    def on_create_private_chat(self, data):
        username = data.get('username')
        if not username:
            emit('error', {'message': 'username required'})
            return
        chat_info, other_dto = current_app.container.group_service.create_private_chat(
            current_user.id, username
        )
        join_room(chat_info['id'])
        emit('chat_created', chat_info)

    @socket_authenticated
    @socket_handle_errors
    def on_get_chat_list(self, data=None):
        chats = current_app.container.chat_service.get_user_chats(current_user.id)
        emit('chat_list', chats)
        unread = current_app.container.chat_service.get_unread_counts(current_user.id)
        emit('unread_counts', unread)


class PresenceNamespace(Namespace):
    def on_connect(self):
        if not current_user.is_authenticated:
            return False
        try:
            join_room(f'user_{current_user.id}')
            current_app.container.presence_service.user_connected(
                current_user.id, current_user.username, request.sid
            )
            online_contacts = current_app.container.presence_service.get_online_users_in_chats(
                current_user.id
            )
            for username in online_contacts:
                emit('user_online', {'username': username})
            chat_ids = current_app.container.chat_repo.get_user_chat_ids(current_user.id)
            contacts = current_app.container.chat_repo.get_common_users(current_user.id, chat_ids)
            for contact in contacts:
                emit('user_online', {'username': current_user.username}, room=f'user_{contact.id}')
        except Exception as e:
            current_app.logger.exception("Error in PresenceNamespace.on_connect")
            emit('error', {'message': 'Failed to initialize presence'})
        return True

    def on_disconnect(self):
        if current_user.is_authenticated:
            current_app.container.presence_service.user_disconnected(
                current_user.id, current_user.username
            )
            chat_ids = current_app.container.chat_repo.get_user_chat_ids(current_user.id)
            contacts = current_app.container.chat_repo.get_common_users(current_user.id, chat_ids)
            for contact in contacts:
                last_seen = current_app.container.presence_service.get_last_seen(current_user.username)
                emit('user_offline', {
                    'username': current_user.username,
                    'last_seen': last_seen.isoformat()
                }, room=f'user_{contact.id}')


class GroupNamespace(Namespace):
    def on_connect(self):
        if not current_user.is_authenticated:
            return False
        return True

    @socket_authenticated
    @socket_handle_errors
    @rate_limit_socket_func('create_group')
    def on_create_group(self, data):
        name = data.get('name')
        description = data.get('description', '')
        member_ids = data.get('member_ids')
        if not name or member_ids is None:
            emit('error', {'message': 'name and member_ids required'})
            return
        group_info = current_app.container.group_service.create_group(
            name, description, current_user.id, member_ids
        )
        for user_id in member_ids:
            emit('group_created', group_info, room=f'user_{user_id}')
        join_room(group_info['id'])

    @socket_authenticated
    @socket_handle_errors
    def on_get_group_info(self, data):
        chat_id = data.get('chat_id')
        if not chat_id:
            emit('error', {'message': 'chat_id required'})
            return
        info = current_app.container.group_service.get_group_info(chat_id, current_user.id)
        if info:
            emit('group_info', info)
        else:
            emit('error', {'message': 'Group not found or access denied'})

    @socket_authenticated
    @socket_handle_errors
    @rate_limit_socket_func('add_to_group')
    def on_add_to_group(self, data):
        chat_id = data.get('chat_id')
        user_id = data.get('user_id')
        if not chat_id or not user_id:
            emit('error', {'message': 'chat_id and user_id required'})
            return
        result = current_app.container.group_service.add_user_to_group(
            chat_id, user_id, current_user.id
        )
        emit('added_to_group', result, room=f'user_{user_id}')
        emit('group_info_updated', result, room=chat_id)

    @socket_authenticated
    @socket_handle_errors
    @rate_limit_socket_func('remove_from_group')
    def on_remove_from_group(self, data):
        chat_id = data.get('chat_id')
        user_id = data.get('user_id')
        if not chat_id or not user_id:
            emit('error', {'message': 'chat_id and user_id required'})
            return
        result = current_app.container.group_service.remove_user_from_group(
            chat_id, user_id, current_user.id
        )
        if user_id != current_user.id:
            emit('removed_from_group', {'chat_id': chat_id}, room=f'user_{user_id}')
        emit('group_info_updated', result, room=chat_id)

    @socket_authenticated
    @socket_handle_errors
    @rate_limit_socket_func('leave_group')
    def on_leave_group(self, data):
        chat_id = data.get('chat_id')
        if not chat_id:
            emit('error', {'message': 'chat_id required'})
            return
        current_app.container.group_service.remove_user_from_group(
            chat_id, current_user.id, current_user.id
        )
        leave_room(chat_id)
        emit('left_group', {'chat_id': chat_id}, room=chat_id)
