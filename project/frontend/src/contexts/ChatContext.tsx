import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import { useAuth } from './AuthContext';
import { Chat, Message, GroupInfo } from '../types';
import { SocketManager, ChatEventHandlers } from '../services/SocketManager';
import { usersAPI } from '../services/api';

interface ChatContextType {
  chats: Record<string, Chat>;
  currentChatId: string | null;
  messages: Message[];
  unreadCounts: Record<string, number>;
  typingUsers: Set<string>;
  isLoadingHistory: boolean;
  currentChatPartner: string | null;
  currentChatPartnerId: number | null;
  groupInfo: GroupInfo | null;
  setCurrentChatId: (id: string | null) => void;
  sendMessage: (text: string) => void;
  switchChat: (chatId: string) => void;
  loadChatAvatar: (chatId: string, username: string) => Promise<void>;
  loadChatPartnerProfile: (chatId: string) => Promise<void>;
  createGroup: (name: string, description: string, memberIds: number[]) => void;
  addUserToGroup: (chatId: string, userId: number) => void;
  removeUserFromGroup: (chatId: string, userId: number) => void;
  leaveGroup: (chatId: string) => void;
  fetchGroupInfo: (chatId: string) => void;
  deleteMessage: (messageId: number) => void;
  editMessage: (messageId: number, newText: string) => void;
  socket: SocketManager | null;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();

  const [chats, setChats] = useState<Record<string, Chat>>({});
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [currentChatPartner, setCurrentChatPartner] = useState<string | null>(null);
  const [currentChatPartnerId, setCurrentChatPartnerId] = useState<number | null>(null);
  const [groupInfo, setGroupInfo] = useState<GroupInfo | null>(null);
  const [socket, setSocket] = useState<SocketManager | null>(null);

  const currentChatIdRef = useRef(currentChatId);
  const userRef = useRef(user);
  const chatsRef = useRef(chats);
  const unreadCountsRef = useRef(unreadCounts);

