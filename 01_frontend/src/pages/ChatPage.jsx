import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getChatRoom, getMessages, sendMessage, getStreamUrl } from '../api/chat';

const ChatPage = () => {
  const navigate = useNavigate();
  const { roomId } = useParams();
  const scrollRef = useRef();
  const sseRef = useRef(null);

  const [roomInfo, setRoomInfo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [correctionData, setCorrectionData] = useState({
    original: '',
    corrected: '',
    reason: '대화를 시작하면 실시간으로 교정해드릴게요!',
  });
  const [inputText, setInputText] = useState('');

  // 방 정보 + 메시지 히스토리 불러오기
  useEffect(() => {
    getChatRoom(roomId)
      .then((res) => setRoomInfo(res.data.data))
      .catch((err) => console.error('Failed to load chat room:', err));

    getMessages(roomId)
      .then((res) => {
        const loaded = res.data.data.messages.map((m) => ({
          id: m.id,
          sender: m.senderType?.toLowerCase() === 'user' ? 'user' : 'ai',
          text: m.content,
          timestamp: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }));
        setMessages(loaded);
      })
      .catch((err) => console.error('Failed to load messages:', err));

    return () => sseRef.current?.close();
  }, [roomId]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // SSE로 AI 응답 스트리밍 처리
  const connectSSE = (messageId) => {
    sseRef.current?.close();
    const url = getStreamUrl(roomId, messageId);
    const es = new EventSource(url);
    sseRef.current = es;

    let aiText = '';
    const aiMsgId = Date.now() + 1;

    setMessages(prev => [...prev, { id: aiMsgId, sender: 'ai', text: '', timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);

    const handleChunk = (e) => {
      const data = JSON.parse(e.data);
      aiText += data.content;
      setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, text: aiText } : m));
    };

    const handleEvaluation = (e) => {
      const data = JSON.parse(e.data);
      const issues = data.feedback?.grammarIssues;
      if (issues?.length > 0) {
        const newCorrection = {
          original: issues[0].issue,
          corrected: issues[0].correction,
          reason: issues[0].explanation,
        };
        setCorrectionData(newCorrection);

        const newNote = {
          id: Date.now(),
          ...newCorrection,
          date: new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\. /g, '.').replace('.', ''),
        };
        const saved = JSON.parse(localStorage.getItem('wrongAnswerNotes') || '[]');
        localStorage.setItem('wrongAnswerNotes', JSON.stringify([newNote, ...saved]));
      }
    };

    const handleComplete = () => es.close();

    es.addEventListener('ai_chunk', handleChunk);
    es.addEventListener('evaluation', handleEvaluation);
    es.addEventListener('ai_complete', handleComplete);

    es.onerror = () => es.close();
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: inputText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');

    sendMessage(roomId, inputText)
      .then((res) => connectSSE(res.data.data.id))
      .catch(() => {
        // 백엔드 없을 때 mock 응답
        setTimeout(() => {
          setMessages(prev => [...prev, {
            id: Date.now() + 1,
            sender: 'ai',
            text: "I see! That sounds interesting. Tell me more!",
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }]);

          // mock 교정 데이터 → 오답노트 자동 저장
          const mockCorrection = {
            original: inputText,
            corrected: inputText + ' (corrected)',
            reason: '문법을 확인해보세요.',
          };
          setCorrectionData(mockCorrection);

          const newNote = {
            id: Date.now(),
            ...mockCorrection,
            date: new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\. /g, '.').replace('.', ''),
          };
          const saved = JSON.parse(localStorage.getItem('wrongAnswerNotes') || '[]');
          localStorage.setItem('wrongAnswerNotes', JSON.stringify([newNote, ...saved]));
        }, 1000);
      });
  };

  return (
    <div style={styles.pageWrapper}>
      {/* 1. 상단 헤더 */}
      <header style={styles.header}>
        <button onClick={() => navigate('/chat-list')} style={styles.backBtn} aria-label="뒤로가기">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
        </button>
        <h2 style={styles.headerTitle}>{roomInfo?.characterName ?? '...'}</h2>
        <div style={{ width: '40px' }}></div>
      </header>

      {/* 2. 실시간 교정창 */}
      <div style={styles.correctionFixer}>
        <div style={styles.correctionBar}>
          <div style={styles.correctionTitle}>실시간 교정 창</div>
          {correctionData.original ? (
            <div style={styles.correctionContent}>
              <span style={styles.originalText}>"{correctionData.original}"</span>
              <span style={styles.arrowIcon}>➔</span>
              <span style={styles.correctedText}>"{correctionData.corrected}"</span>
            </div>
          ) : null}
          <div style={styles.correctionReason}>{correctionData.reason}</div>
        </div>
      </div>

      {/* 3. 채팅창 영역 */}
      <div style={styles.chatBox}>
        {messages.map((msg) => (
          <div key={msg.id} style={msg.sender === 'user' ? styles.userRow : styles.aiRow}>
            {msg.sender === 'ai' && (
              <div style={styles.aiAvatarWrapper}>
                <div style={styles.aiAvatarCircle}>AI<br/>프로필</div>
              </div>
            )}
            <div style={msg.sender === 'user' ? styles.userBubble : styles.aiBubble}>
              {msg.text}
            </div>
          </div>
        ))}
        <div ref={scrollRef} />
      </div>

      {/* 4. 입력바 영역 */}
      <form onSubmit={handleSend} style={styles.inputArea}>
        <button type="button" style={styles.attachBtn} aria-label="파일 첨부">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </button>
        
        <div style={styles.inputField}>
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="메시지를 입력하세요"
            style={styles.input}
          />
          <button type="submit" style={styles.sendBtn} aria-label="전송">
            {inputText.trim() ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

const styles = {
  pageWrapper: { display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#fcfcfc', overflow: 'hidden' },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '15px 20px', backgroundColor: '#fff', borderBottom: '1px solid #f0f0f0'
  },
  headerTitle: { fontSize: '18px', fontWeight: 'bold', color: '#4E3473', margin: 0, textAlign: 'center', flex: 1 },
  backBtn: { 
    background: 'none', border: 'none', width: '40px', height: '40px', borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', 
    color: '#4E3473', padding: 0, transition: 'all 0.2s ease', opacity: 0.9
  },
  
  correctionFixer: { padding: '15px 20px', backgroundColor: '#fcfcfc' },
  correctionBar: {
    backgroundColor: '#4E3473', color: '#fff', padding: '15px 20px', borderRadius: '40px', 
    textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '5px',
    boxShadow: '0 4px 15px rgba(78, 52, 115, 0.2)',
  },
  correctionTitle: { fontSize: '12px', opacity: 0.8 },
  correctionContent: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', fontSize: '14px', fontWeight: '600' },
  originalText: { textDecoration: 'line-through', color: '#b2a4c4' },
  correctedText: { color: '#ffffff' },
  arrowIcon: { fontSize: '12px' },
  correctionReason: { fontSize: '11px', color: '#d1c8de' },

  chatBox: { flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' },

  userRow: { display: 'flex', justifyContent: 'flex-end', width: '100%' },
  userBubble: { 
    backgroundColor: '#4E3473', color: '#fff', padding: '12px 18px', borderRadius: '18px 18px 0 18px', 
    maxWidth: '70%', fontSize: '14px', boxShadow: '0 2px 8px rgba(78, 52, 115, 0.15)', wordBreak: 'break-word'
  },

  aiRow: { display: 'flex', alignItems: 'flex-start', gap: '10px', width: '100%' },
  aiAvatarWrapper: { flexShrink: 0 },
  aiAvatarCircle: { 
    width: '45px', height: '45px', borderRadius: '50%', backgroundColor: '#eee', 
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#666', border: '1px solid #ddd'
  },
  aiBubble: { 
    backgroundColor: '#fff', color: '#333', padding: '12px 18px', borderRadius: '18px 18px 18px 0', 
    maxWidth: '70%', fontSize: '14px', border: '1px solid #eee', boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
  },

  inputArea: {
    display: 'flex', alignItems: 'center', padding: '12px 16px 16px',
    backgroundColor: '#fff', borderTop: '1px solid #f0f0f0', gap: '12px',
  },
  attachBtn: {
    width: '40px', height: '40px', borderRadius: '50%', border: 'none',
    backgroundColor: '#4E3473', color: '#fff', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all 0.2s ease', opacity: 0.9, padding: '0', flexShrink: 0
  },
  inputField: {
    flex: 1, display: 'flex', alignItems: 'center', backgroundColor: '#4E3473',
    borderRadius: '24px', padding: '8px 14px', gap: '8px',
  },
  input: {
    flex: 1, border: 'none', background: 'transparent', color: '#fff',
    padding: '6px 4px', outline: 'none', fontSize: '14px',
  },
  sendBtn: {
    background: 'none', border: 'none', color: '#fff', cursor: 'pointer',
    padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center',
    opacity: 0.9, transition: 'all 0.15s ease', flexShrink: 0
  }
};

export default ChatPage;