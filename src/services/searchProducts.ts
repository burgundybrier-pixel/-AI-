import type { Product } from '../types/product';
import type { SearchConditions } from '../types/chat';

const overlaps = <T>(want: T[] | undefined, have: T[]) => !want?.length || want.some((x) => have.includes(x));

/**
 * 조건을 모두 만족하는가 (명세서 §4.2의 "필터링" 단계).
 * - subCategory는 포함 관계: '패딩'을 찾으면 '롱패딩', '경량패딩'도 나온다
 * - 색·스타일·계절·상황은 여러 개 중 하나만 맞으면 된다 ("검정이나 네이비")
 * - 제외 조건의 subCategory는 정확히 같은 것만 뺀다 ("두껍지 않은" → 패딩·롱패딩만 빼고 경량패딩은 남김)
 */
export function matchesConditions(p: Product, c: SearchConditions): boolean {
  if (c.category && p.category !== c.category) return false;
  if (c.subCategory && !p.subCategory.includes(c.subCategory)) return false;
  if (c.colors?.length && !c.colors.includes(p.color)) return false;
  if (!overlaps(c.styles, p.styleTags)) return false;
  if (!overlaps(c.seasons, p.seasons)) return false;
  if (!overlaps(c.occasions, p.occasions)) return false;
  if (c.fit && p.fit !== c.fit) return false;
  if (c.minPrice !== undefined && p.price < c.minPrice) return false;
  if (c.maxPrice !== undefined && p.price > c.maxPrice) return false;

  const ex = c.exclude;
  if (ex) {
    if (ex.subCategories?.includes(p.subCategory)) return false;
    if (ex.colors?.includes(p.color)) return false;
    const text = `${p.name} ${p.description} ${p.keywords.join(' ')}`.toLowerCase();
    if (ex.keywords?.some((k) => text.includes(k.toLowerCase()))) return false;
  }
  return true;
}

/** 조건을 만족하는 상품 전체. 기준 상품 자신은 빼고 돌려준다 */
export function searchProducts(products: Product[], c: SearchConditions): Product[] {
  return products.filter((p) => p.id !== c.baseProductId && matchesConditions(p, c));
}
