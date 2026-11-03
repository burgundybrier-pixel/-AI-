import { Link } from 'react-router-dom';
import { getProductById } from '../../data/products';
import type { Outfit, OutfitRequest, OutfitSlot } from '../../types/outfit';
import { CATEGORY_LABEL, formatPrice } from '../../utils/format';

interface OutfitCardProps {
  outfit: Outfit;
  request: OutfitRequest;
  index: number;
  stale: boolean;
  onReplace: (slot: OutfitSlot) => void;
}

export function OutfitCard({ outfit, request, index, stale, onReplace }: OutfitCardProps) {
  return (
    <article className="outfit-card" aria-labelledby={`outfit-title-${index}`}>
      <header className="outfit-card-head">
        <span className="outfit-number">0{index + 1}</span>
        <h3 id={`outfit-title-${index}`}>무시니의 코디 {index + 1}</h3>
        <span>{outfit.items.length}개 아이템</span>
      </header>
      <ul className="outfit-items">
        {outfit.items.map((item) => {
          const product = getProductById(item.productId);
          if (!product) return null;
          return (
            <li key={item.slot} className={item.locked ? 'outfit-item is-locked' : 'outfit-item'}>
              <Link className="outfit-item-link" to={`/product/${product.id}`}>
                <img src={product.imageUrl} alt="" loading="lazy" />
                <div className="outfit-item-copy">
                  <div className="outfit-item-category">{CATEGORY_LABEL[item.slot]} {item.locked && <span>선택한 상품 · 고정</span>}</div>
                  <strong>{product.brand}</strong>
                  <span className="outfit-item-name">{product.name}</span>
                  <b>{formatPrice(product.price)}</b>
                </div>
              </Link>
              {!item.locked && <button type="button" className="outfit-replace" disabled={stale}
                aria-label={`코디 ${index + 1} ${CATEGORY_LABEL[item.slot]} 다른 상품으로 바꾸기`} onClick={() => onReplace(item.slot)}>다른 상품으로 바꾸기 <span aria-hidden>↻</span></button>}
            </li>
          );
        })}
      </ul>
      <div className="outfit-reasons">{outfit.reasons.map((reason) => <p key={reason}>{reason}</p>)}</div>
      <footer className="outfit-total"><div><span>코디 총금액</span><strong>{formatPrice(outfit.totalPrice)}</strong></div>
        <p>예산 {formatPrice(request.totalBudget)} · 남은 예산 <b>{formatPrice(request.totalBudget - outfit.totalPrice)}</b></p>
      </footer>
    </article>
  );
}
