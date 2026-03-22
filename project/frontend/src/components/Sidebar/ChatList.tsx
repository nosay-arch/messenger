import React, { useMemo } from 'react';
import { useChat } from '../../contexts/ChatContext';
import { formatTime, escapeHtml } from '../../services/utils';

export const ChatList: React.FC = () => {
  const { chats, currentChatId, unreadCounts, switchChat } = useChat();

  const sortedChats = useMemo(() => {
    return Object.values(chats).sort((a, b) => {
      if (!a.lastTime) return 1;
      if (!b.lastTime) return -1;
      return new Date(b.lastTime).getTime() - new Date(a.lastTime).getTime();
    });
  }, [chats]);

  if (sortedChats.length === 0) {
    return (
      <div className="chats-empty">
        <i className="fas fa-comments"></i>
        <p>Нет чатов. Начните диалог с пользователем</p>
      </div>
    );
  }

  return (
    <>
      {sortedChats.map(chat => (
        <div
          key={chat.id}
          className={`chat-item ${chat.id === currentChatId ? 'active' : ''}`}
          onClick={() => switchChat(chat.id)}
        >
          <div className="chat-avatar">
            {chat.avatarUrl ? (
              <img src={chat.avatarUrl} alt="" />
            ) : chat.type === 'group' ? (
              <i className="fas fa-users"></i>
            ) : (
              chat.name.charAt(0).toUpperCase()
            )}
          </div>
          <div className="chat-info">
            <div className="chat-name">
              {chat.type === 'group' && <i className="fas fa-users"></i>}
              {escapeHtml(chat.name)}
            </div>
            <div className="chat-last-msg">{escapeHtml(chat.lastMessage?.substring(0, 30) || '')}</div>
          </div>
          <div className="chat-meta">
            {unreadCounts[chat.id] > 0 && (
              <span className="unread-badge">{unreadCounts[chat.id]}</span>
            )}
            <span className="chat-time">{formatTime(chat.lastTime || '')}</span>
          </div>
        </div>
      ))}
    </>
  );
};
