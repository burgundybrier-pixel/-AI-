// 명세서 §10 인수 테스트 중 챗봇 로직 부분 (T01–T05, T07, T08, T12) + 시나리오 A·B·E + 발표 흐름 §11

import { describe, expect, it } from 'vitest';
import type { AssistantMessage, SearchConditions } from '../types/chat';
import { getProductById } from '../data/products';
import { respond, respondToImage, respondToPatch, startWithProduct, type ChatTurn } from './chatEngine';
import { parseQuery } from './parseQuery';

/** 대화를 차례로 이어 가며 마지막 턴을 돌려준다 */
function chat(...lines: string[]): ChatTurn {
  let conditions: SearchConditions = {};
  let turn!: ChatTurn;
  for (const line of lines) {
    turn = respond(line, conditions);
    conditions = turn.conditions;
  }
  return turn;
}

function itemsOf(m: AssistantMessage) {
  expect(m.kind).toBe('recommend');
  if (m.kind !== 'recommend') return [];
  return m.result.items.map((i) => getProductById(i.productId)!);
}

describe('명세서 §10 인수 테스트', () => {
  it('T01 검정 후드티 → 검정 후드티만', () => {
    const items = itemsOf(chat('검정 후드티').message);
    expect(items).toHaveLength(3);
    for (const p of items) {
      expect(p.subCategory).toBe('후드티');
      expect(p.color).toBe('BLACK');
    }
  });

  it('T02 10만 원 이하 겨울 외투', () => {
    const { conditions, message } = chat('10만 원 이하 겨울 외투 추천해줘');
    expect(conditions).toMatchObject({ category: 'outer', seasons: ['winter'], maxPrice: 100000 });
    for (const p of itemsOf(message)) {
      expect(p.category).toBe('outer');
      expect(p.seasons).toContain('winter');
      expect(p.price).toBeLessThanOrEqual(100000);
    }
  });

  it('T03 더 스트릿한 걸로 → 이전 조건 유지 + 스타일 추가', () => {
    const { conditions, message } = chat('10만 원 이하 겨울 외투 추천해줘', '더 스트릿한 걸로');
    expect(conditions).toMatchObject({ category: 'outer', seasons: ['winter'], maxPrice: 100000, styles: ['street'] });
    for (const p of itemsOf(message)) expect(p.styleTags).toContain('street');
  });

  it('T04 5만 원 이하로 바꿔줘 → 가격만 갱신', () => {
    const { conditions, message } = chat('10만 원 이하 겨울 외투 추천해줘', '더 스트릿한 걸로', '5만 원 이하로 바꿔줘');
    expect(conditions).toMatchObject({ category: 'outer', seasons: ['winter'], maxPrice: 50000, styles: ['street'] });
    expect(itemsOf(message)).toHaveLength(3);
  });

  it('T05 패딩은 제외해줘 → 패딩 계열 없음', () => {
    const { message } = chat('10만 원 이하 겨울 외투 추천해줘', '패딩은 제외해줘');
    const items = itemsOf(message);
    expect(items.length).toBeGreaterThanOrEqual(3);
    for (const p of items) expect(p.subCategory).not.toMatch(/패딩/);
  });

  it('T07 샘플 상품 링크 → 그 상품을 기준으로', () => {
    const { conditions, message } = chat('https://www.musinsa.com/products/7334751');
    expect(conditions.baseProductId).toBe('7334751');
    expect(itemsOf(message).map((p) => p.id)).toEqual(['7334751']);
  });

  it('T07 모르는 링크 → 지원하지 않음 안내', () => {
    expect(chat('https://example.com/item/1').message.kind).toBe('unsupported');
  });

  it('T08 비슷한 옷 찾아줘 → 기준 상품 제외, 같은 대분류', () => {
    const base = getProductById('7334751')!;
    const turn = respond('비슷한 옷 찾아줘', { baseProductId: base.id });
    const items = itemsOf(turn.message);
    expect(items.length).toBeGreaterThanOrEqual(3);
    expect(items.map((p) => p.id)).not.toContain(base.id);
    for (const p of items) expect(p.category).toBe(base.category);
  });

  it('T08 비슷한데 더 저렴한 거 → 기준보다 싼 것만', () => {
    const base = getProductById('7334751')!;
    const items = itemsOf(respond('비슷한데 더 저렴한 거', { baseProductId: base.id }).message);
    expect(items.length).toBeGreaterThanOrEqual(3);
    for (const p of items) expect(p.price).toBeLessThan(base.price);
  });

  it('T12 맞는 상품 없음 → 조건 완화 제안, 누르면 결과가 생김', () => {
    const turn = chat('빨간 코트 추천해줘');
    expect(turn.message.kind).toBe('empty');
    if (turn.message.kind !== 'empty') return;
    expect(turn.message.relaxOptions.length).toBeGreaterThan(0);
    const after = respondToPatch(turn.message.relaxOptions[0].patch, turn.conditions);
    expect(after.message.kind).toBe('recommend');
  });
});

