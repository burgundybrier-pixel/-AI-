import { describe, expect, it } from 'vitest';
import type { Product } from '../types/product';
import type { Outfit, OutfitRequest } from '../types/outfit';
import { outfitKey, parseOutfitBudget, recommendOutfits, replaceOutfitItem } from './recommendOutfits';
import { newOutfitSession, restoreOutfitSession } from './outfitSession';

function product(id: string, category: Product['category'], price: number, patch: Partial<Product> = {}): Product {
  return { id, category, price, originalPrice: price * 2, name: id, brand: '테스트', subCategory: category,
    imageUrl: '/test.png', color: 'BLACK', seasons: ['spring', 'fall'], styleTags: ['minimal'], fit: 'regular',
    material: '면', description: '', popularityScore: 50, rating: 4, reviewCount: 1, occasions: ['daily'], keywords: [], ...patch };
}

function catalog(): Product[] {
  return [product('outer', 'outer', 50000), product('top-a', 'top', 20000), product('top-b', 'top', 25000),
    product('bottom-a', 'bottom', 30000), product('bottom-b', 'bottom', 35000),
    product('shoes-a', 'shoes', 10000), product('shoes-b', 'shoes', 15000), product('shoes-costly', 'shoes', 200000)];
}

const request = (patch: Partial<OutfitRequest> = {}): OutfitRequest => ({ baseProductId: 'outer', totalBudget: 150000, occasion: 'daily', ...patch });
function success(list = catalog(), req = request()): Outfit[] {
  const result = recommendOutfits(list, req);
  expect(result.status).toBe('success');
  if (result.status !== 'success') throw new Error('Expected a complete outfit');
  return result.outfits;
}

