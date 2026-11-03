import type { Product } from '../types/product';
import type { Outfit, OutfitItem, OutfitRequest, OutfitSession } from '../types/outfit';
import { OCCASION_LABEL, SEASON_LABEL } from '../utils/labels';
import { recommendOutfits, validateOutfit } from './recommendOutfits';

export const outfitStorageKey = (baseProductId: string) => `musinsa-demo:outfit:v1:${baseProductId}`;
export const newOutfitSession = (baseProductId: string): OutfitSession => ({
  version: 1, baseProductId, draft: { budget: '150,000', occasion: 'daily', season: '' }, submitted: null, result: null,
});

const record = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const occasion = (value: unknown) => typeof value === 'string' && Object.hasOwn(OCCASION_LABEL, value);
const season = (value: unknown) => typeof value === 'string' && Object.hasOwn(SEASON_LABEL, value);

/** Treat storage as untrusted and re-resolve prices, locks and reasons from today's catalog. */
export function restoreOutfitSession(raw: string | null, baseProductId: string, products: Product[]): OutfitSession {
  const fresh = newOutfitSession(baseProductId);
  if (!raw) return fresh;
  try {
    const value: unknown = JSON.parse(raw);
    if (!record(value) || value.version !== 1 || value.baseProductId !== baseProductId || !products.some((p) => p.id === baseProductId)) return fresh;
    const draft = value.draft;
    if (!record(draft) || typeof draft.budget !== 'string' || draft.budget.length > 64 || !occasion(draft.occasion) || !(draft.season === '' || season(draft.season))) return fresh;
    const checkedDraft = draft as unknown as OutfitSession['draft'];
    if (value.submitted === null && value.result === null) return { ...fresh, draft: checkedDraft };
    const submitted = value.submitted;
    if (!record(submitted) || submitted.baseProductId !== baseProductId || !Number.isSafeInteger(submitted.totalBudget) || (submitted.totalBudget as number) <= 0
      || !occasion(submitted.occasion) || !(submitted.season === undefined || season(submitted.season))) return fresh;
    const request = submitted as unknown as OutfitRequest;
    if (!record(value.result)) return fresh;
    let result = recommendOutfits(products, request);
    if (value.result.status === 'success') {
      const stored = value.result.outfits;
      if (!Array.isArray(stored) || stored.length < 1 || stored.length > 3) return fresh;
      const outfits: Outfit[] = [];
      for (const saved of stored) {
        if (!record(saved) || !Array.isArray(saved.items)
          || !saved.items.every((item: unknown) => record(item) && typeof item.productId === 'string'
            && ['outer', 'top', 'bottom', 'shoes'].includes(item.slot as string) && typeof item.locked === 'boolean')) return fresh;
        const outfit = validateOutfit(products, request, saved.items as OutfitItem[]);
        if (!outfit || outfits.some((o) => o.id === outfit.id)) return fresh;
        outfits.push(outfit);
      }
      result = { status: 'success', outfits };
    } else if (value.result.status !== 'empty' && value.result.status !== 'invalid') return fresh;
    return { ...fresh, draft: checkedDraft, submitted: request, result };
  } catch {
    return fresh;
  }
}
