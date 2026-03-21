import React from 'react';
import { useChat } from '../../contexts/ChatContext';
import { TypingIndicator } from './TypingIndicator';

interface ChatHeaderProps {
  onBack?: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({ onBack }) => {
  const { chats, currentChatId, currentChatPartnerId, typingUsers } = useChat();
  const chat = currentChatId ? chats[currentChatId] : null;
  const isGroup = chat?.type === 'group';
  const isPrivate = chat?.type === 'private';

  const avatarUrl = chat?.avatarUrl;
  const partnerName = chat?.name || 'Чат';

  const handleAvatarClick = () => {
    if (isPrivate && currentChatPartnerId) {
      // open user profile modal
    }
  };

  return (
    <div className="chat-header">
      {onBack && (
        <button className="back-button" onClick={onBack}>
          <i className="fas fa-arrow-left"></i>
        </button>
      )}
      <div className="chat-header-avatar" onClick={handleAvatarClick}>
        {avatarUrl ? (
          <img src={avatarUrl} alt="" />
        ) : (
          <div className="chat-avatar-placeholder">{partnerName.charAt(0).toUpperCase()}</div>
        )}
      </div>
      <div className="chat-header-info">
        <div className="chat-partner-name">{partnerName}</div>
        <div className="online-status">
          {isPrivate ? (
            <span>○ офлайн</span> // status will be updated via socket
          ) : (
            typingUsers.size > 0 && <TypingIndicator />
          )}
        </div>
      </div>
    </div>
  );
};
