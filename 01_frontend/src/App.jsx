import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ACCESS_TOKEN } from './constants/storage';
import { getSavedTheme, applyTheme } from './utils/theme';

import Sidebar from './component/Sidebar';
import Header from './component/Header';

import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import HomePage from './pages/HomePage';
import FriendsPage from './pages/FriendsPage';
import ChatListPage from './pages/ChatListPage';
import ChatPage from './pages/ChatPage';
import SettingsPage from './pages/SettingsPage';
import AddFriendsPage from './pages/AddFriendsPage';
import CustomFriendPage from './pages/CustomFriendPage';
import WrongAnswerPage from './pages/WrongAnswerPage';

function PrivateRoute({ children }) {
  if (import.meta.env.VITE_SKIP_AUTH === 'true') return children;
  const token = localStorage.getItem(ACCESS_TOKEN);
  return token ? children : <Navigate to="/login" replace />;
}

function App() {
  useEffect(() => {
    const theme = getSavedTheme();
    applyTheme(theme);

    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = () => applyTheme('system');
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to={import.meta.env.VITE_SKIP_AUTH === 'true' ? "/home" : "/login"} />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/chat/:roomId" element={<PrivateRoute><ChatPage /></PrivateRoute>} />
        <Route path="/*" element={<PrivateRoute><Layout /></PrivateRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

const NO_GENERIC_HEADER = ['/friends', '/chat-list', '/add-friends', '/custom-friend'];

function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const showHeader = !NO_GENERIC_HEADER.includes(location.pathname);

  return (
    <div className={`app-layout${sidebarOpen ? '' : ' sidebar-collapsed'}`}>
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(o => !o)} />
      <div className="app-main">
        {showHeader && <Header />}
        <div className="app-content">
          <Routes>
            <Route path="/home" element={<HomePage />} />
            <Route path="/friends" element={<FriendsPage />} />
            <Route path="/chat-list" element={<ChatListPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/add-friends" element={<AddFriendsPage />} />
            <Route path="/custom-friend" element={<CustomFriendPage />} />
            <Route path="/wrong-answer" element={<WrongAnswerPage />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

export default App;
