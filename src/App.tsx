import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AuthForm } from './components/auth/AuthForm';
import { Navigation } from './components/layout/Navigation';
import { NewsFeed } from './components/feed/NewsFeed';
import { FriendsPage } from './components/friends/FriendsPage';
import { ProfilePage } from './components/profile/ProfilePage';

function AppContent() {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState<'feed' | 'friends' | 'profile'>('feed');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-500 text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navigation currentPage={currentPage} onNavigate={setCurrentPage} />
      <main className="max-w-7xl mx-auto px-4 py-8">
        {currentPage === 'feed' && <NewsFeed />}
        {currentPage === 'friends' && <FriendsPage />}
        {currentPage === 'profile' && <ProfilePage />}
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
