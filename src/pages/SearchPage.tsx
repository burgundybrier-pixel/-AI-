import { useNavigate, useSearchParams } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { BottomNav } from '../components/layout/BottomNav';
import { Icon } from '../components/common/Icon';
import { ProductCard } from '../components/product/ProductCard';
import { MusiniCard } from '../components/product/MusiniCard';
import { products } from '../data/products';
import { keywordSearch } from '../services/keywordSearch';

// A 화면의 고정 문구 (데모용)
const RECENT_KEYWORDS = ['하이넥 니트 가디건', '맨투맨 겨울', '해링턴자켓'];
const RECENT_BRANDS = ['무신사 스탠다드', '티와이', '배스앤바디웍스'];
const POPULAR_KEYWORDS = ['경량패딩', '후리스', '패딩', '니트', '후드티', '무신사 스탠다드', '후드집업', '맨투맨', '바지', '스파오 경량패딩'];

/** /search: 검색어 입력 전 화면. /search?q=…: 검색 결과 (A의 search·results 화면) */
export function SearchPage() {
  const [params] = useSearchParams();
  const q = params.get('q')?.trim() ?? '';
  // 검색어가 바뀌면 입력칸을 새 값으로 다시 만든다
  return q ? <SearchResults key={q} q={q} /> : <SearchHome />;
}

function SearchHome() {
  const navigate = useNavigate();
  const search = (word: string) => navigate(`/search?q=${encodeURIComponent(word)}`);

  return (
    <>
      <Header back editable query="" />
      <main className="search-page">
        <section>
          <h2>최근 검색어 <button>모두삭제</button></h2>
          <div className="chips">{RECENT_KEYWORDS.map((w) => <span key={w} onClick={() => search(w)}>{w} ×</span>)}</div>
        </section>
        <section>
          <h2>최근 방문한 브랜드 <button>모두삭제</button></h2>
          <div className="chips brands">{RECENT_BRANDS.map((w) => <span key={w}>{w} ×</span>)}</div>
        </section>
        <section className="ranking">
          <h2>인기 검색어 <small>10.27 19:20, 남성 기준</small><button>더보기</button></h2>
          <ol>{POPULAR_KEYWORDS.map((w) => <li key={w} onClick={() => search(w)}>{w}</li>)}</ol>
        </section>
        <MusiniCard />
      </main>
    </>
  );
}

function SearchResults({ q }: { q: string }) {
  const results = keywordSearch(products, q);

  return (
    <>
      <Header back editable query={q} />
      <div className="result-tabs"><b>상품</b><span>브랜드</span><span>스냅/코디</span><span>콘텐츠</span><span>발매</span></div>
      <main className="results">
        <h2>새 상품 <b>{results.length.toLocaleString('ko-KR')}</b> <small>USED 0</small></h2>
        <div className="filter-row">
          <button><Icon name="sliders" size={20} /> 필터</button><button>남</button><button>여</button><button>추천⌄</button><button>컬러⌄</button>
        </div>
        <div className="count-row"><span>{results.length.toLocaleString('ko-KR')}개</span><b>무신사 추천순⌄</b></div>
        {results.length > 0 ? (
          <section className="grid">{results.map((p) => <ProductCard key={p.id} product={p} />)}</section>
        ) : (
          <div className="empty-result">
            <p><strong>검색 결과가 없습니다.</strong><br />다른 검색어를 입력하거나, 무시니에게 문장으로 물어보세요.</p>
            <MusiniCard query={q} />
          </div>
        )}
      </main>
      <BottomNav active="category" />
    </>
  );
}
