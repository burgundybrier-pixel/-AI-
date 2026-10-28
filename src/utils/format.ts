import type { Category, Product } from '../types/product';

/** 49900 → '49,900원' */
export const formatPrice = (won: number) => `${won.toLocaleString('ko-KR')}원`;

/** 할인율(%)은 저장하지 않고 정가와 판매가로 계산한다. 할인이 없으면 0 */
export const discountRate = (p: Pick<Product, 'price' | 'originalPrice'>) =>
  p.originalPrice > p.price ? Math.round((1 - p.price / p.originalPrice) * 100) : 0;

export const CATEGORY_LABEL: Record<Category, string> = {
  top: '상의',
  outer: '아우터',
  bottom: '바지',
  shoes: '신발',
  bag: '가방',
  acc: '소품',
};