describe('코디 추천', () => {
  it.each(['top-a', 'bottom-a', 'shoes-a'])('%s 기준은 상의·하의·신발 3개 구성', (baseProductId) => {
    for (const outfit of success(catalog(), request({ baseProductId }))) {
      expect(outfit.items.map((i) => i.slot)).toEqual(['top', 'bottom', 'shoes']);
      expect(outfit.items.filter((i) => i.locked).map((i) => i.productId)).toEqual([baseProductId]);
    }
  });

  it('아우터 기준은 상의를 포함한 4개이며 판매가 합계로 계산한다', () => {
    const list = catalog();
    const outfits = success(list);
    expect(outfits).toHaveLength(3);
    for (const outfit of outfits) {
      expect(outfit.items.map((i) => i.slot)).toEqual(['outer', 'top', 'bottom', 'shoes']);
      expect(outfit.items.filter((i) => i.productId === 'outer')).toEqual([{ slot: 'outer', productId: 'outer', locked: true }]);
      expect(new Set(outfit.items.map((i) => i.productId)).size).toBe(4);
      expect(outfit.totalPrice).toBe(outfit.items.reduce((sum, i) => sum + list.find((p) => p.id === i.productId)!.price, 0));
      expect(outfit.totalPrice).toBeLessThanOrEqual(150000);
    }
    expect(new Set(outfits.map((o) => outfitKey(o.items))).size).toBe(outfits.length);
  });

  it('예산과 정확히 같은 조합은 포함하고 기준 상품 가격도 합산한다', () => {
    const outfits = success(catalog(), request({ totalBudget: 110000 }));
    expect(outfits).toHaveLength(1);
    expect(outfits[0].totalPrice).toBe(110000);
    expect(recommendOutfits(catalog(), request({ totalBudget: 109999 }))).toEqual({ status: 'empty', reason: 'budget', minimumBudget: 110000 });
  });

  it('기준 상품만으로 예산을 초과해도 최소 필요 금액은 완성 조합으로 제안한다', () => {
    expect(recommendOutfits(catalog(), request({ totalBudget: 10000 }))).toEqual({ status: 'empty', reason: 'budget', minimumBudget: 110000 });
  });

  it('가능한 조합이 2개면 2개만 반환한다', () => {
    const list = catalog().filter((p) => !['top-b', 'bottom-b', 'shoes-costly'].includes(p.id));
    expect(success(list)).toHaveLength(2);
  });

  it('낮은 인기도의 저렴한 후보도 예산에 맞으면 찾는다', () => {
    const list = [...catalog(), product('top-cheap', 'top', 5000, { popularityScore: 0 })];
    const outfits = success(list, request({ totalBudget: 95000 }));
    expect(outfits).toHaveLength(1);
    expect(outfits[0].items.some((i) => i.productId === 'top-cheap')).toBe(true);
  });

  it('선택한 계절이 모든 아이템에 적용된다', () => {
    const list = catalog().map((p) => p.id === 'shoes-b' ? { ...p, seasons: ['winter'] as Product['seasons'] } : p);
    for (const outfit of success(list, request({ season: 'spring' }))) {
      for (const item of outfit.items) expect(list.find((p) => p.id === item.productId)!.seasons).toContain('spring');
    }
    expect(recommendOutfits(list, request({ season: 'summer' }))).toEqual({ status: 'empty', reason: 'season' });
  });

  it('기준 상품은 맞지만 다른 필수 카테고리의 계절 상품이 없으면 안내한다', () => {
    const list = catalog().map((p) => p.category === 'shoes' ? { ...p, seasons: ['winter'] as Product['seasons'] } : p);
    expect(recommendOutfits(list, request({ season: 'spring' }))).toEqual({ status: 'empty', reason: 'season' });
  });

  it('필수 카테고리가 없으면 미완성 코디를 반환하지 않는다', () => {
    expect(recommendOutfits(catalog().filter((p) => p.category !== 'shoes'), request())).toEqual({ status: 'empty', reason: 'missing-category', missingSlots: ['shoes'] });
  });

  it.each([0, -1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1])('잘못된 예산 %s 거부', (totalBudget) => {
    expect(recommendOutfits(catalog(), request({ totalBudget }))).toEqual({ status: 'invalid', reason: 'invalid-budget' });
  });

  it('알 수 없는 ID와 미지원 카테고리를 구분한다', () => {
    expect(recommendOutfits(catalog(), request({ baseProductId: 'unknown' }))).toEqual({ status: 'invalid', reason: 'missing-product' });
    expect(recommendOutfits([...catalog(), product('bag', 'bag', 1000)], request({ baseProductId: 'bag' }))).toEqual({ status: 'invalid', reason: 'unsupported-category' });
  });

  it('착용 상황은 우선순위에 반영하고 없는 근거는 설명하지 않는다', () => {
    const list = catalog().map((p) => p.id === 'top-b' ? { ...p, occasions: ['work'] as Product['occasions'] } : p);
    const outfits = success(list, request({ occasion: 'work' }));
    expect(outfits[0].items.some((i) => i.productId === 'top-b')).toBe(true);
    expect(outfits[0].reasons.join(' ')).toContain('출근 태그가 있는 상의');
    const travel = success(list, request({ occasion: 'travel' }));
    expect(travel.every((o) => !o.reasons.join(' ').includes('여행 태그'))).toBe(true);
  });

  it('입력을 변경하지 않으며 동일 입력은 동일한 결과를 반환한다', () => {
    const list = catalog();
    const req = request();
    const before = structuredClone({ list, req });
    const first = recommendOutfits(list, req);
    expect(recommendOutfits(list, req)).toEqual(first);
    expect({ list, req }).toEqual(before);
  });
});

describe('코디 아이템 교체', () => {
  it('한 슬롯만 바꾸고 기준 상품·다른 코디는 유지하며 가격·이유를 재계산한다', () => {
    const outfits = success();
    const before = structuredClone(outfits);
    const result = replaceOutfitItem(catalog(), request(), outfits[0], 'shoes');
    expect(result.status).toBe('success');
    if (result.status !== 'success') return;
    expect(result.outfit.items.filter((i) => i.slot !== 'shoes')).toEqual(outfits[0].items.filter((i) => i.slot !== 'shoes'));
    expect(result.outfit.items.find((i) => i.slot === 'shoes')!.productId).not.toBe(outfits[0].items.find((i) => i.slot === 'shoes')!.productId);
    expect(result.outfit.totalPrice).toBeLessThanOrEqual(150000);
    expect(result.outfit.reasons.join(' ')).toContain(result.outfit.totalPrice.toLocaleString('ko-KR'));
    expect(outfits).toEqual(before);
  });

  it('기준 상품을 교체하지 않는다', () => {
    expect(replaceOutfitItem(catalog(), request(), success()[0], 'outer')).toEqual({ status: 'unavailable' });
  });

  it('교체 요청에서도 유효하지 않은 예산을 거부한다', () => {
    expect(replaceOutfitItem(catalog(), request({ totalBudget: NaN }), success()[0], 'shoes')).toEqual({ status: 'unavailable' });
  });

  it('예산을 넘는 대안과 계절이 다른 대안은 거부한다', () => {
    const req = request({ totalBudget: 110000 });
    const original = success(catalog(), req)[0];
    expect(replaceOutfitItem(catalog(), req, original, 'shoes')).toEqual({ status: 'unavailable' });
    const list = catalog().map((p) => p.id === 'shoes-b' ? { ...p, seasons: ['winter'] as Product['seasons'] } : p);
    const spring = request({ season: 'spring' });
    expect(replaceOutfitItem(list, spring, success(list, spring)[0], 'shoes')).toEqual({ status: 'unavailable' });
  });

  it('교체하면 다른 코디와 같아지는 후보도 거부한다', () => {
    const list = catalog().filter((p) => !['top-b', 'bottom-b', 'shoes-costly'].includes(p.id));
    const outfits = success(list);
    expect(replaceOutfitItem(list, request(), outfits[0], 'shoes', [outfits[1]])).toEqual({ status: 'unavailable' });
  });
});

