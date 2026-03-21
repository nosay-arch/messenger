import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';

interface EditMessageModalProps {
  currentText: string;
  onConfirm: (newText: string) => void;
  onCancel: () => void;
}

export const EditMessageModal: React.FC<EditMessageModalProps> = ({
  currentText,
  onConfirm,
  onCancel,
}) => {
  const [text, setText] = useState(currentText);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onCancel]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (text.trim()) onConfirm(text.trim());
    }
  };

  return ReactDOM.createPortal(
    <div className="modal" style={{ display: 'block' }} onClick={onCancel}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <span className="close" onClick={onCancel}>&times;</span>
        <h3>Редактировать сообщение</h3>
        <input
          type="text"
          className="edit-message-input"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyPress={handleKeyPress}
          ref={inputRef}
        />
        <div className="modal-actions">
          <button className="modal-btn modal-btn-primary" onClick={() => onConfirm(text)}>
            Сохранить
          </button>
          <button className="modal-btn modal-btn-secondary" onClick={onCancel}>
            Отмена
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
