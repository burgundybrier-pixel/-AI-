import type { Category, Product, StyleTag } from '../types/product';

export type RankingSort = 'popular' | 'lowPrice';

export interface RankingFilter {
  category?: Category;
  style?: StyleTag;
  sort: RankingSort;
}

/**
 * 랭킹 (명세서 S03). 실제 판매량이 아니라 데모용 인기도(popularityScore) 기준이다 (명세서 시나리오 F).
 * 인기도가 같으면 후기 수 → 별점 순.
 */
export function rankProducts(products: Product[], f: RankingFilter): Product[] {
  const list = products.filter((p) => (!f.category || p.category === f.category) && (!f.style || p.styleTags.includes(f.style)));
  if (f.sort === 'lowPrice') return list.sort((a, b) => a.price - b.price);
  return list.sort((a, b) => b.popularityScore - a.popularityScore || b.reviewCount - a.reviewCount || b.rating - a.rating);
}
