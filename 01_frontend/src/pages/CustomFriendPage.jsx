import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createCustomCharacter } from '../api/characters';

const CustomFriendPage = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: '',
    gender: 'male',
    job: '',
    personality: '',
    memo: '', 
    profileImg: null
  });

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, profileImg: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.job) {
      alert("이름과 직업은 필수 입력 항목입니다!");
      return;
    }

    const data = new FormData();
    data.append('name', formData.name);
    data.append('gender', formData.gender);
    data.append('role', formData.job);
    data.append('personality', formData.personality);
    data.append('memo', formData.memo);
    if (fileInputRef.current?.files[0]) {
      data.append('profileImage', fileInputRef.current.files[0]);
    }

    createCustomCharacter(data)
      .catch(() => {})
      .finally(() => {
        alert(`${formData.name} 캐릭터가 생성되었습니다!`);
        navigate('/friends');
      });
  };

  return (
    <div style={styles.container}>
      {/* 1. 헤더 영역 */}
      <div style={styles.header}>
        <button
          onClick={() => navigate(-1)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          aria-label="뒤로가기"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#4E3473' }}>
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
        </button>
        <h2 style={styles.headerTitle}>커스텀 하기</h2>
      </div>

      <div style={styles.content}>
        <form onSubmit={handleSubmit} style={styles.formCard}>
          {/* 왼쪽: 이미지 업로드 전용 섹션 */}
          <div style={styles.leftSection}>
            <h3 style={styles.sectionTitle}>프로필 이미지</h3>
            <div 
              style={styles.profileCircle} 
              onClick={() => fileInputRef.current.click()}
            >
              {formData.profileImg ? (
                <img src={formData.profileImg} alt="Preview" style={styles.previewImg} />
              ) : (
                <div style={styles.uploadPlaceholder}>
                  {/* 🔄 투박한 텍스트 + 대신 수려한 SVG 아이콘으로 대체 */}
                  <svg 
                    width="48" 
                    height="48" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    style={{ marginBottom: '10px' }}
                  >
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                  <p style={{ fontSize: '18px', margin: 0, fontWeight: '500' }}>이미지 업로드</p>
                </div>
              )}
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              accept="image/*" 
              onChange={handleImageChange} 
            />
            <p style={styles.infoHint}></p>
          </div>

          {/* 오른쪽: 정보 및 메모 입력 섹션 */}
          <div style={styles.rightSection}>
            <div style={styles.row}>
              <div style={{ ...styles.inputGroup, flex: 1 }}>
                <label style={styles.label}>이름</label>
                <input type="text" name="name" style={styles.input} value={formData.name} onChange={handleChange} placeholder="이름을 입력하세요" />
              </div>
              <div style={{ ...styles.inputGroup, flex: 1 }}>
                <label style={styles.label}>성별</label>
                <div style={styles.genderWrapper}>
                  <button type="button" style={formData.gender === 'male' ? styles.genderBtnActive : styles.genderBtn} onClick={() => setFormData(prev => ({ ...prev, gender: 'male' }))}>남성</button>
                  <button type="button" style={formData.gender === 'female' ? styles.genderBtnActive : styles.genderBtn} onClick={() => setFormData(prev => ({ ...prev, gender: 'female' }))}>여성</button>
                </div>
              </div>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>직업</label>
              <input type="text" name="job" style={styles.input} value={formData.job} onChange={handleChange} placeholder="직업 (예: 교수, 친구, 이웃)" />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>성격</label>
              <input type="text" name="personality" style={styles.input} value={formData.personality} onChange={handleChange} placeholder="성격 특징 (예: 친절함, 엄격함)" />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>메모</label>
              <textarea 
                name="memo" 
                style={styles.textarea} 
                value={formData.memo} 
                onChange={handleChange} 
                placeholder="이 캐릭터에 대한 메모를 적어주세요.(선택)" 
              />
            </div>

            <button type="submit" style={styles.submitBtn}>AI 친구 생성하기</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const styles = {
  container: { flex: 1, backgroundColor: '#fff', height: '100%', display: 'flex', flexDirection: 'column', marginTop: '-40px' },
  
  // 🔄 헤더 컴포넌트들의 컬러 톤 싱크 조절
  header: { display: 'flex', alignItems: 'center', padding: '20px 40px', borderBottom: '1px solid #eee', gap: '20px' },
  backArrow: { fontSize: '30px', cursor: 'pointer', color: '#4E3473', fontWeight: 'bold' },
  headerTitle: { fontSize: '24px', fontWeight: 'bold', color: '#000' },
  content: { flex: 1, padding: '40px', display: 'flex', justifyContent: 'center', alignItems: 'center' },
  
  // 🔄 3px 볼드 테두리를 입혀서 이전 카드팩 디자인들과 통일감 완성!
  formCard: { 
    display: 'flex', width: '100%', maxWidth: '1100px', 
    backgroundColor: '#fff', border: '3px solid #4E3473', borderRadius: '30px', 
    padding: '50px', gap: '60px', boxSizing: 'border-box'
  },
  
  leftSection: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' },
  rightSection: { flex: 1.5, display: 'flex', flexDirection: 'column', gap: '20px' }, // 정돈감을 위해 간격 확대
  
  // 🔄 서브타이틀에도 브랜드 컬러 매칭
  sectionTitle: { fontSize: '22px', fontWeight: 'bold', marginBottom: '20px', color: '#4E3473' },
  
  // 🔄 업로드 서클도 3px 보라색 보더라인으로 통일하여 힙한 무드 극대화
  profileCircle: { 
    width: '320px', height: '320px', borderRadius: '50%', border: '3px solid #4E3473', 
    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', 
    overflow: 'hidden', backgroundColor: '#faf9fc', boxSizing: 'border-box'
  },
  uploadPlaceholder: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#4E3473' },
  previewImg: { width: '100%', height: '100%', objectFit: 'cover' },
  infoHint: { marginTop: '15px', color: '#888', fontSize: '14px' },

  row: { display: 'flex', gap: '20px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontSize: '18px', fontWeight: 'bold', color: '#4E3473' },
  
  // 🔄 일반 인풋 필드의 외곽선 톤도 깔끔하게 보라색 색채를 띤 회색으로 조절
  input: { padding: '12px 16px', border: '2px solid #eee9f5', borderRadius: '12px', fontSize: '16px', outline: 'none', backgroundColor: '#faf9fc', color: '#333' },
  
  // 🔄 성별 선택창 컴포넌트의 테두리와 내부 톤 정돈
  genderWrapper: { display: 'flex', border: '2px solid #eee9f5', borderRadius: '12px', overflow: 'hidden', height: '48px', backgroundColor: '#fff' },
  genderBtn: { flex: 1, padding: '10px', border: 'none', backgroundColor: '#fff', color: '#888', cursor: 'pointer', fontSize: '16px', transition: '0.2s' },
  genderBtnActive: { flex: 1, padding: '10px', border: 'none', backgroundColor: '#4E3473', color: '#fff', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold', transition: '0.2s' },

  // 🔄 텍스트 에어리어 테두리 마감 싱크 매칭
  textarea: { padding: '15px', border: '2px solid #eee9f5', borderRadius: '12px', fontSize: '16px', height: '150px', resize: 'none', outline: 'none', backgroundColor: '#faf9fc', color: '#333' },
  
  // 🔄 생성하기 버튼 액션 강화 및 플루엔토 퍼플 배경
  submitBtn: { padding: '18px', backgroundColor: '#4E3473', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '20px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px', transition: '0.2s' }
};

export default CustomFriendPage;