import { useLocation, useNavigate } from 'react-router-dom';
import { USER_ID } from '../constants/storage';

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const userId = localStorage.getItem(USER_ID) || '사용자';

  let title = '';
  let backTo = null;

  if (location.pathname === '/home') {
    title = `어서오세요 ${userId}님!`;
  } else if (location.pathname === '/settings') {
    title = '설정';
  } else if (location.pathname === '/wrong-answer') {
    backTo = '/home';
  }

  return (
    <div className="header" style={{ display: 'flex', alignItems: 'center' }}>
      {backTo && (
        <button
          onClick={() => navigate(backTo)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'white', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          aria-label="뒤로가기"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
        </button>
      )}
      <h1 style={{ display: 'inline' }}>{title}</h1>
    </div>
  );
};

export default Header;