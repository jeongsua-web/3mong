import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MoreVertical, Star, ArrowLeft, Plus } from 'lucide-react';
import { getMyCharacters, toggleFavorite, deleteCharacter } from '../api/characters';
import { createChatRoom } from '../api/chat';

const AVATAR_COLORS = ['#6366F1', '#0891B2', '#059669', '#B45309', '#BE185D', '#7C3AED'];
const avatarColor = (name) => AVATAR_COLORS[(name || '?').charCodeAt(0) % AVATAR_COLORS.length];

const FriendsPage = () => {
  const navigate = useNavigate();
  const [friends, setFriends] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFriend, setSelectedFriend] = useState(null);

  useEffect(() => {
    getMyCharacters()
      .then(res => {
        setFriends(res.data.data.characters.map(c => ({
          id: c.id, name: c.name,
          desc: `${c.role} / ${c.gender} / ${c.personality}`,
          isFavorite: c.isFavorite, profileImg: c.profileImageUrl || null, memo: c.memo || '',
        })));
      })
      .catch(() => setFriends([]));
  }, []);

  const filtered = friends.filter(f => {
    const tab = activeTab === 'all' || (activeTab === 'favorite' && f.isFavorite);
    return tab && f.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleMemoChange = (id, val) => {
    setFriends(p => p.map(f => f.id === id ? { ...f, memo: val } : f));
    setSelectedFriend(p => p?.id === id ? { ...p, memo: val } : p);
  };

  const handleToggleFavorite = (e, id) => {
    e.stopPropagation();
    const f = friends.find(f => f.id === id);
    const v = !f.isFavorite;
    setMenuOpenId(null);
    toggleFavorite(id, v)
      .then(() => setFriends(p => p.map(f => f.id === id ? { ...f, isFavorite: v } : f)))
      .catch(() => alert('즐겨찾기 변경에 실패했습니다.'));
  };

  const handleStartChat = (f) => {
    createChatRoom(f.id, `${f.name}와 대화`)
      .then(res => navigate(`/chat/${res.data.data.id}`))
      .catch(() => alert('채팅방 생성에 실패했습니다.'));
  };

  const handleDelete = (e, id) => {
    e.stopPropagation();
    if (!window.confirm('정말 이 친구를 삭제하시겠습니까?')) return;
    deleteCharacter(id)
      .then(() => { setFriends(p => p.filter(f => f.id !== id)); setMenuOpenId(null); })
      .catch(() => alert('친구 삭제에 실패했습니다.'));
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--surface)', position: 'relative' }} onClick={() => setMenuOpenId(null)}>

      {/* Top bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 32px', borderBottom: '1px solid var(--border)', background: 'var(--surface)', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {[['all','모든 친구'],['favorite','즐겨찾기']].map(([val, label]) => (
            <button key={val} onClick={() => setActiveTab(val)} style={{ padding: '6px 14px', border: '1px solid', borderColor: activeTab === val ? 'var(--accent)' : 'var(--border)', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: activeTab === val ? 600 : 400, background: activeTab === val ? 'var(--accent-l)' : 'transparent', color: activeTab === val ? 'var(--accent)' : 'var(--t2)', transition: 'all 0.12s' }}>
              {label}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg)', borderRadius: 8, padding: '7px 12px', border: '1px solid var(--border)', width: 220 }}>
          <Search size={14} color="var(--t3)" strokeWidth={2} />
          <input type="text" placeholder="검색하기" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 13, color: 'var(--t1)', width: '100%' }} />
        </div>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {filtered.length > 0 ? filtered.map(f => (
          <div key={f.id} onClick={() => setSelectedFriend(f)}
            style={{ display: 'flex', alignItems: 'center', height: 72, padding: '0 32px', borderBottom: '1px solid var(--border)', cursor: 'pointer', background: 'var(--surface)', transition: 'background 0.1s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--surface)'}
          >
            {/* Avatar */}
            <div style={{ position: 'relative', marginRight: 14, flexShrink: 0 }}>
              {f.profileImg
                ? <img src={f.profileImg} alt={f.name} style={{ width: 40, height: 40, borderRadius: 9999, objectFit: 'cover' }} />
                : <div style={{ width: 40, height: 40, borderRadius: 9999, background: avatarColor(f.name), display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 600, fontSize: 15 }}>{f.name[0]}</div>
              }
              {f.isFavorite && (
                <div style={{ position: 'absolute', top: -3, right: -3, width: 14, height: 14, background: 'var(--surface)', borderRadius: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Star size={10} color="#D97706" fill="#D97706" />
                </div>
              )}
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--t1)', marginBottom: 2 }}>{f.name}</div>
              <div style={{ fontSize: 12, color: 'var(--t3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.desc}</div>
            </div>

            {/* Menu */}
            <div style={{ position: 'relative', marginLeft: 8 }} onClick={e => e.stopPropagation()}>
              <button
                onClick={e => { e.stopPropagation(); setMenuOpenId(menuOpenId === f.id ? null : f.id); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)', padding: '4px', borderRadius: 4, display: 'flex', alignItems: 'center' }}
              >
                <MoreVertical size={15} />
              </button>
              {menuOpenId === f.id && (
                <div style={{ position: 'absolute', top: 30, right: 0, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, boxShadow: 'var(--sh-lg)', zIndex: 100, width: 140, overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
                  <div style={menuItem} onClick={e => handleToggleFavorite(e, f.id)}>{f.isFavorite ? '즐겨찾기 해제' : '즐겨찾기 등록'}</div>
                  <div style={{ ...menuItem, color: 'var(--error)', borderBottom: 'none' }} onClick={e => handleDelete(e, f.id)}>친구 삭제</div>
                </div>
              )}
            </div>
          </div>
        )) : (
          <div style={{ padding: '64px 32px', textAlign: 'center', color: 'var(--t3)', fontSize: 13 }}>검색 결과가 없습니다.</div>
        )}
      </div>

      {/* Detail modal */}
      {selectedFriend && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 }} onClick={() => setSelectedFriend(null)}>
          <div style={{ width: 420, background: 'var(--surface)', borderRadius: 16, padding: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', border: '1px solid var(--border)' }} onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedFriend(null)} style={{ position: 'absolute', top: 16, left: 16, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)', padding: 4, borderRadius: 6, display: 'flex' }}>
              <ArrowLeft size={18} />
            </button>

            {selectedFriend.profileImg
              ? <img src={selectedFriend.profileImg} alt={selectedFriend.name} style={{ width: 80, height: 80, borderRadius: 9999, objectFit: 'cover', marginBottom: 14, border: '1px solid var(--border)' }} />
              : <div style={{ width: 80, height: 80, borderRadius: 9999, background: avatarColor(selectedFriend.name), display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 30, marginBottom: 14 }}>{selectedFriend.name[0]}</div>
            }
            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--t1)', marginBottom: 4 }}>{selectedFriend.name}</h2>
            <p style={{ fontSize: 13, color: 'var(--t2)', marginBottom: 24 }}>{selectedFriend.desc}</p>

            <div style={{ width: '100%', border: '1px solid var(--border)', borderRadius: 10, padding: 14, marginBottom: 16 }}>
              <textarea
                style={{ width: '100%', height: 110, border: 'none', outline: 'none', fontSize: 13, resize: 'none', color: 'var(--t1)', background: 'transparent', fontFamily: 'inherit', lineHeight: 1.6 }}
                placeholder="이 캐릭터에 대해 메모를 추가해 보세요"
                value={selectedFriend.memo}
                onChange={e => handleMemoChange(selectedFriend.id, e.target.value)}
              />
            </div>
            <button
              onClick={() => handleStartChat(selectedFriend)}
              style={{ width: '100%', padding: '11px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
            >
              대화 시작하기
            </button>
          </div>
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => navigate('/add-friends')}
        style={{ position: 'fixed', bottom: 32, right: 32, width: 44, height: 44, borderRadius: 9999, background: 'var(--accent)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--sh-md)', zIndex: 1000 }}
      >
        <Plus size={20} />
      </button>
    </div>
  );
};

const menuItem = { padding: '10px 14px', fontSize: 13, cursor: 'pointer', color: 'var(--t1)', borderBottom: '1px solid var(--border)' };

export default FriendsPage;
