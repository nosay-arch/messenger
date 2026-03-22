import React, { useRef, useEffect, useCallback, useLayoutEffect } from 'react';
import { Message } from './Message';
import { Message as MessageType } from '../../types';
import { useChat } from '../../contexts/ChatContext';

interface MessageListProps {
  messages: MessageType[];
}

export const MessageList: React.FC<MessageListProps> = ({ messages }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { currentChatId, hasMoreHistory, loadMoreHistory, historyOffsets } = useChat();
  const loadingRef = useRef(false);
  const prevMessagesLengthRef = useRef(messages.length);
  const prevLastMessageIdRef = useRef<number | null>(null);

  // Группировка сообщений по дате
  const groupMessagesByDate = () => {
    const groups: { date: string; messages: MessageType[] }[] = [];
    messages.forEach(msg => {
      const date = new Date(msg.timestamp).toLocaleDateString();
      const lastGroup = groups[groups.length - 1];
      if (lastGroup && lastGroup.date === date) {
        lastGroup.messages.push(msg);
      } else {
        groups.push({ date, messages: [msg] });
      }
    });
    return groups;
  };

  const groups = groupMessagesByDate();

  const handleScroll = useCallback(() => {
    if (!containerRef.current || !currentChatId) return;
    const { scrollTop } = containerRef.current;
    if (scrollTop <= 10 && hasMoreHistory[currentChatId] && !loadingRef.current) {
      loadingRef.current = true;
      const offset = historyOffsets[currentChatId] || 0;
      loadMoreHistory(currentChatId, offset);
      setTimeout(() => {
        loadingRef.current = false;
      }, 1000);
    }
  }, [currentChatId, hasMoreHistory, historyOffsets, loadMoreHistory]);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  // Определяем, было ли добавлено новое сообщение (в конец) или в начало (подгрузка истории)
  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const newLength = messages.length;
    const lastMessage = messages[messages.length - 1];
    const newLastId = lastMessage?.id ?? null;
    const prevLastId = prevLastMessageIdRef.current;

    const wasNewMessageAdded =
      newLength > prevMessagesLengthRef.current &&
      newLastId !== prevLastId &&
      (newLastId !== null && prevLastId !== null);

    if (wasNewMessageAdded) {
      container.scrollTop = container.scrollHeight;
    } else if (newLength > prevMessagesLengthRef.current) {
      const oldScrollHeight = container.scrollHeight;
      // ignore
    }

    prevMessagesLengthRef.current = newLength;
    prevLastMessageIdRef.current = newLastId;
  }, [messages]);

  return (
    <div className="messages-container" ref={containerRef}>
      {groups.map((group, idx) => (
        <React.Fragment key={group.date}>
          {idx > 0 && <div className="date-separator">{group.date}</div>}
          {group.messages.map(msg => (
            <Message key={msg.id} message={msg} />
          ))}
        </React.Fragment>
      ))}
    </div>
  );
};
