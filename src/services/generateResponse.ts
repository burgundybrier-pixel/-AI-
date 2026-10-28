// 응답 6종 (명세서 §4.4)을 무시니 말투로 만든다.
// 말투: 친근한 존댓말, 짧게. 조건은 칩으로 따로 보이니 문장에서는 핵심만.

import type { Product } from '../types/product';
import type { AssistantMessage, RecommendResult, RelaxOption, SearchConditions, TermExplanation } from '../types/chat';
import { conditionLabels } from '../utils/labels';

/** 처음 열었을 때와 알아듣지 못했을 때 보여 줄 추천 질문 (명세서 S05) */
export const STARTER_QUESTIONS = [
  '겨울 아우터 추천해줘',
  '10만 원 이하 검정 후드티',
  '학교 갈 때 입을 깔끔한 코트',
  '빵빵한 겨울 점퍼 찾아줘',
];

let seq = 0;
const base = (text: string) => ({
  id: `a-${Date.now()}-${seq++}`,
  role: 'assistant' as const,
  createdAt: Date.now(),
  text,
});

const joinLabels = (c: SearchConditions) => conditionLabels(c).join(' · ');

export const reply = {
  greeting(baseProduct?: Product): AssistantMessage {
    if (baseProduct) {
      return {
        ...base(`'${baseProduct.name}'을 기준으로 도와드릴게요. 비슷한 옷을 찾거나, 이 옷이 뭐라고 불리는지 물어보세요!`),
        kind: 'clarify',
        suggestions: ['비슷한 옷 찾아줘', '비슷한데 더 저렴한 거', '이런 옷은 보통 뭐라고 불러?'],
      };
    }
    return {
      ...base('안녕하세요, 무시니예요! 찾는 옷을 편하게 말해 주세요. 정확한 상품 이름을 몰라도 괜찮아요.'),
      kind: 'clarify',
      suggestions: STARTER_QUESTIONS,
    };
  },

  recommend(result: RecommendResult, opts: { similarTo?: Product; fromLink?: boolean } = {}): AssistantMessage {
    const { similarTo, fromLink } = opts;
    const labels = joinLabels(result.conditions);
    let text: string;
    if (similarTo) {
      text = `'${similarTo.name}'과 비슷한 옷을 ${result.items.length}개 골라 봤어요.`;
    } else if (fromLink) {
      text = '링크의 상품을 찾았어요! 이 옷을 기준으로 "비슷한데 더 저렴한 거"처럼 말해 보세요.';
    } else {
      text = `${labels ? `${labels} 조건으로 ` : ''}${result.totalMatched}개를 찾았어요.`;
      if (result.totalMatched > result.items.length) text += ` 그중 잘 맞는 ${result.items.length}개예요.`;
      // 조건이 하나뿐이면 더 좁힐 질문을 덧붙인다 (응답 4종: 추가 조건 질문)
      if (conditionLabels(result.conditions).length <= 1) text += ' 예산이나 색, 스타일을 알려 주면 더 좁혀 볼게요.';
    }
    return { ...base(text), kind: 'recommend', result };
  },

  empty(c: SearchConditions, relaxOptions: RelaxOption[]): AssistantMessage {
    return {
      ...base(`아쉽게도 ${joinLabels(c)} 조건에 딱 맞는 옷은 없어요. 조건을 조금 바꿔 볼까요?`),
      kind: 'empty',
      relaxOptions,
    };
  },

  term(product: Product | undefined, term: TermExplanation): AssistantMessage {
    const lead = product ? `이 옷은 보통 '${term.term}'이라고 불러요.` : `'${term.term}'은 이런 옷이에요.`;
    return { ...base(`${lead} ${term.description}`), kind: 'term', term };
  },

  askBaseProduct(): AssistantMessage {
    return {
      ...base('어떤 옷과 비교할까요? 상품 상세에서 "AI 추천" 버튼을 누르거나, 무신사 상품 링크를 붙여 넣어 주세요.'),
      kind: 'clarify',
      suggestions: STARTER_QUESTIONS.slice(0, 2),
    };
  },

  reset(): AssistantMessage {
    return { ...base('조건을 모두 지웠어요. 어떤 옷을 찾고 있는지 다시 말해 주세요!'), kind: 'clarify', suggestions: STARTER_QUESTIONS };
  },

  unknown(): AssistantMessage {
    return {
      ...base('음, 제가 잘 이해하지 못했어요. 옷 종류나 색, 계절, 예산 중 하나만 같이 말해 줄래요?'),
      kind: 'clarify',
      suggestions: STARTER_QUESTIONS,
    };
  },

  unsupportedLink(): AssistantMessage {
    return {
      ...base('이 링크는 아직 열어 볼 수 없어요. 어떤 옷인지 종류·색·스타일을 말로 알려 주면 비슷한 걸 찾아볼게요.'),
      kind: 'unsupported',
    };
  },

  unsupportedImage(): AssistantMessage {
    return {
      ...base('사진을 받았어요! 아직 사진 속 옷을 직접 알아보지는 못해요. 어떤 종류·색·느낌의 옷인지 말로 알려 주면 비슷한 걸 찾아볼게요.'),
      kind: 'unsupported',
    };
  },
};
