import type { ConditionPatch, ExcludeConditions, SearchConditions } from '../types/chat';

const union = <T>(a: T[] = [], b: T[] = []) => [...new Set([...a, ...b])];

/** 현재 조건 + 패치 → 다음 조건. 적용 순서: reset → clear → set → add (types/chat.ts의 ConditionPatch 설명) */
export function applyPatch(current: SearchConditions, patch: ConditionPatch): SearchConditions {
  const next: SearchConditions = patch.reset ? {} : structuredClone(current);

  for (const key of patch.clear ?? []) delete next[key];

  for (const [key, value] of Object.entries(patch.set ?? {}) as [keyof SearchConditions, unknown][]) {
    if (value !== undefined) (next as Record<string, unknown>)[key] = structuredClone(value);
  }

  const add = patch.add ?? {};
  if (add.colors) next.colors = union(next.colors, add.colors);
  if (add.styles) next.styles = union(next.styles, add.styles);
  if (add.seasons) next.seasons = union(next.seasons, add.seasons);
  if (add.occasions) next.occasions = union(next.occasions, add.occasions);
  if (add.exclude) {
    const ex: ExcludeConditions = next.exclude ?? {};
    next.exclude = {
      subCategories: union(ex.subCategories, add.exclude.subCategories),
      colors: union(ex.colors, add.exclude.colors),
      keywords: union(ex.keywords, add.exclude.keywords),
    };
  }

  // 비어 버린 목록은 지운다 → "조건 없음"과 "빈 조건"을 같은 것으로
  for (const key of ['colors', 'styles', 'seasons', 'occasions'] as const) if (next[key]?.length === 0) delete next[key];
  if (next.exclude) {
    for (const key of ['subCategories', 'colors', 'keywords'] as const) if (!next.exclude[key]?.length) delete next.exclude[key];
    if (!Object.keys(next.exclude).length) delete next.exclude;
  }

  return next;
}
