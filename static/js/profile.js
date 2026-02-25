class ProfileManager {
    constructor(app) {
        this.app = app;
        this.setupProfileMenuButton();
    }

    setupProfileMenuButton() {
        const userMenuBtn = document.getElementById('user-menu-button');
        if (userMenuBtn) {
            userMenuBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleUserPopup();
            });
        }

        document.addEventListener('click', (e) => {
            const userPopup = document.getElementById('user-popup');
            if (userPopup && !userPopup.contains(e.target) && !userMenuBtn.contains(e.target)) {
                userPopup?.classList.add('hidden');
            }
        });
    }

    toggleUserPopup() {
        const userPopup = document.getElementById('user-popup');
        if (userPopup) {
            userPopup.classList.toggle('hidden');
        }
    }

    async openProfileMenu() {
        const userPopup = document.getElementById('user-popup');
        if (userPopup) {
            userPopup.classList.add('hidden');
        }

        const profileModal = document.getElementById('profile-modal');
        if (!profileModal) {
            this.createProfileModal();
        } else {
            document.getElementById('profile-modal').classList.remove('hidden');
            await this.loadProfileData();
        }
    }

    createProfileModal() {
        const modal = document.createElement('div');
        modal.id = 'profile-modal';
        modal.className = 'profile-modal hidden';
        modal.innerHTML = `
            <div class="profile-modal-content">
                <div class="profile-modal-header">
                    <h3>Профиль</h3>
                    <button class="profile-modal-close" id="profile-modal-close">✕</button>
                </div>
                <div id="profile-error" class="error-message hidden"></div>
                
                <div class="profile-section">
                    <label>Имя пользователя</label>
                    <input type="text" id="profile-modal-username" disabled>
                </div>
                
                <div class="profile-section">
                    <label>Номер телефона</label>
                    <input type="text" id="profile-modal-phone" disabled>
                </div>
                
                <div class="profile-section">
                    <label>О себе</label>
                    <textarea id="profile-modal-bio" placeholder="Расскажите о себе..." maxlength="500"></textarea>
                    <div class="char-count" id="bio-char-count">0/500</div>
                </div>
                
                <div class="profile-section">
                    <label>Аватар URL</label>
                    <input type="text" id="profile-modal-avatar" placeholder="Ссылка на аватар">
                </div>
                
                <div class="profile-actions">
                    <button id="profile-save-btn" class="btn-primary">Сохранить</button>
                    <button id="profile-cancel-btn" class="btn-secondary">Отмена</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        this.setupProfileModalEvents();
        this.loadProfileData();
    }

    setupProfileModalEvents() {
        const closeBtn = document.getElementById('profile-modal-close');
        const cancelBtn = document.getElementById('profile-cancel-btn');
        const saveBtn = document.getElementById('profile-save-btn');
        const bioInput = document.getElementById('profile-modal-bio');

        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeProfileModal());
        }

        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.closeProfileModal());
        }

        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveProfile());
        }

        if (bioInput) {
            bioInput.addEventListener('input', (e) => {
                const charCount = document.getElementById('bio-char-count');
                if (charCount) {
                    charCount.textContent = `${e.target.value.length}/500`;
                }
            });
        }

        document.getElementById('profile-modal')?.addEventListener('click', (e) => {
            if (e.target.id === 'profile-modal') {
                this.closeProfileModal();
            }
        });
    }

    async loadProfileData() {
        try {
            const response = await fetch('/api/profile', {
                headers: { 'X-Requested-With': 'XMLHttpRequest' }
            });

            if (!response.ok) {
                this.showProfileError('Ошибка загрузки профиля');
                return;
            }

            const data = await response.json();

            document.getElementById('profile-modal-username').value = data.username || '';
            document.getElementById('profile-modal-phone').value = data.phone || '';
            document.getElementById('profile-modal-bio').value = data.bio || '';
            document.getElementById('profile-modal-avatar').value = data.avatar_url || '';

            const charCount = document.getElementById('bio-char-count');
            if (charCount) {
                charCount.textContent = `${(data.bio || '').length}/500`;
            }

            this.clearProfileError();
        } catch (err) {
            this.showProfileError('Ошибка загрузки профиля');
        }
    }

    async saveProfile() {
        const saveBtn = document.getElementById('profile-save-btn');
        const originalText = saveBtn?.textContent;

        if (saveBtn) {
            saveBtn.textContent = '⏳ Сохранение...';
            saveBtn.disabled = true;
        }

        try {
            const bio = document.getElementById('profile-modal-bio').value.trim();
            const avatarUrl = document.getElementById('profile-modal-avatar').value.trim();

            const csrfToken = document.getElementById('csrf-token').value;
            const response = await fetch('/api/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRFToken': csrfToken
                },
                body: JSON.stringify({
                    bio: bio || null,
                    avatar_url: avatarUrl || null
                })
            });

            if (!response.ok) {
                this.showProfileError('Ошибка сохранения профиля');
                return;
            }

            this.app.ui.showNotification('Профиль обновлен', false);
            this.closeProfileModal();
        } catch (err) {
            this.showProfileError('Ошибка соединения');
        } finally {
            if (saveBtn) {
                saveBtn.textContent = originalText;
                saveBtn.disabled = false;
            }
        }
    }

    closeProfileModal() {
        const modal = document.getElementById('profile-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    showProfileError(message) {
        const errorEl = document.getElementById('profile-error');
        if (errorEl) {
            errorEl.textContent = message;
            errorEl.classList.remove('hidden');
        }
    }

    clearProfileError() {
        const errorEl = document.getElementById('profile-error');
        if (errorEl) {
            errorEl.textContent = '';
            errorEl.classList.add('hidden');
        }
    }
}
