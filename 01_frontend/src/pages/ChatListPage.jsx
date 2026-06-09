import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getChatRooms, deleteChatRoom, pinChatRoom } from '../api/chat';

const ChatListPage = () => {
  const navigate = useNavigate();

  const [chatRooms, setChatRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getChatRooms()
      .then((res) => setChatRooms(res.data.data.rooms))
      .catch(() => {
        // 백엔드 연결 전 임시 mock 데이터
        setChatRooms([
          { id: 1, characterName: 'Alex', title: 'Alex와 대화', lastMessageAt: null, isPinned: true },
          { id: 2, characterName: 'Mina', title: 'Mina와 대화', lastMessageAt: null, isPinned: false },
          { id: 3, characterName: 'Katherine', title: 'Katherine과 대화', lastMessageAt: null, isPinned: false },
        ]);
      })
      .finally(() => setLoading(false));
  }, []);

  const [menuOpenId, setMenuOpenId] = useState(null);
  const mousePos = useRef({ x: 0, y: 0 });

  // 검색어 상태
  const [searchTerm, setSearchTerm] = useState('');

  const sortedRooms = [...chatRooms].sort((a, b) => b.isPinned - a.isPinned);

  // 고정 정렬된 방 목록에서 검색어 매칭 필터링
  const filteredRooms = sortedRooms.filter(room =>
    room.characterName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleMouseDown = (e) => { mousePos.current = { x: e.clientX, y: e.clientY }; };

  const handleMouseUp = (e, id) => {
    const diffX = Math.abs(e.clientX - mousePos.current.x);
    const diffY = Math.abs(e.clientY - mousePos.current.y);
    if (diffX < 5 && diffY < 5) navigate(`/chat/${id}`);
  };

  const toggleMenu = (e, id) => { e.stopPropagation(); setMenuOpenId(menuOpenId === id ? null : id); };

  const handleDelete = (e, id) => {
    e.stopPropagation();
    if (!window.confirm('삭제할까?')) return;
    deleteChatRoom(id)
      .then(() => setChatRooms(prev => prev.filter(r => r.id !== id)))
      .catch(() => alert('채팅방 삭제에 실패했습니다.'));
  };

  const handleTogglePin = (e, id) => {
    e.stopPropagation();
    const room = chatRooms.find(r => r.id === id);
    const newPinned = !room.isPinned;
    pinChatRoom(id, newPinned)
      .then(() => setChatRooms(prev => prev.map(r => r.id === id ? { ...r, isPinned: newPinned } : r)))
      .catch(() => alert('고정 변경에 실패했습니다.'));
  };

  return (
    <div style={styles.container} onClick={() => setMenuOpenId(null)}>
      
      {/* 상단 우측 검색 바 영역 */}
      <div style={styles.topSection}>
        <div style={styles.searchWrapper}>
          <input 
            type="text" 
            placeholder="채팅방 검색" 
            style={styles.searchInput} 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
        </div>
      </div>

      <div style={styles.listWrapper}>
        {loading && <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>불러오는 중...</div>}
        {filteredRooms.map((room) => (
          <div key={room.id} style={styles.chatItem} onMouseDown={handleMouseDown} onMouseUp={(e) => handleMouseUp(e, room.id)}>

            <div style={styles.profileImage}>
              <span style={{ fontSize: '24px', color: '#9e80b6' }}>{room.characterName?.[0] ?? '?'}</span>
            </div>

            <div style={styles.infoSection}>
              <div style={styles.nameRow}>
                <span style={styles.userName}>
                  {room.characterName}
                  {room.isPinned && <span style={styles.pinIcon}>📌</span>}
                </span>

                <div style={styles.menuContainer}>
                  <span style={styles.moreIcon} onMouseDown={(e) => e.stopPropagation()} onClick={(e) => toggleMenu(e, room.id)}>⋮</span>
                  {menuOpenId === room.id && (
                    <div style={styles.dropdown} onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
                      <div style={styles.menuItem} onClick={(e) => handleTogglePin(e, room.id)}>{room.isPinned ? "고정 해제" : "채팅 고정"}</div>
                      <div style={{ ...styles.menuItem, color: '#ff4d4f', borderBottom: 'none' }} onClick={(e) => handleDelete(e, room.id)}>채팅 삭제</div>
                    </div>
                  )}
                </div>
              </div>

              <div style={styles.msgRow}>
                <span style={styles.lastMsg}>{room.title}</span>
                <span style={styles.timeText}>
                  {room.lastMessageAt ? new Date(room.lastMessageAt).toLocaleDateString() : ''}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const styles = {
  container: { flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#fff', height: '100%', marginTop: '-40px' },
  topSection: { display: 'flex', justifyContent: 'flex-end', alignItems: 'center', padding: '20px 40px', borderBottom: '1px solid #eee', backgroundColor: '#fff' },
  searchWrapper: { backgroundColor: '#f0f0f0', borderRadius: '20px', padding: '8px 15px', width: '220px', border: '1px solid #eee' },
  searchInput: { border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '14px' },

  listWrapper: { flex: 1, overflowY: 'auto' },
  
  chatItem: {
    display: 'flex',
    alignItems: 'center',
    height: '115px',
    padding: '0 40px',
    borderBottom: '1px solid #eee',
    cursor: 'pointer',
    position: 'relative',
    boxSizing: 'border-box'
  },
  
  profileImage: { width: '65px', height: '65px', borderRadius: '50%', backgroundColor: '#ede7f6', marginRight: '25px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' },

  infoSection: { flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', minWidth: 0 },
  nameRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  
  userName: { fontSize: '24px', fontWeight: '400', color: '#4E3473', display: 'inline-flex', alignItems: 'center' }, 
  pinIcon: { fontSize: '18px', marginLeft: '6px' },
  
  menuContainer: { position: 'relative', display: 'flex', alignItems: 'center' },
  moreIcon: { fontSize: '32px', color: '#000', cursor: 'pointer', padding: '0 10px', display: 'inline-flex', alignItems: 'center' },
  
  dropdown: { position: 'absolute', top: '40px', right: '0', backgroundColor: '#fff', border: '1px solid #eee', borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.15)', zIndex: 100, width: '140px', overflow: 'hidden' },
  menuItem: { padding: '14px', fontSize: '15px', textAlign: 'center', borderBottom: '1px solid #f5f5f5', cursor: 'pointer', color: '#333' },
  
  msgRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px' },
  lastMsg: { fontSize: '18px', color: '#666', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  timeText: { fontSize: '16px', color: '#888', flexShrink: 0 }
};

export default ChatListPage;