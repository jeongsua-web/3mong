import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flame, BookOpen, MessageSquare, ArrowRight, CheckSquare } from 'lucide-react';
import { DAILY_CHAT_SECONDS_PREFIX, DAILY_LEARNED_WORDS_PREFIX, WRONG_ANSWER_REVIEW_DATE } from '../constants/storage';
import { getChatRooms } from '../api/chat';
import { getWrongAnswers } from '../api/wrongAnswer';

const todayDateKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const loadGoals = () => {
  const dk = todayDateKey();
  const chatSeconds = parseInt(localStorage.getItem(`${DAILY_CHAT_SECONDS_PREFIX}${dk}`) || '0', 10);
  const dailyWords = parseInt(localStorage.getItem(`${DAILY_LEARNED_WORDS_PREFIX}${dk}`) || '0', 10);
  const reviewDate = localStorage.getItem(WRONG_ANSWER_REVIEW_DATE);
  return [
    { text: '10분간 영어학습 진행하기', done: chatSeconds >= 600 },
    { text: '단어 20개 완벽하게 암기하기', done: dailyWords >= 20 },
    { text: '오답노트 다시 확인하기', done: reviewDate === dk },
  ];
};

const EXPRESSIONS = [
  { en: "Don't even think about it.", ko: '꿈도 꾸지 마!' },
  { en: "It's on the tip of my tongue.", ko: '말이 입에서 맴돌아요.' },
  { en: "I'm all ears.", ko: '다 들을게요. / 말해봐요.' },
  { en: "Break a leg!", ko: '잘 해봐요! / 행운을 빌어요!' },
  { en: "Hit the sack.", ko: '잠자리에 들다.' },
  { en: "Bite the bullet.", ko: '이를 악물고 참다.' },
  { en: "It's a piece of cake.", ko: '식은 죽 먹기야.' },
  { en: "Under the weather.", ko: '몸이 좋지 않아요.' },
  { en: "Spill the beans.", ko: '비밀을 누설하다.' },
  { en: "Once in a blue moon.", ko: '아주 가끔, 드물게.' },
  { en: "The ball is in your court.", ko: '이제 당신 차례예요.' },
  { en: "Hang in there.", ko: '조금만 더 버텨요.' },
  { en: "Get the ball rolling.", ko: '일을 시작하다, 시동을 걸다.' },
  { en: "Call it a day.", ko: '오늘은 여기까지 해요.' },
  { en: "Go the extra mile.", ko: '한 발 더 나아가다, 남다른 노력을 하다.' },
  { en: "Kill two birds with one stone.", ko: '일석이조.' },
  { en: "Cost an arm and a leg.", ko: '굉장히 비싸다.' },
  { en: "Let the cat out of the bag.", ko: '무심코 비밀을 말해버리다.' },
  { en: "Bite off more than you can chew.", ko: '과욕을 부리다.' },
  { en: "You can't judge a book by its cover.", ko: '겉만 보고 판단하지 마세요.' },
];

const QUOTES = [
  '힘들 때 어떻게 건너갔죠?\n그냥 힘들어 했더니 지나갔어요!',
  '영어는 매일 조금씩이 답이에요.\n오늘도 한 걸음 앞으로!',
  '실수는 배움의 증거예요.\n틀려도 괜찮아요.',
  '유창함은 완벽함이 아닌\n두려움 없이 말하는 것에서 시작돼요.',
  '오늘의 1%가 쌓여\n내일의 나를 만들어요.',
  '어제보다 오늘 한 단어 더.\n그게 전부예요.',
  '잘 못해도 괜찮아요.\n꾸준함이 재능을 이겨요.',
  '처음엔 누구나 서툴러요.\n포기하지 않는 사람이 결국 잘해요.',
  '영어가 어렵게 느껴질수록\n그만큼 성장하고 있다는 신호예요.',
  '오늘 배운 표현 하나가\n언젠가 진짜 대화에서 빛날 거예요.',
  '두려움이 사라질 때까지 기다리지 말고\n두려운 채로 시작하세요.',
  '매일 5분이라도 영어에 노출되면\n뇌는 조금씩 바뀌어요.',
  '완벽한 문장보다\n용기 있는 한 마디가 더 값져요.',
  '영어는 언어예요.\n시험이 아니에요. 그냥 말해봐요.',
  '지금 이 순간 공부하는 나,\n충분히 대단해요.',
  '틀린 문장 하나가\n맞는 문장 열 개를 가르쳐줘요.',
  '느려도 괜찮아요.\n멈추지만 않으면 돼요.',
  '오늘의 나는 어제의 나보다\n조금 더 영어를 알아요.',
  '꿈꾸는 언어가 생기면\n세상이 두 배로 넓어져요.',
  '지금 어색한 발음도\n연습하면 자연스러워져요.',
];

const dayIndex = (arr) => {
  const start = new Date(2026, 0, 1);
  const today = new Date();
  const diff = Math.floor((today - start) / 86400000);
  return ((diff % arr.length) + arr.length) % arr.length;
};

const EXPRESSION = EXPRESSIONS[dayIndex(EXPRESSIONS)];
const QUOTE = QUOTES[dayIndex(QUOTES)];

const CARD = {
  background: 'var(--surface)',
  borderRadius: 12,
  border: '1px solid var(--border)',
  padding: 24,
};

