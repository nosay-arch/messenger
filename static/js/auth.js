class Auth {
    constructor(app) {
        this.app = app;
        this.currentStep = 'phone';
        this.phoneNumber = '';
        this.isSubmitting = false;
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Phone step
        const phoneInput = document.getElementById('phone-input');
        const phoneSendBtn = document.getElementById('phone-send-btn');
        
        if (phoneInput) {
            phoneInput.addEventListener('input', () => this.clearError('phone'));
            phoneInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.handleSendCode();
            });
        }
        
        if (phoneSendBtn) {
            phoneSendBtn.addEventListener('click', () => this.handleSendCode());
        }

        // Code step
        const codeInput = document.getElementById('code-input');
        const codeVerifyBtn = document.getElementById('code-verify-btn');
        const codeBackBtn = document.getElementById('code-back-btn');

        if (codeInput) {
            codeInput.addEventListener('input', () => {
                this.clearError('code');
                if (codeInput.value.length === 6) {
                    this.handleVerifyCode();
                }
            });
            codeInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && codeInput.value.length === 6) {
                    this.handleVerifyCode();
                }
            });
        }

        if (codeVerifyBtn) {
            codeVerifyBtn.addEventListener('click', () => this.handleVerifyCode());
        }

        if (codeBackBtn) {
            codeBackBtn.addEventListener('click', () => this.goBack());
        }

        // Profile step
        const usernameInput = document.getElementById('profile-username-input');
        const registerBtn = document.getElementById('profile-register-btn');
        const profileBackBtn = document.getElementById('profile-back-btn');

        if (usernameInput) {
            usernameInput.addEventListener('input', () => this.clearError('profile'));
            usernameInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.handleCompleteProfile();
            });
        }

        if (registerBtn) {
            registerBtn.addEventListener('click', () => this.handleCompleteProfile());
        }

        if (profileBackBtn) {
            profileBackBtn.addEventListener('click', () => this.goBack());
        }
    }

    clearError(type = 'phone') {
        const errorId = `${type}-error`;
        const errorEl = document.getElementById(errorId);
        if (errorEl) {
            errorEl.textContent = '';
            errorEl.classList.add('hidden');
        }
    }

    showError(message, type = 'phone') {
        const errorId = `${type}-error`;
        const errorEl = document.getElementById(errorId);
        if (errorEl) {
            errorEl.textContent = message;
            errorEl.classList.remove('hidden');
        }
    }

    async handleSendCode() {
        if (this.isSubmitting) return;

        const phoneInput = document.getElementById('phone-input');
        if (!phoneInput || !phoneInput.value.trim()) {
            this.showError('Введите номер телефона', 'phone');
            return;
        }

        this.isSubmitting = true;
        const sendBtn = document.getElementById('phone-send-btn');
        const originalText = sendBtn?.textContent;
        if (sendBtn) sendBtn.textContent = '⏳ Отправка...';
        if (sendBtn) sendBtn.disabled = true;

        try {
            const csrfToken = document.getElementById('csrf-token').value;
            const response = await fetch('/auth/send-code', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRFToken': csrfToken
                },
                body: JSON.stringify({ phone: phoneInput.value.trim() })
            });

            const data = await response.json();

            if (!response.ok) {
                this.showError(data.error || 'Ошибка при отправке кода', 'phone');
                return;
            }

            this.phoneNumber = phoneInput.value.trim();
            this.currentStep = 'code';
            this.showCodeStep(data.masked_phone);
        } catch (err) {
            this.showError('Ошибка соединения', 'phone');
            console.error('Send code error:', err);
        } finally {
            this.isSubmitting = false;
            if (sendBtn) {
                sendBtn.textContent = originalText;
                sendBtn.disabled = false;
            }
        }
    }

    showCodeStep(maskedPhone) {
        const phoneStep = document.getElementById('phone-step');
        const codeStep = document.getElementById('code-step');

        if (phoneStep) phoneStep.classList.add('hidden');
        if (codeStep) {
            codeStep.classList.remove('hidden');
            const phoneDisplay = codeStep.querySelector('.masked-phone');
            if (phoneDisplay) phoneDisplay.textContent = maskedPhone;
            const codeInput = document.getElementById('code-input');
            if (codeInput) {
                codeInput.focus();
                codeInput.value = '';
            }
        }
    }

    async handleVerifyCode() {
        if (this.isSubmitting) return;

        const codeInput = document.getElementById('code-input');
        if (!codeInput || !codeInput.value.trim() || codeInput.value.length !== 6) {
            this.showError('Введите 6-значный код', 'code');
            return;
        }

        this.isSubmitting = true;
        const verifyBtn = document.getElementById('code-verify-btn');
        const originalText = verifyBtn?.textContent;
        if (verifyBtn) {
            verifyBtn.textContent = '⏳ Проверка...';
            verifyBtn.disabled = true;
        }

        try {
            const csrfToken = document.getElementById('csrf-token').value;
            const response = await fetch('/auth/verify-code', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRFToken': csrfToken
                },
                body: JSON.stringify({
                    phone: this.phoneNumber,
                    code: codeInput.value.trim()
                })
            });

            const data = await response.json();

            if (!response.ok) {
                this.showError(data.error || 'Ошибка проверки кода', 'code');
                codeInput.value = '';
                return;
            }

            if (data.exists) {
                // Пользователь существует - входим
                this.app.currentUserId = data.user_id;
                this.app.currentUsername = data.username;
                this.completeLogin();
            } else {
                // Новый пользователь - показываем форму профиля
                this.currentStep = 'profile';
                this.showProfileStep();
            }
        } catch (err) {
            this.showError('Ошибка соединения', 'code');
            if (codeInput) codeInput.value = '';
            console.error('Verify code error:', err);
        } finally {
            this.isSubmitting = false;
            if (verifyBtn) {
                verifyBtn.textContent = originalText;
                verifyBtn.disabled = false;
            }
        }
    }

    showProfileStep() {
        const codeStep = document.getElementById('code-step');
        const profileStep = document.getElementById('profile-step');

        if (codeStep) codeStep.classList.add('hidden');
        if (profileStep) {
            profileStep.classList.remove('hidden');
            const usernameInput = document.getElementById('profile-username-input');
            if (usernameInput) {
                usernameInput.focus();
                usernameInput.value = '';
            }
        }
    }

    async handleCompleteProfile() {
        if (this.isSubmitting) return;

        const usernameInput = document.getElementById('profile-username-input');
        if (!usernameInput || !usernameInput.value.trim()) {
            this.showError('Введите имя пользователя', 'profile');
            return;
        }

        const username = usernameInput.value.trim();
        if (username.length < 3) {
            this.showError('Имя должно содержать минимум 3 символа', 'profile');
            return;
        }

        this.isSubmitting = true;
        const registerBtn = document.getElementById('profile-register-btn');
        const originalText = registerBtn?.textContent;
        if (registerBtn) {
            registerBtn.textContent = '⏳ Создание...';
            registerBtn.disabled = true;
        }

        try {
            const csrfToken = document.getElementById('csrf-token').value;
            const response = await fetch('/auth/register-by-phone', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRFToken': csrfToken
                },
                body: JSON.stringify({
                    phone: this.phoneNumber,
                    username: username
                })
            });

            const data = await response.json();

            if (!response.ok) {
                this.showError(data.error || 'Ошибка регистрации', 'profile');
                return;
            }

            this.app.currentUserId = data.user_id;
            this.app.currentUsername = data.username;
            this.completeLogin();
        } catch (err) {
            this.showError('Ошибка соединения', 'profile');
            console.error('Register error:', err);
        } finally {
            this.isSubmitting = false;
            if (registerBtn) {
                registerBtn.textContent = originalText;
                registerBtn.disabled = false;
            }
        }
    }

    completeLogin() {
        // Если это на странице логина (auth.html) - перейти на главную
        if (window.location.pathname === '/login') {
            window.location.href = '/';
            return;
        }
        
        // Если это в основном приложении - скрыть overlay и подключиться
        const elements = this.app.ui?.elements;
        if (elements && elements.authOverlay) elements.authOverlay.classList.add('hidden');
        if (elements && elements.mainInterface) elements.mainInterface.classList.remove('hidden');
        if (elements && elements.popupUsername) elements.popupUsername.textContent = this.app.currentUsername;
        if (elements && elements.inputArea) elements.inputArea.classList.add('hidden');
        if (this.app.socket) this.app.socket.connect();
        this.resetForm();
    }

    resetForm() {
        const phoneInput = document.getElementById('phone-input');
        const codeInput = document.getElementById('code-input');
        const usernameInput = document.getElementById('profile-username-input');
        const bioInput = document.getElementById('profile-bio-input');

        if (phoneInput) phoneInput.value = '';
        if (codeInput) codeInput.value = '';
        if (usernameInput) usernameInput.value = '';
        if (bioInput) bioInput.value = '';

        this.clearError('phone');
        this.clearError('code');
        this.clearError('profile');
        this.currentStep = 'phone';

        const phoneStep = document.getElementById('phone-step');
        const codeStep = document.getElementById('code-step');
        const profileStep = document.getElementById('profile-step');

        if (phoneStep) phoneStep.classList.remove('hidden');
        if (codeStep) codeStep.classList.add('hidden');
        if (profileStep) profileStep.classList.add('hidden');
    }

    goBack() {
        if (this.currentStep === 'code') {
            this.currentStep = 'phone';
            const phoneStep = document.getElementById('phone-step');
            const codeStep = document.getElementById('code-step');
            if (phoneStep) phoneStep.classList.remove('hidden');
            if (codeStep) codeStep.classList.add('hidden');
            const codeInput = document.getElementById('code-input');
            if (codeInput) codeInput.value = '';
            this.clearError('code');
            const phoneInput = document.getElementById('phone-input');
            if (phoneInput) phoneInput.focus();
        } else if (this.currentStep === 'profile') {
            this.currentStep = 'code';
            const codeStep = document.getElementById('code-step');
            const profileStep = document.getElementById('profile-step');
            if (codeStep) codeStep.classList.remove('hidden');
            if (profileStep) profileStep.classList.add('hidden');
            this.clearError('profile');
            const codeInput = document.getElementById('code-input');
            if (codeInput) codeInput.focus();
        }
    }

    async tryAutoLogin() {
        try {
            const response = await fetch('/api/me', {
                headers: { 'X-Requested-With': 'XMLHttpRequest' },
            });
            if (response.ok) {
                const data = await response.json();
                this.app.currentUserId = data.id;
                this.app.currentUsername = data.username;
                
                // Если это на странице логина - просто перейти на главную
                if (window.location.pathname === '/login') {
                    window.location.href = '/';
                    return;
                }
                
                // Если это в основном приложении
                const elements = this.app.ui?.elements;
                const loadingScreen = elements?.loadingScreen;
                const mainInterface = elements?.mainInterface;
                if (loadingScreen) loadingScreen.classList.add('hidden');
                if (mainInterface) mainInterface.classList.remove('hidden');
                if (elements?.popupUsername) {
                    elements.popupUsername.textContent = this.app.currentUsername;
                }
                if (elements?.inputArea) {
                    elements.inputArea.classList.add('hidden');
                }
                if (this.app.socket) this.app.socket.connect();
            } else {
                this.showAuthScreen();
            }
        } catch (err) {
            console.error('Auto login error:', err);
            this.showAuthScreen();
        }
    }

    showAuthScreen() {
        // Если это на странице логина, ничего не делаем
        if (window.location.pathname === '/login') {
            return;
        }
        
        const elements = this.app.ui?.elements;
        const loadingScreen = elements?.loadingScreen;
        const authOverlay = elements?.authOverlay;
        if (loadingScreen) loadingScreen.classList.add('hidden');
        if (authOverlay) authOverlay.classList.remove('hidden');
        const phoneInput = document.getElementById('phone-input');
        if (phoneInput) setTimeout(() => phoneInput.focus(), 100);
    }

    async logout() {
        try {
            const csrfToken = document.getElementById('csrf-token').value;
            const response = await fetch('/auth/logout', {
                method: 'POST',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRFToken': csrfToken
                },
            });
            if (response.ok) {
                if (this.app.socket && this.app.socket.socket) {
                    this.app.socket.socket.disconnect();
                }
                if (this.app.ui?.closeSidebar) {
                    this.app.ui.closeSidebar();
                }
                location.reload();
            } else {
                if (this.app.ui?.showNotification) {
                    this.app.ui.showNotification('Ошибка при выходе');
                }
            }
        } catch (err) {
            if (this.app.ui?.showNotification) {
                this.app.ui.showNotification('Ошибка соединения');
            }
            console.error('Logout error:', err);
        }
    }
}
