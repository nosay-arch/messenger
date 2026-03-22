import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useChat } from '../../contexts/ChatContext';
import { showNotification } from '../Common/Notification';

export const UserMenu: React.FC = () => {
  const { user, logout } = useAuth();
  const { socket } = useChat();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    if (socket) socket.disconnect();
    await logout();
    showNotification('Вы вышли из системы', false);
  };

  const openProfile = () => {
    setOpen(false);
    window.dispatchEvent(new CustomEvent('openProfileModal'));
  };

  const openCreateGroup = () => {
    setOpen(false);
    window.dispatchEvent(new CustomEvent('openCreateGroupModal'));
  };

  return (
    <div className="user-menu-wrapper" ref={menuRef}>
      <button className="user-menu-button" onClick={() => setOpen(!open)}>
        <i className="fas fa-ellipsis-v"></i>
      </button>
      <div className={`user-popup ${open ? '' : 'hidden'}`}>
        <div className="popup-header">
          <div className="popup-username">{user?.username}</div>
        </div>
        <div className="popup-divider"></div>
        <button className="popup-item" onClick={openProfile}>
          <i className="fas fa-user"></i> Профиль
        </button>
        <button className="popup-item" onClick={openCreateGroup}>
          <i className="fas fa-users"></i> Создать группу
        </button>
        <div className="popup-divider"></div>
        <button className="popup-item logout" onClick={handleLogout}>
          <i className="fas fa-sign-out-alt"></i> Выйти
        </button>
        <div className="popup-footer">
          <div className="popup-version">v1.0</div>
        </div>
      </div>
    </div>
  );
};
