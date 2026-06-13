import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { USER_ID, USER_NAME } from '../constants/storage';
import { getMyProfile } from '../api/user';

const BackIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12"/>
    <polyline points="12 19 5 12 12 5"/>
  </svg>
);

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState(() => {
    const name = localStorage.getItem(USER_NAME);
    if (name) return name;
    const userId = localStorage.getItem(USER_ID) || '';
    return userId.includes('@') ? userId.split('@')[0] : (userId || '사용자');
  });

  useEffect(() => {
    getMyProfile()
      .then((res) => {
        const name = res?.data?.data?.name;
        if (name) {
          localStorage.setItem(USER_NAME, name);
          setDisplayName(name);
        }
      })
      .catch(() => {});
  }, []);

  let title = '';
  let backTo = null;

  if (location.pathname === '/home') title = `안녕하세요, ${displayName}님`;
  else if (location.pathname === '/settings') title = '설정';
  else if (location.pathname === '/wrong-answer') { title = '오답노트'; backTo = '/home'; }

  return (
    <div className="app-header">
      {backTo && (
        <button
          onClick={() => navigate(backTo)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B6880', padding: 4, display: 'flex', borderRadius: 8 }}
          aria-label="뒤로가기"
        >
          <BackIcon />
        </button>
      )}
      <img src="/logo.PNG" alt="Fluento 로고" style={{ height: '32px', objectFit: 'contain' }} />
      <h1>{title}</h1>
    </div>
  );
};

export default Header;
