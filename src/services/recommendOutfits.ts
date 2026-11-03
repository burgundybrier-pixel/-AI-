import type { Category, Product } from '../types/product';
import type { Outfit, OutfitItem, OutfitReplacement, OutfitRequest, OutfitResult, OutfitSlot } from '../types/outfit';
import { CATEGORY_LABEL, formatPrice } from '../utils/format';
import { OCCASION_LABEL, STYLE_LABEL } from '../utils/labels';

export function getOutfitSlots(category: Category): OutfitSlot[] | null {
  if (category === 'outer') return ['outer', 'top', 'bottom', 'shoes'];
  if (category === 'top' || category === 'bottom' || category === 'shoes') return ['top', 'bottom', 'shoes'];
  return null;
}

/** Validate the whole input; never accept a numeric prefix such as "150000원". */
export function parseOutfitBudget(value: string): number | null {
  const text = value.trim();
  if (!/^(?:\d+|\d{1,3}(?:,\d{3})+)$/.test(text)) return null;
  const amount = Number(text.replaceAll(',', ''));
  return Number.isSafeInteger(amount) && amount > 0 ? amount : null;
}

export function outfitKey(items: Pick<OutfitItem, 'slot' | 'productId'>[]): string {
  return items.map((item) => `${item.slot}:${item.productId}`).sort().join('|');
}

function describeOutfit(base: Product, additional: Product[], total: number, request: OutfitRequest): string[] {
  const sharedStyle = base.styleTags.find((style) => additional.some((p) => p.styleTags.includes(style)));
  const styleText = sharedStyle
    ? `${STYLE_LABEL[sharedStyle]} 태그가 겹치는 ${additional.filter((p) => p.styleTags.includes(sharedStyle)).map((p) => CATEGORY_LABEL[p.category]).join('·')} 아이템을 골랐어요.`
    : '선택한 상품에 상의·하의·신발 구성을 맞췄어요.';
  const occasionItems = additional.filter((p) => p.occasions.includes(request.occasion));
  const occasionText = occasionItems.length
    ? ` ${OCCASION_LABEL[request.occasion]} 태그가 있는 ${occasionItems.map((p) => CATEGORY_LABEL[p.category]).join('·')} 아이템을 포함했어요.`
    : '';
  return [styleText + occasionText, `전체 ${formatPrice(total)}으로 ${formatPrice(request.totalBudget)} 예산 안에 맞췄어요.`];
}

/** Resolve IDs from the supplied catalog and rebuild derived fields, including restored data. */
export function validateOutfit(products: Product[], request: OutfitRequest, items: OutfitItem[]): Outfit | null {
  if (!Number.isSafeInteger(request.totalBudget) || request.totalBudget <= 0) return null;
  const byId = new Map(products.map((p) => [p.id, p]));
  const base = byId.get(request.baseProductId);
  const slots = base ? getOutfitSlots(base.category) : null;
  if (!base || !slots || items.length !== slots.length) return null;
  if (new Set(items.map((i) => i.slot)).size !== slots.length || new Set(items.map((i) => i.productId)).size !== slots.length) return null;
  const resolved: Product[] = [];
  const normalized: OutfitItem[] = [];
  for (const slot of slots) {
    const item = items.find((i) => i.slot === slot);
    const product = item ? byId.get(item.productId) : undefined;
    if (!product || product.category !== slot || (request.season && !product.seasons.includes(request.season))) return null;
    resolved.push(product);
    normalized.push({ slot, productId: product.id, locked: product.id === base.id });
  }
  if (resolved.filter((p) => p.id === base.id).length !== 1) return null;
  const totalPrice = resolved.reduce((sum, p) => sum + p.price, 0);
  if (totalPrice > request.totalBudget) return null;
  const additional = resolved.filter((p) => p.id !== base.id);
  const score = additional.reduce((sum, p) => sum
    + p.styleTags.filter((style) => base.styleTags.includes(style)).length * 4
    + (p.occasions.includes(request.occasion) ? 3 : 0)
    + (p.seasons.some((season) => base.seasons.includes(season)) ? 1 : 0)
    + p.popularityScore * 0.01, 0);
  return { id: outfitKey(normalized), items: normalized, totalPrice, score, reasons: describeOutfit(base, additional, totalPrice, request) };
}

