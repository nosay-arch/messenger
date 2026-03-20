import { ChatApplication } from './main';

export class ProfileManager {
    private app: ChatApplication;

    constructor(app: ChatApplication) {
        this.app = app;
        this.setupMenuItems();
    }

    private setupMenuItems() {
        const profileBtn = document.getElementById('popup-profile');
        if (profileBtn) {
            profileBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.openProfileModal();
            });
        }
        const createGroupBtn = document.getElementById('popup-create-group');
        if (createGroupBtn) {
            createGroupBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                document.getElementById('user-popup')?.classList.add('hidden');
                this.app.ui.showCreateGroupModal();
            });
        }
    }

    /**
     * Открывает модальное окно профиля.
     * @param userId - ID пользователя (если null или равен текущему, открывается свой профиль)
     */
    openProfileModal(userId: number | null = null) {
        const userPopup = document.getElementById('user-popup');
        if (userPopup) userPopup.classList.add('hidden');

        const isOwn = !userId || userId === this.app.currentUserId;
        const targetId = userId || this.app.currentUserId!;

        if (isOwn) {
            this.app.ui.showProfileModal();
        } else {
            this.app.ui.showUserProfileModal(targetId);
        }
    }
}
