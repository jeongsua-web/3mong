import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyProfile, updateProfileImage, deleteAccount } from '../api/user';
import { logout } from '../api/auth';
import { ACCESS_TOKEN, USER_ID } from '../constants/storage';

const SettingsPage = () => {
  const navigate = useNavigate();
  const [profileImage, setProfileImage] = useState(null);
  const [profileName, setProfileName] = useState('사용자');
  const [profileEmail, setProfileEmail] = useState('user@example.com');
  const [language, setLanguage] = useState('ko');
  const [theme, setTheme] = useState('system');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const fileInputRef = useRef(null);

  useEffect(() => {
    getMyProfile()
      .then((res) => {
        const user = res.data.data;
        setProfileName(user.username || '사용자');
        setProfileEmail(user.email || '');
        if (user.profileImageUrl) setProfileImage(user.profileImageUrl);
      })
      .catch(() => {
        const savedEmail = localStorage.getItem(USER_ID);
        if (savedEmail) setProfileEmail(savedEmail);
      });
  }, []);

  const handleLogout = () => {
    if (window.confirm('로그아웃하시겠습니까?')) {
      logout().catch(() => {});
      localStorage.removeItem(ACCESS_TOKEN);
      localStorage.removeItem(USER_ID);
      navigate('/login');
    }
  };

  const handleDeleteAccount = () => {
    if (window.confirm('정말로 계정을 탈퇴하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      deleteAccount()
        .catch(() => {})
        .finally(() => {
          localStorage.clear();
          navigate('/login');
        });
    }
  };

  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => setProfileImage(event.target.result);
    reader.readAsDataURL(file);
    updateProfileImage(file).catch(() => {});
  };

  const handleFileInputClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      {/* 🎨 CSS 스타일 구조 명확화 */}
      <style>{`
        /* 1. 체크박스가 선택(ON)되었을 때 슬라이더 배경색 */
        input[type="checkbox"]:checked + span {
          background-color: #4E3473 !important;
        }
        
        /* 2. 체크박스가 선택(ON)되었을 때 하얀 동그라미 위치 이동 */
        input[type="checkbox"]:checked + span:after {
          left: 25px;
        }
        
        /* 3. 기본(OFF) 상태의 하얀 동그라미 기본 설정 */
        .custom-slider:after {
          content: '';
          position: absolute;
          width: 22px;
          height: 22px;
          left: 3px;
          top: 3px;
          background-color: white;
          border-radius: 50%;
          transition: all 0.2s ease-in-out;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
      `}</style>

      <div style={styles.container}>
        <div style={styles.content}>
          <h1 style={styles.title}>설정</h1>

          {/* 계정 설정 - 맨 위 */}
          <div style={styles.accountSection}>
            <div style={styles.profileContainer}>
              <div style={styles.profileImageWrapper}>
                {profileImage ? (
                  <img src={profileImage} alt="프로필" style={styles.profileImage} />
                ) : (
                  <div style={styles.profileImagePlaceholder}>
                    <span style={styles.placeholderText}>👤</span>
                  </div>
                )}
                <button
                  onClick={handleFileInputClick}
                  style={styles.cameraButton}
                  title="프로필 사진 변경"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                    <circle cx="12" cy="13" r="4"></circle>
                  </svg>
                </button>
              </div>
              <div style={styles.profileInfo}>
                <h3 style={styles.profileName}>{profileName}</h3>
                <p style={styles.profileEmail}>{profileEmail}</p>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleProfilePictureChange}
              style={{ display: 'none' }}
            />

            <button onClick={handleLogout} style={styles.button}>
              로그아웃
            </button>
            <button
              onClick={handleDeleteAccount}
              style={{ ...styles.button, ...styles.dangerButton }}
            >
              계정탈퇴
            </button>
          </div>

          {/* 언어 설정 */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>언어 설정</h2>
            <div style={styles.settingItem}>
              <label style={styles.label}>앱 인터페이스 언어</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                style={styles.select}
              >
                <option value="ko">한국어</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>

          {/* 테마 설정 */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>테마 설정</h2>
            <div style={styles.settingItem}>
              <label style={styles.label}>테마 선택</label>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                style={styles.select}
              >
                <option value="light">라이트모드</option>
                <option value="dark">다크모드</option>
                <option value="system">시스템설정</option>
              </select>
            </div>
          </div>

          {/* 알림 설정 */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>알림 설정</h2>
            <div style={styles.toggleItem}>
              <label style={styles.label}>알림 활성화</label>
              <label style={styles.switch}>
                <input
                  type="checkbox"
                  checked={notificationsEnabled}
                  onChange={(e) => setNotificationsEnabled(e.target.checked)}
                  style={styles.checkbox}
                />
                {/* ✅ 클래스명을 부여해 동 동그라미 속성이 겹치지 않도록 방어 */}
                <span className="custom-slider" style={styles.slider}></span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

const styles = {
  container: { flex: 1, backgroundColor: '#fff', height: '100%', overflow: 'auto', marginTop: '-40px', paddingTop: '40px' },
  content: { maxWidth: '100%', margin: '0', padding: '20px 40px', paddingBottom: '40px' },
  title: { fontSize: '28px', fontWeight: '600', color: '#333', marginBottom: '30px', marginTop: '0' },
  accountSection: { backgroundColor: '#faf9fc', borderRadius: '12px', padding: '30px', marginBottom: '30px', border: '2px solid #4E3473' },
  profileContainer: { display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '25px' },
  profileImageWrapper: { flexShrink: 0, position: 'relative' },
  profileImage: { width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #4E3473' },
  profileImagePlaceholder: { width: '100px', height: '100px', borderRadius: '50%', backgroundColor: '#eee9f5', border: '3px solid #4E3473', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  placeholderText: { fontSize: '50px' },
  profileInfo: { flex: 1 },
  profileName: { fontSize: '18px', fontWeight: '600', color: '#333', margin: '0 0 5px 0' },
  profileEmail: { fontSize: '14px', color: '#999', margin: '0' },
  cameraButton: { position: 'absolute', bottom: '0', right: '0', width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#fff', border: '1.5px solid #4E3473', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0', color: '#4E3473', transition: 'transform 0.2s' },
  section: { marginBottom: '30px', paddingBottom: '20px', borderBottom: '1px solid #e0e0e0' },
  sectionTitle: { fontSize: '16px', fontWeight: '600', color: '#333', marginBottom: '15px', marginTop: '0' },
  settingItem: { marginBottom: '15px' },
  toggleItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: '14px', color: '#555', marginBottom: '8px', display: 'block', fontWeight: '500' },
  select: { width: '100%', padding: '10px 12px', fontSize: '14px', border: '1px solid #ddd', borderRadius: '6px', backgroundColor: '#fff', color: '#333', cursor: 'pointer', boxSizing: 'border-box', outline: 'none' },
  button: { width: '100%', padding: '12px 16px', marginBottom: '10px', fontSize: '14px', fontWeight: '500', border: 'none', borderRadius: '6px', backgroundColor: '#4E3473', color: '#fff', cursor: 'pointer' },
  dangerButton: { backgroundColor: '#FF6B6B' },
  switch: { position: 'relative', display: 'inline-block', width: '50px', height: '28px', cursor: 'pointer' },
  checkbox: { opacity: '0', width: '0', height: '0' },
  
  // ✅ 스위치 배경 스타일 정밀 가공 (OFF일 때는 차분한 회색)
  slider: {
    position: 'absolute',
    top: '0',
    left: '0',
    right: '0',
    bottom: '0',
    backgroundColor: '#E0E0E0', // 👈 미사용 상태 가독성 좋은 밝은 회색
    borderRadius: '28px',
    transition: 'background-color 0.2s ease',
  },
};

export default SettingsPage;