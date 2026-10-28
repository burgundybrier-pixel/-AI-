# -musinsa AI-
기존 검색창 형태로 상품을 찾는 게 불편해서, 나에게 추천 / 질의응답 해주는 챗봇 필요하다 생각해.

무신사 앱을 참고한 학교 해커톤용 비공식 데모 (React + Vite + TypeScript, 모바일 우선).

## 실행

```bash
npm install
npm run dev
```

## 구조

| 경로 | 내용 |
|---|---|
| `plan.md` | 원본 해부 |
| `src/pages/` | 홈, 검색(`/search`, `/search?q=`), 상품 상세(`/product/:id`), AI 챗봇(`/ai`) |
| `src/components/` | 헤더·하단 탭바, 상품 카드, 무시니 카드 |
| `src/types/` | 공유 타입 (`Product`, `SearchConditions`, `ChatMessage` …) |
| `src/data/products.ts` | 샘플 상품 45개 |
| `src/styles/style.css` | 화면 디자인 (A) / `app.css`: React로 옮기며 추가한 스타일 |
