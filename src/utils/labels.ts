// 조건 값 → 화면에 보일 한국어 이름 (조건 칩, 추천 이유, 응답 문장)

import type { Color, Fit, Occasion, Season, StyleTag } from '../types/product';
import type { SearchConditions, SortKey } from '../types/chat';
import { CATEGORY_LABEL } from './format';

export const COLOR_LABEL: Record<Color, string> = {
  BLACK: '블랙', WHITE: '화이트', GRAY: '그레이', NAVY: '네이비', BEIGE: '베이지', BROWN: '브라운',
  KHAKI: '카키', BLUE: '블루', RED: '레드', GREEN: '그린', IVORY: '아이보리',
};

export const STYLE_LABEL: Record<StyleTag, string> = {
  minimal: '미니멀', street: '스트릿', casual: '캐주얼', formal: '포멀', vintage: '빈티지',
  workwear: '워크웨어', preppy: '프레피', sporty: '스포티',
};

export const SEASON_LABEL: Record<Season, string> = { spring: '봄', summer: '여름', fall: '가을', winter: '겨울' };

export const OCCASION_LABEL: Record<Occasion, string> = {
  campus: '학교', date: '데이트', work: '출근', travel: '여행', daily: '데일리',
};

export const FIT_LABEL: Record<Fit, string> = { over: '오버핏', regular: '레귤러핏', slim: '슬림핏', crop: '크롭', wide: '와이드' };

export const SORT_LABEL: Record<SortKey, string> = { RECOMMEND: '추천순', POPULAR: '인기순', LOW_PRICE: '낮은 가격순' };

/** 150000 → '15만 원', 45000 → '4.5만 원' */
export const manwon = (won: number) => `${Number((won / 10000).toFixed(1))}만 원`;

export function priceLabel(c: Pick<SearchConditions, 'minPrice' | 'maxPrice'>): string | undefined {
  const { minPrice: min, maxPrice: max } = c;
  if (min !== undefined && max !== undefined) return `${manwon(min)}~${manwon(max)}`;
  if (max !== undefined) return `${manwon(max)} 이하`;
  if (min !== undefined) return `${manwon(min)} 이상`;
  return undefined;
}

/** 조건 칩에 보일 이름들. 순서: 종류 → 계절 → 색 → 스타일 → 상황 → 핏 → 가격 → 제외 → 정렬 */
export function conditionLabels(c: SearchConditions): string[] {
  const out: string[] = [];
  if (c.subCategory) out.push(c.subCategory);
  else if (c.category) out.push(CATEGORY_LABEL[c.category]);
  c.seasons?.forEach((s) => out.push(SEASON_LABEL[s]));
  c.colors?.forEach((x) => out.push(COLOR_LABEL[x]));
  c.styles?.forEach((s) => out.push(STYLE_LABEL[s]));
  c.occasions?.forEach((o) => out.push(OCCASION_LABEL[o]));
  if (c.fit) out.push(FIT_LABEL[c.fit]);
  const price = priceLabel(c);
  if (price) out.push(price);
  const ex = c.exclude;
  if (ex) {
    const excluded = [...(ex.subCategories ?? []), ...(ex.colors ?? []).map((x) => COLOR_LABEL[x]), ...(ex.keywords ?? [])];
    if (excluded.length) out.push(`${[...new Set(excluded)].join('·')} 제외`);
  }
  if (c.sort && c.sort !== 'RECOMMEND') out.push(SORT_LABEL[c.sort]);
  return out;
}
