// 일상 표현 → 검색 조건 사전 (명세서 §4.1). parseQuery가 위에서부터 찾는다.
// 같은 목록 안에서는 긴 표현을 먼저 찾으므로 순서는 신경 쓰지 않아도 된다.

import type { Category, Color, Fit, Occasion, Season, StyleTag } from '../types/product';

export interface ItemTerm {
  words: string[];
  category: Category;
  /** 없으면 대분류만 정한다 ("외투", "바지") */
  subCategory?: string;
  /** "○○ 빼줘"라고 했을 때 함께 빼는 세부 종류. 없으면 subCategory 하나만 뺀다 */
  excludeFamily?: string[];
}

/** 옷 종류. subCategory가 있는 항목이 대분류만 있는 항목보다 우선한다 */
export const ITEM_TERMS: ItemTerm[] = [
  { words: ['경량패딩', '경량 패딩', '얇은 패딩', '가벼운 패딩'], category: 'outer', subCategory: '경량패딩' },
  { words: ['롱패딩', '롱 패딩', '긴 패딩'], category: 'outer', subCategory: '롱패딩' },
  {
    words: ['패딩', '푸퍼', '빵빵한', '다운 재킷', '다운재킷', '숏패딩'],
    category: 'outer', subCategory: '패딩', excludeFamily: ['패딩', '롱패딩', '경량패딩'],
  },
  { words: ['코트', '피코트', '발마칸'], category: 'outer', subCategory: '코트' },
  { words: ['ma-1', '항공점퍼', '항공 점퍼', '봄버', '보머'], category: 'outer', subCategory: 'MA-1' },
  { words: ['블루종'], category: 'outer', subCategory: '블루종' },
  { words: ['바시티', '야구점퍼', '야구 점퍼', '과잠', '스타디움'], category: 'outer', subCategory: '바시티 재킷' },
  { words: ['레더', '가죽'], category: 'outer', subCategory: '레더 재킷' },
  { words: ['플리스', '후리스', '뽀글이'], category: 'outer', subCategory: '플리스' },
  { words: ['외투', '아우터', '점퍼', '재킷', '자켓', '겉옷'], category: 'outer' },

  { words: ['후드티', '후디', '후드 티', '후드티셔츠'], category: 'top', subCategory: '후드티' },
  { words: ['니트', '스웨터'], category: 'top', subCategory: '니트' },
  { words: ['맨투맨', '스웻셔츠', '스웨트셔츠'], category: 'top', subCategory: '맨투맨' },
  { words: ['상의', '윗옷'], category: 'top' },

  { words: ['와이드 팬츠', '와이드팬츠', '통바지', '헐렁한 바지', '넓은 바지'], category: 'bottom', subCategory: '와이드 팬츠' },
  { words: ['슬랙스', '정장바지', '정장 바지'], category: 'bottom', subCategory: '슬랙스' },
  { words: ['청바지', '데님'], category: 'bottom', subCategory: '청바지' },
  { words: ['바지', '팬츠', '하의'], category: 'bottom' },

  { words: ['스니커즈', '운동화'], category: 'shoes', subCategory: '스니커즈' },
  { words: ['부츠', '첼시'], category: 'shoes', subCategory: '부츠' },
  { words: ['신발'], category: 'shoes' },
];

export const COLOR_TERMS: [Color, string[]][] = [
  ['BLACK', ['검정', '검은', '까만', '블랙']],
  ['WHITE', ['흰색', '하얀', '화이트']],
  ['GRAY', ['회색', '그레이', '차콜']],
  ['NAVY', ['네이비', '남색']],
  ['BEIGE', ['베이지']],
  ['IVORY', ['아이보리', '크림색']],
  ['BROWN', ['갈색', '브라운']],
  ['KHAKI', ['카키', '올리브']],
  ['BLUE', ['파란', '파랑', '블루', '하늘색']],
  ['RED', ['빨간', '빨강', '레드']],
  ['GREEN', ['초록', '그린']],
];

export const STYLE_TERMS: [StyleTag, string[]][] = [
  ['minimal', ['미니멀', '깔끔', '심플', '단정', '모던']],
  ['street', ['스트릿', '스트리트', '힙한', '힙하게']],
  ['casual', ['캐주얼', '편한', '편하게', '편안']],
  ['formal', ['포멀', '격식', '정장', '하객']],
  ['vintage', ['빈티지', '레트로']],
  ['workwear', ['워크웨어']],
  ['preppy', ['프레피', '아이비']],
  ['sporty', ['스포티', '고프코어', '아웃도어']],
];

export const SEASON_TERMS: [Season[], string[]][] = [
  [['spring', 'fall'], ['간절기', '환절기']],
  [['winter'], ['겨울', '추운 날', '추울 때', '따뜻한']],
  [['summer'], ['여름', '더운 날', '더울 때']],
  [['spring'], ['봄']],
  [['fall'], ['가을']],
];

export const OCCASION_TERMS: [Occasion, string[]][] = [
  ['campus', ['학교', '대학', '캠퍼스', '등교', '수업']],
  ['date', ['데이트', '소개팅']],
  ['work', ['출근', '회사', '직장', '면접', '오피스']],
  ['travel', ['여행', '나들이']],
  ['daily', ['데일리', '평소', '일상']],
];

export const FIT_TERMS: [Fit, string[]][] = [
  ['over', ['오버핏', '오버사이즈', '박시', '넉넉한', '루즈핏']],
  ['slim', ['슬림']],
  ['crop', ['크롭', '짧은 기장', '짧은 재킷', '짧은 자켓']],
  ['wide', ['와이드']],
  ['regular', ['레귤러', '정핏', '기본핏']],
];

/** "두껍지 않은" 같은 표현 → 두꺼운 패딩만 뺀다 (경량패딩은 남김) */
export const NOT_THICK_WORDS = ['두껍지 않', '안 두꺼', '안두꺼', '너무 두껍', '얇은', '가벼운'];
export const THICK_SUBCATEGORIES = ['패딩', '롱패딩'];
