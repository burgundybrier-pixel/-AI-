import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { SearchPage } from './pages/SearchPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { ChatPage } from './pages/ChatPage';
import { RankingPage } from './pages/RankingPage';
import { WishlistPage } from './pages/WishlistPage';

/** 화면이 바뀌면 맨 위부터 보이게 (A 코드의 window.scrollTo(0,0)) */
function ScrollToTop() {
  const { pathname, search } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname, search]);
  return null;
}

// 경로는 명세서 §6.3
export function App() {
  return (
    <div className="phone-shell">
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/product/:id" element={<ProductDetailPage />} />
        <Route path="/ranking" element={<RankingPage />} />
        <Route path="/wishlist" element={<WishlistPage />} />
        <Route path="/ai" element={<ChatPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
