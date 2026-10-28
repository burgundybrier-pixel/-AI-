// src/types/product.ts — 공유 타입 (B 작성). 2026-10-28 결정: 가격은 숫자, id는 문자열
// 홈·검색·랭킹·상세·찜·AI 추천이 모두 이 타입 하나를 쓴다 (명세서 §5, §6.4).
// enum 대신 문자열 유니언을 쓴다 (Vite TS 템플릿의 erasableSyntaxOnly 설정과 호환).

/** 대분류. 무신사 category 코드: 001 상의, 002 아우터, 003 바지, 004 가방, 101 소품 (신발 코드는 해부에서 미확인) */
export type Category = 'top' | 'outer' | 'bottom' | 'shoes' | 'bag' | 'acc';

/** 무신사 color 필터 코드를 그대로 쓴다 (plan.md 4-1) */
export type Color =
  | 'BLACK' | 'WHITE' | 'GRAY' | 'NAVY' | 'BEIGE'
  | 'BROWN' | 'KHAKI' | 'BLUE' | 'RED' | 'GREEN' | 'IVORY';

/** 원본 검색에는 없고 랭킹 탭에만 있는 축 (plan.md 4-2) */
export type StyleTag =
  | 'minimal' | 'street' | 'casual' | 'formal' | 'vintage'
  | 'workwear' | 'preppy' | 'sporty';

export type Season = 'spring' | 'summer' | 'fall' | 'winter';

/** 무신사 attributeFitGroup에 대응 */
export type Fit = 'over' | 'regular' | 'slim' | 'crop' | 'wide';

/** 착용 상황 (명세서 §4.1) */
export type Occasion = 'campus' | 'date' | 'work' | 'travel' | 'daily';

export interface Product {
  /** 라우트 /product/:id 의 :id와 같은 문자열. 숫자로 바꾸지 않는다 */
  id: string;
  name: string;
  brand: string;
  category: Category;
  /** 세부 종류 이름. "패딩 제외", 패션 용어 설명(시나리오 E)에 쓴다. 예: '패딩', '블루종', 'MA-1', '후드티' */
  subCategory: string;
  /** 판매가 (원). 무신사 price/finalPrice에 해당 */
  price: number;
  /** 할인 전 가격. 할인이 없으면 price와 같게 둔다. 할인율은 저장하지 않고 계산한다 */
  originalPrice: number;
  imageUrl: string;
  /** 대표 색상 하나. 여러 색상 상품은 색상별로 상품을 따로 만든다 (데모 단순화) */
  color: Color;
  /** 여러 계절에 입는 옷이 있어서 배열 (예: 봄·가을) */
  seasons: Season[];
  styleTags: StyleTag[];
  fit: Fit;
  /** 표시용 소재 문구. 예: '나일론 100%' */
  material: string;
  description: string;
  /** 데모용 인기도 0~100. 실제 판매량이 아님 (명세서 §5) */
  popularityScore: number;

  // ---- A의 카드·상세 화면이 이미 보여 주는 값 (A 코드 기준 추가) ----
  /** 별점 0~5. A 코드의 rating '4.5 (2)'를 숫자로 나눈 것 */
  rating: number;
  reviewCount: number;
  /** 카드 이미지 위 분홍 라벨. 예: '아우터 페스티벌'. 없으면 라벨을 그리지 않는다 */
  promoTag?: string;

  // ---- 명세서 §5에 없는 추가 제안 (A와 합의 필요) ----
  /** 착용 상황 인식(명세서 §4.1)에 필요 */
  occasions: Occasion[];
  /** 동의어 사전으로 못 잡는 표현용 검색 키워드. 예: ['빵빵한', '푸퍼'] */
  keywords: string[];
}

// productUrl(명세서 §5)은 저장하지 않는다. `/product/${id}`로 항상 만들 수 있어서, 따로 두면 id와 어긋날 위험만 생긴다.
