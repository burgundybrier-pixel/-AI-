import { useNavigate } from 'react-router-dom';

type HomeTab = 'recommend' | 'ranking';

/** 홈 상단 탭 (A 디자인). 추천·랭킹만 실제로 이동한다 */
export function HomeTabs({ active }: { active: HomeTab }) {
  const navigate = useNavigate();
  return (
    <section className="home-tabs">
      <b>콘텐츠</b>
      <b className={active === 'recommend' ? 'active' : ''} onClick={() => navigate('/')}>추천</b>
      <b className={active === 'ranking' ? 'active' : ''} onClick={() => navigate('/ranking')}>랭킹</b>
      <b>세일</b>
      <b>발매</b>
      <b className="pink">아우터<br />페스티벌</b>
    </section>
  );
}
