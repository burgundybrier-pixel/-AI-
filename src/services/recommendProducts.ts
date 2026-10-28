// 필터링 → 적합도 점수 → 정렬 → 추천 이유 (명세서 §4.2)

import type { Product } from '../types/product';
import type { RecommendResult, RecommendedItem, RelaxOption, SearchConditions } from '../types/chat';
import { searchProducts } from './searchProducts';
import { applyPatch } from './applyPatch';
import { COLOR_LABEL, FIT_LABEL, OCCASION_LABEL, SEASON_LABEL, STYLE_LABEL, manwon, priceLabel } from '../utils/labels';

export const RESULT_LIMIT = 6;

/** 조건과 겹치는 정도. 정렬에만 쓰고 화면에는 보이지 않는다 */
function fitScore(p: Product, c: SearchConditions): number {
  let score = p.popularityScore * 0.3;
  // 요청한 스타일이 그 상품의 대표(첫 번째) 스타일이면 더 높게
  if (c.styles?.includes(p.styleTags[0])) score += 15;
  score += (c.styles ?? []).filter((s) => p.styleTags.includes(s)).length * 5;
  score += (c.occasions ?? []).filter((o) => p.occasions.includes(o)).length * 5;
  if (c.seasons?.length && p.seasons.length <= 2) score += 3; // 그 계절 전용에 가까울수록
  return score;
}

/** 카드 아래 "추천 이유". 사용자가 말한 조건 중 이 상품이 맞춘 것 */
function reasonsFor(p: Product, c: SearchConditions): string[] {
  const out: string[] = [];
  c.seasons?.filter((s) => p.seasons.includes(s)).forEach((s) => out.push(`${SEASON_LABEL[s]}용`));
  if (c.colors?.includes(p.color)) out.push(COLOR_LABEL[p.color]);
  c.styles?.filter((s) => p.styleTags.includes(s)).forEach((s) => out.push(STYLE_LABEL[s]));
  c.occasions?.filter((o) => p.occasions.includes(o)).forEach((o) => out.push(`${OCCASION_LABEL[o]}룩`));
  if (c.fit && p.fit === c.fit) out.push(FIT_LABEL[p.fit]);
  const price = priceLabel(c);
  if (price) out.push(price);
  if (!out.length) out.push(...p.styleTags.slice(0, 2).map((s) => STYLE_LABEL[s]));
  return out.slice(0, 4);
}

function sortItems(items: RecommendedItem[], products: Map<string, Product>, c: SearchConditions) {
  const price = (i: RecommendedItem) => products.get(i.productId)!.price;
  const pop = (i: RecommendedItem) => products.get(i.productId)!.popularityScore;
  if (c.sort === 'LOW_PRICE') return items.sort((a, b) => price(a) - price(b));
  if (c.sort === 'POPULAR') return items.sort((a, b) => pop(b) - pop(a));
  return items.sort((a, b) => b.score - a.score);
}

export function recommendProducts(products: Product[], c: SearchConditions, limit = RESULT_LIMIT): RecommendResult {
  const matched = searchProducts(products, c);
  const byId = new Map(products.map((p) => [p.id, p]));
  const items = sortItems(
    matched.map((p) => ({ productId: p.id, score: fitScore(p, c), reasons: reasonsFor(p, c) })),
    byId,
    c,
  );
  return { conditions: c, items: items.slice(0, limit), totalMatched: matched.length };
}

/**
 * 기준 상품과 비슷한 옷 (T08, 시나리오 D·F).
 * 같은 대분류 안에서 세부 종류·스타일·색·계절이 겹칠수록 높은 점수.
 * 가격·제외 조건은 그대로 지킨다 ("비슷한데 더 저렴한").
 */
export function recommendSimilar(products: Product[], base: Product, c: SearchConditions, limit = RESULT_LIMIT): RecommendResult {
  const hard: SearchConditions = { minPrice: c.minPrice, maxPrice: c.maxPrice, exclude: c.exclude, baseProductId: base.id };
  const scored = searchProducts(products, hard)
    .filter((p) => p.category === base.category)
    .map((p) => {
      const sameSub = p.subCategory === base.subCategory;
      const sharedStyles = p.styleTags.filter((s) => base.styleTags.includes(s));
      const sameColor = p.color === base.color;
      const score = (sameSub ? 4 : 0) + sharedStyles.length * 2 + (sameColor ? 1.5 : 0)
        + p.seasons.filter((s) => base.seasons.includes(s)).length * 0.5 + p.popularityScore * 0.02;
      const reasons = [
        ...(sameSub ? [`같은 ${base.subCategory}`] : []),
        ...sharedStyles.slice(0, 2).map((s) => STYLE_LABEL[s]),
        ...(sameColor ? [COLOR_LABEL[p.color]] : []),
        ...(p.price < base.price ? [`${manwon(base.price - p.price)} 저렴`] : []),
      ];
      return { p, item: { productId: p.id, score, reasons: reasons.slice(0, 4) } };
    })
    .filter(({ item }) => item.score >= 3);

  const byId = new Map(products.map((p) => [p.id, p]));
  const items = sortItems(scored.map((x) => x.item), byId, c);
  return { conditions: c, items: items.slice(0, limit), totalMatched: items.length };
}

/**
 * 결과가 0개일 때 "조건 완화" 버튼 (명세서 §4.2, T12).
 * 조건을 하나씩 풀어 보고, 실제로 결과가 생기는 것만 결과 수가 많은 순서로 최대 3개.
 */
export function relaxOptions(products: Product[], c: SearchConditions): RelaxOption[] {
  const candidates: RelaxOption[] = [];
  const count = (cond: SearchConditions) => searchProducts(products, cond).length;
  const tryClear = (label: string, keys: (keyof SearchConditions)[]) => {
    const patch = { clear: keys };
    const n = count(applyPatch(c, patch));
    if (n > 0) candidates.push({ label: `${label} (${n}개)`, patch });
  };

  if (c.maxPrice !== undefined) {
    // 가격만 빼면 맞는 상품 중 가장 싼 것에 맞춰 상한을 올린다
    const cheapest = searchProducts(products, applyPatch(c, { clear: ['maxPrice'] })).sort((a, b) => a.price - b.price)[0];
    if (cheapest) {
      const newMax = Math.ceil(cheapest.price / 10000) * 10000;
      const patch = { set: { maxPrice: newMax } };
      candidates.push({ label: `가격 상한을 ${manwon(newMax)}으로 올리기 (${count(applyPatch(c, patch))}개)`, patch });
    }
  }
  if (c.colors?.length) tryClear('색상 조건 빼기', ['colors']);
  if (c.styles?.length) tryClear('스타일 조건 빼기', ['styles']);
  if (c.seasons?.length) tryClear('계절 조건 빼기', ['seasons']);
  if (c.occasions?.length) tryClear('착용 상황 빼기', ['occasions']);
  if (c.fit) tryClear('핏 조건 빼기', ['fit']);
  if (c.subCategory) tryClear(`'${c.subCategory}' 말고 다른 종류도 보기`, ['subCategory']);
  if (c.exclude) tryClear('제외 조건 풀기', ['exclude']);

  const n = (o: RelaxOption) => Number(o.label.match(/\((\d+)개\)/)?.[1] ?? 0);
  const best = candidates.sort((a, b) => n(b) - n(a)).slice(0, 3);
  return best.length ? best : [{ label: '조건 모두 지우고 다시 찾기', patch: { reset: true } }];
}
