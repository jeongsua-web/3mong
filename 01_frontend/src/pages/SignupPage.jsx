import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signup, confirmSignup } from '../api/auth';

const SignupPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState('form'); // 'form' | 'confirm'
  const [formData, setFormData] = useState({ username: '', email: '', password: '', confirmPassword: '' });
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSignup = (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setErrorMsg('비밀번호가 일치하지 않습니다.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    signup(formData.username, formData.email, formData.password)
      .then(() => setStep('confirm'))
      .catch((err) => {
        const code = err.response?.data?.error?.code;
        setErrorMsg(code === 'DUPLICATE_EMAIL' ? '이미 사용 중인 이메일입니다.' : '회원가입에 실패했습니다. 다시 시도해주세요.');
      })
      .finally(() => setLoading(false));
  };

  const handleConfirm = (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    confirmSignup(formData.email, code)
      .then(() => {
        alert('회원가입이 완료되었습니다!');
        navigate('/login');
      })
      .catch((err) => {
        const errCode = err.response?.data?.error?.code;
        setErrorMsg(errCode === 'INVALID_CODE' ? '인증 코드가 올바르지 않습니다.' : '인증에 실패했습니다. 다시 시도해주세요.');
      })
      .finally(() => setLoading(false));
  };

  return (
    <div style={styles.appContainer}>
      <div style={styles.logoContainer}>
        <h1 style={styles.logoText}>Fluento</h1>
      </div>

      <div style={styles.card}>
        <h2 style={styles.title}>{step === 'form' ? '회원가입' : '이메일 인증'}</h2>

        {step === 'form' ? (
          <form onSubmit={handleSignup} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>사용자 이름</label>
              <input type="text" name="username" placeholder="홍길동" value={formData.username} onChange={handleChange} required style={styles.input} />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>이메일</label>
              <input type="email" name="email" placeholder="example@fluento.ai" value={formData.email} onChange={handleChange} required style={styles.input} />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>비밀번호</label>
              <input type="password" name="password" placeholder="8자 이상" value={formData.password} onChange={handleChange} required style={styles.input} />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>비밀번호 확인</label>
              <input type="password" name="confirmPassword" placeholder="비밀번호 재입력" value={formData.confirmPassword} onChange={handleChange} required style={styles.input} />
            </div>
            {errorMsg && <p style={styles.error}>{errorMsg}</p>}
            <button type="submit" style={styles.mainButton} disabled={loading}>
              {loading ? '처리 중...' : '가입하기'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleConfirm} style={styles.form}>
            <p style={styles.infoText}><strong>{formData.email}</strong>으로 인증 코드를 보냈습니다.</p>
            <div style={styles.inputGroup}>
              <label style={styles.label}>인증 코드</label>
              <input
                type="text"
                placeholder="코드 6자리 입력"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                style={styles.input}
              />
            </div>
            {errorMsg && <p style={styles.error}>{errorMsg}</p>}
            <button type="submit" style={styles.mainButton} disabled={loading}>
              {loading ? '확인 중...' : '인증 완료'}
            </button>
            <button type="button" style={styles.secondaryButton} onClick={() => { setStep('form'); setErrorMsg(''); }}>
              돌아가기
            </button>
          </form>
        )}

        {step === 'form' && (
          <div style={styles.footer}>
            이미 계정이 있으신가요? <Link to="/login" style={styles.link}>로그인</Link>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  appContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#ffffff' },
  logoContainer: { marginBottom: '20px' },
  logoText: { color: '#4E3473', fontSize: '32px', fontWeight: 'bold' },
  card: { backgroundColor: '#fff', padding: '30px', borderRadius: '16px', width: '380px', boxShadow: '0 10px 25px rgba(0,0,0,0.3)' },
  title: { textAlign: 'center', marginBottom: '25px', color: '#333' },
  form: { display: 'flex', flexDirection: 'column' },
  inputGroup: { marginBottom: '18px' },
  label: { display: 'block', marginBottom: '8px', fontSize: '13px', color: '#666', fontWeight: '600' },
  input: { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', outline: 'none' },
  mainButton: { backgroundColor: '#4E3473', color: '#fff', padding: '14px', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' },
  secondaryButton: { backgroundColor: 'transparent', color: '#888', padding: '10px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px', cursor: 'pointer', marginTop: '8px' },
  footer: { marginTop: '20px', textAlign: 'center', fontSize: '14px', color: '#888' },
  link: { color: '#5e419c', fontWeight: 'bold', textDecoration: 'none', marginLeft: '5px' },
  error: { color: '#ff4d4f', fontSize: '13px', marginBottom: '8px', textAlign: 'center' },
  infoText: { fontSize: '14px', color: '#555', textAlign: 'center', marginBottom: '20px', lineHeight: '1.6' },
};

export default SignupPage;
