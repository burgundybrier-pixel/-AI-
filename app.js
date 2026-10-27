const assets = './assets/';

const products = [
  { id: 1, brand: 'SUPERSUB', name: '[크롭] 하이넥 버튼 니트 가디건 - 브라운', price: '49,900원', original: '99,000원', discount: '50%', rating: '4.5 (2)', img: assets + 'card-black-field-jacket.png', tag: '아우터 페스티벌' },
  { id: 2, brand: 'ALICE', name: '울 헤어리 하이넥 크롭 니트 가디건 [블랙]', price: '54,890원', original: '76,000원', discount: '28%', rating: '4.9 (9)', img: assets + 'card-black-long-coat.png', tag: '아우터 페스티벌' },
  { id: 3, brand: 'URBAN FORM', name: '라이트 패딩 하이넥 재킷', price: '89,000원', original: '119,000원', discount: '25%', rating: '4.7 (18)', img: assets + 'card-black-short-padded-jacket.png', tag: '겨울 추천' },
  { id: 4, brand: 'FIELD NOTE', name: '후드 필드 파카 - 올리브', price: '119,000원', original: '159,000원', discount: '25%', rating: '4.8 (21)', img: assets + 'card-olive-hooded-parka.png', tag: 'AI 추천' },
];

let screen = 'home';
let activeProduct = products[0];
let liked = new Set();

