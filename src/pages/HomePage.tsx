import { useNavigate } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { BottomNav } from '../components/layout/BottomNav';
import { HomeTabs } from '../components/layout/HomeTabs';
import { getProductById, products } from '../data/products';

const HERO_PRODUCT_ID = '5623119';

export function HomePage() {
  const navigate = useNavigate();
  const hero = getProductById(HERO_PRODUCT_ID) ?? products[0];

  return (
    <>
      <Header dark query="겨울 필수 인기 숏패딩 모음" />
      <HomeTabs active="recommend" />
      <button className="hero-banner" onClick={() => navigate(`/search?q=${encodeURIComponent('아우터')}`)}>
        <div><strong>아우터 페스티벌</strong><p>최대 80% 할인</p><small>지금이 아우터 구매 타이밍</small></div>
        <img src={hero.imageUrl} alt="겨울 아우터" />
      </button>
      <div className="quick-row"><button>무신사 스탠다드</button><button>하츠투하츠 MD</button><button>브랜드위크</button></div>
      <section className="section-title"><h2>무신사 라이브 편성표</h2><button>더보기</button></section>
      <div className="live-row">
        {products.slice(0, 3).map((p) => (
          <img key={p.id} src={p.imageUrl} alt={p.name} onClick={() => navigate(`/product/${p.id}`)} />
        ))}
      </div>
      <button className="ai-float" onClick={() => navigate('/ai')}>✦ AI로 찾아보기</button>
      <BottomNav />
    </>
  );
}
