import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../../contexts/ChatContext';
import { usersAPI } from '../../services/api';
import { debounce } from '../../services/utils';
import { showNotification } from '../Common/Notification';

export const Search: React.FC = () => {
  const { socket } = useChat();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Array<{ id: number; username: string }>>([]);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const performSearch = debounce(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }
    try {
      const users = await usersAPI.search(q);
      setResults(users);
      setShowResults(true);
    } catch (err) {
      console.error(err);
      showNotification('Ошибка поиска', true);
    }
  }, 300);

  useEffect(() => {
    performSearch(query);
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleSelect = (username: string) => {
    setQuery('');
    setShowResults(false);
    socket?.emitChat('create_private_chat', { username });
  };

  return (
    <div className="search-wrapper" ref={searchRef}>
      <i className="fas fa-search search-icon"></i>
      <input
        type="text"
        id="sidebar-user-search"
        placeholder="Поиск пользователей..."
        value={query}
        onChange={e => setQuery(e.target.value)}
      />
      {showResults && (
        <div className="search-results show">
          {results.length === 0 ? (
            <div className="empty-message">Ничего не найдено</div>
          ) : (
            results.map(user => (
              <div
                key={user.id}
                className="result-item"
                onClick={() => handleSelect(user.username)}
              >
                <span className="avatar">{user.username.charAt(0).toUpperCase()}</span>
                <span className="username">{user.username}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
