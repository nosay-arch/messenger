import React, { useState, useEffect } from 'react';

export const Notification: React.FC = () => {
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(true);

  useEffect(() => {
    const handleNotify = (event: CustomEvent<{ message: string; isError: boolean }>) => {
      setMessage(event.detail.message);
      setIsError(event.detail.isError);
      setTimeout(() => setMessage(null), 3000);
    };
    window.addEventListener('notify', handleNotify as EventListener);
    return () => window.removeEventListener('notify', handleNotify as EventListener);
  }, []);

  if (!message) return null;
  return (
    <div
      className="notification show"
      style={{ background: isError ? '#c62828' : '#4f7eb3' }}
    >
      {message}
    </div>
  );
};

export const showNotification = (message: string, isError = true) => {
  window.dispatchEvent(new CustomEvent('notify', { detail: { message, isError } }));
};
