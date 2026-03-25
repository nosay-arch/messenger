import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { usersAPI } from '../../services/api';
import { escapeHtml } from '../../services/utils';

interface UserProfileModalProps {
  userId: number;
  onClose: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ userId, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState<{ username: string; bio?: string; avatar_url?: string } | null>(null);

  useEffect(() => {
    usersAPI.getProfile(userId)
      .then(data => {
        setProfile(data);
        setLoading(false);
      })
      .catch(() => {
        setError('Ошибка загрузки профиля');
        setLoading(false);
      });
  }, [userId]);

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
          <h3>Профиль пользователя</h3>
          <button className="profile-modal-close" onClick={onClose}>×</button>
        </div>

        {error && <div className="error-message">{error}</div>}

        {loading && (
          <div style={{ textAlign: 'center', padding: '32px' }}>
            <div className="loader"></div>
          </div>
        )}

        {profile && (
          <>
            <div className="profile-section" style={{ textAlign: 'center' }}>
              <div className="profile-avatar-large">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="Avatar" />
                ) : (
                  <div className="profile-avatar-placeholder">
                    {profile.username.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            </div>

            <div className="profile-section">
              <label>Имя пользователя</label>
              <div className="profile-field">{escapeHtml(profile.username)}</div>
            </div>

            <div className="profile-section">
              <label>О себе</label>
              <div className="profile-field">
                {profile.bio ? escapeHtml(profile.bio) : 'Пользователь пока ничего не рассказал о себе'}
              </div>
            </div>

            <div className="profile-actions">
              <button className="btn-secondary" onClick={onClose}>
                Закрыть
              </button>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  );
};
