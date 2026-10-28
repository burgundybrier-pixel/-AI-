import { useEffect, useLayoutEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Icon } from '../components/common/Icon';
import { ChatBubble, MusiniAvatar, TypingBubble } from '../components/chat/ChatBubble';
import { ChatInput } from '../components/chat/ChatInput';
import { ConditionChips } from '../components/chat/ConditionChips';
import { useChat } from '../hooks/useChat';
import { useGoBack } from '../hooks/useGoBack';
import { useVisualViewportHeight } from '../hooks/useVisualViewportHeight';

/**
 * AI 챗봇 화면 (S05).
 * /ai?q=문장 → 그 문장을 첫 질문으로 보낸다 (검색 화면에서 넘어온 경우)
 * /ai?product=id → 그 상품을 기준으로 시작한다 (상세 화면 "AI 추천", T10)
 */
export function ChatPage() {
  const chat = useChat();
  const navigate = useNavigate();
  const goBack = useGoBack();
  const [params] = useSearchParams();
  const logRef = useRef<HTMLDivElement>(null);
  useVisualViewportHeight();

  // 진입 파라미터는 한 번만 처리하고 주소에서 지운다 (뒤로가기로 돌아와도 다시 보내지 않게).
  // 개발 모드(StrictMode)는 effect를 두 번 실행하므로 처리한 값을 기억해 둔다
  const handled = useRef('');
  useEffect(() => {
    const q = params.get('q');
    const product = params.get('product');
    if ((!q && !product) || handled.current === params.toString()) return;
    handled.current = params.toString();
    if (product) chat.startWithProduct(product);
    if (q) chat.send(q);
    navigate('/ai', { replace: true });
  }, [params, chat, navigate]);

  // 새 메시지가 오면 맨 아래로
  useLayoutEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [chat.messages.length, chat.typing]);

  return (
    <div className="chat-page">
      <header className="chat-head">
        <button className="icon-btn" onClick={goBack} aria-label="뒤로가기"><Icon name="back" size={28} /></button>
        <div className="chat-title"><MusiniAvatar /><strong>무시니</strong><small>AI 쇼핑 도우미</small></div>
        <button className="chat-reset" onClick={chat.reset}>새 대화</button>
      </header>
      <ConditionChips conditions={chat.conditions} onRemove={chat.applyPatch} />

      <div className="chat-log" ref={logRef}>
        {chat.messages.map((m) => (
          <ChatBubble key={m.id} message={m} onSuggest={chat.send} onPatch={chat.applyPatch} />
        ))}
        {chat.typing && <TypingBubble />}
      </div>

      <ChatInput disabled={chat.typing} onSend={chat.send} onImage={chat.sendImage} />
    </div>
  );
}
