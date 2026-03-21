import React from 'react';

export const ChatPlaceholder: React.FC = () => {
  return (
    <div className="chat-placeholder">
      <div className="placeholder-icon">
        <i className="fas fa-comment-dots"></i>
      </div>
      <div className="placeholder-title">Мессенджер</div>
      <div className="placeholder-sub">Выберите чат, чтобы начать общение</div>
    </div>
  );
};