const calcStreak = (rooms) => {
  const dates = new Set(
    rooms.map(r => r.lastMessageAt).filter(Boolean).map(d => d.slice(0, 10))
  );
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let check = new Date(today);
  if (!dates.has(check.toISOString().slice(0, 10))) {
    check.setDate(check.getDate() - 1);
  }
  let streak = 0;
  while (dates.has(check.toISOString().slice(0, 10))) {
    streak++;
    check.setDate(check.getDate() - 1);
  }
  return streak;
};

const StatCard = ({ icon: Icon, label, value, unit }) => (
  <div style={CARD}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
      <Icon size={16} color="var(--t3)" strokeWidth={2} />
      <span style={{ fontSize: 12, color: 'var(--t2)', fontWeight: 500 }}>{label}</span>
    </div>
    <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--t1)', lineHeight: 1, letterSpacing: '-0.5px' }}>
      {value === '…' ? <span style={{ fontSize: 22, color: 'var(--t3)' }}>—</span> : value}
      {value !== '…' && <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--t2)', marginLeft: 4 }}>{unit}</span>}
    </div>
  </div>
);

const HomePage = () => {
  const navigate = useNavigate();
  const [chatCount, setChatCount] = useState(null);
  const [streakDays, setStreakDays] = useState(null);
  const [wrongAnswerCount, setWrongAnswerCount] = useState(null);
  const [lastWrongAnswerDate, setLastWrongAnswerDate] = useState(null);

  useEffect(() => {
    getChatRooms({ limit: 200 })
      .then(res => {
        const d = res.data?.data;
        const rooms = d?.rooms ?? [];
        setChatCount(d?.total ?? rooms.length);
        setStreakDays(calcStreak(rooms));
      })
      .catch(() => { setChatCount(0); setStreakDays(0); });

    getWrongAnswers()
      .then(res => {
        const items = res.data?.data?.wrongAnswers ?? [];
        setWrongAnswerCount(items.length);
        if (items[0]?.createdAt) {
          setLastWrongAnswerDate(new Date(items[0].createdAt).toLocaleDateString('ko-KR'));
        }
      })
      .catch(() => setWrongAnswerCount(0));
  }, []);

  const [goals, setGoals] = useState(loadGoals);

  useEffect(() => {
    const timer = setInterval(() => setGoals(loadGoals()), 5000);
    return () => clearInterval(timer);
  }, []);

  const done = goals.filter(g => g.done).length;

  return (
    <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
        <StatCard icon={Flame} label="학습 연속" value={streakDays === null ? '…' : String(streakDays)} unit="일" />
        <StatCard icon={BookOpen} label="학습한 단어" value={String(parseInt(localStorage.getItem('learnedWords') || '0', 10))} unit="개" />
        <StatCard icon={MessageSquare} label="대화 횟수" value={chatCount === null ? '…' : String(chatCount)} unit="회" />
      </div>

      {/* Goals + Start CTA */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        {/* Goals */}
        <div style={CARD}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckSquare size={15} color="var(--t3)" strokeWidth={2} />
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--t1)' }}>오늘의 목표</span>
            </div>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent)', background: 'var(--accent-l)', padding: '2px 8px', borderRadius: 9999 }}>{done}/{goals.length}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {goals.map((g, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 8px', borderRadius: 8, background: g.done ? 'var(--surface2)' : 'transparent' }}>
                <div style={{ width: 16, height: 16, borderRadius: 4, flexShrink: 0, border: `1.5px solid ${g.done ? 'var(--accent)' : 'var(--border2)'}`, background: g.done ? 'var(--accent)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {g.done && (
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  )}
                </div>
                <span style={{ fontSize: 13, color: g.done ? 'var(--t3)' : 'var(--t1)', textDecoration: g.done ? 'line-through' : 'none' }}>{g.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Start CTA */}
        <div style={{ ...CARD, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 20 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--t1)', marginBottom: 6 }}>AI 친구와 대화 시작</div>
            <p style={{ fontSize: 13, color: 'var(--t2)', lineHeight: 1.6 }}>
              영어 대화를 통해 자연스럽게 표현력을 키워보세요.
            </p>
          </div>
          <button
            onClick={() => navigate('/chat-list')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 16px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer', alignSelf: 'flex-start' }}
          >
            대화 시작하기
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* Expression + Quote */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div style={CARD}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 12 }}>오늘의 표현</div>
          <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--t1)', marginBottom: 8, lineHeight: 1.4 }}>{EXPRESSION.en}</p>
          <p style={{ fontSize: 13, color: 'var(--t2)' }}>{EXPRESSION.ko}</p>
        </div>

        <div style={{ ...CARD, background: 'var(--surface2)' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 12 }}>오늘의 동기부여</div>
          <p style={{ fontSize: 13, color: 'var(--t1)', lineHeight: 1.7, whiteSpace: 'pre-line' }}>{QUOTE}</p>
        </div>
      </div>

      {/* Wrong answer summary */}
      <div
        style={{ ...CARD, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px' }}
        onClick={() => navigate('/wrong-answer')}
        role="button"
      >
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 5 }}>오답노트</div>
          <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--t1)' }}>
            {wrongAnswerCount === null
              ? '불러오는 중...'
              : wrongAnswerCount > 0
                ? `${wrongAnswerCount}개의 오답이 복습을 기다리고 있어요`
                : '아직 오답이 없어요. 열심히 학습하세요!'}
          </p>
          {lastWrongAnswerDate && (
            <p style={{ fontSize: 11, color: 'var(--t3)', marginTop: 3 }}>마지막 학습: {lastWrongAnswerDate}</p>
          )}
        </div>
        <ArrowRight size={16} color="var(--t3)" />
      </div>

    </div>
  );
};

export default HomePage;
