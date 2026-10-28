import { useRef, useState, type FormEvent } from 'react';
import type { Attachment } from '../../types/chat';
import { SAMPLE_PHOTOS } from '../../data/samplePhotos';
import { Icon } from '../common/Icon';

interface ChatInputProps {
  disabled: boolean;
  onSend: (text: string) => void;
  onImage: (attachment: Extract<Attachment, { type: 'image' }>) => void;
}

/** 하단 고정 입력창 + 사진 첨부 (명세서 S05). 링크는 입력창에 그대로 붙여 넣는다 */
export function ChatInput({ disabled, onSend, onImage }: ChatInputProps) {
  const [text, setText] = useState('');
  const [panel, setPanel] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim() || disabled) return;
    onSend(text);
    setText('');
  };

  const pickFile = (file: File | undefined) => {
    if (!file) return;
    onImage({ type: 'image', previewUrl: URL.createObjectURL(file) });
    setPanel(false);
  };

  return (
    <div className="chat-input-wrap">
      {panel && (
        <div className="attach-panel">
          <button className="attach-upload" onClick={() => fileRef.current?.click()}>내 사진 올리기</button>
          <span className="attach-hint">샘플 사진으로 해 보기</span>
          <div className="attach-samples">
            {SAMPLE_PHOTOS.map((s) => (
              <button key={s.id} onClick={() => { onImage({ type: 'image', previewUrl: s.imageUrl, sampleId: s.id }); setPanel(false); }}>
                <img src={s.imageUrl} alt={s.label} />
                <span>{s.label}</span>
              </button>
            ))}
          </div>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { pickFile(e.target.files?.[0]); e.target.value = ''; }} />
        </div>
      )}
      <form className="chat-input" onSubmit={submit}>
        <button type="button" className={`attach-btn ${panel ? 'on' : ''}`} onClick={() => setPanel((v) => !v)} aria-label="사진 첨부">＋</button>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="찾는 옷을 편하게 말해 주세요"
          enterKeyHint="send"
          aria-label="메시지"
        />
        <button type="submit" className="send-btn" disabled={disabled || !text.trim()} aria-label="보내기">
          <Icon name="chevron" size={22} />
        </button>
      </form>
    </div>
  );
}
