import type { ChatMessage, ConditionPatch } from '../../types/chat';
import { getProductById } from '../../data/products';
import { ProductCard } from '../product/ProductCard';

interface ChatBubbleProps {
  message: ChatMessage;
  onSuggest: (text: string) => void;
  onPatch: (patch: ConditionPatch) => void;
}

export function MusiniAvatar() {
  return (
    <span className="avatar" aria-hidden>
      <img src="/assets/musini.png" alt="" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
      <i>✦</i>
    </span>
  );
}

export function TypingBubble() {
  return (
    <div className="msg ai">
      <MusiniAvatar />
      <div className="bubble typing" aria-label="무시니가 입력 중"><span /><span /><span /></div>
    </div>
  );
}

/** 말풍선 하나. AI 응답은 kind에 따라 상품 카드·용어 설명·완화 버튼·추천 질문을 붙인다 (명세서 §4.4) */
export function ChatBubble({ message: m, onSuggest, onPatch }: ChatBubbleProps) {
  if (m.role === 'user') {
    return (
      <div className="msg user">
        {m.attachment?.type === 'image' && <img className="attach-preview" src={m.attachment.previewUrl} alt="첨부한 사진" />}
        {m.text && <div className="bubble">{m.text}</div>}
      </div>
    );
  }

  return (
    <div className="msg ai">
      <MusiniAvatar />
      <div className="ai-body">
        <div className="bubble">{m.text}</div>

        {m.kind === 'recommend' && (
          <div className="msg-products">
            {m.result.items.map((item) => {
              const p = getProductById(item.productId);
              if (!p) return null;
              return (
                <div className="msg-product" key={item.productId}>
                  <ProductCard product={p} />
                  <div className="reason-chips">{item.reasons.map((r) => <span key={r}>{r}</span>)}</div>
                </div>
              );
            })}
          </div>
        )}

        {m.kind === 'term' && (
          <div className="term-card">
            <strong>{m.term.term}</strong>
            <div className="suggestions">
              {m.term.relatedKeywords.map((k) => <button key={k} onClick={() => onSuggest(`${k} 보여줘`)}>{k}</button>)}
            </div>
          </div>
        )}

        {m.kind === 'empty' && (
          <div className="suggestions relax">
            {m.relaxOptions.map((o) => <button key={o.label} onClick={() => onPatch(o.patch)}>{o.label}</button>)}
          </div>
        )}

        {m.kind === 'clarify' && (
          <div className="suggestions">
            {m.suggestions.map((s) => <button key={s} onClick={() => onSuggest(s)}>{s}</button>)}
          </div>
        )}
      </div>
    </div>
  );
}
