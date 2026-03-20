import { io, Socket } from 'socket.io-client';
import { ChatApplication } from './main';

export class SocketManager {
    private app: ChatApplication;
    chatSocket: Socket;
    presenceSocket: Socket;
    groupSocket: Socket;
    manualDisconnect = false;

    constructor(app: ChatApplication) {
        this.app = app;
        const options = {
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: 5,
            transports: ['websocket', 'polling']
        };
        this.chatSocket = io('/chat', options);
        this.presenceSocket = io('/presence', options);
        this.groupSocket = io('/groups', options);
        this.setupHandlers();
    }

    private setupHandlers() {
        this.chatSocket.on('chat_list', (data) => this.app.chat.handleChatList(data));
        this.chatSocket.on('unread_counts', (data) => this.app.chat.handleUnreadCounts(data));
        this.chatSocket.on('chat_created', (data) => this.app.chat.handleChatCreated(data));
        this.chatSocket.on('chat_history', (data) => this.app.chat.handleChatHistory(data));
        this.chatSocket.on('new_message', (data) => this.app.chat.handleNewMessage(data));
        this.chatSocket.on('typing', (data) => this.app.chat.handleTypingIndicator(data));
        this.chatSocket.on('message_deleted', (data) => this.app.chat.handleMessageDeleted(data));
        this.chatSocket.on('message_edited', (data) => this.app.chat.handleMessageEdited(data));

        this.presenceSocket.on('user_online', (data) => this.app.chat.handleUserOnline(data));
        this.presenceSocket.on('user_offline', (data) => this.app.chat.handleUserOffline(data));

        this.groupSocket.on('group_created', (data) => this.app.chat.handleGroupCreated(data));
        this.groupSocket.on('group_info', (data) => this.app.chat.handleGroupInfo(data));
        this.groupSocket.on('group_info_updated', (data) => this.app.chat.handleGroupInfoUpdated(data));
        this.groupSocket.on('removed_from_group', (data) => this.app.chat.handleRemovedFromGroup(data));
        this.groupSocket.on('left_group', (data) => this.app.chat.handleLeftGroup(data));

        this.chatSocket.on('disconnect', (reason) => this.handleDisconnect(reason));
        this.chatSocket.on('connect', () => this.handleReconnect());
        this.chatSocket.on('error', (data) => this.handleError(data));
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

    handleDisconnect(reason: string) {
        if (this.manualDisconnect) {
            this.manualDisconnect = false;
            return;
        }
        this.app.ui.showNotification('Соединение потеряно. Попытка восстановить...', false);
        this.app.ui.disableInput(true);
        this.app.chat.currentTypingUsers.clear();
        this.app.ui.elements.typingIndicator.classList.add('hidden');
    }

    handleReconnect() {
        this.app.ui.showNotification('Соединение восстановлено.', false);
        this.app.ui.disableInput(false);
        if (this.app.chat.currentChatId) this.app.chat.switchChat(this.app.chat.currentChatId);
    }

    handleError(data: any) {
        console.error('Socket error:', data);
        this.app.ui.showNotification('Ошибка: ' + (data?.message || 'Неизвестная ошибка'));
        this.app.chat.groupCreationInProgress = false;
    }
}
