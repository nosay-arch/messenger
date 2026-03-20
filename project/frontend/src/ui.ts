import { ChatApplication } from './main';
import { escapeHtml, isMobile, debounce } from './utils';

export class UI {
    private app: ChatApplication;
    elements: { [key: string]: HTMLElement } = {};
    selectedUsers: Map<number, { id: number; username: string }> | null = null;

    constructor(app: ChatApplication) {
        this.app = app;
        this.cacheDom();
        this.bindEvents();
    }

    cacheDom() {
        const ids = [
            'loading-screen', 'auth-overlay', 'main-interface', 'auth-title',
            'auth-login', 'auth-password', 'auth-password-confirm',
            'auth-submit', 'auth-toggle', 'auth-error', 'chats-list',
            'messages-container', 'chat-placeholder', 'message-input', 'send-btn',
            'chat-header', 'chat-partner-name', 'online-status', 'typing-indicator',
            'input-area', 'sidebar-user-search', 'sidebar-search-results',
            'chats-sidebar', 'user-menu-button', 'user-popup', 'popup-username',
            'popup-logout', 'back-button', 'resizer', 'notification',
            'popup-create-group', 'chat-avatar-img', 'chat-avatar-placeholder', 'chat-header-avatar'
        ];
        this.elements = Object.fromEntries(
            ids.map(id => [this.camelCase(id), document.getElementById(id)!])
        );
        this.ensureSidebarOverlay();
    }

    private camelCase(str: string): string {
        return str.replace(/-([a-z])/g, (_, l) => l.toUpperCase());
    }

    private ensureSidebarOverlay() {
        if (!document.querySelector('.sidebar-overlay')) {
            const overlay = document.createElement('div');
            overlay.className = 'sidebar-overlay';
            document.querySelector('.app-container')!.appendChild(overlay);
        }
        this.elements.sidebarOverlay = document.querySelector('.sidebar-overlay')!;
    }

    bindEvents() {
        if (this.elements.userMenuButton) {
            this.elements.userMenuButton.addEventListener('click', (e) => {
                e.stopPropagation();
                this.elements.userPopup.classList.toggle('hidden');
            });
        }
        document.addEventListener('click', (e) => {
            if (!this.elements.userPopup.contains(e.target as Node) && e.target !== this.elements.userMenuButton) {
                this.elements.userPopup.classList.add('hidden');
            }
        });
        this.elements.popupLogout?.addEventListener('click', () => this.app.auth.logout());
        if (this.elements.popupCreateGroup) {
            this.elements.popupCreateGroup.addEventListener('click', () => {
                this.elements.userPopup.classList.add('hidden');
                this.showCreateGroupModal();
            });
        }
        if (this.elements.resizer) {
            this.elements.resizer.addEventListener('mousedown', this.startResize.bind(this));
        }
        if (this.elements.backButton) {
            this.elements.backButton.addEventListener('click', (e) => {
                e.stopPropagation();
                this.app.chat.resetToPlaceholder();
                if (isMobile()) this.openSidebar();
            });
        }
        if (this.elements.sidebarOverlay) {
            this.elements.sidebarOverlay.addEventListener('click', this.closeSidebar.bind(this));
        }
        window.addEventListener('resize', this.handleWindowResize.bind(this));
        this.initSwipeHandlers();
    }

    startResize(e: MouseEvent) {
        if (isMobile()) return;
        this.app.isResizing = true;
        document.body.style.cursor = 'col-resize';
        const resizeHandler = this.resize.bind(this);
        const stopResizeHandler = this.stopResize.bind(this);
        document.addEventListener('mousemove', resizeHandler);
        document.addEventListener('mouseup', stopResizeHandler);
        e.preventDefault();
    }

    resize(e: MouseEvent) {
        if (!this.app.isResizing) return;
        const sidebar = this.elements.chatsSidebar;
        const newWidth = e.clientX - sidebar.getBoundingClientRect().left;
        const clampedWidth = Math.max(200, Math.min(500, newWidth));
        sidebar.style.width = clampedWidth + 'px';
    }

    stopResize() {
        this.app.isResizing = false;
        document.body.style.cursor = '';
        document.removeEventListener('mousemove', this.resize);
        document.removeEventListener('mouseup', this.stopResize);
    }

