from .namespaces import ChatNamespace, PresenceNamespace, GroupNamespace


def register_socket_handlers(sio, container):
    sio.on_namespace(ChatNamespace('/chat'))
    sio.on_namespace(PresenceNamespace('/presence'))
    sio.on_namespace(GroupNamespace('/groups'))