describe('총예산 직접 입력', () => {
  it.each(['150000', '150,000', ' 150,000 '])('%s 전체 문자열을 검증한다', (value) => expect(parseOutfitBudget(value)).toBe(150000));
  it.each(['', '0', '-1000', '1.5', '15만원', '150000abc', '1e5', '15,00', '1,,000', 'Infinity', '9007199254740992'])('%s 잘못된 금액은 거부한다', (value) => expect(parseOutfitBudget(value)).toBeNull());
});

describe('코디 화면 상태 복원', () => {
  const saved = () => ({ ...newOutfitSession('outer'), submitted: request(), result: { status: 'success', outfits: success() } });

  it('입력 중 조건과 결과 생성 조건을 각각 보존한다', () => {
    const session = saved();
    session.draft.budget = '200,000';
    const restored = restoreOutfitSession(JSON.stringify(session), 'outer', catalog());
    expect(restored.draft.budget).toBe('200,000');
    expect(restored.submitted?.totalBudget).toBe(150000);
    expect(restored.result).toEqual(session.result);
  });

  it('아이템 교체 결과도 보존한다', () => {
    const session = saved();
    session.result.outfits = session.result.outfits.slice(0, 1);
    const replacement = replaceOutfitItem(catalog(), request(), session.result.outfits[0], 'shoes', session.result.outfits.slice(1));
    if (replacement.status !== 'success') throw new Error('Expected alternative');
    session.result.outfits[0] = replacement.outfit;
    expect(restoreOutfitSession(JSON.stringify(session), 'outer', catalog()).result).toEqual(session.result);
  });

  it('저장된 총액·이유·고정 여부를 신뢰하지 않고 재계산한다', () => {
    const session = saved();
    const original = structuredClone(session.result);
    session.result.outfits[0].totalPrice = 1;
    session.result.outfits[0].reasons = ['없는 할인'];
    session.result.outfits[0].items.forEach((i) => { i.locked = false; });
    expect(restoreOutfitSession(JSON.stringify(session), 'outer', catalog()).result).toEqual(original);
  });

  it.each(['{broken', 'null', '{"version":2}', '{"version":1,"draft":null}'])('손상된 저장 데이터는 초기화한다: %s', (raw) => {
    expect(restoreOutfitSession(raw, 'outer', catalog())).toEqual(newOutfitSession('outer'));
  });

  it('다른 기준 상품이나 삭제된 아이템의 결과를 복원하지 않는다', () => {
    expect(restoreOutfitSession(JSON.stringify(saved()), 'top-a', catalog())).toEqual(newOutfitSession('top-a'));
    expect(restoreOutfitSession(JSON.stringify(saved()), 'outer', catalog().filter((p) => p.id !== 'shoes-a'))).toEqual(newOutfitSession('outer'));
  });

  it('저장된 잘못된 조건과 중복 코디를 초기화한다', () => {
    const session = saved();
    session.result.outfits[1] = session.result.outfits[0];
    expect(restoreOutfitSession(JSON.stringify(session), 'outer', catalog())).toEqual(newOutfitSession('outer'));
    expect(restoreOutfitSession(JSON.stringify({ ...saved(), submitted: { ...request(), season: 'unknown' } }), 'outer', catalog())).toEqual(newOutfitSession('outer'));
  });
});
