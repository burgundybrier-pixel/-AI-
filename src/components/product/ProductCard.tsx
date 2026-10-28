import { useNavigate } from 'react-router-dom';
import type { Product } from '../../types/product';
import { Icon } from '../common/Icon';
import { useWishlist } from '../../hooks/useWishlist';
import { discountRate, formatPrice } from '../../utils/format';

/** 홈·검색·랭킹·찜·AI 추천이 모두 쓰는 상품 카드 (명세서 §6.4). rank가 있으면 이미지 왼쪽 위에 순위 */
export function ProductCard({ product: p, rank }: { product: Product; rank?: number }) {
  const navigate = useNavigate();
  const { isLiked, toggle } = useWishlist();
  const rate = discountRate(p);

  return (
    <article className="product-card" onClick={() => navigate(`/product/${p.id}`)}>
      <div className="image-wrap">
        <img src={p.imageUrl} alt={p.name} loading="lazy" />
        {rank !== undefined && <span className="rank-badge">{rank}</span>}
        {p.promoTag && <span className="promo">{p.promoTag}</span>}
        <button className={`heart ${isLiked(p.id) ? 'on' : ''}`} aria-label="찜"
          onClick={(e) => { e.stopPropagation(); toggle(p.id); }}>
          <Icon name="heart" size={27} />
        </button>
      </div>
      <div className="brand">{p.brand}</div>
      <div className="pname">{p.name}</div>
      <div className="price">{rate > 0 && <em>{rate}%</em>} {formatPrice(p.price)}</div>
      {p.reviewCount > 0 && <div className="rating">★ {p.rating.toFixed(1)} ({p.reviewCount.toLocaleString('ko-KR')})</div>}
    </article>
  );
}
