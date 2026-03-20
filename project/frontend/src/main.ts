import './styles/main.scss';
import { UI } from './ui';
import { Auth } from './auth';
import { Chat } from './chat';
import { SocketManager } from './socket';
import { ProfileManager } from './profile';

export class ChatApplication {
    currentUserId: number | null = null;
    currentUsername: string = '';
    isResizing = false;
    ui: UI;
    auth: Auth;
    chat: Chat;
    socket: SocketManager;
    profile: ProfileManager;

    constructor() {
        this.ui = new UI(this);
        this.auth = new Auth(this);
        this.chat = new Chat(this);
        this.socket = new SocketManager(this);
        this.profile = new ProfileManager(this);
        this.init();
    }

    init() {
        this.bindEvents();
        this.auth.tryAutoLogin();
    }

    bindEvents() {
        const ui = this.ui.elements;
        ui.authSubmit?.addEventListener('click', () => this.auth.handleAuth());
        ui.authPassword?.addEventListener('keypress', (e: KeyboardEvent) => {
            if (e.key === 'Enter') this.auth.handleAuth();
        });
        ui.sendBtn?.addEventListener('click', () => this.chat.sendMessage());
        ui.messageInput?.addEventListener('keypress', (e: KeyboardEvent) => {
            if (e.key === 'Enter') this.chat.sendMessage();
        });
        ui.messageInput?.addEventListener('input', () => this.chat.handleTyping());
        ui.sidebarUserSearch?.addEventListener('input', (e: Event) => {
            const query = (e.target as HTMLInputElement).value.trim();
            if (query.length < 2) {
                ui.sidebarSearchResults?.classList.remove('show');
                return;
            }
            this.chat.searchDebounced(query);
        });
        document.addEventListener('click', (e) => {
            if (!ui.sidebarUserSearch?.contains(e.target as Node) && !ui.sidebarSearchResults?.contains(e.target as Node)) {
                ui.sidebarSearchResults?.classList.remove('show');
            }
        });
    }
}

new ChatApplication();
