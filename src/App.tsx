import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { SearchPage } from './pages/SearchPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { ChatPage } from './pages/ChatPage';

/** 화면이 바뀌면 맨 위부터 보이게 (A 코드의 window.scrollTo(0,0)) */
function ScrollToTop() {
  const { pathname, search } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname, search]);
  return null;
}

// 경로는 명세서 §6.3. 랭킹·찜 목록 화면은 아직 없음
export function App() {
  return (
    <div className="phone-shell">
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/product/:id" element={<ProductDetailPage />} />
        <Route path="/ai" element={<ChatPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
