import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../api/auth';
import { ACCESS_TOKEN, USER_ID } from '../constants/storage';

const LoginPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    login(formData.email, formData.password)
      .then((res) => {
        localStorage.setItem(ACCESS_TOKEN, res.data.data.accessToken);
        localStorage.setItem(USER_ID, formData.email);
        navigate('/home');
      })
      .catch(() => {
        setErrorMsg('이메일 또는 비밀번호가 올바르지 않습니다.');
      })
      .finally(() => setLoading(false));
  };

  return (
    // 1. 전체 배경색 (아주 어두운 배경)
    <div style={styles.appContainer}>
      
      {/* 2. 최상단 로고: Fluento */}
      <div style={styles.logoContainer}>
        <h1 style={styles.logoText}>Fluento</h1>
      </div>

      {/* 3. 중앙 하얀색 로그인 카드 */}
      <div style={styles.loginCard}>
        <h2 style={styles.title}>로그인</h2>

        <form onSubmit={handleSubmit} style={styles.form}>
          {/* 4. 이메일/아이디 입력창 */}
          <div style={styles.inputGroup}>
            <label style={styles.inputLabel}>이메일</label>
            <div style={styles.inputWrapper}>
              {/* 아이콘 자리 (실제 아이콘 라이브러리 없어서 문자로 대체) */}
              <span style={styles.icon}>ID</span> {/* 아이콘으로 수정 */}
              <input
                type="email"
                name="email"
                placeholder="example@fluento.ai"
                value={formData.email}
                onChange={handleChange}
                required
                style={styles.inputField}
              />
            </div>
          </div>

          {/* 5. 비밀번호 입력창 */}
          <div style={styles.inputGroup}>
            <label style={styles.inputLabel}>비밀번호</label>
            <div style={styles.inputWrapper}>
              <span style={styles.icon}>PW</span> {/* 아이콘으로 수정 */}
              <input
                type={showPassword ? 'text' : 'password'} // 보이기/숨기기
                name="password"
                placeholder="........"
                value={formData.password}
                onChange={handleChange}
                required
                style={styles.inputField}
              />
              {/* 비밀번호 보이기/숨기기 아이콘 버튼 */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={styles.passwordToggleButton}
              >
                {showPassword ? '숨김' : '보기'} {/*아이콘으로 수정*/}
              </button>
            </div>
          </div>

          {/* 6. 보라색 로그인 버튼 */}
          {errorMsg && <p style={{ color: '#ff4d4f', fontSize: '13px', marginBottom: '8px', textAlign: 'center' }}>{errorMsg}</p>}
          <button type="submit" style={styles.loginButton} disabled={loading}>
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        {/* 7. 소셜 계정 로그인 */}
        <div style={styles.socialDivider}>
          <span style={styles.socialDividerText}>또는 소셜 계정으로 로그인</span>
        </div>

        <div style={styles.socialButtons}>
          <button style={styles.socialButton}>
            <svg width="18" height="18" viewBox="0 0 48 48" style={{ marginRight: '8px', flexShrink: 0 }}>
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            Google
          </button>
          <button style={styles.socialButton}>
            <svg width="18" height="18" viewBox="0 0 814 1000" style={{ marginRight: '8px', flexShrink: 0 }}>
              <path fill="#000000" d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-57.8-155.5-127.4C46 790.7 0 663 0 541.8c0-207.5 135.4-317.3 269-317.3 70.1 0 128.4 46.4 172.5 46.4 42.8 0 109.1-49 192.5-49 34.1 0 124.3 3.2 186.5 99zM554.7 187.2c33.5-39.5 57.8-94.7 57.8-147.9 0-7.7-.6-15.4-1.9-21.8-54.5 2.6-118.6 36.7-157.5 81.5-31.5 35.4-61 90.7-61 146.6 0 8.3 1.3 16.6 1.9 19.2 3.2.6 8.4 1.3 13.6 1.3 48.4 0 109.7-32.2 147.1-78.9z"/>
            </svg>
            Apple
          </button>
        </div>

        {/* 8. 하단 링크 (회원가입, 비밀번호 찾기) */}
        <div style={styles.footer}>
          아직 계정이 없으신가요? 
          {/* Link를 쓰면 페이지 이동할 때 깜빡임이 없어요. */}
          <Link to="/signup" style={styles.footerLinkBold}>회원가입</Link>
          <Link to="/forgot-password" style={styles.footerLink}>비밀번호를 잊으셨나요?</Link>
        </div>
      </div>
    </div>
  );
};

