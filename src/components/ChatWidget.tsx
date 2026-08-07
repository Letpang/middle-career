import React, { useEffect, useRef, useState } from 'react';
import { MessageCircle, X, Send, Loader2 } from 'lucide-react';
import { sendChatMessage, type ChatMessage } from '../lib/chat';

const WELCOME_MESSAGE: ChatMessage = {
  role: 'assistant',
  text: '안녕하세요! 커리어 브릿지 AI 도우미입니다. 일자리, 교육, 상담 신청 등 사이트 이용이 궁금하시거나 이력서·면접 관련 고민이 있으시면 편하게 물어보세요.',
};

const HISTORY_LIMIT = 6;

const ChatWidget: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open, loading]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const nextMessages = [...messages, { role: 'user' as const, text }];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);
    setError(undefined);

    const history = nextMessages.slice(-1 - HISTORY_LIMIT, -1);

    try {
      const data = await sendChatMessage(text, history);
      if (data.error) {
        setError(data.error);
      } else if (data.reply) {
        setMessages((prev) => [...prev, { role: 'assistant', text: data.reply as string }]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div style={{ position: 'fixed', right: '24px', bottom: '24px', zIndex: 1000 }}>
      {open && (
        <div
          className="card"
          style={{
            width: '340px',
            maxWidth: 'calc(100vw - 48px)',
            height: '460px',
            maxHeight: 'calc(100vh - 140px)',
            display: 'flex',
            flexDirection: 'column',
            padding: 0,
            overflow: 'hidden',
            marginBottom: '16px',
            boxShadow: '0 12px 32px rgba(0,0,0,0.18)',
          }}
        >
          {/* 헤더 */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 18px',
              backgroundColor: 'var(--primary)',
              color: '#ffffff',
              flexShrink: 0,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MessageCircle size={20} />
              <span style={{ fontWeight: 700 }}>AI 질문창</span>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="닫기"
              style={{ color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <X size={20} />
            </button>
          </div>

          {/* 메시지 목록 */}
          <div
            ref={scrollRef}
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              backgroundColor: 'var(--bg-secondary)',
            }}
          >
            {messages.map((m, idx) => (
              <div
                key={idx}
                style={{
                  alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                  padding: '10px 14px',
                  borderRadius: '14px',
                  fontSize: '0.9rem',
                  lineHeight: 1.5,
                  whiteSpace: 'pre-wrap',
                  backgroundColor: m.role === 'user' ? 'var(--primary)' : 'var(--bg-primary)',
                  color: m.role === 'user' ? '#ffffff' : 'var(--text-primary)',
                  border: m.role === 'user' ? 'none' : '1px solid var(--border-color)',
                }}
              >
                {m.text}
              </div>
            ))}

            {loading && (
              <div
                style={{
                  alignSelf: 'flex-start',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: 'var(--text-muted)',
                  fontSize: '0.85rem',
                  padding: '4px 4px',
                }}
              >
                <Loader2 size={14} className="spin" /> 답변을 생각하고 있어요...
              </div>
            )}

            {error && (
              <div
                style={{
                  alignSelf: 'flex-start',
                  maxWidth: '90%',
                  padding: '10px 14px',
                  borderRadius: '14px',
                  fontSize: '0.85rem',
                  backgroundColor: 'rgba(239,68,68,0.1)',
                  color: 'var(--danger)',
                }}
              >
                {error}
              </div>
            )}
          </div>

          {/* 입력창 */}
          <div
            style={{
              display: 'flex',
              gap: '8px',
              padding: '12px',
              borderTop: '1px solid var(--border-color)',
              flexShrink: 0,
              backgroundColor: 'var(--bg-primary)',
            }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="궁금한 점을 입력해 주세요..."
              style={{ flex: 1 }}
              disabled={loading}
            />
            <button
              className="btn btn-primary"
              onClick={handleSend}
              disabled={loading || !input.trim()}
              style={{ padding: '10px 14px', display: 'flex', alignItems: 'center' }}
              aria-label="보내기"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}

      {/* 플로팅 버튼 */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        aria-label={open ? 'AI 질문창 닫기' : 'AI 질문창 열기'}
        style={{
          width: '58px',
          height: '58px',
          borderRadius: '50%',
          backgroundColor: 'var(--primary)',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 8px 20px rgba(79,70,229,0.35)',
          marginLeft: 'auto',
        }}
      >
        {open ? <X size={26} /> : <MessageCircle size={26} />}
      </button>
    </div>
  );
};

export default ChatWidget;
