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
    if (selectedUsers.size >= 50) {
      showNotification('Группа не может содержать более 50 участников', true);
      return;
    }
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
    if (name.trim().length > 100) {
      showNotification('Название группы не должно превышать 100 символов', true);
      return;
    }
    if (description.length > 300) {
      showNotification('Описание не должно превышать 300 символов', true);
      return;
    }
    if (selectedUsers.size < 1) {
      showNotification('Выберите хотя бы одного участника', true);
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
        <span className="close" onClick={onClose}>×</span>
        <h3>Создать группу</h3>

        <div className="step-indicator">
          <div className={`step ${step === 1 ? 'active' : ''}`}>
            <span>1</span> Участники
          </div>
          <div className={`step ${step === 2 ? 'active' : ''}`}>
            <span>2</span> Информация
          </div>
        </div>

        {step === 1 && (
          <div className="step-content">
            <div className="user-search-area" ref={searchRef}>
              <input
                type="text"
                placeholder="Поиск пользователей..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                autoComplete="off"
              />
              {showResults && (
                <div className="search-results show" style={{ position: 'absolute', width: '100%' }}>
                  {searchResults.length === 0 ? (
                    <div className="empty-message">Пользователи не найдены</div>
                  ) : (
                    searchResults.map(user => (
                      <div
                        key={user.id}
                        className="result-item"
                        onClick={() => addUser(user)}
                      >
                        <span className="avatar">{user.username.charAt(0).toUpperCase()}</span>
                        <span className="username">{escapeHtml(user.username)}</span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            <div className="selected-users">
              <h4>Участники ({selectedUsers.size}/50)</h4>
              <div className="selected-users-list">
                {selectedUsers.size === 0 && (
                  <div className="empty-state">Добавьте участников через поиск</div>
                )}
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
                onClick={() => setStep(2)}
                disabled={selectedUsers.size === 0}
                className="btn-primary"
              >
                Далее
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="step-content">
            <div className="input-group">
              <label>Название группы *</label>
              <input
                type="text"
                placeholder="Например: Друзья, Коллеги"
                value={name}
                onChange={e => setName(e.target.value)}
                maxLength={100}
              />
            </div>

            <div className="input-group">
              <label>Описание</label>
              <textarea
                placeholder="Расскажите о группе..."
                rows={3}
                value={description}
                onChange={e => setDescription(e.target.value)}
                maxLength={300}
              />
              <div className="char-count">{description.length}/300</div>
            </div>

            <div className="step-actions">
              <button onClick={() => setStep(1)} className="btn-secondary">
                Назад
              </button>
              <button onClick={handleCreate} disabled={!name.trim()} className="btn-primary">
                Создать группу
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};