// 🎨 디자인을 입혀주는 CSS 스타일 객체들
const styles = {
  appContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh', // 화면 전체 높이
    backgroundColor: '#ffffff', // 아주 어두운 검은색
    fontFamily: 'sans-serif',
  },
  logoContainer: { marginBottom: '20px' },
  logoText: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#4E3473', // 로고의 보라색
    margin: 0,
  },
  loginCard: {
    backgroundColor: '#ffffff', // 하얀색 카드
    padding: '40px 30px',
    borderRadius: '16px', // 둥근 모서리
    width: '380px',
    boxShadow: '0 10px 30px rgba(142, 124, 195, 0.2)', // 은은한 보라색 그림자
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  title: {
    fontSize: '22px',
    fontWeight: 'bold',
    color: '#333333',
    margin: '0 0 30px 0',
    textAlign: 'center',
  },
  form: { width: '100%' },
    inputGroup: { 
    marginBottom: '16px',
    width: '100%', // 1. 그룹 전체 너비를 채워서
    textAlign: 'left', // 2. 내부 글자가 왼쪽에서 시작하게 함
    },
    inputLabel: {
        fontSize: '13px',
        color: '#aaaaaa',
        display: 'block',
        marginBottom: '8px',
        paddingLeft: '4px', // 이미지처럼 살짝 안으로 들여쓰기
        fontWeight: '500',
    },
  inputWrapper: {
    display: 'flex',
    alignItems: 'center',
    border: '1px solid #e1e1e1', // 아주 흐린 경계선
    borderRadius: '8px',
    padding: '10px 14px',
    backgroundColor: '#fafafa', // 약간 회색 도는 입력창 배경
    position: 'relative',
  },
  icon: { marginRight: '10px', color: '#aaaaaa' },
  inputField: {
    border: 'none',
    outline: 'none',
    flex: 1,
    fontSize: '15px',
    color: '#333333',
    backgroundColor: 'transparent', // Wrapper 배경색을 따르게 함
  },
  passwordToggleButton: {
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    position: 'absolute',
    right: '12px',
    color: '#aaaaaa',
  },
  loginButton: {
    width: '100%',
    padding: '14px',
    marginTop: '10px',
    border: 'none',
    borderRadius: '8px',
    backgroundColor: '#4E3473', // 로그인 버튼의 보라색
    color: '#ffffff',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  socialDivider: {
    width: '100%',
    margin: '30px 0',
    borderTop: '1px solid #e1e1e1',
    position: 'relative',
    textAlign: 'center',
  },
  socialDividerText: {
    backgroundColor: '#ffffff', // 하얀색으로 겹치는 줄 가리기
    color: '#aaaaaa',
    padding: '0 10px',
    fontSize: '12px',
    position: 'relative',
    top: '-16px',
  },
  socialButtons: {
    display: 'flex',
    gap: '15px',
    width: '100%',
    marginBottom: '20px',
  },
  socialButton: {
    flex: 1,
    padding: '12px',
    border: '1px solid #e1e1e1',
    borderRadius: '8px',
    backgroundColor: '#ffffff',
    color: '#333333',
    cursor: 'pointer',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    marginTop: '10px',
    fontSize: '13px',
    color: '#aaaaaa',
    textAlign: 'center',
  },
  footerLinkBold: {
    color: '#5e419c', // 보라색 회원가입 링크
    fontWeight: 'bold',
    textDecoration: 'none',
    margin: '0 8px',
  },
  footerLink: {
    color: '#5e419c',
    textDecoration: 'none',
    display: 'block', // 비밀번호 링크는 줄바꿈
    marginTop: '6px',
  },
};

export default LoginPage;