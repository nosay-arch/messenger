import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';

interface DeleteConfirmModalProps {
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({ onConfirm, onCancel }) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onCancel]);

  return ReactDOM.createPortal(
    <div className="modal" style={{ display: 'block' }} onClick={onCancel}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <span className="close" onClick={onCancel}>×</span>
        <div className="modal-icon-danger">
          <i className="fas fa-exclamation-triangle"></i>
        </div>
        <h3>Удалить сообщение?</h3>
        <p className="modal-desc">
          Это действие нельзя отменить. Сообщение будет удалено для всех участников чата.
        </p>
        <div className="modal-actions">
          <button className="modal-btn modal-btn-danger" onClick={onConfirm}>
            <i className="fas fa-trash-alt" style={{ marginRight: '6px' }}></i>
            Удалить
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
