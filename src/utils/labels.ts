// 조건 값 → 화면에 보일 한국어 이름 (조건 칩, 추천 이유, 응답 문장)

import type { Color, Fit, Occasion, Season, StyleTag } from '../types/product';
import type { ConditionPatch, SearchConditions, SortKey } from '../types/chat';
import { CATEGORY_LABEL } from './format';
import { getProductById } from '../data/products';

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

export interface ConditionChip {
  label: string;
  /** 칩의 ×를 누르면 적용할 패치 (그 조건 하나만 지운다) */
  remove: ConditionPatch;
}

/** 챗봇 상단 "현재 조건" 칩 (명세서 S05). 값 하나하나를 따로 지울 수 있게 나눈다 */
export function conditionChips(c: SearchConditions): ConditionChip[] {
  const chips: ConditionChip[] = [];
  const base = c.baseProductId ? getProductById(c.baseProductId) : undefined;
  if (base) chips.push({ label: `기준: ${base.name.length > 12 ? `${base.name.slice(0, 12)}…` : base.name}`, remove: { clear: ['baseProductId'] } });
  if (c.subCategory) chips.push({ label: c.subCategory, remove: { clear: ['subCategory'] } });
  else if (c.category) chips.push({ label: CATEGORY_LABEL[c.category], remove: { clear: ['category'] } });

  const listChips = <K extends 'seasons' | 'colors' | 'styles' | 'occasions'>(key: K, label: (v: NonNullable<SearchConditions[K]>[number]) => string) => {
    const values = (c[key] ?? []) as NonNullable<SearchConditions[K]>[number][];
    for (const v of values) chips.push({ label: label(v), remove: { set: { [key]: values.filter((x) => x !== v) } } });
  };
  listChips('seasons', (v) => SEASON_LABEL[v]);
  listChips('colors', (v) => COLOR_LABEL[v]);
  listChips('styles', (v) => STYLE_LABEL[v]);
  listChips('occasions', (v) => OCCASION_LABEL[v]);

  if (c.fit) chips.push({ label: FIT_LABEL[c.fit], remove: { clear: ['fit'] } });
  const price = priceLabel(c);
  if (price) chips.push({ label: price, remove: { clear: ['minPrice', 'maxPrice'] } });
  const ex = c.exclude;
  if (ex) {
    const names = [...new Set([...(ex.subCategories ?? []), ...(ex.colors ?? []).map((x) => COLOR_LABEL[x]), ...(ex.keywords ?? [])])];
    if (names.length) chips.push({ label: `${names[0]}${names.length > 1 ? ` 외 ${names.length - 1}` : ''} 제외`, remove: { clear: ['exclude'] } });
  }
  if (c.sort && c.sort !== 'RECOMMEND') chips.push({ label: SORT_LABEL[c.sort], remove: { clear: ['sort'] } });
  return chips;
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