describe('사진 첨부 (T06) · 상세에서 시작 (T10)', () => {
  it('T06 샘플 사진 → 사진 속 옷과 비슷한 상품', () => {
    const turn = respondToImage('sample-ma1', {});
    expect(turn.conditions.baseProductId).toBe('7334751');
    expect(itemsOf(turn.message).length).toBeGreaterThanOrEqual(3);
  });

  it('T06 일반 사진 → 분석하는 척하지 않고 특징을 물어봄', () => {
    expect(respondToImage(undefined, {}).message.kind).toBe('unsupported');
  });

  it('T10 상세에서 AI 버튼 → 그 상품이 기준 상품', () => {
    const turn = startWithProduct('7420291', {})!;
    expect(turn.conditions.baseProductId).toBe('7420291');
    expect(turn.message.text).toContain('캐시미어 울 싱글 롱 코트');
  });
});

describe('명세서 §2 시나리오', () => {
  it('A: 겨울 깔끔한 검은색 외투 15만 원 이하', () => {
    const items = itemsOf(chat('겨울에 입을 깔끔한 검은색 외투를 찾고 있어. 15만 원 이하로 추천해줘.').message);
    expect(items).toHaveLength(3);
    for (const p of items) {
      expect(p.color).toBe('BLACK');
      expect(p.styleTags).toContain('minimal');
      expect(p.price).toBeLessThanOrEqual(150000);
    }
  });

  it('A: 문장 순서를 바꿔도 같은 조건', () => {
    const a = chat('겨울에 입을 깔끔한 검은색 외투를 찾고 있어. 15만 원 이하로 추천해줘.').conditions;
    const b = chat('15만원 이하 블랙 겨울 아우터, 미니멀한 걸로').conditions;
    expect(b).toEqual(a);
  });

  it('B: 조건을 이어서 추가하고 예산만 줄이기', () => {
    const t = chat('겨울용 외투 추천해줘. 20만 원 이하로.', '좀 더 스트릿한 느낌으로 찾아줘.', '검은색 위주로 보여줘.');
    expect(t.conditions).toMatchObject({ seasons: ['winter'], maxPrice: 200000, styles: ['street'], colors: ['BLACK'] });
    const t2 = respond('예산을 10만 원으로 줄여줘', t.conditions);
    expect(t2.conditions).toMatchObject({ seasons: ['winter'], maxPrice: 100000, styles: ['street'], colors: ['BLACK'] });
  });

  it('E: 이런 옷은 보통 뭐라고 불러? → 용어 설명', () => {
    const m = respond('이런 옷은 보통 뭐라고 불러?', { baseProductId: '7334751' }).message;
    expect(m.kind).toBe('term');
    if (m.kind === 'term') expect(m.term.term).toContain('MA-1');
  });
});

