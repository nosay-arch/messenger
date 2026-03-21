import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useChat } from '../../contexts/ChatContext';
import { usersAPI } from '../../services/api';
import { debounce, escapeHtml } from '../../services/utils';
import { showNotification } from '../Common/Notification';

interface CreateGroupModalProps {
  onClose: () => void;
}

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({ onClose }) => {
  const { createGroup } = useChat();
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<Map<number, { id: number; username: string }>>(new Map());
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ id: number; username: string }>>([]);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const performSearch = debounce(async (q: string) => {
    if (q.length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }
    try {
      const users = await usersAPI.search(q);
      const filtered = users.filter((u: any) => !selectedUsers.has(u.id));
      setSearchResults(filtered);
      setShowResults(true);
    } catch (err) {
      console.error(err);
      showNotification('Ошибка поиска', true);
    }
  }, 300);

  useEffect(() => {
    performSearch(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const addUser = (user: { id: number; username: string }) => {
    setSelectedUsers(prev => new Map(prev).set(user.id, user));
    setSearchQuery('');
    setShowResults(false);
  };

  const removeUser = (id: number) => {
    setSelectedUsers(prev => {
      const newMap = new Map(prev);
      newMap.delete(id);
      return newMap;
    });
  };

  const handleCreate = () => {
    if (!name.trim()) {
      showNotification('Введите название группы', true);
      return;
    }
    const memberIds = Array.from(selectedUsers.keys());
    createGroup(name.trim(), description.trim(), memberIds);
    onClose();
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return ReactDOM.createPortal(
    <div className="modal" style={{ display: 'block' }} onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <span className="close" onClick={onClose}>&times;</span>
        <h3>Создать группу</h3>
        <div className="step-indicator">
          <div className={`step ${step === 1 ? 'active' : ''}`}>1. Участники</div>
          <div className={`step ${step === 2 ? 'active' : ''}`}>2. Информация</div>
        </div>

        {step === 1 && (
          <div className="step-content">
            <div className="user-search-area" ref={searchRef}>
              <input
                type="text"
                id="group-user-search"
                placeholder="Поиск пользователей..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              {showResults && (
                <div className="search-results show" style={{ position: 'absolute', width: '100%' }}>
                  {searchResults.length === 0 ? (
                    <div className="empty-message">Ничего не найдено</div>
                  ) : (
                    searchResults.map(user => (
                      <div
                        key={user.id}
                        className="result-item"
                        onClick={() => addUser(user)}
                      >
                        <span className="avatar">{user.username.charAt(0).toUpperCase()}</span>
                        <span className="username">{user.username}</span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
            <div className="selected-users">
              <h4>Выбранные участники ({selectedUsers.size})</h4>
              <div className="selected-users-list">
                {Array.from(selectedUsers.values()).map(user => (
                  <span key={user.id} className="user-chip">
                    <span className="chip-avatar">{user.username.charAt(0).toUpperCase()}</span>
                    <span className="chip-name">{escapeHtml(user.username)}</span>
                    <i className="fas fa-times" onClick={() => removeUser(user.id)}></i>
                  </span>
                ))}
              </div>
            </div>
            <div className="step-actions">
              <button
                id="group-next-step"
                onClick={() => setStep(2)}
                disabled={selectedUsers.size === 0}
              >
                Далее
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="step-content">
            <input
              type="text"
              id="group-name"
              placeholder="Название группы"
              value={name}
              onChange={e => setName(e.target.value)}
            />
            <textarea
              id="group-description"
              placeholder="Описание (необязательно)"
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
            <div className="step-actions">
              <button id="group-back-step" onClick={() => setStep(1)}>
                Назад
              </button>
              <button id="create-group-btn" onClick={handleCreate} disabled={!name.trim()}>
                Создать
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};
