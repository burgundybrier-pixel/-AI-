import { useRef, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { OutfitCard } from '../components/outfit/OutfitCard';
import { getProductById } from '../data/products';
import { useOutfit } from '../hooks/useOutfit';
import { getOutfitSlots } from '../services/recommendOutfits';
import type { Occasion, Product, Season } from '../types/product';
import { CATEGORY_LABEL, formatPrice } from '../utils/format';
import { OCCASION_LABEL, SEASON_LABEL } from '../utils/labels';

export function OutfitPage() {
  const [params] = useSearchParams();
  const product = getProductById(params.get('product') ?? '');
  return <div className="outfit-page"><Header back title="이 상품으로 코디하기" />
    {!product ? <main className="outfit-empty"><h2>코디할 상품을 찾을 수 없어요</h2><p>무시니에게 추천받은 상품을 다시 선택해주세요.</p><Link to="/ai">무시니에게 추천받기 →</Link></main>
      : !getOutfitSlots(product.category) ? <main className="outfit-empty"><h2>아직 코디를 지원하지 않는 상품이에요</h2><p>상의·하의·아우터·신발 중 하나를 골라주세요.</p><Link to="/ai">다른 상품 선택하기 →</Link></main>
      : <OutfitBuilder key={product.id} product={product} />}
  </div>;
}

function OutfitBuilder({ product }: { product: Product }) {
  const outfit = useOutfit(product.id);
  const budgetRef = useRef<HTMLInputElement>(null);
  const { draft, result, submitted } = outfit;

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    outfit.submit();
  };

  return <main className="outfit-main">
    <section className="outfit-intro"><span className="outfit-eyebrow">MUSINI STYLING</span><h2>마음에 든 그 옷,<br />함께 입으면 더 좋을 조합.</h2><p>선택한 상품은 그대로, 나머지는 무시니와 골라요.</p></section>

    <section className="outfit-base" aria-label="선택한 기준 상품">
      <Link to={`/product/${product.id}`}><img src={product.imageUrl} alt={product.name} /></Link>
      <div><span className="outfit-lock">선택한 상품 · 고정</span><strong>{product.brand}</strong><p>{product.name}</p><b>{formatPrice(product.price)}</b></div>
    </section>

    <form className="outfit-form" onSubmit={onSubmit} noValidate>
      <div className="outfit-section-title"><h3>어떤 코디를 찾으세요?</h3><span>{product.category === 'outer' ? '아우터 포함 4개 구성' : '상의·하의·신발 3개 구성'}</span></div>
      <label htmlFor="outfit-budget">총예산</label>
      <div className="outfit-budget-input"><input id="outfit-budget" ref={budgetRef} type="text" inputMode="numeric" maxLength={24}
        value={draft.budget} aria-invalid={Boolean(outfit.inputError)} aria-describedby={`outfit-budget-hint${outfit.inputError ? ' outfit-budget-error' : ''}`}
        onChange={(e) => outfit.updateDraft({ budget: e.target.value })} /><span>원</span></div>
      <p id="outfit-budget-hint" className="outfit-hint">선택한 상품 가격을 포함한 전체 코디 예산이에요.</p>
      {outfit.inputError && <p id="outfit-budget-error" className="outfit-error" role="alert">{outfit.inputError}</p>}
      <div className="outfit-presets">{[100000, 150000, 200000].map((amount) => <button key={amount} type="button"
        aria-pressed={Number(draft.budget.replaceAll(',', '')) === amount} onClick={() => outfit.updateDraft({ budget: amount.toLocaleString('ko-KR') })}>{formatPrice(amount)}</button>)}</div>
      <fieldset><legend>착용 상황</legend><div className="outfit-options">{(Object.keys(OCCASION_LABEL) as Occasion[]).map((occasion) => <label key={occasion}>
        <input type="radio" name="occasion" value={occasion} checked={draft.occasion === occasion} onChange={() => outfit.updateDraft({ occasion })} /><span>{OCCASION_LABEL[occasion]}</span>
      </label>)}</div></fieldset>
      <label htmlFor="outfit-season">계절</label>
      <select id="outfit-season" value={draft.season} onChange={(e) => outfit.updateDraft({ season: e.target.value as Season | '' })}>
        <option value="">선택 안 함</option>{(Object.keys(SEASON_LABEL) as Season[]).map((season) => <option key={season} value={season}>{SEASON_LABEL[season]}</option>)}
      </select>
      <button className="outfit-submit" type="submit">✦ 코디 추천받기</button>
    </form>

    <div className="outfit-announcement" role="status" aria-live="polite" aria-atomic="true">{outfit.notice}</div>
    {result && <section className="outfit-results" aria-labelledby="outfit-results-title">
      <div className="outfit-section-title"><h3 id="outfit-results-title">무시니가 골라봤어요</h3>{result.status === 'success' && <span>{result.outfits.length}가지 코디</span>}</div>
      {outfit.dirty && <p className="outfit-stale" role="status">조건이 바뀌었어요. 아래는 이전 조건의 결과예요. 「코디 추천받기」를 다시 눌러주세요.</p>}
      {result.status === 'success' && submitted && <>
        <p className="outfit-result-context">{OCCASION_LABEL[submitted.occasion]} · {submitted.season ? SEASON_LABEL[submitted.season] : '계절 제한 없음'} · 총예산 {formatPrice(submitted.totalBudget)}</p>
        {result.outfits.map((item, index) => <OutfitCard key={index} outfit={item} request={submitted} index={index} stale={outfit.dirty} onReplace={(slot) => outfit.replace(index, slot)} />)}
      </>}
      {result.status === 'empty' && <div className="outfit-empty">
        <h4>{result.reason === 'budget' ? (product.price > (submitted?.totalBudget ?? 0) ? '선택한 상품이 총예산을 초과해요' : '이 예산으로 코디를 완성하기 어려워요')
          : result.reason === 'season' ? '선택한 계절에 맞는 코디가 없어요' : '코디에 필요한 상품이 부족해요'}</h4>
        <p>{result.reason === 'budget' && result.minimumBudget ? `선택한 상품과 나머지 아이템을 합치면 최소 ${formatPrice(result.minimumBudget)}이 필요해요.`
          : result.reason === 'season' ? '선택한 상품과 나머지 아이템이 모두 해당 계절에 맞아야 해요. 계절을 변경하거나 선택을 해제해보세요.'
            : `${result.missingSlots?.map((slot) => CATEGORY_LABEL[slot]).join('·') || '필수 카테고리'} 상품을 준비한 뒤 다시 시도해주세요.`}</p>
        {!outfit.dirty && result.minimumBudget !== undefined && <button type="button" onClick={() => outfit.submit({ budget: result.minimumBudget!.toLocaleString('ko-KR') })}>예산을 {formatPrice(result.minimumBudget)}으로 변경</button>}
        {!outfit.dirty && result.reason === 'season' && <button type="button" onClick={() => outfit.submit({ season: '' })}>계절 선택 해제하고 추천받기</button>}
        {result.reason === 'budget' && <button type="button" className="outfit-text-button" onClick={() => budgetRef.current?.focus()}>예산 직접 수정하기</button>}
      </div>}
      {result.status === 'invalid' && <p role="alert" className="outfit-error">상품이나 예산을 확인한 뒤 다시 추천받아주세요.</p>}
    </section>}
    <p className="outfit-disclaimer">샘플 상품 기준 추천이며 실제 판매가·재고와 다를 수 있어요.</p>
  </main>;
}
