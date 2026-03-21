import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useAuth } from '../../contexts/AuthContext';
import { profileAPI } from '../../services/api';
import { showNotification } from '../Common/Notification';

interface ProfileModalProps {
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ onClose }) => {
  const { user, logout } = useAuth();
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
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
    setLoading(true);
    setError('');
    try {
      await profileAPI.update(bio.trim());
      showNotification('Профиль обновлён', false);
      onClose();
    } catch (err) {
      setError('Ошибка сохранения');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
    // Upload immediately
    const formData = new FormData();
    formData.append('avatar', file);
    profileAPI.uploadAvatar(file)
      .then(() => showNotification('Аватар обновлён', false))
      .catch(() => showNotification('Ошибка загрузки аватара', true));
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
          <h3>Профиль</h3>
          <button className="profile-modal-close" onClick={onClose}>&times;</button>
        </div>
        {error && <div id="profile-error">{error}</div>}
        <div className="profile-section avatar-upload-section">
          <label className="avatar-upload-trigger">
            <div className="profile-avatar-large">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar" />
              ) : avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" />
              ) : (
                <div className="profile-avatar-placeholder">
                  {user?.username.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="avatar-edit-overlay">
                <i className="fas fa-camera"></i>
                <span>Изменить</span>
              </div>
            </div>
            <input
              type="file"
              id="avatar-upload"
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
