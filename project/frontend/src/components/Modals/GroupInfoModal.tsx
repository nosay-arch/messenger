import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useChat } from '../../contexts/ChatContext';
import { useAuth } from '../../contexts/AuthContext';
import { usersAPI } from '../../services/api';
import { debounce, escapeHtml } from '../../services/utils';
import { showNotification } from '../Common/Notification';

interface GroupInfoModalProps {
  groupInfo: any;
  onClose: () => void;
}

export const GroupInfoModal: React.FC<GroupInfoModalProps> = ({ groupInfo, onClose }) => {
  const { addUserToGroup, removeUserFromGroup, leaveGroup, fetchGroupInfo } = useChat();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ id: number; username: string }>>([]);
  const [showResults, setShowResults] = useState(false);
  const [members, setMembers] = useState(groupInfo.members);
  const [memberCount, setMemberCount] = useState(groupInfo.member_count);
  const [description, setDescription] = useState(groupInfo.description);
  const [name, setName] = useState(groupInfo.name);
  const [loading, setLoading] = useState(false);

  const isCreator = groupInfo.created_by === user?.id;

  const performSearch = debounce(async (q: string) => {
    if (q.length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }
    try {
      const users = await usersAPI.search(q);
      const existingIds = new Set(members.map((m: any) => m.id));
      const filtered = users.filter((u: any) => !existingIds.has(u.id));
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
      const target = e.target as HTMLElement;
      if (!target.closest('.search-results') && !target.closest('#group-info-search')) {
        setShowResults(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleAddUser = async (userId: number) => {
    setLoading(true);
    try {
      addUserToGroup(groupInfo.id, userId);
      setSearchQuery('');
      setShowResults(false);
      showNotification('Пользователь добавлен в группу', false);
    } catch (err) {
      showNotification('Ошибка добавления пользователя', true);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveUser = (userId: number, username: string) => {
    if (window.confirm(`Удалить ${username} из группы?`)) {
      removeUserFromGroup(groupInfo.id, userId);
    }
  };

  const handleLeave = () => {
    if (isCreator) {
      if (window.confirm('Вы создатель группы. Удаление группы приведет к удалению всех сообщений. Продолжить?')) {
        leaveGroup(groupInfo.id);
        onClose();
      }
    } else {
      if (window.confirm('Вы уверены, что хотите покинуть группу?')) {
        leaveGroup(groupInfo.id);
        onClose();
      }
    }
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  useEffect(() => {
    setMembers(groupInfo.members);
    setMemberCount(groupInfo.member_count);
    setDescription(groupInfo.description);
    setName(groupInfo.name);
  }, [groupInfo]);

  return ReactDOM.createPortal(
    <div className="modal" style={{ display: 'block' }} onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <span className="close" onClick={onClose}>×</span>

        <div className="group-info-meta">
          <h3>{escapeHtml(name)}</h3>
          {description && <p className="group-description">{escapeHtml(description)}</p>}
          <div className="member-count-badge">
            <i className="fas fa-users"></i>
            <span>{memberCount} участников</span>
          </div>
        </div>

        <div className="section-label">Участники</div>
        <div className="members-list">
          {members.map((m: any) => (
            <div key={m.id} className="member-item">
              <div className="member-avatar">
                {m.avatar_url ? (
                  <img src={m.avatar_url} alt={m.username} />
                ) : (
                  <div className="member-avatar-placeholder">
                    {m.username.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="member-info">
                <span className="member-name">{escapeHtml(m.username)}</span>
                {m.is_creator && <span className="member-badge">Создатель</span>}
              </div>
              {isCreator && !m.is_creator && (
                <button
                  className="remove-member-btn"
                  onClick={() => handleRemoveUser(m.id, m.username)}
                  title="Удалить участника"
                >
                  <i className="fas fa-user-minus"></i>
                </button>
              )}
            </div>
          ))}
        </div>

        {isCreator && (
          <div className="add-member-section">
            <div className="section-label" style={{ marginTop: '16px' }}>Добавить участника</div>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                id="group-info-search"
                placeholder="Поиск по имени..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                disabled={loading}
              />
              {showResults && (
                <div className="search-results show" style={{ position: 'absolute', width: '100%' }}>
                  {searchResults.length === 0 ? (
                    <div className="empty-message">Пользователи не найдены</div>
                  ) : (
                    searchResults.map((user: any) => (
                      <div
                        key={user.id}
                        className="result-item"
                        onClick={() => handleAddUser(user.id)}
                      >
                        <span className="avatar">{user.username.charAt(0).toUpperCase()}</span>
                        <span className="username">{escapeHtml(user.username)}</span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        <button id="leave-group-btn" onClick={handleLeave} className={isCreator ? 'btn-danger' : 'btn-secondary'}>
          <i className={`fas ${isCreator ? 'fa-trash-alt' : 'fa-sign-out-alt'}`} style={{ marginRight: '8px' }}></i>
          {isCreator ? 'Удалить группу' : 'Покинуть группу'}
        </button>
      </div>
    </div>,
    document.body
  );
};
