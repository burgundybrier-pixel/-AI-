// 문장 하나 → (다음 조건, AI 응답). useChat과 테스트가 모두 이 함수를 쓴다.

import type { Product } from '../types/product';
import type { AssistantMessage, SearchConditions } from '../types/chat';
import { products as allProducts, getProductById } from '../data/products';
import { FASHION_TERMS } from '../data/fashionTerms';
import { parseQuery } from './parseQuery';
import { applyPatch } from './applyPatch';
import { recommendProducts, recommendSimilar, relaxOptions } from './recommendProducts';
import { reply } from './generateResponse';

export interface ChatTurn {
  conditions: SearchConditions;
  message: AssistantMessage;
}

export function respond(text: string, current: SearchConditions, products: Product[] = allProducts): ChatTurn {
  const baseProduct = current.baseProductId ? getProductById(current.baseProductId) : undefined;
  const { intent, patch } = parseQuery(text, { conditions: current, baseProduct });
  const conditions = applyPatch(current, patch);
  const base = conditions.baseProductId ? getProductById(conditions.baseProductId) : undefined;

  switch (intent) {
    case 'unsupported':
      return { conditions: current, message: reply.unsupportedLink() };

    case 'unknown':
      if (/안녕|반가|하이|hello|\bhi\b/i.test(text)) return { conditions: current, message: reply.greeting(baseProduct) };
      return { conditions: current, message: reply.unknown() };

    case 'reset':
      return { conditions, message: reply.reset() };

    case 'term': {
      const sub = base?.subCategory ?? conditions.subCategory;
      const term = sub ? FASHION_TERMS[sub] : undefined;
      return { conditions, message: term ? reply.term(base, term) : reply.askBaseProduct() };
    }

    case 'product': {
      // 링크의 상품 하나를 카드로 보여 준다
      const result = { conditions, items: base ? [{ productId: base.id, score: 0, reasons: ['붙여 넣은 링크'] }] : [], totalMatched: 1 };
      return { conditions, message: reply.recommend(result, { fromLink: true }) };
    }

    case 'similar': {
      if (!base) return { conditions, message: reply.askBaseProduct() };
      const result = recommendSimilar(products, base, conditions);
      if (!result.items.length) return { conditions, message: reply.empty(conditions, relaxOptions(products, conditions)) };
      return { conditions, message: reply.recommend(result, { similarTo: base }) };
    }

    case 'search': {
      const result = recommendProducts(products, conditions);
      if (!result.items.length) return { conditions, message: reply.empty(conditions, relaxOptions(products, conditions)) };
      return { conditions, message: reply.recommend(result) };
    }
  }
}

/** 조건 완화 버튼을 눌렀을 때. 문장 없이 패치만 적용해 다시 추천한다 */
export function respondToPatch(patch: Parameters<typeof applyPatch>[1], current: SearchConditions, products: Product[] = allProducts): ChatTurn {
  const conditions = applyPatch(current, patch);
  if (patch.reset) return { conditions, message: reply.reset() };
  const result = recommendProducts(products, conditions);
  if (!result.items.length) return { conditions, message: reply.empty(conditions, relaxOptions(products, conditions)) };
  return { conditions, message: reply.recommend(result) };
}
