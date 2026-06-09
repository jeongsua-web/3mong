import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MoreVertical, Pin } from 'lucide-react';
import { getChatRooms, deleteChatRoom, pinChatRoom } from '../api/chat';

const AVATAR_COLORS = ['#6366F1', '#0891B2', '#059669', '#B45309', '#BE185D', '#7C3AED'];
const avatarColor = (name) => AVATAR_COLORS[(name || '?').charCodeAt(0) % AVATAR_COLORS.length];

const ChatListPage = () => {
  const navigate = useNavigate();
  const [chatRooms, setChatRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const mousePos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    getChatRooms()
      .then(res => setChatRooms(res.data.data.rooms))
      .catch(() => setChatRooms([]))
      .finally(() => setLoading(false));
  }, []);

  const sorted = [...chatRooms].sort((a, b) => b.isPinned - a.isPinned);
  const filtered = sorted.filter(r => r.characterName?.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleMouseDown = e => { mousePos.current = { x: e.clientX, y: e.clientY }; };
  const handleMouseUp = (e, id) => {
    if (Math.abs(e.clientX - mousePos.current.x) < 5 && Math.abs(e.clientY - mousePos.current.y) < 5) navigate(`/chat/${id}`);
  };

  const handleDelete = (e, id) => {
    e.stopPropagation();
    if (!window.confirm('삭제할까?')) return;
    deleteChatRoom(id).then(() => setChatRooms(p => p.filter(r => r.id !== id))).catch(() => alert('채팅방 삭제에 실패했습니다.'));
  };

  const handleTogglePin = (e, id) => {
    e.stopPropagation();
    const r = chatRooms.find(r => r.id === id);
    const v = !r.isPinned;
    pinChatRoom(id, v).then(() => setChatRooms(p => p.map(r => r.id === id ? { ...r, isPinned: v } : r))).catch(() => alert('고정 변경에 실패했습니다.'));
  };

  const formatTime = (ts) => {
    if (!ts) return '';
    const d = new Date(ts);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return d.toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' });
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--surface)' }} onClick={() => setMenuOpenId(null)}>

      {/* Top bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 32px', borderBottom: '1px solid var(--border)', background: 'var(--surface)', flexShrink: 0 }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--t1)' }}>AI 채팅</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg)', borderRadius: 8, padding: '7px 12px', border: '1px solid var(--border)', width: 220 }}>
          <Search size={14} color="var(--t3)" strokeWidth={2} />
          <input type="text" placeholder="채팅방 검색" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 13, color: 'var(--t1)', width: '100%' }} />
        </div>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {loading && <div style={{ padding: '48px 32px', textAlign: 'center', color: 'var(--t3)', fontSize: 13 }}>불러오는 중...</div>}
        {filtered.map(room => (
          <div key={room.id} onMouseDown={handleMouseDown} onMouseUp={e => handleMouseUp(e, room.id)}
            style={{ display: 'flex', alignItems: 'center', height: 72, padding: '0 32px', borderBottom: '1px solid var(--border)', cursor: 'pointer', background: 'var(--surface)', transition: 'background 0.1s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--surface)'}
          >
            {/* Avatar */}
            <div style={{ width: 40, height: 40, borderRadius: 9999, background: avatarColor(room.characterName), display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 600, fontSize: 15, flexShrink: 0, marginRight: 14 }}>
              {room.characterName?.[0] ?? '?'}
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--t1)' }}>{room.characterName}</span>
                {room.isPinned && <Pin size={12} color="var(--accent)" fill="var(--accent)" />}
              </div>
              <span style={{ fontSize: 12, color: 'var(--t3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{room.title}</span>
            </div>

            {/* Time + Menu */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, marginLeft: 12, flexShrink: 0 }}>
              <span style={{ fontSize: 11, color: 'var(--t3)' }}>{formatTime(room.lastMessageAt)}</span>
              <div style={{ position: 'relative' }} onMouseDown={e => e.stopPropagation()}>
                <button
                  onClick={e => { e.stopPropagation(); setMenuOpenId(menuOpenId === room.id ? null : room.id); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)', padding: '2px 4px', borderRadius: 4, display: 'flex', alignItems: 'center' }}
                >
                  <MoreVertical size={15} />
                </button>
                {menuOpenId === room.id && (
                  <div style={{ position: 'absolute', top: 24, right: 0, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, boxShadow: 'var(--sh-lg)', zIndex: 100, width: 130, overflow: 'hidden' }} onMouseDown={e => e.stopPropagation()} onClick={e => e.stopPropagation()}>
                    <div style={menuItem} onClick={e => handleTogglePin(e, room.id)}>{room.isPinned ? '고정 해제' : '채팅 고정'}</div>
                    <div style={{ ...menuItem, color: 'var(--error)', borderBottom: 'none' }} onClick={e => handleDelete(e, room.id)}>채팅 삭제</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {!loading && filtered.length === 0 && (
          <div style={{ padding: '64px 32px', textAlign: 'center', color: 'var(--t3)', fontSize: 13 }}>채팅방이 없습니다.</div>
        )}
      </div>
    </div>
  );
};

const menuItem = { padding: '10px 14px', fontSize: 13, cursor: 'pointer', color: 'var(--t1)', borderBottom: '1px solid var(--border)' };

export default ChatListPage;
