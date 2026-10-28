import { useNavigate } from 'react-router-dom';
import { Icon, type IconName } from '../common/Icon';

type NavId = 'category' | 'snap' | 'home' | 'likes' | 'my';

// [id, 아이콘(글자 아이콘이면 문자열 그대로), 라벨]
const ITEMS: [NavId, IconName | '⌕' | '(S)', string][] = [
  ['category', '⌕', '카테고리'],
  ['snap', '(S)', '스냅'],
  ['home', 'home', '홈'],
  ['likes', 'heart', '좋아요'],
  ['my', 'user', '마이'],
];

export function BottomNav({ active = 'home' }: { active?: NavId }) {
  const navigate = useNavigate();
  return (
    <nav className="bottom-nav">
      {ITEMS.map(([id, icon, label]) => (
        <button key={id} className={active === id ? 'selected' : ''} onClick={id === 'home' ? () => navigate('/') : undefined}>
          {icon === '⌕' || icon === '(S)' ? <span className="text-icon">{icon}</span> : <Icon name={icon} size={31} />}
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}
