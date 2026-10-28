import type { Product } from '../types/product';
import { CATEGORY_LABEL } from '../utils/format';

/**
 * 일반 검색 (명세서 S02). 원본 무신사처럼 "글자가 들어 있는가"만 본다.
 * 띄어쓰기로 나눈 단어가 모두 들어 있어야 결과에 나온다.
 * 그래서 "빵빵한 겨울 점퍼" 같은 문장은 0건 → AI 검색과의 차이를 보여 주는 장면 (plan.md 4-3)
 */
export function keywordSearch(products: Product[], query: string): Product[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  return products.filter((p) => {
    const text = [p.name, p.brand, p.subCategory, CATEGORY_LABEL[p.category], p.promoTag ?? '', ...p.keywords]
      .join(' ')
      .toLowerCase();
    return words.every((w) => text.includes(w));
  });
}
