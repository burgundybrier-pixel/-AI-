import { useSearchParams } from 'react-router-dom';
import type { Category, StyleTag } from '../types/product';
import { Header } from '../components/layout/Header';
import { HomeTabs } from '../components/layout/HomeTabs';
import { BottomNav } from '../components/layout/BottomNav';
import { ProductCard } from '../components/product/ProductCard';
import { products } from '../data/products';
import { rankProducts, type RankingSort } from '../services/rankProducts';
import { STYLE_LABEL } from '../utils/labels';

const CATEGORY_TABS: [Category | undefined, string][] = [
  [undefined, '전체'], ['outer', '아우터'], ['top', '상의'], ['bottom', '바지'], ['shoes', '신발'],
];
// 원본 무신사 랭킹의 스타일 탭 (plan.md 4-2: 원본은 스타일을 랭킹에서만 고를 수 있음)
const STYLE_TABS: StyleTag[] = ['street', 'minimal', 'casual', 'vintage', 'preppy', 'sporty'];

/** /ranking (명세서 S03). 필터는 주소에 남겨서 상세에 갔다 와도 그대로 */
export function RankingPage() {
  const [params, setParams] = useSearchParams();
  const category = (params.get('category') as Category | null) ?? undefined;
  const style = (params.get('style') as StyleTag | null) ?? undefined;
  const sort: RankingSort = params.get('sort') === 'lowPrice' ? 'lowPrice' : 'popular';
  const list = rankProducts(products, { category, style, sort });

  const update = (key: string, value?: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  return (
    <>
      <Header dark query="랭킹에서 인기 상품 찾기" />
      <HomeTabs active="ranking" />
      <div className="result-tabs ranking-tabs">
        {CATEGORY_TABS.map(([value, label]) => (
          value === category
            ? <b key={label}>{label}</b>
            : <span key={label} onClick={() => update('category', value)}>{label}</span>
        ))}
      </div>
      <main className="results">
        <div className="filter-row style-row">
          <button className={!style ? 'on' : ''} onClick={() => update('style')}>전체 스타일</button>
          {STYLE_TABS.map((s) => (
            <button key={s} className={style === s ? 'on' : ''} onClick={() => update('style', style === s ? undefined : s)}>
              {STYLE_LABEL[s]}
            </button>
          ))}
        </div>
        <div className="count-row">
          <span>{list.length}개 · 데모 인기도 기준</span>
          <b className="sort-toggle">
            <button className={sort === 'popular' ? 'on' : ''} onClick={() => update('sort')}>인기순</button>
            <button className={sort === 'lowPrice' ? 'on' : ''} onClick={() => update('sort', 'lowPrice')}>낮은 가격순</button>
          </b>
        </div>
        <section className="grid">
          {list.map((p, i) => <ProductCard key={p.id} product={p} rank={i + 1} />)}
        </section>
      </main>
      <BottomNav />
    </>
  );
}
