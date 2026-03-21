import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useChat } from '../../contexts/ChatContext';
import { Message as MessageType } from '../../types';
import { formatTime, escapeHtml } from '../../services/utils';
import { DeleteConfirmModal, EditMessageModal } from '../Modals';

interface MessageProps {
  message: MessageType;
}

export const Message: React.FC<MessageProps> = ({ message }) => {
  const { user } = useAuth();
  const { deleteMessage, editMessage } = useChat();
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const isOwn = message.user_id === user?.id;

  const handleEdit = () => {
    setShowMenu(false);
    setShowEditModal(true);
  };

  const handleDelete = () => {
    setShowMenu(false);
    setShowDeleteModal(true);
  };

  const onEditConfirm = (newText: string) => {
    if (newText.trim() && newText !== message.text) {
      editMessage(message.id, newText.trim());
    }
  };

  const onDeleteConfirm = () => {
    deleteMessage(message.id);
  };

  return (
    <>
      <div className={`message ${isOwn ? 'own' : 'other'} ${message.is_deleted ? 'deleted' : ''}`}>
        {!isOwn && (
          <div className="avatar" data-user-id={message.user_id}>
            {message.avatar_url ? (
              <img src={message.avatar_url} alt="" />
            ) : (
              message.nickname.charAt(0).toUpperCase()
            )}
          </div>
        )}
        <div className="message-content">
          {!isOwn && (
            <div className="message-nickname">
              <span className="clickable-nickname" data-user-id={message.user_id}>
                {escapeHtml(message.nickname)}
              </span>
            </div>
          )}
          <div className="bubble">
            <div className="message-row">
              <span className="message-text">
                {message.is_deleted
                  ? 'Сообщение удалено'
                  : escapeHtml(message.text)}
                {message.edited && !message.is_deleted && (
                  <span className="edited-indicator">ред.</span>
                )}
              </span>
              <span className="timestamp">{formatTime(message.timestamp)}</span>
            </div>
          </div>
        </div>
        {isOwn && !message.is_deleted && (
          <div className="message-actions" onClick={() => setShowMenu(!showMenu)}>
            ⋮
          </div>
        )}
        {showMenu && (
          <div className="message-actions-menu show">
            <button onClick={handleEdit}>Редактировать</button>
            <button onClick={handleDelete}>Удалить</button>
          </div>
        )}
      </div>
      {showDeleteModal && (
        <DeleteConfirmModal
          onConfirm={onDeleteConfirm}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}
      {showEditModal && (
        <EditMessageModal
          currentText={message.text}
          onConfirm={onEditConfirm}
          onCancel={() => setShowEditModal(false)}
        />
      )}
    </>
  );
};