describe('명세서 §11 발표 시연 흐름', () => {
  it('③ 자연어 추천 → ④ 더 스트릿하게', () => {
    const first = chat('겨울에 학교 다닐 때 입을 검정 외투 추천해줘. 너무 두껍지 않고 15만 원 이하였으면 좋겠어.');
    expect(first.conditions).toMatchObject({ seasons: ['winter'], occasions: ['campus'], colors: ['BLACK'], maxPrice: 150000 });
    for (const p of itemsOf(first.message)) expect(['패딩', '롱패딩']).not.toContain(p.subCategory);

    const second = respond('조금 더 스트릿하게 바꿔줘.', first.conditions);
    expect(second.conditions.maxPrice).toBe(150000);
    const items = itemsOf(second.message);
    expect(items).toHaveLength(3);
    for (const p of items) expect(p.styleTags).toContain('street');
  });
});

describe('랭킹 (S03)', () => {
  it('인기순: 인기도가 높은 순, 같은 대분류·스타일만', async () => {
    const { rankProducts } = await import('./rankProducts');
    const { products } = await import('../data/products');
    const list = rankProducts(products, { category: 'outer', style: 'street', sort: 'popular' });
    expect(list.length).toBeGreaterThan(0);
    for (const p of list) {
      expect(p.category).toBe('outer');
      expect(p.styleTags).toContain('street');
    }
    for (let i = 1; i < list.length; i++) expect(list[i - 1].popularityScore).toBeGreaterThanOrEqual(list[i].popularityScore);
  });

  it('낮은 가격순', async () => {
    const { rankProducts } = await import('./rankProducts');
    const { products } = await import('../data/products');
    const list = rankProducts(products, { sort: 'lowPrice' });
    expect(list).toHaveLength(products.length);
    for (let i = 1; i < list.length; i++) expect(list[i - 1].price).toBeLessThanOrEqual(list[i].price);
  });
});

describe('조건 패치', () => {
  it('"네이비도" → 색을 교체하지 않고 더한다', () => {
    expect(chat('검은색 외투', '네이비도 같이 보여줘').conditions.colors).toEqual(['BLACK', 'NAVY']);
  });

  it('"가격은 상관없어" → 가격 조건 해제', () => {
    expect(chat('10만 원 이하 니트', '가격은 상관없어').conditions.maxPrice).toBeUndefined();
  });

  it('"처음부터 다시" → 조건 초기화', () => {
    expect(chat('10만 원 이하 니트', '처음부터 다시').conditions).toEqual({});
  });

  it('"봄버"의 "봄"을 계절로 읽지 않는다', () => {
    const { patch } = parseQuery('검정 봄버 재킷', { conditions: {} });
    expect(patch.set).toMatchObject({ subCategory: 'MA-1', colors: ['BLACK'] });
    expect(patch.set?.seasons).toBeUndefined();
  });

  it('제외 조건에 빈 목록을 남기지 않는다', () => {
    expect(chat('패딩은 빼줘').conditions.exclude).toEqual({ subCategories: ['패딩', '롱패딩', '경량패딩'] });
  });

  it('인사 → 시작 질문 안내', () => {
    const m = chat('안녕').message;
    expect(m.kind).toBe('clarify');
    expect(m.text).toContain('무시니');
  });

  it('"빵빵한 겨울 점퍼" → 일반 검색은 0건이지만 챗봇은 패딩으로 이해, 얇은 경량패딩은 뺀다', () => {
    const t = chat('빵빵한 겨울 점퍼');
    expect(t.conditions).toMatchObject({ subCategory: '패딩', seasons: ['winter'], exclude: { subCategories: ['경량패딩'] } });
    const items = itemsOf(t.message);
    expect(items.length).toBeGreaterThanOrEqual(3);
    for (const p of items) expect(p.subCategory).not.toBe('경량패딩');
  });
});
