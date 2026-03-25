import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useChat } from '../../contexts/ChatContext';
import { profileAPI } from '../../services/api';
import { showNotification } from '../Common/Notification';

interface ProfileModalProps {
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ onClose }) => {
  const { user, logout } = useAuth();
  const { socket } = useChat();
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  useEffect(() => {
    profileAPI.get()
      .then(data => {
        setBio(data.bio || '');
        setAvatarUrl(data.avatar_url || null);
      })
      .catch(() => setError('Ошибка загрузки профиля'));
  }, []);

  const handleSave = async () => {
    if (bio.length > 500) {
      setError('Био не может превышать 500 символов');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await profileAPI.update(bio.trim());
      showNotification('Профиль обновлён', false);
      onClose();
    } catch (err) {
      setError('Ошибка сохранения профиля');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Проверка размера файла (10 MB)
    if (file.size > 10 * 1024 * 1024) {
      showNotification('Файл слишком большой (макс. 10 MB)', true);
      return;
    }

    // Проверка типа файла
    if (!file.type.startsWith('image/')) {
      showNotification('Пожалуйста, выберите изображение', true);
      return;
    }

    setAvatarPreview(URL.createObjectURL(file));

    try {
      const response = await profileAPI.uploadAvatar(file);
      setAvatarUrl(response.avatar_url);
      showNotification('Аватар обновлён', false);
      socket?.emitChat('get_chat_list', {});
    } catch (err) {
      showNotification('Ошибка загрузки аватара', true);
      setAvatarPreview(null);
    }
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return ReactDOM.createPortal(
    <div className="profile-modal" style={{ display: 'flex' }} onClick={onClose}>
      <div className="profile-modal-content" onClick={e => e.stopPropagation()}>
        <div className="profile-modal-header">
          <h3>Мой профиль</h3>
          <button className="profile-modal-close" onClick={onClose}>×</button>
        </div>
        {error && <div className="error-message" style={{ marginBottom: '16px' }}>{error}</div>}

        <div className="profile-section avatar-upload-section" style={{ textAlign: 'center' }}>
          <label className="avatar-upload-trigger">
            <div className="profile-avatar-large">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar preview" />
              ) : avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" />
              ) : (
                <div className="profile-avatar-placeholder">
                  {user?.username?.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="avatar-edit-overlay">
                <i className="fas fa-camera"></i>
                <span>Изменить</span>
              </div>
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              style={{ display: 'none' }}
            />
          </label>
        </div>

        <div className="profile-section">
          <label>Имя пользователя</label>
          <input type="text" value={user?.username || ''} disabled />
        </div>

        <div className="profile-section">
          <label>О себе</label>
          <textarea
            value={bio}
            onChange={e => setBio(e.target.value.slice(0, 500))}
            rows={3}
            placeholder="Расскажите о себе..."
            maxLength={500}
          />
          <div className="char-count">{bio.length}/500</div>
        </div>

        <div className="profile-actions">
          <button className="btn-primary" onClick={handleSave} disabled={loading}>
            {loading ? 'Сохранение...' : 'Сохранить'}
          </button>
          <button className="btn-secondary" onClick={onClose}>
            Отмена
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
