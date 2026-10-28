import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../common/Icon';
import { useGoBack } from '../../hooks/useGoBack';

interface HeaderProps {
  back?: boolean;
  dark?: boolean;
  /** 검색창에 보일 문구. null이면 검색창을 그리지 않는다 (상세 화면) */
  query?: string | null;
  /** true면 검색창이 실제 입력칸이 된다 (검색 화면). false면 누르면 검색 화면으로 이동하는 버튼 */
  editable?: boolean;
}

export function Header({ back = false, dark = false, query = '', editable = false }: HeaderProps) {
  const navigate = useNavigate();
  const goBack = useGoBack();
  const [text, setText] = useState(query ?? '');

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const q = text.trim();
    if (q) navigate(`/search?q=${encodeURIComponent(q)}`);
  };

  return (
    <header className={dark ? 'top-dark' : 'top-light'}>
      <div className="head-row">
        {back ? (
          <button className="icon-btn" onClick={goBack} aria-label="뒤로가기"><Icon name="back" size={31} /></button>
        ) : (
          <button className="wordmark" onClick={() => navigate('/')}>MUSINSA</button>
        )}

        {query !== null && (editable ? (
          <form className="search-box" onSubmit={submit} role="search">
            <input value={text} onChange={(e) => setText(e.target.value)} placeholder="검색어를 입력하세요" enterKeyHint="search" />
            <button type="submit" aria-label="검색"><Icon name="search" size={29} /></button>
          </form>
        ) : (
          <button className="search-box" onClick={() => navigate('/search')}>
            <span>{query || '검색어를 입력하세요'}</span><Icon name="search" size={29} />
          </button>
        ))}

        {!back ? (
          <div className="head-actions">
            <button className="icon-btn round">〽</button>
            <button className="icon-btn"><Icon name="bell" /></button>
            <button className="icon-btn bag"><Icon name="bag" /><b>8</b></button>
          </div>
        ) : (
          <button className="icon-btn bag"><Icon name="bag" /><b>8</b></button>
        )}
      </div>
    </header>
  );
}
