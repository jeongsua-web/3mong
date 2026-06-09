import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ACCESS_TOKEN } from './constants/storage';

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
import WrongAnswerPage from './pages/WrongAnswerPage'

function PrivateRoute({ children }) {
  if (import.meta.env.VITE_SKIP_AUTH === 'true') return children;
  const token = localStorage.getItem(ACCESS_TOKEN);
  return token ? children : <Navigate to="/login" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/" element={<Navigate to={import.meta.env.VITE_SKIP_AUTH === 'true' ? "/home" : "/login"} />} />
 
        {/* 2. 로그인 / 회원가입 */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        {/* 3. 인증 필요한 독립 채팅창 */}
        <Route path="/chat/:roomId" element={<PrivateRoute><ChatPage /></PrivateRoute>} />

        {/* 4. 공통 레이아웃이 필요한 페이지들 (인증 필요) */}
        <Route path="/*" element={<PrivateRoute><Layout /></PrivateRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

function Layout() {
  const location = useLocation();

  return (
    <div className='container'>
      <Sidebar />
      <div className='main'>
        {!['/friends', '/chat-list', '/add-friends', '/custom-friend'].includes(location.pathname) && <Header />}
        <div className="content">
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