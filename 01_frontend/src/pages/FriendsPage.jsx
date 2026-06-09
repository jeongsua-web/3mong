import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyCharacters, toggleFavorite, deleteCharacter } from '../api/characters';

import alexImg from '../assets/alex.PNG';
import minaImg from '../assets/mina.png';
import katherineImg from '../assets/katherine.png';

const MOCK_FRIENDS = [
  { id: 1, name: 'Alex', desc: 'Professor / male / kind, strict', isFavorite: false, profileImg: katherineImg, memo: '' },
  { id: 2, name: 'Mina', desc: 'Bestie / female / lovely, biatch', isFavorite: true, profileImg: minaImg, memo: '' },
  { id: 3, name: 'Katherine', desc: 'Neighbor / female / brusque', isFavorite: true, profileImg: katherineImg, memo: '' },
];

const FriendsPage = () => {
  const navigate = useNavigate();

  const [friends, setFriends] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFriend, setSelectedFriend] = useState(null);

  useEffect(() => {
    getMyCharacters()
      .then((res) => {
        const data = res.data.data.characters.map((c) => ({
          id: c.id,
          name: c.name,
          desc: `${c.role} / ${c.gender} / ${c.personality}`,
          isFavorite: c.isFavorite,
          profileImg: c.profileImageUrl || null,
          memo: c.memo || '',
        }));
        setFriends(data);
      })
      .catch(() => setFriends(MOCK_FRIENDS));
  }, []);

  const filteredFriends = friends.filter(friend => {
    const matchesTab = activeTab === 'all' || (activeTab === 'favorite' && friend.isFavorite);
    const matchesSearch = friend.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const handleMemoChange = (id, newMemo) => {
    setFriends(prev => prev.map(f => f.id === id ? { ...f, memo: newMemo } : f));
    setSelectedFriend(prev => prev && prev.id === id ? { ...prev, memo: newMemo } : prev);
  };

  const toggleMenu = (e, id) => {
    e.stopPropagation(); 
    setMenuOpenId(menuOpenId === id ? null : id);
  };

  const handleToggleFavorite = (e, id) => {
    e.stopPropagation();
    const friend = friends.find(f => f.id === id);
    const newVal = !friend.isFavorite;
    setMenuOpenId(null);
    toggleFavorite(id, newVal)
      .then(() => setFriends(prev => prev.map(f => f.id === id ? { ...f, isFavorite: newVal } : f)))
      .catch(() => alert('즐겨찾기 변경에 실패했습니다.'));
  };

  const handleDeleteFriend = (e, id) => {
    e.stopPropagation();
    if (!window.confirm('정말 이 친구를 삭제하시겠습니까?')) return;
    deleteCharacter(id)
      .then(() => {
        setFriends(prev => prev.filter(f => f.id !== id));
        setMenuOpenId(null);
      })
      .catch(() => alert('친구 삭제에 실패했습니다.'));
  };

  return (
    <div style={styles.container} onClick={() => setMenuOpenId(null)}>
      {/* 상단 섹션 */}
      <div style={styles.topSection}>
        <div style={styles.tabWrapper}>
          <button style={activeTab === 'all' ? styles.activeTabBtn : styles.tabBtn} onClick={() => setActiveTab('all')}>모든 친구</button>
          <button style={activeTab === 'favorite' ? styles.activeTabBtn : styles.tabBtn} onClick={() => setActiveTab('favorite')}>즐겨찾는 친구</button>
        </div>
        <div style={styles.searchWrapper}>
          <input type="text" placeholder="검색하기" style={styles.searchInput} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </div>

      {/* 리스트 섹션 */}
      <div style={styles.listWrapper}>
        {filteredFriends.length > 0 ? (
          filteredFriends.map((friend) => (
            <div key={friend.id} style={styles.friendItem} onClick={() => setSelectedFriend(friend)}>
              <div style={styles.avatarWrapper}>
                <img src={friend.profileImg} alt={friend.name} style={styles.profileImage} />
                {friend.isFavorite && <span style={styles.starBadge}>⭐</span>}
              </div>

              <div style={styles.infoSection}>
                <div style={styles.nameRow}>
                  <span style={styles.userName}>{friend.name}</span>
                  <div style={styles.menuContainer}>
                    <span style={styles.moreIcon} onClick={(e) => toggleMenu(e, friend.id)}>⋮</span>
                    {menuOpenId === friend.id && (
                      <div style={styles.dropdown} onClick={(e) => e.stopPropagation()}>
                        <div style={styles.menuItem} onClick={(e) => handleToggleFavorite(e, friend.id)}>
                          {friend.isFavorite ? "즐겨찾기 해제" : "즐겨찾기 등록"}
                        </div>
                        <div style={{...styles.menuItem, color: '#ff4d4f', borderBottom: 'none'}} onClick={(e) => handleDeleteFriend(e, friend.id)}>
                          친구 삭제
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div style={styles.descText}>{friend.desc}</div>
              </div>
            </div>
          ))
        ) : (
          <div style={styles.noResult}>검색 결과가 없습니다.</div>
        )}
      </div>

      {/* 상세 모달 */}
      {selectedFriend && (
        <div style={styles.modalOverlay} onClick={() => setSelectedFriend(null)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <button
                onClick={() => setSelectedFriend(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                aria-label="닫기"
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#4E3473' }}>
                  <line x1="19" y1="12" x2="5" y2="12"></line>
                  <polyline points="12 19 5 12 12 5"></polyline>
                </svg>
              </button>
            </div>
            <img src={selectedFriend.profileImg} alt={selectedFriend.name} style={styles.modalProfileImg} />
            <h2 style={styles.modalName}>{selectedFriend.name}</h2>
            <p style={styles.modalDescText}>{selectedFriend.desc}</p>
            <div style={styles.memoBox}>
              <textarea 
                style={styles.memoTextarea} 
                placeholder="이 캐릭터에 대해 메모를 추가해 보세요!"
                value={selectedFriend.memo}
                onChange={(e) => handleMemoChange(selectedFriend.id, e.target.value)}
              />
            </div>
          </div>
        </div>
      )}

      {/* 🔄 텍스트 대신 SVG 벡터 아이콘을 사용해 쏠림 현상을 완벽 해결 */}
      <button style={styles.addFloatingBtn} onClick={() => navigate('/add-friends')}>
        <svg 
          width="28" 
          height="28" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="3" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </button>
    </div>
  );
};

const styles = {
  container: { flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#fff', height: '100%', position: 'relative', marginTop: '-40px' },
  topSection: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 40px', borderBottom: '1px solid #eee', backgroundColor: '#fff' },
  tabWrapper: { display: 'flex', gap: '10px' },
  tabBtn: { padding: '8px 16px', border: '1px solid #ddd', borderRadius: '20px', cursor: 'pointer', fontSize: '14px', backgroundColor: '#fff', color: '#555' },
  activeTabBtn: { padding: '8px 16px', border: '1px solid #4E3473', borderRadius: '20px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold', backgroundColor: '#4E3473', color: '#fff' },
  searchWrapper: { backgroundColor: '#f0f0f0', borderRadius: '20px', padding: '8px 15px', width: '220px', border: '1px solid #eee' },
  searchInput: { border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '14px' },
  listWrapper: { flex: 1, overflowY: 'auto' },
  friendItem: { display: 'flex', alignItems: 'center', height: '115px', padding: '0 40px', borderBottom: '1px solid #eee', backgroundColor: '#fff', cursor: 'pointer', boxSizing: 'border-box' },
  avatarWrapper: { position: 'relative', width: '65px', height: '65px', flexShrink: 0, marginRight: '25px' },
  profileImage: { width: '65px', height: '65px', borderRadius: '50%', objectFit: 'cover', backgroundColor: '#D9D9D9', flexShrink: 0 },
  starBadge: { position: 'absolute', top: '-5px', left: '-5px', fontSize: '20px' },
  infoSection: { flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', minWidth: 0 },
  nameRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  userName: { fontSize: '24px', fontWeight: '400', color: '#4E3473' },
  menuContainer: { position: 'relative' },
  moreIcon: { fontSize: '32px', color: '#000', cursor: 'pointer', padding: '0 10px' },
  dropdown: { 
    position: 'absolute', top: '40px', right: '0', backgroundColor: '#fff', 
    border: '1px solid #eee', borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.15)', 
    zIndex: 100, width: '140px', overflow: 'hidden' 
  },
  menuItem: { padding: '14px', fontSize: '15px', textAlign: 'center', cursor: 'pointer', color: '#333', borderBottom: '1px solid #f5f5f5' },
  descText: { fontSize: '18px', color: '#666', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  noResult: { padding: '60px', textAlign: 'center', color: '#999', fontSize: '20px' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 },
  modalContent: { width: '500px', backgroundColor: '#fff', borderRadius: '30px', padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' },
  modalHeader: { width: '100%', display: 'flex', justifyContent: 'flex-start' },
  modalBack: { fontSize: '35px', cursor: 'pointer', fontWeight: 'bold' },
  modalProfileImg: { width: '200px', height: '200px', borderRadius: '50%', backgroundColor: '#D9D9D9', marginBottom: '20px', objectFit: 'cover' },
  modalName: { fontSize: '40px', fontWeight: 'bold', marginBottom: '10px' },
  modalDescText: { fontSize: '22px', color: '#333', marginBottom: '30px' },
  memoBox: { width: '100%', height: '250px', border: '1px solid #000', borderRadius: '20px', padding: '20px' },
  memoTextarea: { width: '100%', height: '100%', border: 'none', outline: 'none', fontSize: '20px', resize: 'none' },

  // 🔄 SVG 정렬 규격에 맞게 깔끔하게 가공된 플로팅 버튼 스타일
  addFloatingBtn: { 
    position: 'fixed', 
    bottom: '40px', 
    right: '40px', 
    width: '60px', 
    height: '60px', 
    borderRadius: '50%', 
    backgroundColor: '#4E3473', 
    border: 'none', 
    color: '#fff', 
    cursor: 'pointer', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    boxShadow: '0 4px 15px rgba(78, 52, 115, 0.4)',
    zIndex: 1000,
    padding: 0 // 불필요한 패딩 초기화로 순수 center 정렬 확보
  }
};

export default FriendsPage;