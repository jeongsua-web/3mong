import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera } from 'lucide-react';
import { getMyProfile, updateProfileImage, updateSettings, deleteAccount } from '../api/user';
import { logout } from '../api/auth';
import { ACCESS_TOKEN, USER_ID } from '../constants/storage';
import { getSavedTheme, saveTheme, applyTheme } from '../utils/theme';

const SettingsPage = () => {
  const navigate = useNavigate();
  const [profileImage, setProfileImage] = useState(null);
  const [profileName, setProfileName] = useState('사용자');
  const [profileEmail, setProfileEmail] = useState('user@example.com');
  const [theme, setTheme] = useState(getSavedTheme);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const fileInputRef = useRef(null);

  useEffect(() => {
    getMyProfile()
      .then(res => {
        const u = res.data.data;
        setProfileName(u.name || '사용자');
        setProfileEmail(u.email || '');
        if (u.profileImageUrl) setProfileImage(u.profileImageUrl);
        if (u.theme) { setTheme(u.theme); saveTheme(u.theme); applyTheme(u.theme); }
        if (u.notificationEnabled != null) setNotificationsEnabled(u.notificationEnabled);
      })
      .catch(() => {
        const saved = localStorage.getItem(USER_ID);
        if (saved) setProfileEmail(saved);
      });
  }, []);

  const handleLogout = () => {
    if (!window.confirm('로그아웃하시겠습니까?')) return;
    logout().catch(() => {});
    localStorage.removeItem(ACCESS_TOKEN);
    localStorage.removeItem(USER_ID);
    navigate('/login');
  };

  const handleDeleteAccount = () => {
    if (!window.confirm('정말로 계정을 탈퇴하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return;
    deleteAccount().catch(() => {}).finally(() => { localStorage.clear(); navigate('/login'); });
  };

  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const originalImage = profileImage; // 롤백용
    const reader = new FileReader();
    reader.onload = ev => setProfileImage(ev.target.result);
    reader.readAsDataURL(file);
    updateProfileImage(file).catch(() => {
      setProfileImage(originalImage); // 미리보기 롤백
      alert('프로필 이미지 변경에 실패했습니다.');
    });
  };

  const initials = profileName ? profileName[0].toUpperCase() : '?';

  return (
    <div style={{ padding: '32px', maxWidth: 600, display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Profile card */}
      <div style={section}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            {profileImage
              ? <img src={profileImage} alt="프로필" onError={() => setProfileImage(null)} style={{ width: 64, height: 64, borderRadius: 9999, objectFit: 'cover', border: '1px solid var(--border)' }} />
              : <div style={{ width: 64, height: 64, borderRadius: 9999, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 22 }}>{initials}</div>
            }
            <button onClick={() => fileInputRef.current?.click()} style={{ position: 'absolute', bottom: 0, right: 0, width: 22, height: 22, borderRadius: 9999, background: 'var(--surface)', border: '1px solid var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, color: 'var(--t2)' }}>
              <Camera size={11} />
            </button>
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--t1)', marginBottom: 2 }}>{profileName}</div>
            <div style={{ fontSize: 13, color: 'var(--t3)' }}>{profileEmail}</div>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleProfilePictureChange} style={{ display: 'none' }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button onClick={handleLogout} style={btnBase}>로그아웃</button>
          <button onClick={handleDeleteAccount} style={{ ...btnBase, background: 'var(--error-l)', color: 'var(--error)' }}>계정 탈퇴</button>
        </div>
      </div>

      {/* Theme */}
      <div style={section}>
        <h2 style={sectionTitle}>테마 설정</h2>
        <div>
          <label style={labelStyle}>테마 선택</label>
          <select
            value={theme}
            onChange={e => {
              const t = e.target.value;
              setTheme(t);
              saveTheme(t);
              applyTheme(t);
              updateSettings({ theme: t }).catch(() => {});
            }}
            style={selectStyle}
          >
            <option value="light">라이트모드</option>
            <option value="dark">다크모드</option>
            <option value="system">시스템 설정</option>
          </select>
        </div>
      </div>

      {/* Notifications */}
      <div style={section}>
        <h2 style={sectionTitle}>알림 설정</h2>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 13, color: 'var(--t2)' }}>알림 활성화</span>
          <button
            type="button"
            onClick={() => {
              const next = !notificationsEnabled;
              setNotificationsEnabled(next);
              updateSettings({ notificationEnabled: next }).catch(() => {});
            }}
            style={{ width: 44, height: 24, borderRadius: 9999, border: 'none', cursor: 'pointer', background: notificationsEnabled ? 'var(--accent)' : 'var(--border)', transition: 'background 0.2s', position: 'relative', padding: 0 }}
          >
            <div style={{ width: 18, height: 18, borderRadius: 9999, background: '#fff', position: 'absolute', top: 3, left: notificationsEnabled ? 23 : 3, transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
          </button>
        </div>
      </div>

    </div>
  );
};

const section = { background: 'var(--surface)', borderRadius: 12, border: '1px solid var(--border)', padding: '20px 24px' };
const sectionTitle = { fontSize: 13, fontWeight: 600, color: 'var(--t1)', marginBottom: 14 };
const labelStyle = { display: 'block', fontSize: 12, color: 'var(--t2)', marginBottom: 6 };
const selectStyle = { width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, color: 'var(--t1)', background: 'var(--surface)', outline: 'none', cursor: 'pointer' };
const btnBase = { width: '100%', padding: '10px 14px', fontSize: 13, fontWeight: 500, border: 'none', borderRadius: 8, background: 'var(--accent-l)', color: 'var(--accent)', cursor: 'pointer' };

export default SettingsPage;
