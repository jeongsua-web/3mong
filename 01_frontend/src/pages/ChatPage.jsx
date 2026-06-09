import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { getChatRoom, getMessages, sendMessage, getStreamUrl } from '../api/chat';
import { LEARNED_WORDS } from '../constants/storage';

const AVATAR_COLORS = ['#6366F1', '#0891B2', '#059669', '#B45309', '#BE185D', '#7C3AED'];
const avatarColor = (name) => AVATAR_COLORS[(name || '?').charCodeAt(0) % AVATAR_COLORS.length];

const ChatPage = () => {
  const navigate = useNavigate();
  const { roomId } = useParams();
  const scrollRef = useRef();
  const sseRef = useRef(null);

  const [roomInfo, setRoomInfo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [correctionData, setCorrectionData] = useState({ original: '', corrected: '', reason: '' });
  const [inputText, setInputText] = useState('');

  useEffect(() => {
    getChatRoom(roomId).then(res => setRoomInfo(res.data.data)).catch(err => console.error(err));
    getMessages(roomId)
      .then(res => setMessages(res.data.data.messages.map(m => ({
        id: m.id, sender: m.senderType?.toLowerCase() === 'user' ? 'user' : 'ai',
        text: m.content, timestamp: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }))))
      .catch(err => console.error(err));
    return () => sseRef.current?.close();
  }, [roomId]);

  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const connectSSE = (messageId) => {
    sseRef.current?.close();
    const es = new EventSource(getStreamUrl(roomId, messageId));
    sseRef.current = es;
    let aiText = '';
    const aiMsgId = Date.now() + 1;
    setMessages(prev => [...prev, { id: aiMsgId, sender: 'ai', text: '', timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);

    es.addEventListener('ai_chunk', e => {
      aiText += JSON.parse(e.data).content;
      setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, text: aiText } : m));
    });
    es.addEventListener('evaluation', e => {
      const issues = JSON.parse(e.data).feedback?.grammarIssues;
      if (issues?.length > 0) {
        const c = { original: issues[0].issue, corrected: issues[0].correction, reason: issues[0].explanation };
        setCorrectionData(c);
      }
    });
    es.addEventListener('ai_complete', () => es.close());
    es.onerror = () => es.close();
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    const wordCount = (inputText.match(/[a-zA-Z]+/g) ?? []).length;
    if (wordCount > 0) {
      const prev = parseInt(localStorage.getItem(LEARNED_WORDS) || '0', 10);
      localStorage.setItem(LEARNED_WORDS, String(prev + wordCount));
    }
    const msg = { id: Date.now(), sender: 'user', text: inputText, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setMessages(prev => [...prev, msg]);
    setInputText('');
    sendMessage(roomId, inputText)
      .then(res => connectSSE(res.data.data.id))
      .catch(() => {
        setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'ai', text: '메시지 전송에 실패했습니다. 다시 시도해 주세요.', timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
      });
  };

  const charName = roomInfo?.characterName ?? '...';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg)', overflow: 'hidden' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 20px', height: 64, background: 'var(--surface)', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <button onClick={() => navigate('/chat-list')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t2)', padding: 6, borderRadius: 6, display: 'flex' }}>
          <ArrowLeft size={18} />
        </button>
        <div style={{ width: 34, height: 34, borderRadius: 9999, background: avatarColor(charName), display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 600, fontSize: 13, flexShrink: 0 }}>
          {charName[0] || '?'}
        </div>
        <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--t1)', flex: 1 }}>{charName}</span>
      </div>

      {/* Correction bar */}
      {(correctionData.original || correctionData.reason) && (
        <div style={{ padding: '10px 20px', background: 'var(--surface)', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <div style={{ background: 'var(--accent-l)', borderRadius: 10, padding: '10px 14px', border: '1px solid var(--accent-m)' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 5 }}>실시간 교정</div>
            {correctionData.original && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                <span style={{ fontSize: 13, color: 'var(--t3)', textDecoration: 'line-through' }}>"{correctionData.original}"</span>
                <ArrowRight size={12} color="var(--t3)" />
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)' }}>"{correctionData.corrected}"</span>
              </div>
            )}
            {correctionData.reason && <div style={{ fontSize: 12, color: 'var(--t2)' }}>{correctionData.reason}</div>}
          </div>
        </div>
      )}

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {messages.map(msg => (
          <div key={msg.id} style={{ display: 'flex', justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: 8 }}>
            {msg.sender === 'ai' && (
              <div style={{ width: 32, height: 32, borderRadius: 9999, background: avatarColor(charName), display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 600, fontSize: 12, flexShrink: 0 }}>
                {charName[0] || '?'}
              </div>
            )}
            <div style={{ maxWidth: '68%', display: 'flex', flexDirection: 'column', alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start', gap: 3 }}>
              <div style={{
                padding: '10px 14px',
                borderRadius: msg.sender === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                background: msg.sender === 'user' ? 'var(--accent)' : 'var(--surface)',
                color: msg.sender === 'user' ? '#fff' : 'var(--t1)',
                fontSize: 14,
                lineHeight: 1.55,
                border: msg.sender === 'user' ? 'none' : '1px solid var(--border)',
                wordBreak: 'break-word',
              }}>{msg.text}</div>
              <span style={{ fontSize: 11, color: 'var(--t3)' }}>{msg.timestamp}</span>
            </div>
          </div>
        ))}
        <div ref={scrollRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} style={{ padding: '12px 16px 16px', background: 'var(--surface)', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, flexShrink: 0 }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', background: 'var(--bg)', borderRadius: 20, padding: '6px 6px 6px 14px', border: '1px solid var(--border)', gap: 8 }}>
          <input
            type="text"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            placeholder="메시지를 입력하세요"
            style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: 14, color: 'var(--t1)' }}
          />
          <button type="submit" style={{ width: 32, height: 32, borderRadius: 9999, border: 'none', background: inputText.trim() ? 'var(--accent)' : 'var(--border)', color: inputText.trim() ? '#fff' : 'var(--t3)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.12s' }}>
            <ArrowRight size={15} />
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatPage;
