import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { Attachment, ChatMessage, ConditionPatch, SearchConditions, UserMessage } from '../types/chat';
import { respond, respondToImage, respondToPatch, startWithProduct, type ChatTurn } from '../services/chatEngine';
import { reply } from '../services/generateResponse';

// 대화 기록과 현재 조건. 앱 전체에 하나만 두어서 상품 상세로 갔다 와도 그대로 남는다 (T13).
// 새로고침에도 남도록 sessionStorage에 저장한다 (탭을 닫으면 사라짐).

const STORAGE_KEY = 'musinsa-demo:chat';
/** "입력 중…"을 보여 주는 시간. 바로 답하면 기계처럼 보여서 약간 기다린다 */
const TYPING_MS = 550;

interface ChatValue {
  messages: ChatMessage[];
  conditions: SearchConditions;
  typing: boolean;
  send: (text: string) => void;
  sendImage: (attachment: Extract<Attachment, { type: 'image' }>) => void;
  applyPatch: (patch: ConditionPatch) => void;
  startWithProduct: (productId: string) => void;
  reset: () => void;
}

interface Saved {
  messages: ChatMessage[];
  conditions: SearchConditions;
}

const ChatContext = createContext<ChatValue | null>(null);

function load(): Saved {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Saved;
  } catch {
    // 저장소를 못 쓰면 새 대화로 시작
  }
  return { messages: [reply.greeting()], conditions: {} };
}

let userSeq = 0;
const userMessage = (text: string, attachment?: Attachment): UserMessage => ({
  id: `u-${Date.now()}-${userSeq++}`,
  role: 'user',
  createdAt: Date.now(),
  text,
  ...(attachment ? { attachment } : {}),
});

export function ChatProvider({ children }: { children: ReactNode }) {
  const [saved, setSaved] = useState<Saved>(load);
  const [typing, setTyping] = useState(false);
  // 응답을 기다리는 동안 다음 입력이 와도 최신 조건 위에 쌓이도록 ref로 들고 있다
  const conditionsRef = useRef(saved.conditions);

  useEffect(() => {
    conditionsRef.current = saved.conditions;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    } catch {
      // 저장 실패는 무시 (메모리에는 남아 있음)
    }
  }, [saved]);

  /** 사용자 말풍선을 먼저 붙이고, 잠깐 뒤 AI 응답을 붙인다 */
  const run = (user: UserMessage | null, makeTurn: (c: SearchConditions) => ChatTurn) => {
    if (user) setSaved((s) => ({ ...s, messages: [...s.messages, user] }));
    setTyping(true);
    window.setTimeout(() => {
      const turn = makeTurn(conditionsRef.current);
      conditionsRef.current = turn.conditions;
      setSaved((s) => ({ conditions: turn.conditions, messages: [...s.messages, turn.message] }));
      setTyping(false);
    }, TYPING_MS);
  };

  const value: ChatValue = {
    messages: saved.messages,
    conditions: saved.conditions,
    typing,
    send: (text) => {
      const t = text.trim();
      if (t) run(userMessage(t), (c) => respond(t, c));
    },
    sendImage: (attachment) => run(userMessage('', attachment), (c) => respondToImage(attachment.sampleId, c)),
    applyPatch: (patch) => run(null, (c) => respondToPatch(patch, c)),
    startWithProduct: (productId) => {
      if (conditionsRef.current.baseProductId === productId) return; // 같은 상품으로 다시 들어온 경우
      const turn = startWithProduct(productId, conditionsRef.current);
      if (!turn) return;
      conditionsRef.current = turn.conditions;
      setSaved((s) => ({ conditions: turn.conditions, messages: [...s.messages, turn.message] }));
    },
    reset: () => {
      conditionsRef.current = {};
      setSaved({ messages: [reply.greeting()], conditions: {} });
    },
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat은 ChatProvider 안에서만 쓸 수 있다');
  return ctx;
}
