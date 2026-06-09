import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus } from 'lucide-react';
import { getRecommendedCharacters, createCustomCharacter } from '../api/characters';

const MOCK = [
  { id: 1, name: 'James', role: 'Boyfriend', gender: 'male', trait: 'nonchalant, shy' },
  { id: 2, name: 'Charles', role: 'Colleague', gender: 'male', trait: 'cool, detached' },
  { id: 3, name: 'Anna', role: 'Mom', gender: 'female', trait: 'warm, kind' },
  { id: 4, name: 'Jenny', role: 'Colleague', gender: 'female', trait: 'bright, shy' },
];

const AVATAR_COLORS = ['#6366F1', '#0891B2', '#059669', '#B45309', '#BE185D', '#7C3AED'];
const avatarColor = (name) => AVATAR_COLORS[(name || '?').charCodeAt(0) % AVATAR_COLORS.length];

const AddFriendsPage = () => {
  const navigate = useNavigate();
  const [friends, setFriends] = useState(MOCK);
  const [addingId, setAddingId] = useState(null);

  useEffect(() => {
    getRecommendedCharacters()
      .then(res => setFriends(res.data.data.characters))
      .catch(() => setFriends(MOCK));
  }, []);

  const handleAdd = (f) => {
    if (addingId === f.id) return;
    setAddingId(f.id);
    const data = new FormData();
    data.append('name', f.name);
    data.append('gender', f.gender);
    data.append('role', f.role);
    data.append('personality', f.trait || '');
    createCustomCharacter(data)
      .then(() => { navigate('/friends'); })
      .catch(() => { alert('친구 추가에 실패했습니다. 잠시 후 다시 시도해주세요.'); })
      .finally(() => { setAddingId(null); });
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg)' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 32px', borderBottom: '1px solid var(--border)', background: 'var(--surface)', flexShrink: 0 }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t2)', padding: 4, borderRadius: 6, display: 'flex' }}>
          <ArrowLeft size={18} />
        </button>
        <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--t1)' }}>친구 추가</h2>
      </div>

      {/* Grid */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 32 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 16 }}>
          {friends.map(f => (
            <div key={f.id} style={card}>
              <div style={{ width: 64, height: 64, borderRadius: 9999, background: f.img ? 'none' : avatarColor(f.name), display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14, overflow: 'hidden', flexShrink: 0 }}>
                {f.img
                  ? <img src={f.img} alt={f.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ color: 'white', fontWeight: 700, fontSize: 22 }}>{f.name[0]}</span>
                }
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--t1)', marginBottom: 6 }}>{f.name}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, justifyContent: 'center', marginBottom: 8 }}>
                <span style={chip}>{f.role}</span>
                <span style={chip}>{f.gender === 'male' ? '남성' : '여성'}</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--t3)', textAlign: 'center', lineHeight: 1.5, marginBottom: 14 }}>{f.trait}</div>
              <button
                onClick={() => handleAdd(f)}
                disabled={addingId === f.id}
                style={{ padding: '7px 18px', background: addingId === f.id ? 'var(--accent-l)' : 'var(--accent)', color: addingId === f.id ? 'var(--accent)' : '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: addingId === f.id ? 'not-allowed' : 'pointer' }}
              >
                {addingId === f.id ? '추가 중...' : '친구 추가'}
              </button>
            </div>
          ))}

          {/* Custom card */}
          <div style={{ ...card, background: 'var(--surface2)', cursor: 'pointer', border: '1px dashed var(--border2)' }} onClick={() => navigate('/custom-friend')}>
            <div style={{ width: 64, height: 64, borderRadius: 9999, background: 'var(--accent-l)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
              <Plus size={24} color="var(--accent)" strokeWidth={2} />
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--accent)', marginBottom: 6 }}>커스텀 하기</div>
            <div style={{ fontSize: 12, color: 'var(--t3)', textAlign: 'center' }}>원하는 친구를 직접 만들어 보세요</div>
          </div>
        </div>
      </div>
    </div>
  );
};

const card = {
  background: 'var(--surface)',
  borderRadius: 12,
  border: '1px solid var(--border)',
  padding: '20px 16px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
};

const chip = {
  fontSize: 11,
  fontWeight: 500,
  color: 'var(--accent)',
  background: 'var(--accent-l)',
  padding: '2px 8px',
  borderRadius: 4,
};

export default AddFriendsPage;
