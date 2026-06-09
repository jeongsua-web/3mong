import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signup } from '../api/auth';

const STEPS = ['email', 'password', 'username'];
const STEP_LABELS = { email: '이메일을 입력해주세요', password: '비밀번호를 설정해주세요', username: '닉네임을 정해주세요' };
const STEP_TITLES = { email: '회원가입', password: '비밀번호 설정', username: '사용자 이름' };

const SignupPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState('email');
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const stepIdx = STEPS.indexOf(step);
  const handleChange = (e) => setFormData(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleNext = (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (step === 'email') return setStep('password');
    if (step === 'password') return setStep('username');
    setLoading(true);
    signup(formData.username, formData.email, formData.password)
      .then(() => navigate('/login'))
      .catch(err => {
        const code = err.response?.data?.error?.code;
        setErrorMsg(code === 'DUPLICATE_EMAIL' ? '이미 사용 중인 이메일입니다.' : '회원가입에 실패했습니다. 다시 시도해주세요.');
      })
      .finally(() => setLoading(false));
  };

  const goBack = () => { setErrorMsg(''); const prev = STEPS[stepIdx - 1]; if (prev) setStep(prev); };

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

          {/* Progress */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 22 }}>
            {STEPS.map((s, i) => (
              <div key={s} style={{ flex: 1, height: 2, borderRadius: 9999, background: i <= stepIdx ? 'var(--accent)' : 'var(--border)', transition: 'background 0.2s' }} />
            ))}
          </div>

          <p style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 3, fontWeight: 500 }}>단계 {stepIdx + 1} / {STEPS.length}</p>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--t1)', marginBottom: 4 }}>{STEP_TITLES[step]}</h2>
          <p style={{ fontSize: 13, color: 'var(--t3)', marginBottom: 20 }}>{STEP_LABELS[step]}</p>

          <form onSubmit={handleNext} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {step === 'email' && (
              <div>
                <label style={lbl}>이메일 주소</label>
                <input type="email" name="email" placeholder="example@fluento.ai" value={formData.email} onChange={handleChange} required autoFocus style={inp} />
              </div>
            )}
            {step === 'password' && (
              <div>
                <label style={lbl}>비밀번호</label>
                <input type="password" name="password" placeholder="8자 이상" value={formData.password} onChange={handleChange} required autoFocus style={inp} />
              </div>
            )}
            {step === 'username' && (
              <div>
                <label style={lbl}>사용자 이름</label>
                <input type="text" name="username" placeholder="홍길동" value={formData.username} onChange={handleChange} required autoFocus style={inp} />
              </div>
            )}

            {errorMsg && (
              <div style={{ background: 'var(--error-l)', border: '1px solid #FECACA', borderRadius: 8, padding: '9px 12px', fontSize: 13, color: 'var(--error)' }}>
                {errorMsg}
              </div>
            )}

            <button type="submit" disabled={loading} style={{ padding: '11px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, marginTop: 2 }}>
              {loading ? '처리 중...' : step === 'username' ? '가입하기' : '계속'}
            </button>

            {stepIdx > 0 && (
              <button type="button" onClick={goBack} style={{ padding: '10px', background: 'transparent', color: 'var(--t2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>
                이전
              </button>
            )}
          </form>

          {step === 'email' && (
            <div style={{ textAlign: 'center', marginTop: 18, fontSize: 13, color: 'var(--t3)' }}>
              이미 계정이 있으신가요?{' '}
              <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>로그인</Link>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

const lbl = { display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--t2)', marginBottom: 5 };
const inp = { width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, color: 'var(--t1)', outline: 'none', background: 'var(--bg)', boxSizing: 'border-box', fontFamily: 'inherit' };

export default SignupPage;
