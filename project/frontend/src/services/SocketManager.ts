import { io, Socket } from 'socket.io-client';

export type ChatEventHandlers = {
  onChatList: (data: any) => void;
  onUnreadCounts: (data: any) => void;
  onChatCreated: (data: any) => void;
  onChatHistory: (data: any) => void;
  onChatHistoryMore?: (data: any) => void;
  onNewMessage: (data: any) => void;
  onTyping: (data: any) => void;
  onMessageDeleted: (data: any) => void;
  onMessageEdited: (data: any) => void;
  onUserOnline: (data: any) => void;
  onUserOffline: (data: any) => void;
  onGroupCreated: (data: any) => void;
  onGroupInfo: (data: any) => void;
  onGroupInfoUpdated: (data: any) => void;
  onAddedToGroup: (data: any) => void;
  onRemovedFromGroup: (data: any) => void;
  onLeftGroup: (data: any) => void;
  onDisconnect: (reason: string) => void;
  onReconnect: () => void;
  onError: (data: any) => void;
};

export class SocketManager {
  chatSocket: Socket;
  presenceSocket: Socket;
  groupSocket: Socket;
  manualDisconnect = false;
  private isFirstConnect = true;
  private handlers: ChatEventHandlers;

  constructor(handlers: ChatEventHandlers) {
    this.handlers = handlers;
    const options = {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      transports: ['websocket', 'polling'] as string[],
    };
    this.chatSocket = io('/chat', options);
    this.presenceSocket = io('/presence', options);
    this.groupSocket = io('/groups', options);
    this.setupHandlers();
  }

  private setupHandlers() {
    this.chatSocket.on('chat_list', this.handlers.onChatList);
    this.chatSocket.on('unread_counts', this.handlers.onUnreadCounts);
    this.chatSocket.on('chat_created', this.handlers.onChatCreated);
    this.chatSocket.on('chat_history', this.handlers.onChatHistory);
    this.chatSocket.on('chat_history_more', (data) => {
      if (this.handlers.onChatHistoryMore) this.handlers.onChatHistoryMore(data);
    });
    this.chatSocket.on('new_message', this.handlers.onNewMessage);
    this.chatSocket.on('typing', this.handlers.onTyping);
    this.chatSocket.on('message_deleted', this.handlers.onMessageDeleted);
    this.chatSocket.on('message_edited', this.handlers.onMessageEdited);

    this.presenceSocket.on('user_online', this.handlers.onUserOnline);
    this.presenceSocket.on('user_offline', this.handlers.onUserOffline);

    this.groupSocket.on('group_created', this.handlers.onGroupCreated);
    this.groupSocket.on('group_info', this.handlers.onGroupInfo);
    this.groupSocket.on('group_info_updated', this.handlers.onGroupInfoUpdated);
    this.groupSocket.on('added_to_group', this.handlers.onAddedToGroup);
    this.groupSocket.on('removed_from_group', this.handlers.onRemovedFromGroup);
    this.groupSocket.on('left_group', this.handlers.onLeftGroup);

    this.chatSocket.on('disconnect', (reason) => {
      if (!this.manualDisconnect) {
        this.handlers.onDisconnect(reason);
      }
      this.manualDisconnect = false;
    });
    this.chatSocket.on('connect', () => {
      if (!this.isFirstConnect) this.handlers.onReconnect();
      this.isFirstConnect = false;
    });
    this.chatSocket.on('error', this.handlers.onError);
  }

  emitChat(event: string, data: any) {
    this.chatSocket.emit(event, data);
  }
  emitPresence(event: string, data: any) {
    this.presenceSocket.emit(event, data);
  }
  emitGroup(event: string, data: any) {
    this.groupSocket.emit(event, data);
  }

  connect() {
    if (!this.chatSocket.connected) {
      this.chatSocket.connect();
      this.presenceSocket.connect();
      this.groupSocket.connect();
    }
  }

  disconnect() {
    this.manualDisconnect = true;
    this.chatSocket.disconnect();
    this.presenceSocket.disconnect();
    this.groupSocket.disconnect();
  }
}
