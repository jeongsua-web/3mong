import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './HomePage.css';
import { WRONG_ANSWER_NOTES } from '../constants/storage';
const getWrongAnswerNotes = () => {
  const saved = localStorage.getItem(WRONG_ANSWER_NOTES);
  return saved ? JSON.parse(saved) : [];
};

const HomePage = () => {
  const navigate = useNavigate();
  const wrongAnswerNotes = getWrongAnswerNotes();
  const [goals, setGoals] = useState([
    { text: '10분간 영어학습 진행하기!', done: false },
    { text: '단어 20개 완벽하게 암기하기!', done: false },
    { text: '오답노트 다시 확인하기!', done: false },
    { text: '', done: false },
    { text: '', done: false },
  ]);

  const toggleGoal = (index) => {
    const newGoals = [...goals];
    newGoals[index].done = !newGoals[index].done;
    setGoals(newGoals);
  };

  return (
    <>
      <div style={{display: 'flex', gap: '30px', alignItems: 'stretch'}}>
        <div style={{display: 'flex', flexDirection: 'column'}}>
          <h2>오늘의 목표에요</h2>
          <div className="goal-box" style={{flex: 1}}>
            {goals.map((goal, index) => (
              <label key={index} className='goal-item'>
                <input
                  type="checkbox"
                  checked={goal.done}
                  onChange={() => toggleGoal(index)}
                />
                {goal.text && (
                  <span className={goal.done ? 'done' : ''}>
                    {goal.text}
                  </span>
                )}
              </label>
            ))}
          </div>
        </div>

        <div style={{display: 'flex', flexDirection: 'column'}}>
          <div style={{visibility: 'hidden'}}><h2>placeholder</h2></div>
          <div className="start-box" style={{flex: 1}}>
            <p className="start-title">학습을 시작해요!</p>
            <button className="start-btn">
              START!
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{marginLeft: '6px', display: 'inline'}}>
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <hr className='divider'/>

      <div style={{display: 'flex', gap: '30px', marginTop: '50px'}}>
        <div>
          <h2>오늘의 표현 하나 배워보세요</h2>
          <div className="expression-box">
            <p><strong>Don't even think about it.</strong></p>
            <p>꿈도 꾸지마!</p>
          </div>
        </div>

        <div>
          <h2>동기부여 가득!</h2>
          <div className="willpower-box">
            <p>"힘들 때 어떻게 건너갔죠?<br/>그냥 힘들어 했더니 지나갔어요!"</p>
          </div>
        </div>
      </div>

      <div style={{display: 'flex', gap: '20px', marginTop: '30px'}}>
        <div>
          <h2>
            📝 오답노트
            <button
              onClick={() => navigate('/wrong-answer')}
              style={{background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginLeft: '8px', display: 'inline-flex', alignItems: 'center', verticalAlign: 'text-bottom', lineHeight: '1', position: 'relative', top: '-2px'}}
              aria-label="오답노트로 이동"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </button>
          </h2>
          <div className="wronganswer-box" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '10px', padding: '20px' }}>
            <p style={{ fontSize: '13px', color: '#aaa', margin: 0 }}>
              마지막 학습: {wrongAnswerNotes[0]?.date ?? '-'}
            </p>
            <p style={{ fontSize: '15px', color: '#4E3473', fontWeight: '600', margin: 0 }}>
              오답 {wrongAnswerNotes.length}개가 복습을 기다리고 있어요!
            </p>
          </div>
        </div>

        <div>
          <h2>📖 단어장</h2>
          <div className="wronganswer-box">
            <p className="wronganswer-item">☁️ sky　　하늘</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default HomePage;