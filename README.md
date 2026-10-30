# -musinsa AI-
기존 검색창 형태로 상품을 찾는 게 불편해서, 나에게 추천 / 질의응답 해주는 챗봇 필요하다 생각해.

무신사 앱을 참고한 학교 해커톤용 비공식 데모 (React + Vite + TypeScript, 모바일 우선).

배포: https://musinsa-ai-steel.vercel.app (Vercel, PC에서 `npx vercel deploy --prod`로 올림)

## 실행

```bash
npm install
npm run dev
npm test   # 챗봇 로직 시나리오 테스트 (명세서 §10)
```

## 구조

| 경로 | 내용 |
|---|---|
| `plan.md` | 원본 해부 |
| `demo-scenario.md` | 발표 시연 시나리오 |
| `src/pages/` | 홈, 검색(`/search`, `/search?q=`), 랭킹(`/ranking`), 상품 상세(`/product/:id`), 찜 목록(`/wishlist`), AI 챗봇(`/ai`) |
| `src/components/` | 헤더·하단 탭바, 상품 카드, 무시니 카드 |
| `src/types/` | 공유 타입 (`Product`, `SearchConditions`, `ChatMessage` …) |
| `src/data/products.ts` | 샘플 상품 45개 |
| `src/data/synonyms.ts`, `fashionTerms.ts` | 일상 표현 → 검색 조건 사전, 패션 용어 설명 |
| `src/services/` | 챗봇 로직: `parseQuery` → `applyPatch` → `recommendProducts` → `generateResponse`, 묶음은 `chatEngine.respond()` |
| `src/hooks/useChat.tsx`, `src/components/chat/`, `src/pages/ChatPage.tsx` | 챗봇 화면. 대화는 화면을 옮겨도 유지. `/ai?q=문장`, `/ai?product=상품id`로 시작 가능 |
| `src/data/samplePhotos.ts` | 사진 검색 시연용 샘플 사진 3장 |
| `src/styles/style.css` | 화면 디자인 (A) / `app.css`: React로 옮기며 추가한 스타일 |
