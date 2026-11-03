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

## 이 상품으로 코디하기

무시니(`/ai`)가 추천한 상품의 「이 상품으로 코디하기」 또는 상품 상세의 같은 버튼으로 시작한다. `/outfit?product=3054928`처럼 상품 ID로 직접 열 수도 있다.

- 기준 상품을 고정하고 총예산·착용 상황·계절에 맞춰 최대 3개의 코디를 추천한다.
- 상의·하의·신발 기준은 3개, 아우터 기준은 안에 입을 상의를 포함해 4개로 구성한다.
- 총예산에는 기준 상품 가격도 포함한다. 예산이 부족하면 실제로 구성 가능한 최소 총액을 제안한다.
- 「다른 상품으로 바꾸기」는 해당 코디의 한 아이템만 교체한다. 예산·계절과 다른 코디의 중복 여부를 다시 검사한다.
- 입력 조건과 추천에 적용한 조건을 구분하며, 상품 상세에서 돌아오거나 새로고침해도 같은 탭의 상태를 복원한다.
- 기존 45개 샘플과 태그를 활용한 규칙 기반 데모다. 외부 AI API·실시간 재고·실제 구매·가상 피팅은 포함하지 않는다.

`npm test`로 기존 대화와 새 코디 로직을 검증하고, `npm run build`로 TypeScript 검사와 배포용 빌드를 확인한다. 코디 화면은 `src/pages/OutfitPage.tsx`, 추천·교체는 `src/services/recommendOutfits.ts`, 저장 상태 검증은 `src/services/outfitSession.ts`에 있다.

## 파일 구조

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
