import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../../contexts/ChatContext';
import { showNotification } from '../Common/Notification';

export const MessageInput: React.FC = () => {
  const { currentChatId, sendMessage, socket } = useChat();
  const [text, setText] = useState('');
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

  const handleTyping = () => {
    if (!currentChatId) return;
    socket?.emitChat('typing', { chat_id: currentChatId, typing: text.trim().length > 0 });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (text.trim().length > 0) {
      typingTimeoutRef.current = setTimeout(() => {
        if (currentChatId) {
          socket?.emitChat('typing', { chat_id: currentChatId, typing: false });
        }
      }, 2000);
    }
  };

  useEffect(() => {
    handleTyping();
  }, [text]);

  const handleSend = () => {
    if (!currentChatId) return;
    if (!text.trim()) return;
    if (text.length > 500) {
      showNotification('Сообщение слишком длинное (макс. 500)', true);
      return;
    }
    sendMessage(text);
    setText('');
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    socket?.emitChat('typing', { chat_id: currentChatId, typing: false });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="input-area">
      <input
        type="text"
        placeholder="Введите сообщение..."
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyPress={handleKeyPress}
        disabled={!currentChatId}
      />
      <button onClick={handleSend} disabled={!currentChatId}>
        <i className="fas fa-paper-plane"></i>
      </button>
    </div>
  );
};
