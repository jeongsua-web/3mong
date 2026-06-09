import { useState, useEffect } from 'react';
import './WrongAnswerPage.css';
import { mockNotes } from '../data/wrongAnswerMock';
import { getWrongAnswers, deleteWrongAnswer } from '../api/wrongAnswer';

const WrongAnswerPage = () => {
  const [notes, setNotes] = useState([]);

  useEffect(() => {
    getWrongAnswers()
      .then((res) => {
        const data = res.data.data.wrongAnswers.map((w) => ({
          id: w.id,
          date: new Date(w.createdAt).toLocaleDateString(),
          original: w.original,
          corrected: w.corrected,
          reason: w.explanation,
        }));
        setNotes(data);
      })
      .catch(() => setNotes(mockNotes));
  }, []);

  const handleDelete = (id) => {
    deleteWrongAnswer(id)
      .then(() => setNotes((prev) => prev.filter(n => n.id !== id)))
      .catch(() => alert('삭제에 실패했습니다.'));
  };

  return (
    <>
      <h2 style={{ marginTop: '-30px' }}>📝 오답노트</h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginTop: '20px' }}>
        {notes.map((note) => (
          <div key={note.id} className="notebook-box">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="note-date">{note.date}</div>
              <button className="note-delete-btn" onClick={() => handleDelete(note.id)}>✕</button>
            </div>
            <div className="note-original">"{note.original}"</div>
            <div className="note-arrow">↓</div>
            <div className="note-corrected">"{note.corrected}"</div>
            <div className="note-reason">{note.reason}</div>
          </div>
        ))}
      </div>
    </>
  );
};

export default WrongAnswerPage;
