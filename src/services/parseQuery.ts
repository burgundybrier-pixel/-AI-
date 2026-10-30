// 사용자 문장 → ConditionPatch + 의도 (명세서 §4.1)
// 규칙 기반이라 문장 순서나 표현이 달라도 사전에 있는 단어만 찾으면 된다.
// 찾은 표현은 문장에서 지워 나간다. 그래야 "봄버"의 "봄"이 계절로 잡히는 일이 없다.

import type { Color, Product } from '../types/product';
import type { ConditionPatch, ExcludeConditions, ListConditionKey, SearchConditions, SortKey } from '../types/chat';
import {
  COLOR_TERMS, FIT_TERMS, ITEM_TERMS, NOT_THICK_WORDS, OCCASION_TERMS, SEASON_TERMS, STYLE_TERMS, THICK_SUBCATEGORIES, THICK_WORDS,
  type ItemTerm,
} from '../data/synonyms';
import { getProductById } from '../data/products';

export type QueryIntent =
  | 'search'      // 조건을 바꾸고 추천
  | 'similar'     // 기준 상품과 비슷한 옷 (T08)
  | 'term'        // 이 옷은 뭐라고 불러? (시나리오 E)
  | 'product'     // 상품 링크만 붙여 넣음 (시나리오 D)
  | 'reset'       // 처음부터 다시
  | 'unsupported' // 열 수 없는 링크
  | 'unknown';    // 아무것도 알아듣지 못함

export interface ParseResult {
  intent: QueryIntent;
  patch: ConditionPatch;
}

export interface ParseContext {
  conditions: SearchConditions;
  baseProduct?: Product;
}

const PRICE_UNIT = 10000;

