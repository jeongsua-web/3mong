import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRecommendedCharacters, deleteCharacter } from '../api/characters';

const MOCK_RECOMMENDED = [
  { id: 1, name: 'James', role: 'Boyfriend', gender: 'male', trait: 'nonchalant, shy' },
  { id: 2, name: 'Charles', role: 'Colleague', gender: 'male', trait: 'cool, detached' },
  { id: 3, name: 'Anna', role: 'Mom', gender: 'female', trait: 'warm, kind' },
  { id: 4, name: 'Jenny', role: 'Colleague', gender: 'female', trait: 'bright, shy' },
];

const AddFriendsPage = () => {
  const navigate = useNavigate();
  const [recommendedFriends, setRecommendedFriends] = useState(MOCK_RECOMMENDED);

  useEffect(() => {
    getRecommendedCharacters()
      .then((res) => setRecommendedFriends(res.data.data.characters))
      .catch(() => setRecommendedFriends(MOCK_RECOMMENDED));
  }, []);

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
        <h2 style={styles.headerTitle}>친구 추가</h2>
      </div>

      <div style={styles.content}>
        {/* 2. 카드 그리드 영역 */}
        <div style={styles.grid}>
          {recommendedFriends.map((friend) => (
            <div key={friend.id} style={styles.card}>
              <img src={friend.img} alt={friend.name} style={styles.profileImg} />
              <div style={styles.nameTag}>[{friend.name}]</div>
              <div style={styles.infoText}>
                {friend.role}<br />
                {friend.gender}<br />
                {friend.trait}
              </div>
            </div>
          ))}

          {/* 3. 커스텀 하기 카드 */}
          <div style={styles.customCard} onClick={() => navigate('/custom-friend')}>
            <div style={styles.plusIcon}>
              <svg 
                width="32" 
                height="32" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="3" /* 🔄 더 정돈되도록 아이콘 선 두께도 살짝 보강 */
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </div>
            <div style={styles.customTitle}>커스텀 하기</div>
            <div style={styles.customDesc}>원하는 친구를 생성하세요!</div>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    flex: 1, backgroundColor: '#fff', height: '100%',
    display: 'flex', flexDirection: 'column', marginTop: '-40px'
  },
  header: {
    display: 'flex', alignItems: 'center', padding: '20px 40px',
    borderBottom: '1px solid #eee', gap: '20px'
  },
  backArrow: { fontSize: '30px', cursor: 'pointer', color: '#4E3473', fontWeight: 'bold' },
  headerTitle: { fontSize: '24px', fontWeight: 'bold', color: '#000' },
  
  content: { padding: '40px' },
  subTitle: { fontSize: '28px', fontWeight: 'bold', marginBottom: '30px', color: '#000' },
  
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '25px',
    justifyItems: 'start'
  },
  
  // 🔄 친구 카드 스타일 (테두리 2px 볼드화)
  card: {
    width: '220px', height: '300px', 
    border: '2px solid #4E3473', // 👈 1px에서 2px로 묵직하게 두께 강화!
    borderRadius: '15px', display: 'flex', flexDirection: 'column',
    alignItems: 'center', padding: '18px', textAlign: 'center', // 패딩 미세조정으로 균형 확보
    backgroundColor: '#fff', transition: 'transform 0.2s',
    boxSizing: 'border-box'
  },
  profileImg: {
    width: '100px', height: '100px', borderRadius: '50%',
    backgroundColor: '#eee9f5', marginBottom: '20px', objectFit: 'cover'
  },
  nameTag: { fontSize: '22px', fontWeight: 'bold', marginBottom: '15px', color: '#4E3473' },
  infoText: { fontSize: '18px', color: '#555', lineHeight: '1.5' },

  // 🔄 커스텀 카드 스타일 (테두리 3px 볼드화 및 라인 싱크 매칭)
  customCard: {
    width: '220px', height: '300px', 
    border: '2px solid #4E3473', // 👈 여기도 2px로 일치!
    borderRadius: '15px', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', padding: '20px',
    cursor: 'pointer', backgroundColor: '#faf9fc', transition: 'background 0.2s',
    boxSizing: 'border-box'
  },
  plusIcon: {
    width: '80px', height: '80px', borderRadius: '50%',
    backgroundColor: '#eee9f5', display: 'flex', alignItems: 'center',
    justifyContent: 'center', color: '#4E3473', marginBottom: '20px'
  },
  customTitle: { fontSize: '22px', fontWeight: 'bold', marginBottom: '10px', color: '#4E3473' },
  customDesc: { fontSize: '14px', color: '#888', textAlign: 'center' },
};

export default AddFriendsPage;