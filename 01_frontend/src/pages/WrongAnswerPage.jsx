import { useState, useEffect } from 'react';
import { X, ChevronDown } from 'lucide-react';
import { getWrongAnswers, deleteWrongAnswer } from '../api/wrongAnswer';

const WrongAnswerPage = () => {
  const [notes, setNotes] = useState([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    setError(false);
    getWrongAnswers()
      .then(res => setNotes(res.data.data.wrongAnswers.map(w => ({
        id: w.id,
        date: new Date(w.createdAt).toLocaleDateString(),
        original: w.original,
        corrected: w.corrected,
        reason: w.explanation,
      }))))
      .catch(() => setError(true));
  }, []);

  const handleDelete = (id) => {
    deleteWrongAnswer(id)
      .then(() => setNotes(p => p.filter(n => n.id !== id)))
      .catch(() => alert('삭제에 실패했습니다.'));
  };

  return (
    <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--t1)', marginBottom: 4 }}>오답노트</h2>
          <p style={{ fontSize: 13, color: 'var(--t3)' }}>{error ? '' : `${notes.length}개의 항목이 복습을 기다리고 있어요`}</p>
        </div>
      </div>

      {error ? (
        <div style={{ background: 'var(--surface)', borderRadius: 12, border: '1px solid var(--border)', padding: '64px 32px', textAlign: 'center' }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--error)', marginBottom: 6 }}>데이터를 불러오지 못했습니다</p>
          <p style={{ fontSize: 13, color: 'var(--t3)' }}>잠시 후 다시 시도해주세요.</p>
        </div>
      ) : notes.length === 0 ? (
        <div style={{ background: 'var(--surface)', borderRadius: 12, border: '1px solid var(--border)', padding: '64px 32px', textAlign: 'center' }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--t1)', marginBottom: 6 }}>오답이 없어요</p>
          <p style={{ fontSize: 13, color: 'var(--t3)' }}>대화를 시작하면 교정된 내용이 여기에 기록돼요.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
          {notes.map(note => (
            <div key={note.id} style={{ background: 'var(--surface)', borderRadius: 12, border: '1px solid var(--border)', borderLeft: '3px solid var(--accent)', padding: '18px 20px', position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: 11, color: 'var(--t3)', fontWeight: 500 }}>{note.date}</span>
                <button onClick={() => handleDelete(note.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)', padding: 0, display: 'flex', borderRadius: 4 }}>
                  <X size={14} />
                </button>
              </div>

              <div style={{ fontSize: 13, color: 'var(--t3)', textDecoration: 'line-through', marginBottom: 8, wordBreak: 'break-word' }}>
                "{note.original}"
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <ChevronDown size={14} color="var(--accent)" strokeWidth={2.5} />
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)', wordBreak: 'break-word' }}>"{note.corrected}"</span>
              </div>

              <div style={{ fontSize: 12, color: 'var(--t2)', lineHeight: 1.6, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
                {note.reason}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WrongAnswerPage;
