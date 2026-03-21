import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

export const AuthOverlay: React.FC = () => {
  const { login, register } = useAuth();
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!username.trim() || !password.trim()) {
      setError('Заполните все поля');
      return;
    }
    if (!isLoginMode) {
      if (!confirm.trim()) {
        setError('Подтвердите пароль');
        return;
      }
      if (password !== confirm) {
        setError('Пароли не совпадают');
        return;
      }
      if (password.length < 8) {
        setError('Пароль должен быть не менее 8 символов');
        return;
      }
    }

    setLoading(true);
    const success = isLoginMode
      ? await login(username, password)
      : await register(username, password);
    setLoading(false);
    if (!success) {
      setError(isLoginMode ? 'Ошибка входа' : 'Ошибка регистрации');
    }
  };

  const toggleMode = () => {
    setIsLoginMode(!isLoginMode);
    setError('');
    setUsername('');
    setPassword('');
    setConfirm('');
  };

  return (
    <div className="auth-overlay">
      <div className="auth-card">
        <h2 className="auth-card-title">{isLoginMode ? 'Вход' : 'Регистрация'}</h2>
        <p className="auth-card-subtitle">
          {isLoginMode ? 'Введите свои данные' : 'Создайте новый аккаунт'}
        </p>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <i className="fas fa-user"></i>
            <input
              type="text"
              placeholder="Имя пользователя"
              value={username}
              onChange={e => setUsername(e.target.value)}
              disabled={loading}
              autoFocus
            />
          </div>
          <div className="input-group">
            <i className="fas fa-lock"></i>
            <input
              type="password"
              placeholder="Пароль"
              value={password}
              onChange={e => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>
          {!isLoginMode && (
            <div className="input-group" id="password-confirm-group">
              <i className="fas fa-check-circle"></i>
              <input
                type="password"
                placeholder="Подтвердите пароль"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                disabled={loading}
              />
            </div>
          )}
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? '⏳ Подождите...' : isLoginMode ? 'Войти' : 'Зарегистрироваться'}
          </button>
        </form>
        <button className="btn-link" onClick={toggleMode} disabled={loading}>
          {isLoginMode ? 'Нет аккаунта? Зарегистрироваться' : 'Уже есть аккаунт? Войти'}
        </button>
      </div>
    </div>
  );
};