    toggleSidebar() {
        if (!isMobile()) return;
        if (this.elements.chatsSidebar.classList.contains('open')) {
            this.closeSidebar();
        } else {
            this.openSidebar();
        }
    }

    openSidebar() {
        if (!isMobile()) return;
        this.elements.chatsSidebar.classList.add('open');
        this.elements.sidebarOverlay?.classList.add('visible');
        document.body.style.overflow = 'hidden';
    }

    closeSidebar() {
        if (!isMobile()) return;
        this.elements.chatsSidebar.classList.remove('open');
        this.elements.sidebarOverlay?.classList.remove('visible');
        document.body.style.overflow = '';
    }

    private initSwipeHandlers() {
        let touchstartX = 0, touchstartY = 0;
        let touchendX = 0, touchendY = 0;
        document.addEventListener('touchstart', (e) => {
            touchstartX = e.changedTouches[0].screenX;
            touchstartY = e.changedTouches[0].screenY;
        });
        document.addEventListener('touchend', (e) => {
            touchendX = e.changedTouches[0].screenX;
            touchendY = e.changedTouches[0].screenY;
            this.handleSwipe(touchstartX, touchendX, touchstartY, touchendY);
        });
    }

    private handleSwipe(startX: number, endX: number, startY: number, endY: number) {
        const deltaX = endX - startX;
        const deltaY = endY - startY;
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
            if (deltaX > 0) {
                this.openSidebar();
            } else {
                if (this.app.chat.currentChatId) {
                    this.app.chat.resetToPlaceholder();
                    this.openSidebar();
                } else {
                    this.closeSidebar();
                }
            }
        }
    }

    private handleWindowResize() {
        if (!isMobile()) {
            this.elements.chatsSidebar.classList.remove('open');
            this.elements.sidebarOverlay?.classList.remove('visible');
            document.body.style.overflow = '';
        } else if (!this.app.chat.currentChatId) {
            this.updateHeaderForNoChat();
        }
    }

    updateHeaderForNoChat() {
        this.elements.chatPartnerName.textContent = 'Чаты';
        this.elements.onlineStatus.textContent = '';
        this.elements.typingIndicator.classList.add('hidden');
    }

    showNotification(message: string, isError = true) {
        const notif = this.elements.notification;
        if (!notif) return;
        notif.textContent = message;
        notif.classList.add('show');
        notif.style.background = isError ? '#c62828' : '#4f7eb3';
        setTimeout(() => notif.classList.remove('show'), 3000);
    }

    disableInput(disabled: boolean) {
        (this.elements.sendBtn as HTMLButtonElement).disabled = disabled;
        (this.elements.messageInput as HTMLInputElement).disabled = disabled;
    }

    // ==================== Модальные окна ====================

    showEditMessageModal(messageId: number, currentText: string) {
        const template = document.getElementById('edit-message-modal-template');
        if (!template) return;
        const modalElement = template.cloneNode(true) as HTMLElement;
        modalElement.removeAttribute('id');
        modalElement.style.display = 'block';
        document.body.appendChild(modalElement);

        const closeBtn = modalElement.querySelector('.close');
        const saveBtn = modalElement.querySelector('#edit-message-save') as HTMLButtonElement;
        const cancelBtn = modalElement.querySelector('#edit-message-cancel') as HTMLButtonElement;
        const input = modalElement.querySelector('#edit-message-input') as HTMLInputElement;
        input.value = currentText;

        const removeModal = () => {
            modalElement.remove();
            document.removeEventListener('keydown', escapeHandler);
        };

        const escapeHandler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') removeModal();
        };

        closeBtn?.addEventListener('click', removeModal);
        cancelBtn?.addEventListener('click', removeModal);
        saveBtn?.addEventListener('click', () => {
            const newText = input.value.trim();
            if (newText && newText !== currentText) {
                this.app.chat.editMessage(messageId, newText);
            }
            removeModal();
        });

        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') saveBtn.click();
        });

        modalElement.addEventListener('click', (e) => {
            if (e.target === modalElement) removeModal();
        });

        document.addEventListener('keydown', escapeHandler);
        input.focus();
        input.select();
    }

    showDeleteConfirmModal(messageId: number) {
        const template = document.getElementById('delete-confirm-modal-template');
        if (!template) return;
        const modalElement = template.cloneNode(true) as HTMLElement;
        modalElement.removeAttribute('id');
        modalElement.style.display = 'block';
        document.body.appendChild(modalElement);

        const closeBtn = modalElement.querySelector('.close');
        const yesBtn = modalElement.querySelector('#delete-confirm-yes') as HTMLButtonElement;
        const noBtn = modalElement.querySelector('#delete-confirm-no') as HTMLButtonElement;

        const removeModal = () => {
            modalElement.remove();
            document.removeEventListener('keydown', escapeHandler);
        };

        const escapeHandler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') removeModal();
        };

        closeBtn?.addEventListener('click', removeModal);
        noBtn?.addEventListener('click', removeModal);
        yesBtn?.addEventListener('click', () => {
            this.app.chat.deleteMessage(messageId);
            removeModal();
        });

        modalElement.addEventListener('click', (e) => {
            if (e.target === modalElement) removeModal();
        });

        document.addEventListener('keydown', escapeHandler);
    }

    showCreateGroupModal() {
        const template = document.getElementById('create-group-modal-template');
        if (!template) return;
        const modalElement = template.cloneNode(true) as HTMLElement;
        modalElement.removeAttribute('id');
        modalElement.style.display = 'block';
        document.body.appendChild(modalElement);

        this.selectedUsers = new Map();
        this.bindGroupModalEvents(modalElement);
    }

    private bindGroupModalEvents(modalElement: HTMLElement) {
        const searchInput = modalElement.querySelector('#group-user-search') as HTMLInputElement;
        const resultsDiv = modalElement.querySelector('#group-search-results') as HTMLElement;
        const selectedDiv = modalElement.querySelector('#selected-users-list') as HTMLElement;
        const nextBtn = modalElement.querySelector('#group-next-step') as HTMLButtonElement;
        const backBtn = modalElement.querySelector('#group-back-step') as HTMLButtonElement;
        const createBtn = modalElement.querySelector('#create-group-btn') as HTMLButtonElement;
        const nameInput = modalElement.querySelector('#group-name') as HTMLInputElement;
        const descInput = modalElement.querySelector('#group-description') as HTMLTextAreaElement;
        const step1 = modalElement.querySelector('#group-step-1') as HTMLElement;
        const step2 = modalElement.querySelector('#group-step-2') as HTMLElement;
        const steps = modalElement.querySelectorAll('.step');

        if (!this.selectedUsers) this.selectedUsers = new Map();

        const updateNextButton = () => {
            nextBtn.disabled = this.selectedUsers!.size === 0;
        };

        const goToStep = (step: number) => {
            if (step === 1) {
                step1.classList.remove('hidden');
                step2.classList.add('hidden');
                steps[0].classList.add('active');
                steps[1].classList.remove('active');
            } else {
                step1.classList.add('hidden');
                step2.classList.remove('hidden');
                steps[0].classList.remove('active');
                steps[1].classList.add('active');
                createBtn.disabled = !nameInput.value.trim();
            }
        };

        nextBtn.addEventListener('click', () => goToStep(2));
        backBtn.addEventListener('click', () => goToStep(1));

        const addUserChip = (id: number, username: string) => {
            const chip = document.createElement('span');
            chip.className = 'user-chip';
            chip.dataset.id = id.toString();
            chip.innerHTML = `
                <span class="chip-avatar">${username.charAt(0).toUpperCase()}</span>
                <span class="chip-name">${escapeHtml(username)}</span>
                <i class="fas fa-times"></i>
            `;
            chip.querySelector('i')!.addEventListener('click', (e) => {
                e.stopPropagation();
                chip.remove();
                this.selectedUsers!.delete(id);
                updateNextButton();
            });
            selectedDiv.appendChild(chip);
        };

        searchInput.addEventListener('input', debounce(async (e: Event) => {
            const query = (e.target as HTMLInputElement).value.trim();
            if (query.length < 2) {
                resultsDiv.classList.remove('show');
                return;
            }
            try {
                const response = await fetch(`/api/users?q=${encodeURIComponent(query)}`);
                if (!response.ok) throw new Error('Ошибка загрузки пользователей');
                const users = await response.json();
                if (users.length === 0) {
                    resultsDiv.innerHTML = '<div class="empty-message">Ничего не найдено</div>';
                    resultsDiv.classList.add('show');
                    return;
                }
                const available = users.filter((u: any) => !this.selectedUsers!.has(u.id));
                resultsDiv.innerHTML = available.map((u: any) => `
                    <div class="result-item" data-id="${u.id}" data-username="${u.username}">
                        <span class="avatar">${u.username.charAt(0).toUpperCase()}</span>
                        <span class="username">${escapeHtml(u.username)}</span>
                    </div>
                `).join('');
                resultsDiv.classList.add('show');
                resultsDiv.querySelectorAll('.result-item').forEach(item => {
                    item.addEventListener('click', () => {
                        const id = parseInt(item.getAttribute('data-id')!);
                        const username = item.getAttribute('data-username')!;
                        if (!this.selectedUsers!.has(id)) {
                            this.selectedUsers!.set(id, { id, username });
                            addUserChip(id, username);
                        }
                        resultsDiv.classList.remove('show');
                        searchInput.value = '';
                        updateNextButton();
                    });
                });
            } catch (err) {
                console.error('Ошибка поиска', err);
                this.showNotification('Ошибка поиска пользователей', true);
            }
        }, 300));

        nameInput.addEventListener('input', () => {
            createBtn.disabled = !nameInput.value.trim();
        });

        createBtn.addEventListener('click', () => {
            const name = nameInput.value.trim();
            const description = descInput.value.trim();
            const memberIds = Array.from(this.selectedUsers!.keys());
            this.app.chat.createGroup(name, description, memberIds);
            modalElement.remove();
        });

        // Закрытие
        const closeBtn = modalElement.querySelector('.close');
        closeBtn?.addEventListener('click', () => modalElement.remove());
        modalElement.addEventListener('click', (e) => {
            if (e.target === modalElement) modalElement.remove();
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') modalElement.remove();
        }, { once: true });
    }

    showGroupInfoModal(info: any) {
        const template = document.getElementById('group-info-modal-template');
        if (!template) return;
        const modalElement = template.cloneNode(true) as HTMLElement;
        modalElement.removeAttribute('id');
        modalElement.style.display = 'block';
        document.body.appendChild(modalElement);

        const nameEl = modalElement.querySelector('#group-name-display') as HTMLElement;
        const descEl = modalElement.querySelector('#group-description-display') as HTMLElement;
        const countEl = modalElement.querySelector('#group-member-count') as HTMLElement;
        const membersList = modalElement.querySelector('#group-members-list') as HTMLElement;
        const addSection = modalElement.querySelector('#group-add-member-section') as HTMLElement;
        const leaveBtn = modalElement.querySelector('#leave-group-btn') as HTMLButtonElement;

        nameEl.textContent = info.name;
        descEl.textContent = info.description || '';
        countEl.textContent = `Участников: ${info.member_count}`;

        const membersHtml = info.members.map((m: any) => `
            <div class="member-item" data-id="${m.id}">
                <span class="member-avatar">${m.avatar_url ? `<img src="${m.avatar_url}" class="member-avatar-img">` : m.username.charAt(0).toUpperCase()}</span>
                <span>${escapeHtml(m.username)} ${m.is_creator ? '(создатель)' : ''}</span>
                ${this.app.currentUsername !== m.username && info.created_by === this.app.currentUserId ?
                    `<button class="remove-member-btn">Удалить</button>` : ''}
            </div>
        `).join('');
        membersList.innerHTML = membersHtml;

        if (info.created_by === this.app.currentUserId) {
            addSection.style.display = 'block';
            const searchInput = modalElement.querySelector('#group-info-search') as HTMLInputElement;
            const resultsDiv = modalElement.querySelector('#group-info-results') as HTMLElement;
            searchInput.addEventListener('input', debounce(async (e) => {
                const query = (e.target as HTMLInputElement).value.trim();
                if (query.length < 2) return;
                try {
                    const response = await fetch(`/api/users?q=${encodeURIComponent(query)}`);
                    const users = await response.json();
                    const existingIds = new Set(info.members.map((m: any) => m.id));
                    const available = users.filter((u: any) => !existingIds.has(u.id));
                    resultsDiv.innerHTML = available.map((u: any) => `<div class="result-item" data-id="${u.id}">${escapeHtml(u.username)}</div>`).join('');
                    resultsDiv.classList.add('show');
                    resultsDiv.querySelectorAll('.result-item').forEach(item => {
                        item.addEventListener('click', () => {
                            const userId = parseInt(item.getAttribute('data-id')!);
                            this.app.chat.addUserToGroup(info.id, userId);
                            resultsDiv.classList.remove('show');
                            searchInput.value = '';
                        });
                    });
                } catch (err) {
                    console.error('Ошибка поиска', err);
                }
            }, 300));
        }

        membersList.querySelectorAll('.remove-member-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const memberId = parseInt((e.target as HTMLElement).closest('.member-item')!.getAttribute('data-id')!);
                if (confirm('Удалить участника?')) {
                    this.app.chat.removeUserFromGroup(info.id, memberId);
                }
            });
        });

        leaveBtn.addEventListener('click', () => {
            this.app.chat.leaveGroup(info.id);
            modalElement.remove();
        });

        // Закрытие
        const closeBtn = modalElement.querySelector('.close');
        closeBtn?.addEventListener('click', () => modalElement.remove());
        modalElement.addEventListener('click', (e) => {
            if (e.target === modalElement) modalElement.remove();
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') modalElement.remove();
        }, { once: true });
    }

    showUserProfileModal(userId: number, initialData?: any) {
        const template = document.getElementById('user-profile-view-modal-template');
        if (!template) return;
        const modalElement = template.cloneNode(true) as HTMLElement;
        modalElement.removeAttribute('id');
        modalElement.style.display = 'block';
        document.body.appendChild(modalElement);

        const errorEl = modalElement.querySelector('#user-profile-error') as HTMLElement;
        const usernameEl = modalElement.querySelector('#user-profile-username') as HTMLElement;
        const bioEl = modalElement.querySelector('#user-profile-bio') as HTMLElement;
        const avatarContainer = modalElement.querySelector('#user-profile-avatar') as HTMLElement;

        const loadProfile = async () => {
            try {
                const response = await fetch(`/api/users/${userId}/profile`, {
                    headers: { 'X-Requested-With': 'XMLHttpRequest' }
                });
                if (!response.ok) {
                    const err = await response.json();
                    throw new Error(err.error || 'Ошибка загрузки');
                }
                const data = await response.json();
                usernameEl.textContent = data.username || '';
                bioEl.textContent = data.bio || '—';
                if (data.avatar_url) {
                    avatarContainer.innerHTML = `<img src="${data.avatar_url}" class="profile-avatar-img">`;
                } else {
                    avatarContainer.innerHTML = `<div class="profile-avatar-placeholder">${data.username.charAt(0).toUpperCase()}</div>`;
                }
            } catch (err: any) {
                errorEl.textContent = err.message;
                errorEl.classList.remove('hidden');
            }
        };

        loadProfile();

        const closeBtn = modalElement.querySelector('.profile-modal-close');
        const closeFooterBtn = modalElement.querySelector('#user-profile-close-btn');
        const removeModal = () => {
            modalElement.remove();
            document.removeEventListener('keydown', escapeHandler);
        };
        const escapeHandler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') removeModal();
        };

        closeBtn?.addEventListener('click', removeModal);
        closeFooterBtn?.addEventListener('click', removeModal);
        modalElement.addEventListener('click', (e) => {
            if (e.target === modalElement) removeModal();
        });
        document.addEventListener('keydown', escapeHandler);
    }

    showProfileModal(initialData?: any) {
        const template = document.getElementById('profile-modal-template');
        if (!template) return;
        const modalElement = template.cloneNode(true) as HTMLElement;
        modalElement.removeAttribute('id');
        modalElement.style.display = 'block';
        document.body.appendChild(modalElement);

        const errorEl = modalElement.querySelector('#profile-error') as HTMLElement;
        const usernameInput = modalElement.querySelector('#profile-modal-username') as HTMLInputElement;
        const bioInput = modalElement.querySelector('#profile-modal-bio') as HTMLTextAreaElement;
        const charCount = modalElement.querySelector('#bio-char-count') as HTMLElement;
        const avatarImg = modalElement.querySelector('#profile-avatar-img') as HTMLImageElement;
        const avatarPlaceholder = modalElement.querySelector('#profile-avatar-placeholder') as HTMLElement;
        const avatarUpload = modalElement.querySelector('#avatar-upload') as HTMLInputElement;
        const saveBtn = modalElement.querySelector('#profile-save-btn') as HTMLButtonElement;
        const cancelBtn = modalElement.querySelector('#profile-cancel-btn') as HTMLButtonElement;

        const loadProfile = async () => {
            try {
                const response = await fetch('/api/profile', {
                    headers: { 'X-Requested-With': 'XMLHttpRequest' }
                });
                if (!response.ok) throw new Error('Ошибка загрузки');
                const data = await response.json();
                usernameInput.value = data.username || '';
                bioInput.value = data.bio || '';
                charCount.textContent = `${(data.bio || '').length}/500`;
                if (data.avatar_url) {
                    avatarImg.src = data.avatar_url;
                    avatarImg.style.display = 'block';
                    avatarPlaceholder.style.display = 'none';
                } else {
                    avatarImg.style.display = 'none';
                    avatarPlaceholder.style.display = 'flex';
                    avatarPlaceholder.textContent = data.username.charAt(0).toUpperCase();
                }
            } catch (err) {
                errorEl.textContent = 'Ошибка загрузки профиля';
                errorEl.classList.remove('hidden');
            }
        };

        loadProfile();

        bioInput.addEventListener('input', () => {
            charCount.textContent = `${bioInput.value.length}/500`;
        });

        avatarUpload.addEventListener('change', async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (event) => {
                avatarImg.src = event.target?.result as string;
                avatarImg.style.display = 'block';
                avatarPlaceholder.style.display = 'none';
            };
            reader.readAsDataURL(file);
            await this.uploadAvatar(file, errorEl);
        });

        saveBtn.addEventListener('click', async () => {
            saveBtn.disabled = true;
            saveBtn.textContent = '⏳ Сохранение...';
            try {
                const csrfToken = (document.getElementById('csrf-token') as HTMLInputElement).value;
                const response = await fetch('/api/profile', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                        'X-CSRFToken': csrfToken
                    },
                    body: JSON.stringify({ bio: bioInput.value.trim() || null })
                });
                if (!response.ok) throw new Error('Ошибка сохранения');
                this.showNotification('Профиль обновлён', false);
                removeModal();
            } catch (err) {
                errorEl.textContent = 'Ошибка сохранения';
                errorEl.classList.remove('hidden');
            } finally {
                saveBtn.disabled = false;
                saveBtn.textContent = 'Сохранить';
            }
        });

        const removeModal = () => {
            modalElement.remove();
            document.removeEventListener('keydown', escapeHandler);
        };
        const escapeHandler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') removeModal();
        };
        cancelBtn.addEventListener('click', removeModal);
        const closeBtn = modalElement.querySelector('.profile-modal-close');
        closeBtn?.addEventListener('click', removeModal);
        modalElement.addEventListener('click', (e) => {
            if (e.target === modalElement) removeModal();
        });
        document.addEventListener('keydown', escapeHandler);
    }

    private async uploadAvatar(file: File, errorEl: HTMLElement) {
        const formData = new FormData();
        formData.append('avatar', file);
        const csrfToken = (document.getElementById('csrf-token') as HTMLInputElement).value;
        try {
            const response = await fetch('/api/profile/avatar', {
                method: 'POST',
                headers: { 'X-CSRFToken': csrfToken },
                body: formData
            });
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Ошибка загрузки');
            }
            this.showNotification('Аватар обновлён', false);
        } catch (err: any) {
            errorEl.textContent = err.message;
            errorEl.classList.remove('hidden');
        }
    }

    updateGroupHeader(info: any) {
        this.elements.chatPartnerName.textContent = info.name;
    }
}
