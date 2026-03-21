import React from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { ChatProvider } from './contexts/ChatContext';
import { MainLayout } from './components/Layout/MainLayout';
import { AuthOverlay } from './components/Auth/AuthOverlay';
import { Loader } from './components/Common/Loader';
import { Notification } from './components/Common/Notification';
import { useAuth } from './contexts/AuthContext';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loader />;
  }

  if (!user) {
    return <AuthOverlay />;
  }

  return (
    <>
      <MainLayout />
      <Notification />
    </>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <ChatProvider>
        <AppContent />
      </ChatProvider>
    </AuthProvider>
  );
};
