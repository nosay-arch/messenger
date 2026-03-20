import { ChatApplication } from './main';
import { getCsrfToken } from './utils';

export class Auth {
    private app: ChatApplication;
    isSubmitting = false;
    isLoginMode = true;

    constructor(app: ChatApplication) {
        this.app = app;
        this.attachListeners();
    }

    private attachListeners() {
        const toggleBtn = document.getElementById('auth-toggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleMode();
            });
        }
        const submitBtn = document.getElementById('auth-submit');
        if (submitBtn) {
            submitBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleAuth();
            });
        }
        const passwordField = document.getElementById('auth-password') as HTMLInputElement;
        if (passwordField) {
            passwordField.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.handleAuth();
            });
        }
    }

    toggleMode() {
        this.isLoginMode = !this.isLoginMode;
        const title = document.getElementById('auth-title');
        const subtitle = document.getElementById('auth-subtitle');
        const submitBtn = document.getElementById('auth-submit') as HTMLButtonElement;
        const toggleBtn = document.getElementById('auth-toggle') as HTMLButtonElement;
        const confirmGroup = document.getElementById('password-confirm-group');

        if (this.isLoginMode) {
            if (title) title.textContent = 'Вход';
            if (subtitle) subtitle.textContent = 'Введите свои данные';
            if (submitBtn) submitBtn.textContent = 'Войти';
            if (toggleBtn) toggleBtn.textContent = 'Нет аккаунта? Зарегистрироваться';
            if (confirmGroup) confirmGroup.classList.add('hidden');
        } else {
            if (title) title.textContent = 'Регистрация';
            if (subtitle) subtitle.textContent = 'Создайте новый аккаунт';
            if (submitBtn) submitBtn.textContent = 'Зарегистрироваться';
            if (toggleBtn) toggleBtn.textContent = 'Уже есть аккаунт? Войти';
            if (confirmGroup) confirmGroup.classList.remove('hidden');
        }
        this.clearError();
    }

    private clearError() {
        const errorEl = document.getElementById('auth-error');
        if (errorEl) {
            errorEl.textContent = '';
            errorEl.classList.add('hidden');
        }
    }

    private showError(message: string) {
        const errorEl = document.getElementById('auth-error');
        if (errorEl) {
            errorEl.textContent = message;
            errorEl.classList.remove('hidden');
        } else {
            alert(message);
        }
    }

    async handleAuth() {
        if (this.isSubmitting) return;

        const loginField = document.getElementById('auth-login') as HTMLInputElement;
        const passwordField = document.getElementById('auth-password') as HTMLInputElement;

        const login = loginField?.value.trim();
        const password = passwordField?.value.trim();

        if (!login || !password) {
            this.showError('Заполните все поля');
            return;
        }

        if (this.isLoginMode) {
            await this.performLogin(login, password);
        } else {
            const confirmField = document.getElementById('auth-password-confirm') as HTMLInputElement;
            const confirm = confirmField?.value.trim();
            if (!confirm) {
                this.showError('Подтвердите пароль');
                return;
            }
            if (password !== confirm) {
                this.showError('Пароли не совпадают');
                return;
            }
            if (password.length < 8) {
                this.showError('Пароль должен быть не менее 8 символов');
                return;
            }
            await this.performRegister(login, password);
        }
    }

    private async performLogin(username: string, password: string) {
        this.setSubmitting(true);
        try {
            const csrfToken = getCsrfToken();
            const response = await fetch('/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRFToken': csrfToken
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (!response.ok) {
                this.showError(data.error || 'Ошибка входа');
                return;
            }

            this.app.currentUserId = data.id;
            this.app.currentUsername = data.username;
            this.completeLogin();
        } catch (err) {
            this.showError('Ошибка соединения');
            console.error('Login error:', err);
        } finally {
            this.setSubmitting(false);
        }
    }

    private async performRegister(username: string, password: string) {
        this.setSubmitting(true);
        try {
            const csrfToken = getCsrfToken();
            const response = await fetch('/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRFToken': csrfToken
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (!response.ok) {
                this.showError(data.error || 'Ошибка регистрации');
                return;
            }

            await this.performLogin(username, password);
        } catch (err) {
            this.showError('Ошибка соединения');
            console.error('Register error:', err);
        } finally {
            this.setSubmitting(false);
        }
    }

    private setSubmitting(state: boolean) {
        this.isSubmitting = state;
        const submitBtn = document.getElementById('auth-submit') as HTMLButtonElement;
        if (submitBtn) {
            submitBtn.disabled = state;
            submitBtn.textContent = state ? '⏳ Подождите...' : (this.isLoginMode ? 'Войти' : 'Зарегистрироваться');
        }
    }

    private completeLogin() {
        const elements = this.app.ui.elements;
        if (elements.authOverlay) elements.authOverlay.classList.add('hidden');
        if (elements.mainInterface) elements.mainInterface.classList.remove('hidden');
        if (elements.popupUsername) elements.popupUsername.textContent = this.app.currentUsername;
        if (elements.inputArea) elements.inputArea.classList.add('hidden');
        this.app.socket.connect();
        this.resetForm();
    }

    private resetForm() {
        const loginField = document.getElementById('auth-login') as HTMLInputElement;
        const passwordField = document.getElementById('auth-password') as HTMLInputElement;
        const confirmField = document.getElementById('auth-password-confirm') as HTMLInputElement;
        if (loginField) loginField.value = '';
        if (passwordField) passwordField.value = '';
        if (confirmField) confirmField.value = '';
        this.clearError();
    }

    async tryAutoLogin() {
        try {
            const response = await fetch('/api/auth/me', {
                headers: { 'X-Requested-With': 'XMLHttpRequest' },
            });
            if (response.ok) {
                const data = await response.json();
                this.app.currentUserId = data.id;
                this.app.currentUsername = data.username;

                if (window.location.pathname === '/login') {
                    window.location.href = '/';
                    return;
                }

                const elements = this.app.ui.elements;
                if (elements.loadingScreen) elements.loadingScreen.classList.add('hidden');
                if (elements.mainInterface) elements.mainInterface.classList.remove('hidden');
                if (elements.popupUsername) elements.popupUsername.textContent = this.app.currentUsername;
                if (elements.inputArea) elements.inputArea.classList.add('hidden');
                this.app.socket.connect();
            } else {
                this.showAuthScreen();
            }
        } catch (err) {
            console.error('Auto login error:', err);
            this.showAuthScreen();
        }
    }

    private showAuthScreen() {
        if (window.location.pathname === '/login') return;

        const elements = this.app.ui.elements;
        if (elements.loadingScreen) elements.loadingScreen.classList.add('hidden');
        if (elements.authOverlay) elements.authOverlay.classList.remove('hidden');
        setTimeout(() => {
            const loginField = document.getElementById('auth-login') as HTMLInputElement;
            if (loginField) loginField.focus();
        }, 100);
    }

    async logout() {
        try {
            const csrfToken = getCsrfToken();
            const response = await fetch('/auth/logout', {
                method: 'POST',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRFToken': csrfToken
                },
            });
            if (response.ok) {
                if (this.app.socket) {
                    this.app.socket.manualDisconnect = true;
                    this.app.socket.chatSocket.disconnect();
                    this.app.socket.presenceSocket.disconnect();
                    this.app.socket.groupSocket.disconnect();
                }
                location.reload();
            } else {
                this.app.ui.showNotification('Ошибка при выходе');
            }
        } catch (err) {
            this.app.ui.showNotification('Ошибка соединения');
            console.error('Logout error:', err);
        }
    }
}
