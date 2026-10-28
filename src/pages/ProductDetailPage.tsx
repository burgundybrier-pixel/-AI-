import { useNavigate, useParams } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Icon } from '../components/common/Icon';
import { getProductById } from '../data/products';
import { useWishlist } from '../hooks/useWishlist';
import { CATEGORY_LABEL, discountRate, formatPrice } from '../utils/format';

export function ProductDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { isLiked, toggle } = useWishlist();
  const p = getProductById(id);

  if (!p) {
    return (
      <>
        <Header back query={null} />
        <main className="empty-result"><p><strong>상품을 찾을 수 없습니다.</strong></p></main>
      </>
    );
  }

  const rate = discountRate(p);
  const liked = isLiked(p.id);

  return (
    <>
      <Header back query={null} />
      <main className="detail">
        <div className="detail-photo">
          <img src={p.imageUrl} alt={p.name} />
          {/* 원본의 "AI 추천 · 비슷한 상품" 자리. 이 상품을 기준으로 챗봇을 연다 (T10) */}
          <button className="ai-bubble" onClick={() => navigate('/ai')}>
            <Icon name="spark" size={18} /> AI 추천 <small>비슷한 상품</small>
          </button>
          <span>1 / 1 ⛶</span>
        </div>
        <section className="info">
          <div className="detail-brand">{p.brand}<button onClick={() => toggle(p.id)}>{liked ? '♥' : '♡'} 찜</button></div>
          <div className="crumb">{CATEGORY_LABEL[p.category]} 〉 {p.subCategory} ({p.brand})</div>
          <h1>{p.name}</h1>
          {p.promoTag && <span className="tag">{p.promoTag}</span>}
          {p.reviewCount > 0 && <p className="score">★ <b>{p.rating.toFixed(1)}</b> 후기 {p.reviewCount.toLocaleString('ko-KR')}개</p>}
          <div className="swatches"><img src={p.imageUrl} alt="" /></div>
          <div className="price-detail">
            {rate > 0 && <del>{formatPrice(p.originalPrice)}</del>}
            <strong>{rate > 0 && <em>{rate}%</em>} {formatPrice(p.price)}</strong>
          </div>
          <p className="detail-desc">{p.description}</p>
          <p className="detail-material">소재: {p.material}</p>
        </section>
      </main>
      <div className="purchase">
        <button className="like-main" onClick={() => toggle(p.id)}>{liked ? '♥' : '♡'}<small>찜</small></button>
        <button onClick={() => alert('데모에서는 구매할 수 없어요.')}>구매하기</button>
      </div>
    </>
  );
}
