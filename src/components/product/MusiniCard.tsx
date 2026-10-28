import { useNavigate } from 'react-router-dom';
import { Icon } from '../common/Icon';

/** 검색 화면의 "무시니에게 물어보세요" 카드 (A 디자인). 누르면 챗봇 화면으로. query가 있으면 그 문장을 첫 질문으로 */
export function MusiniCard({ query }: { query?: string }) {
  const navigate = useNavigate();
  return (
    <section className="musini-card">
      <img src="/assets/musini.png" alt="무시니 AI 쇼핑 도우미"
        onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }} />
      <div className="musini-copy">
        <strong>무시니에게 물어보세요</strong>
        <span>원하는 스타일을 자연어로 찾아드려요</span>
        <button onClick={() => navigate(query ? `/ai?q=${encodeURIComponent(query)}` : '/ai')}>
          <Icon name="spark" size={18} /> AI에게 자연어로 찾기 <Icon name="chevron" size={17} />
        </button>
      </div>
    </section>
  );
}