  useEffect(() => {
    currentChatIdRef.current = currentChatId;
  }, [currentChatId]);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    chatsRef.current = chats;
  }, [chats]);

  useEffect(() => {
    unreadCountsRef.current = unreadCounts;
  }, [unreadCounts]);

  // Handlers for socket events
  const handleChatList = useCallback((data: any[]) => {
    const newChats: Record<string, Chat> = {};
    data.forEach(c => {
      newChats[c.id] = {
        id: c.id,
        name: c.name,
        type: c.type,
        lastMessage: c.lastMessage || '',
        lastTime: c.lastTime || '',
        avatarUrl: undefined,
      };
    });
    setChats(newChats);
  }, []);

  const handleUnreadCounts = useCallback((data: Record<string, number>) => {
    setUnreadCounts(data);
  }, []);

  const handleChatCreated = useCallback((chat: any) => {
    setChats(prev => ({
      ...prev,
      [chat.id]: {
        id: chat.id,
        name: chat.name,
        type: chat.type,
        lastMessage: '',
        lastTime: '',
        avatarUrl: undefined,
      },
    }));
    // Switch to new chat after creation
    setCurrentChatId(chat.id);
  }, []);

  const handleChatHistory = useCallback((data: { chat_id: string; messages: Message[] }) => {
    if (data.chat_id === currentChatIdRef.current) {
      setMessages(data.messages);
      setIsLoadingHistory(false);
      socket?.emitChat('mark_read', { chat_id: currentChatIdRef.current });
    }
  }, [socket]);

  const handleNewMessage = useCallback((msg: Message) => {
    // Update last message in chat list
    setChats(prev => {
      const chat = prev[msg.chat_id];
      if (chat) {
        const lastMessageText = msg.is_deleted ? 'Сообщение удалено' : msg.text;
        return {
          ...prev,
          [msg.chat_id]: {
            ...chat,
            lastMessage: lastMessageText,
            lastTime: msg.timestamp,
          },
        };
      }
      return prev;
    });

    if (msg.chat_id === currentChatIdRef.current) {
      setMessages(prev => [...prev, msg]);
      // Mark as read
      socket?.emitChat('mark_read', { chat_id: currentChatIdRef.current });
    } else {
      if (msg.user_id !== userRef.current?.id) {
        setUnreadCounts(prev => ({
          ...prev,
          [msg.chat_id]: (prev[msg.chat_id] || 0) + 1,
        }));
      }
    }
  }, [socket]);

  const handleTyping = useCallback((data: { chat_id: string; username: string; typing: boolean }) => {
    if (data.chat_id !== currentChatIdRef.current) return;
    setTypingUsers(prev => {
      const newSet = new Set(prev);
      if (data.typing) newSet.add(data.username);
      else newSet.delete(data.username);
      return newSet;
    });
  }, []);

  const handleMessageDeleted = useCallback((data: { message_id: number }) => {
    setMessages(prev =>
      prev.map(m => (m.id === data.message_id ? { ...m, is_deleted: true, text: '' } : m))
    );
  }, []);

  const handleMessageEdited = useCallback((data: Message) => {
    setMessages(prev =>
      prev.map(m => (m.id === data.id ? { ...m, text: data.text, edited: true } : m))
    );
  }, []);

  const handleUserOnline = useCallback((data: { username: string }) => {
    // Not used directly, but can be used for status updates
  }, []);

  const handleUserOffline = useCallback((data: { username: string }) => {
    // Not used directly, but can be used for status updates
  }, []);

  const handleGroupCreated = useCallback((chatInfo: any) => {
    setChats(prev => ({
      ...prev,
      [chatInfo.id]: {
        id: chatInfo.id,
        name: chatInfo.name,
        type: chatInfo.type,
        lastMessage: '',
        lastTime: '',
        avatarUrl: undefined,
      },
    }));
    setCurrentChatId(chatInfo.id);
  }, []);

  const handleGroupInfo = useCallback((info: GroupInfo) => {
    setGroupInfo(info);
  }, []);

  const handleGroupInfoUpdated = useCallback((info: any) => {
    if (currentChatIdRef.current === info.id) {
      setChats(prev => ({
        ...prev,
        [info.id]: { ...prev[info.id], name: info.name },
      }));
    }
    // If modal is open, we'll show updated info later via state
  }, []);

  const handleRemovedFromGroup = useCallback((data: { chat_id: string }) => {
    setChats(prev => {
      const newChats = { ...prev };
      delete newChats[data.chat_id];
      return newChats;
    });
    if (currentChatIdRef.current === data.chat_id) {
      setCurrentChatId(null);
    }
  }, []);

  const handleLeftGroup = useCallback((data: { chat_id: string }) => {
    setChats(prev => {
      const newChats = { ...prev };
      delete newChats[data.chat_id];
      return newChats;
    });
    if (currentChatIdRef.current === data.chat_id) {
      setCurrentChatId(null);
    }
  }, []);

  const handleDisconnect = useCallback((reason: string) => {
    // Show notification (handled elsewhere)
  }, []);

  const handleReconnect = useCallback(() => {
    // Request fresh data after reconnect
    socket?.emitChat('get_chat_list', {});
    if (currentChatIdRef.current) {
      socket?.emitChat('join_chat', { chat_id: currentChatIdRef.current });
    }
  }, [socket]);

  const handleError = useCallback((data: any) => {
    console.error('Socket error:', data);
  }, []);

  // Create socket when authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const handlers: ChatEventHandlers = {
      onChatList: handleChatList,
      onUnreadCounts: handleUnreadCounts,
      onChatCreated: handleChatCreated,
      onChatHistory: handleChatHistory,
      onNewMessage: handleNewMessage,
      onTyping: handleTyping,
      onMessageDeleted: handleMessageDeleted,
      onMessageEdited: handleMessageEdited,
      onUserOnline: handleUserOnline,
      onUserOffline: handleUserOffline,
      onGroupCreated: handleGroupCreated,
      onGroupInfo: handleGroupInfo,
      onGroupInfoUpdated: handleGroupInfoUpdated,
      onRemovedFromGroup: handleRemovedFromGroup,
      onLeftGroup: handleLeftGroup,
      onDisconnect: handleDisconnect,
      onReconnect: handleReconnect,
      onError: handleError,
    };

    const newSocket = new SocketManager(handlers);
    newSocket.connect();
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [
    isAuthenticated,
    handleChatList,
    handleUnreadCounts,
    handleChatCreated,
    handleChatHistory,
    handleNewMessage,
    handleTyping,
    handleMessageDeleted,
    handleMessageEdited,
    handleUserOnline,
    handleUserOffline,
    handleGroupCreated,
    handleGroupInfo,
    handleGroupInfoUpdated,
    handleRemovedFromGroup,
    handleLeftGroup,
    handleDisconnect,
    handleReconnect,
    handleError,
  ]);

  // Load chat avatars when chats change
  useEffect(() => {
    Object.entries(chats).forEach(([chatId, chat]) => {
      if (chat.type === 'private' && !chat.avatarUrl) {
        usersAPI.getProfileByUsername(chat.name)
          .then(userData => {
            setChats(prev => ({
              ...prev,
              [chatId]: { ...prev[chatId], avatarUrl: userData.avatar_url },
            }));
          })
          .catch(console.error);
      }
    });
  }, [chats]);

  // Actions
  const sendMessage = useCallback(
    (text: string) => {
      if (!currentChatId || !socket) return;
      socket.emitChat('new_message', { chat_id: currentChatId, text });
    },
    [currentChatId, socket]
  );

  const switchChat = useCallback(
    (chatId: string) => {
      if (!socket) return;
      if (currentChatId) {
        socket.emitChat('typing', { chat_id: currentChatId, typing: false });
      }
      setCurrentChatId(chatId);
      setIsLoadingHistory(true);
      setMessages([]);
      socket.emitChat('join_chat', { chat_id: chatId });
    },
    [socket, currentChatId]
  );

  const loadChatAvatar = useCallback(async (chatId: string, username: string) => {
    try {
      const userData = await usersAPI.getProfileByUsername(username);
      setChats(prev => ({
        ...prev,
        [chatId]: { ...prev[chatId], avatarUrl: userData.avatar_url },
      }));
    } catch (err) {
      console.error(err);
    }
  }, []);

  const loadChatPartnerProfile = useCallback(
    async (chatId: string) => {
      const chat = chats[chatId];
      if (!chat || chat.type !== 'private') return;
      try {
        const userData = await usersAPI.getProfileByUsername(chat.name);
        setCurrentChatPartnerId(userData.id);
        // avatar will be loaded separately
      } catch (err) {
        console.error(err);
      }
    },
    [chats]
  );

  const createGroup = useCallback(
    (name: string, description: string, memberIds: number[]) => {
      if (!socket) return;
      socket.emitGroup('create_group', { name, description, member_ids: memberIds });
    },
    [socket]
  );

  const addUserToGroup = useCallback(
    (chatId: string, userId: number) => {
      socket?.emitGroup('add_to_group', { chat_id: chatId, user_id: userId });
    },
    [socket]
  );

  const removeUserFromGroup = useCallback(
    (chatId: string, userId: number) => {
      socket?.emitGroup('remove_from_group', { chat_id: chatId, user_id: userId });
    },
    [socket]
  );

  const leaveGroup = useCallback(
    (chatId: string) => {
      if (window.confirm('Вы уверены, что хотите покинуть группу?')) {
        socket?.emitGroup('leave_group', { chat_id: chatId });
      }
    },
    [socket]
  );

  const fetchGroupInfo = useCallback(
    (chatId: string) => {
      socket?.emitGroup('get_group_info', { chat_id: chatId });
    },
    [socket]
  );

  const deleteMessage = useCallback(
    (messageId: number) => {
      if (!currentChatId) return;
      socket?.emitChat('delete_message', { chat_id: currentChatId, message_id: messageId });
    },
    [currentChatId, socket]
  );

  const editMessage = useCallback(
    (messageId: number, newText: string) => {
      if (!currentChatId) return;
      socket?.emitChat('edit_message', {
        chat_id: currentChatId,
        message_id: messageId,
        text: newText,
      });
    },
    [currentChatId, socket]
  );

  const value: ChatContextType = {
    chats,
    currentChatId,
    messages,
    unreadCounts,
    typingUsers,
    isLoadingHistory,
    currentChatPartner,
    currentChatPartnerId,
    groupInfo,
    setCurrentChatId,
    sendMessage,
    switchChat,
    loadChatAvatar,
    loadChatPartnerProfile,
    createGroup,
    addUserToGroup,
    removeUserFromGroup,
    leaveGroup,
    fetchGroupInfo,
    deleteMessage,
    editMessage,
    socket,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChat = () => {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used within ChatProvider');
  return ctx;
};
