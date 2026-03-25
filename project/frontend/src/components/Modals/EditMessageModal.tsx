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
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (text.trim() && text.trim() !== currentText) {
        onConfirm(text.trim());
      } else if (!text.trim()) {
        onCancel();
      } else {
        onCancel();
      }
    }
  };

  const handleConfirm = () => {
    if (text.trim() && text.trim() !== currentText) {
      onConfirm(text.trim());
    } else {
      onCancel();
    }
  };

  return ReactDOM.createPortal(
    <div className="modal" style={{ display: 'block' }} onClick={onCancel}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <span className="close" onClick={onCancel}>×</span>
        <h3>Редактировать сообщение</h3>
        <p className="modal-desc">Измените текст сообщения</p>
        <input
          type="text"
          className="edit-message-input"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyPress={handleKeyPress}
          ref={inputRef}
          maxLength={500}
        />
        <div className="modal-actions">
          <button className="modal-btn modal-btn-primary" onClick={handleConfirm}>
            <i className="fas fa-check" style={{ marginRight: '6px' }}></i>
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