/** 문장에서 다음 단어를 찾을 때 쓰는 작업용 문자열. 찾은 부분은 공백으로 지운다 */
class Sentence {
  text: string;
  constructor(raw: string) {
    this.text = ` ${raw.toLowerCase().replace(/\s+/g, ' ')} `;
  }
  /** 정규식에 걸린 부분을 모두 지우고 걸린 결과를 돌려준다 */
  take(re: RegExp): RegExpExecArray[] {
    const found = [...this.text.matchAll(new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g'))];
    for (const m of found) this.text = this.text.replace(m[0], ' '.repeat(m[0].length));
    return found;
  }
  has(re: RegExp) {
    return re.test(this.text);
  }
  /** 사전 단어를 찾아 지운다. 찾은 단어 뒤에 "도"가 붙어 있으면 also = true ("네이비도") */
  takeWord(word: string): { found: boolean; also: boolean } {
    const idx = this.text.indexOf(word);
    if (idx < 0) return { found: false, also: false };
    const tail = this.text.slice(idx + word.length).split(' ')[0];
    this.text = this.text.slice(0, idx) + ' '.repeat(word.length) + this.text.slice(idx + word.length);
    return { found: true, also: tail.endsWith('도') };
  }
}

/** [값, 단어 목록] 사전에서 문장에 나온 값을 모두 찾는다. 긴 단어부터 */
function takeTerms<T>(s: Sentence, dict: [T, string[]][]): { values: T[]; also: boolean } {
  const pairs = dict.flatMap(([v, words]) => words.map((w) => [v, w] as const)).sort((a, b) => b[1].length - a[1].length);
  const values: T[] = [];
  let also = false;
  for (const [v, w] of pairs) {
    const r = s.takeWord(w.toLowerCase());
    if (!r.found) continue;
    if (!values.includes(v)) values.push(v);
    also ||= r.also;
  }
  return { values, also };
}

function findItem(word: string): ItemTerm | undefined {
  const w = word.toLowerCase();
  return ITEM_TERMS.find((t) => t.words.some((x) => w.includes(x.toLowerCase())));
}

function findColor(word: string): Color | undefined {
  return COLOR_TERMS.find(([, words]) => words.some((x) => word.includes(x)))?.[0];
}

/** "15만 원 이하", "5만 원대", "10만 원으로 줄여줘", "3만 원 이상" */
function takePrice(s: Sentence): Pick<SearchConditions, 'minPrice' | 'maxPrice'> | null {
  const num = String.raw`(\d+(?:\.\d+)?)\s*(만|천)?\s*원?`;
  const toWon = (n: string, unit?: string) => Math.round(Number(n) * (unit === '만' ? PRICE_UNIT : unit === '천' ? 1000 : 1));

  const range = s.take(new RegExp(String.raw`(\d+)\s*만\s*원?\s*대`))[0];
  if (range) {
    const n = Number(range[1]);
    return { minPrice: n * PRICE_UNIT, maxPrice: (n + 1) * PRICE_UNIT - 1 };
  }
  const min = s.take(new RegExp(num + String.raw`\s*(이상|넘는|부터)`))[0];
  if (min) return { minPrice: toWon(min[1], min[2]) };
  const max = s.take(new RegExp(num + String.raw`\s*(이하|이내|아래|까지|미만|밑|안쪽|선에서|선|으로|로|짜리)?`))
    .find((m) => m[2] || Number(m[1]) >= 1000);
  if (max) return { maxPrice: toWon(max[1], max[2]) };
  return null;
}

const SORT_PATTERNS: [SortKey, RegExp][] = [
  ['LOW_PRICE', /(싼|저렴한|낮은\s*가격|가격\s*낮은)\s*순/],
  ['POPULAR', /인기|잘\s*나가|많이\s*팔|유행/],
  ['RECOMMEND', /추천\s*순/],
];

const CLEAR_PATTERNS: [(keyof SearchConditions)[], RegExp][] = [
  [['minPrice', 'maxPrice'], /(가격|예산|돈)\s*(은|는|도)?\s*상관\s*(없|x)/],
  [['colors'], /(색|색깔|색상|컬러)\s*(은|는|도)?\s*상관\s*(없|x)/],
  [['styles'], /(스타일|느낌)\s*(은|는|도)?\s*상관\s*(없|x)/],
  [['seasons'], /(계절|시즌)\s*(은|는|도)?\s*상관\s*(없|x)/],
  [['exclude'], /제외\s*(조건)?\s*(풀|없애|취소)/],
];

export function parseQuery(raw: string, ctx: ParseContext): ParseResult {
  const s = new Sentence(raw);
  const patch: ConditionPatch = {};
  const set: Partial<SearchConditions> = {};
  const add: Partial<Pick<SearchConditions, ListConditionKey>> = {};
  const exclude: ExcludeConditions = {};
  const clear: (keyof SearchConditions)[] = [];

  // 1. 처음부터 다시
  if (s.take(/처음부터|초기화|리셋|다시\s*시작|새로\s*찾/).length) patch.reset = true;

  // 2. 상품 링크 (시나리오 D)
  const url = s.take(/https?:\/\/\S+/)[0]?.[0];
  let urlProduct: Product | undefined;
  if (url) {
    const id = url.match(/\/products?\/(\d+)/)?.[1];
    urlProduct = id ? getProductById(id) : undefined;
    if (!urlProduct) return { intent: 'unsupported', patch: {} };
    set.baseProductId = urlProduct.id;
  }

  // 3. "가격은 상관없어" 같은 해제
  for (const [keys, re] of CLEAR_PATTERNS) if (s.take(re).length) clear.push(...keys);

  // 4. 제외 조건: "패딩은 빼줘", "빨간색 말고", "로고 없는"
  for (const m of s.take(/(\S+?)\s*(?:은|는|이|가|을|를)?\s*(?:제외|빼고|빼줘|빼 줘|말고|없는|없이)/)) {
    const word = m[1];
    if (word.includes('상관')) continue;
    const item = findItem(word);
    const color = findColor(word);
    if (item?.subCategory) (exclude.subCategories ??= []).push(...(item.excludeFamily ?? [item.subCategory]));
    else if (color) (exclude.colors ??= []).push(color);
    else if (word.length >= 2) (exclude.keywords ??= []).push(word);
  }
  if (NOT_THICK_WORDS.some((w) => s.has(new RegExp(w))) && !s.has(/경량|얇은 패딩|가벼운 패딩/)) {
    (exclude.subCategories ??= []).push(...THICK_SUBCATEGORIES);
  } else if (THICK_WORDS.some((w) => s.has(new RegExp(w)))) {
    (exclude.subCategories ??= []).push('경량패딩');
  }

  // 5. 옷 종류: 세부 종류가 있는 표현을 우선
  const items = ITEM_TERMS
    .flatMap((t) => t.words.map((w) => ({ t, w: w.toLowerCase() })))
    .sort((a, b) => b.w.length - a.w.length)
    .filter(({ w }) => s.takeWord(w).found)
    .map(({ t }) => t);
  const item = items.find((t) => t.subCategory) ?? items[0];
  if (item) {
    set.category = item.category;
    if (item.subCategory) set.subCategory = item.subCategory;
    else clear.push('subCategory');
  }
  NOT_THICK_WORDS.forEach((w) => s.take(new RegExp(w)));

  // 6. 색·스타일·계절·상황 ("네이비도"처럼 "도"가 붙으면 기존 목록에 더한다)
  const lists: [ListConditionKey, { values: unknown[]; also: boolean }][] = [
    ['colors', takeTerms(s, COLOR_TERMS)],
    ['styles', takeTerms(s, STYLE_TERMS)],
    ['seasons', (() => { const r = takeTerms(s, SEASON_TERMS); return { values: [...new Set(r.values.flat())], also: r.also }; })()],
    ['occasions', takeTerms(s, OCCASION_TERMS)],
  ];
  for (const [key, r] of lists) {
    if (!r.values.length) continue;
    const target = (r.also ? add : set) as Record<string, unknown>;
    target[key] = r.values;
  }

  // 7. 핏
  const fit = takeTerms(s, FIT_TERMS).values[0];
  if (fit) set.fit = fit;

  // 8. 가격
  const price = takePrice(s);
  if (price) {
    Object.assign(set, price);
    if (price.maxPrice !== undefined && price.minPrice === undefined) clear.push('minPrice');
    if (price.minPrice !== undefined && price.maxPrice === undefined) clear.push('maxPrice');
  }

  // 9. 의도
  const wantsSimilar = s.has(/비슷|유사|닮은|같은\s*느낌|이런\s*느낌|이거랑|이 옷이랑/);
  const wantsTerm = s.has(/뭐라고\s*(불|부르|해|하)|이름이?\s*뭐|무슨\s*옷|설명해|어떤\s*옷이야/);
  const wantsCheaper = s.has(/더\s*(저렴|싸|싼)|저렴하게|싸게|가격.{0,3}(낮|내려)|예산.{0,3}(줄|낮)/);
  const base = urlProduct ?? ctx.baseProduct;
  // 링크와 함께 "더 싼 거"라고 하면 그 상품과 비슷한 것 중에서 찾는다 (시나리오 D)
  const similarMode = Boolean(base) && (wantsSimilar || (wantsCheaper && Boolean(urlProduct)));

  // 10. 정렬
  for (const [key, re] of SORT_PATTERNS) if (s.has(re)) { set.sort = key; break; }

  // "더 저렴하게": 가격을 직접 말하지 않았을 때만
  if (wantsCheaper && !price) {
    if (similarMode && base) set.maxPrice = base.price - 1;
    else if (ctx.conditions.maxPrice !== undefined) {
      set.maxPrice = Math.max(PRICE_UNIT, Math.floor((ctx.conditions.maxPrice * 0.7) / PRICE_UNIT) * PRICE_UNIT);
    } else set.sort = 'LOW_PRICE';
  }

  if (Object.keys(set).length) patch.set = set;
  if (Object.keys(add).length) patch.add = add;
  if (Object.keys(exclude).length) (patch.add ??= {}).exclude = exclude;
  if (clear.length) patch.clear = [...new Set(clear)];

  const changed = Boolean(patch.set || patch.add || patch.clear);
  let intent: QueryIntent;
  if (wantsTerm) intent = 'term';
  else if (similarMode) intent = 'similar';
  else if (urlProduct && Object.keys(set).length === 1 && !patch.add && !patch.clear) intent = 'product';
  else if (changed) intent = 'search';
  else if (patch.reset) intent = 'reset';
  else if (wantsSimilar) intent = 'similar';
  else intent = 'unknown';

  return { intent, patch };
}
