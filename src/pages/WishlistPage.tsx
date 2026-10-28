import { useNavigate } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { BottomNav } from '../components/layout/BottomNav';
import { ProductCard } from '../components/product/ProductCard';
import { getProductById } from '../data/products';
import { useWishlist } from '../hooks/useWishlist';
import type { Product } from '../types/product';

/** /wishlist (명세서 S06). 최근에 찜한 상품이 위로. 카드의 하트를 다시 누르면 찜 취소 */
export function WishlistPage() {
  const navigate = useNavigate();
  const { ids } = useWishlist();
  const liked = [...ids].reverse().map(getProductById).filter((p): p is Product => Boolean(p));

  return (
    <>
      <Header back title="좋아요" />
      <main className="results">
        <h2>찜한 상품 <b>{liked.length}</b></h2>
        {liked.length > 0 ? (
          <section className="grid wishlist-grid">{liked.map((p) => <ProductCard key={p.id} product={p} />)}</section>
        ) : (
          <div className="empty-result">
            <p><strong>아직 찜한 상품이 없어요.</strong><br />마음에 드는 옷의 하트를 눌러 모아 보세요.</p>
            <div className="empty-actions">
              <button onClick={() => navigate('/ranking')}>랭킹 구경하기</button>
              <button className="primary" onClick={() => navigate('/ai')}>✦ 무시니에게 추천받기</button>
            </div>
          </div>
        )}
      </main>
      <BottomNav active="likes" />
    </>
  );
}
