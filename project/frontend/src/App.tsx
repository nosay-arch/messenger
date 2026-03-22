import React, { useState, useEffect } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { ChatProvider } from './contexts/ChatContext';
import { MainLayout } from './components/Layout/MainLayout';
import { AuthOverlay } from './components/Auth/AuthOverlay';
import { Loader } from './components/Common/Loader';
import { Notification } from './components/Common/Notification';
import { useAuth } from './contexts/AuthContext';
import { ProfileModal, CreateGroupModal, UserProfileModal } from './components/Modals';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [createGroupModalOpen, setCreateGroupModalOpen] = useState(false);
  const [userProfileModalOpen, setUserProfileModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  useEffect(() => {
    const handleOpenProfile = () => setProfileModalOpen(true);
    const handleOpenCreateGroup = () => setCreateGroupModalOpen(true);
    const handleOpenUserProfile = (e: CustomEvent<{ userId: number }>) => {
      setSelectedUserId(e.detail.userId);
      setUserProfileModalOpen(true);
    };
    window.addEventListener('openProfileModal', handleOpenProfile);
    window.addEventListener('openCreateGroupModal', handleOpenCreateGroup);
    window.addEventListener('openUserProfileModal', handleOpenUserProfile as EventListener);
    return () => {
      window.removeEventListener('openProfileModal', handleOpenProfile);
      window.removeEventListener('openCreateGroupModal', handleOpenCreateGroup);
      window.removeEventListener('openUserProfileModal', handleOpenUserProfile as EventListener);
    };
  }, []);

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
      {profileModalOpen && <ProfileModal onClose={() => setProfileModalOpen(false)} />}
      {createGroupModalOpen && <CreateGroupModal onClose={() => setCreateGroupModalOpen(false)} />}
      {userProfileModalOpen && selectedUserId && (
        <UserProfileModal userId={selectedUserId} onClose={() => setUserProfileModalOpen(false)} />
      )}
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