function compare(a: Outfit, b: Outfit): number {
  if (a.score !== b.score) return b.score - a.score;
  if (a.totalPrice !== b.totalPrice) return a.totalPrice - b.totalPrice;
  const aIds = a.items.map((i) => i.productId).join('|');
  const bIds = b.items.map((i) => i.productId).join('|');
  return aIds < bIds ? -1 : aIds > bIds ? 1 : 0;
}

export function recommendOutfits(products: Product[], request: OutfitRequest): OutfitResult {
  if (!Number.isSafeInteger(request.totalBudget) || request.totalBudget <= 0) return { status: 'invalid', reason: 'invalid-budget' };
  const base = products.find((p) => p.id === request.baseProductId);
  if (!base) return { status: 'invalid', reason: 'missing-product' };
  const slots = getOutfitSlots(base.category);
  if (!slots) return { status: 'invalid', reason: 'unsupported-category' };
  const missingSlots = slots.filter((slot) => slot !== base.category && !products.some((p) => p.category === slot));
  if (missingSlots.length) return { status: 'empty', reason: 'missing-category', missingSlots };
  if (request.season && !base.seasons.includes(request.season)) return { status: 'empty', reason: 'season' };
  const candidates = slots.map((slot) => slot === base.category ? [base]
    : products.filter((p) => p.category === slot && (!request.season || p.seasons.includes(request.season))));
  if (candidates.some((list) => !list.length)) return { status: 'empty', reason: 'season' };

  let minimumBudget = Infinity;
  const outfits = new Map<string, Outfit>();
  function visit(index: number, selected: Product[]) {
    if (index === slots!.length) {
      const total = selected.reduce((sum, p) => sum + p.price, 0);
      minimumBudget = Math.min(minimumBudget, total);
      if (total > request.totalBudget) return;
      const outfit = validateOutfit(products, request, selected.map((p, i) => ({ slot: slots![i], productId: p.id, locked: p.id === base!.id })));
      if (outfit) outfits.set(outfit.id, outfit);
      return;
    }
    for (const product of candidates[index]) {
      if (!selected.some((p) => p.id === product.id)) visit(index + 1, [...selected, product]);
    }
  }
  visit(0, []);
  const remaining = [...outfits.values()].sort(compare);
  if (!remaining.length) return Number.isFinite(minimumBudget)
    ? { status: 'empty', reason: 'budget', minimumBudget }
    : { status: 'empty', reason: 'missing-category' };
  const selected: Outfit[] = [remaining.shift()!];
  while (selected.length < 3 && remaining.length) {
    const previousIds = new Set(selected.at(-1)!.items.filter((i) => !i.locked).map((i) => i.productId));
    const overlap = (o: Outfit) => o.items.filter((i) => !i.locked && previousIds.has(i.productId)).length;
    let best = 0;
    for (let i = 1; i < remaining.length; i++) if (overlap(remaining[i]) < overlap(remaining[best])) best = i;
    selected.push(remaining.splice(best, 1)[0]);
  }
  return { status: 'success', outfits: selected };
}

export function replaceOutfitItem(products: Product[], request: OutfitRequest, outfit: Outfit, slot: OutfitSlot, otherOutfits: Outfit[] = []): OutfitReplacement {
  const current = validateOutfit(products, request, outfit.items);
  const item = current?.items.find((i) => i.slot === slot);
  if (!current || !item || item.locked) return { status: 'unavailable' };
  const occupied = new Set(otherOutfits.map((o) => outfitKey(o.items)));
  const alternatives = products.filter((p) => p.category === slot && p.id !== item.productId)
    .map((p) => validateOutfit(products, request, current.items.map((i) => i.slot === slot ? { ...i, productId: p.id } : i)))
    .filter((o): o is Outfit => o !== null && !occupied.has(o.id)).sort(compare);
  return alternatives.length ? { status: 'success', outfit: alternatives[0] } : { status: 'unavailable' };
}