const icon = (name, size = 25) => {
  const paths = {
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.8-3.8"/>',
    bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/>',
    bag: '<path d="M6 8h12l1 13H5L6 8Z"/><path d="M9 8a3 3 0 0 1 6 0"/>',
    heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.9-8.6a5.5 5.5 0 0 0-.1-7.8Z"/>',
    home: '<path d="m3 11 9-8 9 8v10H3V11Z"/><path d="M9 21v-6h6v6"/>',
    user: '<circle cx="12" cy="7" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    back: '<path d="m15 18-6-6 6-6"/>',
    sliders: '<path d="M4 6h16M4 12h16M4 18h16"/><circle cx="8" cy="6" r="1.7" fill="white"/><circle cx="15" cy="12" r="1.7" fill="white"/><circle cx="10" cy="18" r="1.7" fill="white"/>',
    chevron: '<path d="m9 18 6-6-6-6"/>',
    spark: '<path d="m12 2 1.7 6.3L20 10l-6.3 1.7L12 18l-1.7-6.3L4 10l6.3-1.7L12 2Z"/>',
  };
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths[name]}</svg>`;
};

function header({ back = false, query = '', dark = false } = {}) {
  return `<header class="${dark ? 'top-dark' : 'top-light'}">
    <div class="head-row">
      ${back ? `<button class="icon-btn" onclick="go('home')">${icon('back', 31)}</button>` : `<button class="wordmark" onclick="go('home')">MUSINSA</button>`}
      ${query !== null ? `<button class="search-box" onclick="go('search')"><span>${query || '검색어를 입력하세요'}</span>${icon('search', 29)}</button>` : ''}
      ${!back ? `<div class="head-actions"><button class="icon-btn round">〽</button><button class="icon-btn">${icon('bell')}</button><button class="icon-btn bag">${icon('bag')}<b>8</b></button></div>` : `<button class="icon-btn bag">${icon('bag')}<b>8</b></button>`}
    </div>
  </header>`;
}

function nav(active = 'home') {
  const items = [['category','⌕','카테고리'], ['snap','(S)','스냅'], ['home','home','홈'], ['likes','heart','좋아요'], ['my','user','마이']];
  return `<nav class="bottom-nav">${items.map(([id, i, label]) => `<button class="${active === id ? 'selected' : ''}" onclick="${id === 'home' ? "go('home')" : ''}">${i === '⌕' || i === '(S)' ? `<span class="text-icon">${i}</span>` : icon(i, 31)}<span>${label}</span></button>`).join('')}</nav>`;
}

function productCard(p) {
  const isLiked = liked.has(p.id);
  return `<article class="product-card" onclick="detail(${p.id})"><div class="image-wrap"><img src="${p.img}" alt="${p.name}"><span class="promo">${p.tag}</span><button class="heart ${isLiked ? 'on' : ''}" onclick="event.stopPropagation(); toggleLike(${p.id})">${icon('heart', 27)}</button></div><div class="brand">${p.brand}</div><div class="pname">${p.name}</div><div class="price"><em>${p.discount}</em> ${p.price}</div><div class="rating">★ ${p.rating}</div></article>`;
}

function home() {
  return `${header({ query: '겨울 필수 인기 숏패딩 모음', dark: true })}
  <section class="home-tabs"><b>콘텐츠</b><b class="active">추천</b><b>랭킹</b><b>세일</b><b>발매</b><b class="pink">아우터<br>페스티벌</b></section>
  <button class="hero-banner" onclick="go('results')"><div><strong>아우터 페스티벌</strong><p>최대 80% 할인</p><small>지금이 아우터 구매 타이밍</small></div><img src="${products[2].img}" alt="겨울 아우터"></button>
  <div class="quick-row"><button>무신사 스탠다드</button><button>하츠투하츠 MD</button><button>브랜드위크</button></div>
  <section class="section-title"><h2>무신사 라이브 편성표</h2><button>더보기</button></section>
  <div class="live-row">${products.slice(0,3).map(p => `<img src="${p.img}" alt="${p.name}">`).join('')}</div>
  <button class="ai-float" onclick="alert('AI 쇼핑 도우미 화면은 팀원 B의 챗봇 기능과 연결됩니다.')">✦ AI로 찾아보기</button>${nav()}`;
}

function search() {
  return `${header({ back: true, query: '' })}<main class="search-page"><section><h2>최근 검색어 <button>모두삭제</button></h2><div class="chips"><span>하이넥 니트 가디건 ×</span><span>맨투맨 겨울 ×</span><span>해링턴자켓 ×</span></div></section><section><h2>최근 방문한 브랜드 <button>모두삭제</button></h2><div class="chips brands"><span>무신사 스탠다드 ×</span><span>티와이 ×</span><span>배스앤바디웍스 ×</span></div></section>${rankingList('인기 검색어')}${aiSearchCard()}</main>`;
}
function rankingList(title) {
  const words = ['경량패딩','후리스','패딩','니트','후드티','무신사 스탠다드','후드집업','맨투맨','바지','스파오 경량패딩'];
  return `<section class="ranking"><h2>${title} <small>10.27 19:20, 남성 기준</small><button>더보기</button></h2><ol>${words.map(x => `<li>${x}</li>`).join('')}</ol></section>`;
}
function aiSearchCard() {
  return `<section class="musini-card"><img src="./assets/musini.png" alt="무시니 AI 쇼핑 도우미"><div class="musini-copy"><strong>무시니에게 물어보세요</strong><span>원하는 스타일을 자연어로 찾아드려요</span><button onclick="openAiSearch()">${icon('spark', 18)} AI에게 자연어로 찾기 ${icon('chevron', 17)}</button></div></section>`;
}

function results() { return `${header({ back: true, query: '하이넥 니트 가디건' })}<div class="result-tabs"><b>상품</b><span>브랜드</span><span>스냅/코디</span><span>콘텐츠</span><span>발매</span></div><main class="results"><h2>새 상품 <b>1,255</b> <small>USED 55</small></h2><div class="filter-row"><button>${icon('sliders',20)} 필터</button><button>남</button><button>여</button><button>추천⌄</button><button>컬러⌄</button></div><div class="count-row"><span>1,255개</span><b>무신사 추천순⌄</b></div><section class="grid">${products.map(productCard).join('')}</section></main>${nav('category')}`; }

function detailScreen() { const p = activeProduct; return `${header({ back: true, query: null })}<main class="detail"><div class="detail-photo"><img src="${p.img}" alt="${p.name}"><div class="ai-bubble">${icon('spark',18)} AI 추천 <small>비슷한 상품</small></div><span>1 / 7 ⛶</span></div><section class="info"><div class="detail-brand">${p.brand}<button>♡ 14만</button></div><div class="crumb">아우터 〉 가디건 (${p.brand})</div><h1>${p.name}</h1><span class="tag">아우터 페스티벌</span><p class="score">★ <b>4.5</b> 후기 2개</p><div class="swatches"><img src="${p.img}"><img src="${products[1].img}"></div><div class="price-detail"><del>${p.original}</del><strong><em>${p.discount}</em> ${p.price}</strong></div></section></main><div class="purchase"><button class="like-main" onclick="toggleLike(${p.id})">${liked.has(p.id) ? '♥' : '♡'}<small>239</small></button><button>구매하기</button></div>`; }

function go(next) { screen = next; render(); window.scrollTo(0,0); }
function detail(id) { activeProduct = products.find(p => p.id === id); screen = 'detail'; render(); window.scrollTo(0,0); }
function toggleLike(id) { liked.has(id) ? liked.delete(id) : liked.add(id); render(); }
function openAiSearch() { alert('AI 쇼핑 도우미로 이동합니다.\n팀원 B의 챗봇 화면이 연결되면 /ai 경로로 바로 전환하면 됩니다.'); }
function render() { document.getElementById('app').innerHTML = screen === 'home' ? home() : screen === 'search' ? search() : screen === 'results' ? results() : detailScreen(); }
render();
