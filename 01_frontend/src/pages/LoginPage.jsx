import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { login, loginWithGoogle } from '../api/auth';
import { ACCESS_TOKEN, USER_ID, USER_NAME } from '../constants/storage';
import { getMyProfile } from '../api/user';

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

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await loginWithGoogle(credentialResponse.credential);
      localStorage.setItem(ACCESS_TOKEN, res.data.data.accessToken);
      localStorage.setItem(USER_ID, 'google-user');
      try {
        const profileRes = await getMyProfile();
        const name = profileRes?.data?.data?.name;
        if (name) localStorage.setItem(USER_NAME, name);
      } catch {}
      navigate('/home');
    } catch {
      setErrorMsg('구글 로그인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await login(formData.email, formData.password);
      localStorage.setItem(ACCESS_TOKEN, res.data.data.accessToken);
      localStorage.setItem(USER_ID, formData.email);
      try {
        const profileRes = await getMyProfile();
        const name = profileRes?.data?.data?.name;
        if (name) localStorage.setItem(USER_NAME, name);
      } catch {}
      navigate('/home');
    } catch {
      setErrorMsg('이메일 또는 비밀번호가 올바르지 않습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 380, display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 44, height: 44, background: 'var(--accent)', borderRadius: 12, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 20, marginBottom: 12 }}>F</div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--t1)', letterSpacing: '-0.3px', marginBottom: 4 }}>Fluento</h1>
          <p style={{ fontSize: 13, color: 'var(--t3)' }}>AI 친구와 함께 영어를 배워보세요</p>
        </div>

        {/* Card */}
        <div style={{ background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', padding: '28px 32px' }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--t1)', marginBottom: 22 }}>로그인</h2>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={lbl}>이메일</label>
              <input type="email" name="email" placeholder="example@fluento.ai" value={formData.email} onChange={handleChange} required style={inp} />
            </div>

            <div>
              <label style={lbl}>비밀번호</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="비밀번호를 입력하세요"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  style={{ ...inp, paddingRight: 42 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)', padding: 0, display: 'flex' }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {errorMsg && (
              <div style={{ background: 'var(--error-l)', border: '1px solid #FECACA', borderRadius: 8, padding: '9px 12px', fontSize: 13, color: 'var(--error)' }}>
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{ padding: '11px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, marginTop: 2 }}
            >
              {loading ? '로그인 중...' : '로그인'}
            </button>
          </form>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '18px 0' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <span style={{ fontSize: 12, color: 'var(--t3)' }}>또는</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setErrorMsg('구글 로그인에 실패했습니다.')}
              width="316"
              text="signin_with"
              shape="rectangular"
              locale="ko"
            />
          </div>

          <div style={{ textAlign: 'center', marginTop: 18, fontSize: 13, color: 'var(--t3)' }}>
            아직 계정이 없으신가요?{' '}
            <Link to="/signup" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>회원가입</Link>
          </div>
          <div style={{ textAlign: 'center', marginTop: 6 }}>
            <Link to="/forgot-password" style={{ fontSize: 12, color: 'var(--t3)', textDecoration: 'none' }}>비밀번호를 잊으셨나요?</Link>
          </div>
        </div>

      </div>
    </div>
  );
};

const lbl = { display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--t2)', marginBottom: 5 };
const inp = { width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, color: 'var(--t1)', outline: 'none', background: 'var(--bg)', boxSizing: 'border-box', fontFamily: 'inherit' };

export default LoginPage;
