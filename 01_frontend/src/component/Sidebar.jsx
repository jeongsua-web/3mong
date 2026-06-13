import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Users, MessageSquare, FileText, Settings, ChevronLeft, Menu } from 'lucide-react';

const NAV = [
  { path: '/home', label: '홈', Icon: Home },
  { path: '/friends', label: 'AI 친구', Icon: Users },
  { path: '/chat-list', label: 'AI 채팅', Icon: MessageSquare },
  { path: '/wrong-answer', label: '오답노트', Icon: FileText },
];

const Sidebar = ({ isOpen, onToggle }) => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <aside className="sidebar">
      {isOpen ? (
        <div className="sidebar-logo" onClick={() => navigate('/home')}>
          <img src="/logo.PNG" alt="Fluento 로고" style={{ height: '64px', objectFit: 'contain' }} />
          <span className="sidebar-logo-text">Fluento</span>
          <button
            className="sidebar-toggle-btn"
            onClick={e => { e.stopPropagation(); onToggle(); }}
            title="사이드바 닫기"
          >
            <ChevronLeft size={16} />
          </button>
        </div>
      ) : (
        <div className="sidebar-logo sidebar-logo-collapsed">
          <button
            className="sidebar-hamburger-btn"
            onClick={onToggle}
            title="사이드바 열기"
          >
            <Menu size={18} />
          </button>
        </div>
      )}

      <nav className="sidebar-nav">
        {NAV.map(({ path, label, Icon }) => (
          <button
            key={path}
            className={`sidebar-nav-btn${location.pathname === path ? ' active' : ''}`}
            onClick={() => navigate(path)}
            title={!isOpen ? label : undefined}
          >
            <span className="nav-icon"><Icon size={18} /></span>
            {isOpen && label}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button
          className={`sidebar-nav-btn${location.pathname === '/settings' ? ' active' : ''}`}
          onClick={() => navigate('/settings')}
          title={!isOpen ? '설정' : undefined}
        >
          <span className="nav-icon"><Settings size={18} /></span>
          {isOpen && '설정'}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
