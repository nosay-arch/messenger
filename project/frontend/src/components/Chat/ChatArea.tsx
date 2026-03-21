import React from 'react';
import { useChat } from '../../contexts/ChatContext';
import { ChatHeader } from './ChatHeader';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { ChatPlaceholder } from './ChatPlaceholder';

interface ChatAreaProps {
  onBack?: () => void;
}

export const ChatArea: React.FC<ChatAreaProps> = ({ onBack }) => {
  const { currentChatId, isLoadingHistory, messages } = useChat();

  if (!currentChatId && !isLoadingHistory) {
    return <ChatPlaceholder />;
  }

  if (isLoadingHistory) {
    return <div className="loader"></div>;
  }

  return (
    <div className="chat-area">
      <ChatHeader onBack={onBack} />
      <MessageList messages={messages} />
      <MessageInput />
    </div>
  );
};
