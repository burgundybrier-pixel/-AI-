import { useEffect, useState } from 'react';
import { products } from '../data/products';
import type { OutfitDraft, OutfitRequest, OutfitSlot } from '../types/outfit';
import { parseOutfitBudget, recommendOutfits, replaceOutfitItem } from '../services/recommendOutfits';
import { newOutfitSession, outfitStorageKey, restoreOutfitSession } from '../services/outfitSession';

export function useOutfit(baseProductId: string) {
  const [session, setSession] = useState(() => {
    try { return restoreOutfitSession(sessionStorage.getItem(outfitStorageKey(baseProductId)), baseProductId, products); }
    catch { return newOutfitSession(baseProductId); }
  });
  const [inputError, setInputError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    try { sessionStorage.setItem(outfitStorageKey(baseProductId), JSON.stringify(session)); }
    catch { /* Storage may be disabled; this page still works in memory. */ }
  }, [baseProductId, session]);

  const { draft, submitted } = session;
  const dirty = submitted !== null && (parseOutfitBudget(draft.budget) !== submitted.totalBudget
    || draft.occasion !== submitted.occasion || (draft.season || undefined) !== submitted.season);

  function updateDraft(patch: Partial<OutfitDraft>) {
    setSession((s) => ({ ...s, draft: { ...s.draft, ...patch } }));
    setInputError('');
    setNotice('');
  }

  function submit(patch: Partial<OutfitDraft> = {}) {
    const nextDraft = { ...draft, ...patch };
    const totalBudget = parseOutfitBudget(nextDraft.budget);
    if (totalBudget === null) {
      setInputError('총예산을 1원 이상의 정수로 입력해주세요.');
      return;
    }
    const request: OutfitRequest = { baseProductId, totalBudget, occasion: nextDraft.occasion, ...(nextDraft.season ? { season: nextDraft.season } : {}) };
    const result = recommendOutfits(products, request);
    setSession((s) => ({ ...s, draft: nextDraft, submitted: request, result }));
    setInputError('');
    setNotice(result.status === 'success' ? `코디 ${result.outfits.length}개를 추천했어요.` : '조건에 맞는 코디를 구성하지 못했어요. 아래 안내를 확인해주세요.');
  }

  function replace(index: number, slot: OutfitSlot) {
    if (dirty || !submitted || session.result?.status !== 'success') return;
    const outfits = session.result.outfits;
    const outfit = outfits[index];
    if (!outfit) return;
    const replaced = replaceOutfitItem(products, submitted, outfit, slot, outfits.filter((_, i) => i !== index));
    if (replaced.status === 'unavailable') {
      setNotice('이 예산과 조건에서 바꿀 수 있는 다른 상품이 없어요.');
      return;
    }
    setSession((s) => ({ ...s, result: { status: 'success', outfits: outfits.map((o, i) => i === index ? replaced.outfit : o) } }));
    setNotice(`코디 ${index + 1}의 아이템을 바꿨어요. 총금액도 다시 계산했어요.`);
  }

  return { ...session, dirty, inputError, notice, updateDraft, submit, replace };
}
