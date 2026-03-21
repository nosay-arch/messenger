import React from 'react';
import { ChatList } from './ChatList';
import { Search } from './Search';
import { UserMenu } from './UserMenu';

export const Sidebar: React.FC = () => {
  return (
    <div className="chats-sidebar">
      <div className="chats-header">
        <div className="chats-header-left">
          <UserMenu />
        </div>
        <div className="chats-header-center">
          <Search />
        </div>
      </div>
      <div className="chats-section-header">Сообщения</div>
      <div className="chats-list-wrap">
        <div className="chats-list">
          <ChatList />
        </div>
      </div>
    </div>
  );
};
