// src/types/chat.ts — 공유 타입 초안 (B 작성, A 확인용)
// 챗봇의 검색 조건·메시지·추천 결과. A는 RecommendResult와 SearchConditions의 가격·카테고리만 알면 된다.

import type { Category, Color, Fit, Occasion, Product, Season, StyleTag } from './product';

// ---------------------------------------------------------------
// 검색 조건
// ---------------------------------------------------------------

/** 정렬. 무신사 sortCode 값에 맞춘다 (plan.md 4-1) */
export type SortKey = 'RECOMMEND' | 'POPULAR' | 'LOW_PRICE';

/** "패딩 제외", "빨간색 빼고", "로고 없는 옷" (명세서 §4.1 제외 조건) */
export interface ExcludeConditions {
  subCategories?: string[];
  colors?: Color[];
  /** 상품명·설명·keywords에 들어 있으면 제외. 예: '로고' */
  keywords?: string[];
}

/**
 * 챗봇이 대화 내내 들고 있는 "현재 검색 조건".
 * 모든 필드가 선택 항목이다. 비어 있으면 그 조건으로 거르지 않는다.
 * A의 일반 검색 화면(S02)도 category·minPrice·maxPrice·sort를 같은 이름으로 쓰면 AI 검색 전환이 쉬워진다.
 */
export interface SearchConditions {
  category?: Category;
  subCategory?: string;
  colors?: Color[];
  styles?: StyleTag[];
  seasons?: Season[];
  occasions?: Occasion[];
  fit?: Fit;
  /** 원 단위. 무신사 minPrice/maxPrice와 같은 이름 */
  minPrice?: number;
  maxPrice?: number;
  sort?: SortKey;
  exclude?: ExcludeConditions;
  /** 기준 상품. 상세에서 "AI에게 물어보기"(T10), URL 입력(T07), "비슷한 옷"(T08)에 쓴다 */
  baseProductId?: Product['id'];
}

/** 값이 여러 개일 수 있는 조건. "블랙도 추가해 줘"처럼 기존 값에 더할 수 있다 */
export type ListConditionKey = 'colors' | 'styles' | 'seasons' | 'occasions';

/**
 * parseQuery가 한 문장에서 뽑아낸 "바뀐 부분".
 * useChat은 이것을 현재 SearchConditions 위에 적용해 다음 조건을 만든다.
 * 패치에 등장하지 않은 조건은 그대로 남는다 (T03, T04).
 *
 * 적용 순서: reset → clear → set → add
 *   "처음부터 다시"          → { reset: true }
 *   "처음부터, 니트 보여줘"   → { reset: true, set: { category: 'top', subCategory: '니트' } }
 *   "가격은 상관없어"         → { clear: ['minPrice', 'maxPrice'] }
 *   "5만 원 이하로 바꿔줘"    → { set: { maxPrice: 50000 } }            (T04: 가격만 교체)
 *   "검은색 위주로"           → { set: { colors: ['BLACK'] } }           (배열 통째로 교체)
 *   "네이비도 같이 보여줘"     → { add: { colors: ['NAVY'] } }            (기존 배열에 합치기)
 *   "패딩은 빼줘"             → { add: { exclude: { subCategories: ['패딩'] } } }
 */
export interface ConditionPatch {
  /** true면 모든 조건을 비운 뒤 나머지를 적용한다 */
  reset?: boolean;
  /** 지울 조건 이름. 지운 조건은 "거르지 않음"이 된다 */
  clear?: (keyof SearchConditions)[];
  /** 덮어쓸 조건. 배열 조건도 통째로 교체한다 */
  set?: Partial<SearchConditions>;
  /** 기존 배열에 중복 없이 더할 값. 제외 조건도 항목별로 더한다 */
  add?: Partial<Pick<SearchConditions, ListConditionKey | 'exclude'>>;
}

// ---------------------------------------------------------------
// 추천 결과
// ---------------------------------------------------------------

export interface RecommendedItem {
  /** 상품 전체가 아니라 id만 둔다. 카드는 products.ts에서 찾아 그린다 → 찜 상태·가격이 화면마다 어긋나지 않는다 (명세서 §6.4) */
  productId: Product['id'];
  /** 정렬에 쓴 적합도 점수. 화면에는 보여 주지 않는다 */
  score: number;
  /** 카드 아래 "추천 이유". 예: ['겨울용', '블랙', '15만 원 이하'] */
  reasons: string[];
}

export interface RecommendResult {
  /** 이 결과를 만들 때 적용한 조건의 복사본. 조건 칩은 이것으로 그린다 */
  conditions: SearchConditions;
  items: RecommendedItem[];
  /** 가격·제외 조건을 통과한 전체 개수 (items는 그중 상위 몇 개) */
  totalMatched: number;
}

/** 결과가 0개일 때 보여 줄 "조건 완화" 버튼 (명세서 §4.2, T12) */
export interface RelaxOption {
  /** 버튼 문구. 예: '가격 상한을 20만 원으로 올리기' */
  label: string;
  patch: ConditionPatch;
}

/** 패션 용어 설명 응답 (시나리오 E) */
export interface TermExplanation {
  /** 예: '블루종' */
  term: string;
  description: string;
  /** 관련 검색 키워드 칩. 예: ['MA-1', '봄버 재킷'] */
  relatedKeywords: string[];
}

// ---------------------------------------------------------------
// 메시지
// ---------------------------------------------------------------

/** 사용자가 첨부한 것. 이미지는 미리보기 URL만 들고, 등록된 샘플이면 sampleId가 붙는다 (명세서 §2 시나리오 C·D) */
export type Attachment =
  | { type: 'image'; previewUrl: string; sampleId?: string }
  | { type: 'url'; url: string; productId?: Product['id'] };

export interface UserMessage {
  id: string;
  role: 'user';
  createdAt: number;
  text: string;
  attachment?: Attachment;
}

interface AssistantBase {
  id: string;
  role: 'assistant';
  createdAt: number;
  /** 말풍선 본문 */
  text: string;
}

/** 응답 6종 (명세서 §4.4). kind로 구분해서, 화면은 switch 한 번으로 그린다 */
export type AssistantMessage = AssistantBase & (
  | { kind: 'text' }
  | { kind: 'recommend'; result: RecommendResult }
  | { kind: 'term'; term: TermExplanation }
  | { kind: 'clarify'; suggestions: string[] }
  | { kind: 'empty'; relaxOptions: RelaxOption[] }
  | { kind: 'unsupported' }
);

export type ChatMessage = UserMessage | AssistantMessage;
