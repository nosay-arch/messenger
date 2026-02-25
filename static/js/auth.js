class PhoneAuth {
    constructor(app) {
        this.app = app;
        this.currentStep = 'phone';
        this.phoneNumber = '';
        this.isSubmitting = false;
        this.setupEventListeners();
    }

    setupEventListeners() {
        const phoneInput = document.getElementById('phone-input');
        const codeInput = document.getElementById('code-input');
        const usernameInput = document.getElementById('profile-username-input');
        
        if (phoneInput) {
            phoneInput.addEventListener('input', () => this.clearError());
        }
        if (codeInput) {
            codeInput.addEventListener('input', () => {
                this.clearError();
                if (codeInput.value.length === 6) {
                    this.handleVerifyCode();
                }
            });
        }
        if (usernameInput) {
            usernameInput.addEventListener('input', () => this.clearError());
        }
    }

    clearError() {
        const errorEl = document.getElementById('phone-error');
        if (errorEl) {
            errorEl.textContent = '';
            errorEl.classList.add('hidden');
        }
    }

    showError(message) {
        const errorEl = document.getElementById('phone-error');
        if (errorEl) {
            errorEl.textContent = message;
            errorEl.classList.remove('hidden');
        }
    }

    async handleSendCode() {
        if (this.isSubmitting) return;
        
        const phoneInput = document.getElementById('phone-input');
        if (!phoneInput || !phoneInput.value.trim()) {
            this.showError('Введите номер телефона');
            return;
        }

        this.isSubmitting = true;
        const sendBtn = document.getElementById('phone-send-btn');
        const originalText = sendBtn?.textContent;

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
                this.showError(data.error || 'Ошибка при отправке кода');
                return;
            }

            this.phoneNumber = phoneInput.value.trim();
            this.currentStep = 'code';
            this.showCodeStep(data.masked_phone);
        } catch (err) {
            this.showError('Ошибка соединения');
        } finally {
            this.isSubmitting = false;
            if (sendBtn) sendBtn.textContent = originalText;
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
            if (codeInput) codeInput.focus();
        }
    }

    async handleVerifyCode() {
        if (this.isSubmitting) return;

        const codeInput = document.getElementById('code-input');
        if (!codeInput || !codeInput.value.trim() || codeInput.value.length !== 6) {
            return;
        }

        this.isSubmitting = true;
        const code = codeInput.value.trim();

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
                    code
                })
            });

            const data = await response.json();

            if (!response.ok) {
                this.showError(data.error || 'Ошибка проверки кода');
                if (codeInput) codeInput.value = '';
                return;
            }

            if (data.exists) {
                this.app.currentUserId = data.user_id;
                this.app.currentUsername = data.username;
                this.completeLogin();
            } else {
                this.currentStep = 'profile';
                this.showProfileStep();
            }
        } catch (err) {
            this.showError('Ошибка соединения');
            if (codeInput) codeInput.value = '';
        } finally {
            this.isSubmitting = false;
        }
    }

    showProfileStep() {
        const codeStep = document.getElementById('code-step');
        const profileStep = document.getElementById('profile-step');

        if (codeStep) codeStep.classList.add('hidden');
        if (profileStep) {
            profileStep.classList.remove('hidden');
            const usernameInput = document.getElementById('profile-username-input');
            if (usernameInput) usernameInput.focus();
        }
    }

    async handleCompleteProfile() {
        if (this.isSubmitting) return;

        const usernameInput = document.getElementById('profile-username-input');
        if (!usernameInput || !usernameInput.value.trim()) {
            this.showError('Введите имя пользователя');
            return;
        }

        this.isSubmitting = true;
        const registerBtn = document.getElementById('profile-register-btn');
        const originalText = registerBtn?.textContent;
        if (registerBtn) registerBtn.textContent = '⏳ Регистрация...';

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
                    username: usernameInput.value.trim()
                })
            });

            const data = await response.json();

            if (!response.ok) {
                this.showError(data.error || 'Ошибка регистрации');
                return;
            }

            this.app.currentUserId = data.user_id;
            this.app.currentUsername = data.username;
            this.completeLogin();
        } catch (err) {
            this.showError('Ошибка соединения');
        } finally {
            this.isSubmitting = false;
            if (registerBtn) registerBtn.textContent = originalText;
        }
    }

    completeLogin() {
        const elements = this.app.ui.elements;
        elements.authOverlay.classList.add('hidden');
        elements.mainInterface.classList.remove('hidden');
        elements.popupUsername.textContent = this.app.currentUsername;
        elements.inputArea.classList.add('hidden');
        this.app.socket.connect();
        this.resetForm();
    }

    resetForm() {
        const phoneInput = document.getElementById('phone-input');
        const codeInput = document.getElementById('code-input');
        const usernameInput = document.getElementById('profile-username-input');

        if (phoneInput) phoneInput.value = '';
        if (codeInput) codeInput.value = '';
        if (usernameInput) usernameInput.value = '';

        this.clearError();
        this.currentStep = 'phone';

        document.getElementById('phone-step')?.classList.remove('hidden');
        document.getElementById('code-step')?.classList.add('hidden');
        document.getElementById('profile-step')?.classList.add('hidden');
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
            this.clearError();
        } else if (this.currentStep === 'profile') {
            this.currentStep = 'code';
            const codeStep = document.getElementById('code-step');
            const profileStep = document.getElementById('profile-step');
            if (codeStep) codeStep.classList.remove('hidden');
            if (profileStep) profileStep.classList.add('hidden');
            this.clearError();
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
                this.app.ui.elements.loadingScreen.classList.add('hidden');
                this.app.ui.elements.mainInterface.classList.remove('hidden');
                this.app.ui.elements.popupUsername.textContent = this.app.currentUsername;
                this.app.ui.elements.inputArea.classList.add('hidden');
                this.app.socket.connect();
            } else {
                this.showAuthScreen();
            }
        } catch {
            this.showAuthScreen();
        }
    }

    showAuthScreen() {
        this.app.ui.elements.loadingScreen.classList.add('hidden');
        this.app.ui.elements.authOverlay.classList.remove('hidden');
    }

    async logout() {
        try {
            const csrfToken = document.getElementById('csrf-token').value;
            const response = await fetch('/logout', {
                method: 'POST',
                headers: { 'X-Requested-With': 'XMLHttpRequest', 'X-CSRFToken': csrfToken },
            });
            if (response.ok) {
                if (this.app.socket.socket) this.app.socket.socket.disconnect();
                this.app.ui.closeSidebar();
                location.reload();
            } else {
                this.app.ui.showNotification('Ошибка при выходе');
            }
        } catch {
            this.app.ui.showNotification('Ошибка соединения');
        }
    }
}
