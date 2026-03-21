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
    }
  }, 300);

  useEffect(() => {
    performSearch(searchQuery);
  }, [searchQuery]);

  const handleAddUser = (userId: number) => {
    addUserToGroup(groupInfo.id, userId);
    setSearchQuery('');
    setShowResults(false);
  };

  const handleRemoveUser = (userId: number) => {
    if (confirm('Удалить участника?')) {
      removeUserFromGroup(groupInfo.id, userId);
    }
  };

  const handleLeave = () => {
    leaveGroup(groupInfo.id);
    onClose();
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
        <span className="close" onClick={onClose}>&times;</span>
        <div className="group-info-meta">
          <h3>{escapeHtml(name)}</h3>
          {description && <p>{escapeHtml(description)}</p>}
          <div className="member-count-badge">
            <i className="fas fa-users"></i> {memberCount} участников
          </div>
        </div>

        <div className="section-label">Участники</div>
        <div className="members-list">
          {members.map((m: any) => (
            <div key={m.id} className="member-item">
              <div className="member-avatar">
                {m.avatar_url ? (
                  <img src={m.avatar_url} alt="" />
                ) : (
                  <div className="member-avatar-placeholder">{m.username.charAt(0).toUpperCase()}</div>
                )}
              </div>
              <span>{escapeHtml(m.username)} {m.is_creator && '(создатель)'}</span>
              {isCreator && !m.is_creator && (
                <button className="remove-member-btn" onClick={() => handleRemoveUser(m.id)}>
                  Удалить
                </button>
              )}
            </div>
          ))}
        </div>

        {isCreator && (
          <div className="add-member-section">
            <input
              type="text"
              id="group-info-search"
              placeholder="Добавить участника..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            {showResults && (
              <div className="search-results show" style={{ position: 'absolute', width: '100%' }}>
                {searchResults.length === 0 ? (
                  <div className="empty-message">Ничего не найдено</div>
                ) : (
                  searchResults.map((user: any) => (
                    <div
                      key={user.id}
                      className="result-item"
                      onClick={() => handleAddUser(user.id)}
                    >
                      {user.username}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        <button id="leave-group-btn" onClick={handleLeave}>
          {isCreator ? 'Удалить группу' : 'Покинуть группу'}
        </button>
      </div>
    </div>,
    document.body
  );
};
