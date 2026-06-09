import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload } from 'lucide-react';
import { createCustomCharacter } from '../api/characters';

const CustomFriendPage = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({ name: '', gender: 'male', job: '', personality: '', memo: '', profileImg: null });
  const [submitting, setSubmitting] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setFormData(p => ({ ...p, profileImg: reader.result }));
    reader.readAsDataURL(file);
  };

  const handleChange = (e) => setFormData(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.job) { alert('이름과 직업은 필수 입력 항목입니다!'); return; }
    const data = new FormData();
    data.append('name', formData.name);
    data.append('gender', formData.gender);
    data.append('role', formData.job);
    data.append('personality', formData.personality);
    data.append('memo', formData.memo);
    if (fileInputRef.current?.files[0]) data.append('profileImage', fileInputRef.current.files[0]);
    setSubmitting(true);
    createCustomCharacter(data)
      .then(() => { alert(`${formData.name} 캐릭터가 생성되었습니다!`); navigate('/friends'); })
      .catch(() => { alert('캐릭터 생성에 실패했습니다. 잠시 후 다시 시도해주세요.'); })
      .finally(() => { setSubmitting(false); });
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg)' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 32px', borderBottom: '1px solid var(--border)', background: 'var(--surface)', flexShrink: 0 }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t2)', padding: 4, borderRadius: 6, display: 'flex' }}>
          <ArrowLeft size={18} />
        </button>
        <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--t1)' }}>AI 친구 만들기</h2>
      </div>

      {/* Form */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 32, display: 'flex', justifyContent: 'center' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 28, width: '100%', maxWidth: 860, background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', padding: 36 }}>

          {/* Left: avatar upload */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, flexShrink: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--t2)', alignSelf: 'flex-start' }}>프로필 이미지</div>
            <div onClick={() => fileInputRef.current?.click()} style={{ width: 180, height: 180, borderRadius: 9999, border: '1px dashed var(--border2)', background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden' }}>
              {formData.profileImg
                ? <img src={formData.profileImg} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    <Upload size={24} color="var(--t3)" strokeWidth={1.5} />
                    <span style={{ fontSize: 12, color: 'var(--t3)' }}>이미지 업로드</span>
                  </div>
                )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
          </div>

          {/* Right: fields */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={lbl}>이름 *</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="이름을 입력하세요" style={inp} />
              </div>
              <div>
                <label style={lbl}>성별</label>
                <div style={{ display: 'flex', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', height: 40 }}>
                  {[['male','남성'],['female','여성']].map(([v,l]) => (
                    <button key={v} type="button" onClick={() => setFormData(p => ({ ...p, gender: v }))} style={{ flex: 1, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: formData.gender === v ? 600 : 400, background: formData.gender === v ? 'var(--accent)' : 'var(--surface)', color: formData.gender === v ? '#fff' : 'var(--t2)', transition: 'all 0.12s' }}>{l}</button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label style={lbl}>직업 *</label>
              <input type="text" name="job" value={formData.job} onChange={handleChange} placeholder="직업 (예: 교수, 친구, 이웃)" style={inp} />
            </div>

            <div>
              <label style={lbl}>성격</label>
              <input type="text" name="personality" value={formData.personality} onChange={handleChange} placeholder="성격 특징 (예: 친절함, 엄격함)" style={inp} />
            </div>

            <div>
              <label style={lbl}>메모</label>
              <textarea name="memo" value={formData.memo} onChange={handleChange} placeholder="이 캐릭터에 대한 메모를 적어주세요. (선택)" style={{ ...inp, height: 100, resize: 'none' }} />
            </div>

            <button type="submit" disabled={submitting} style={{ padding: '11px', background: submitting ? 'var(--accent-l)' : 'var(--accent)', color: submitting ? 'var(--accent)' : '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer', marginTop: 4 }}>
              {submitting ? '생성 중...' : 'AI 친구 생성하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const lbl = { display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--t2)', marginBottom: 5 };
const inp = { width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, color: 'var(--t1)', background: 'var(--bg)', outline: 'none', fontFamily: 'inherit' };

export default CustomFriendPage;
