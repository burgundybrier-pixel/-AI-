import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

// 찜 목록. 모든 화면이 같은 상태를 보고, 새로고침해도 유지된다 (명세서 S06, T11)

const STORAGE_KEY = 'musinsa-demo:wishlist';

interface WishlistValue {
  ids: string[];
  isLiked: (id: string) => boolean;
  toggle: (id: string) => void;
}

const WishlistContext = createContext<WishlistValue | null>(null);

function load(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<string[]>(load);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    } catch {
      // 저장소를 쓸 수 없는 환경(시크릿 창 등)에서는 메모리에만 둔다
    }
  }, [ids]);

  const value: WishlistValue = {
    ids,
    isLiked: (id) => ids.includes(id),
    toggle: (id) => setIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])),
  };

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist는 WishlistProvider 안에서만 쓸 수 있다');
  return ctx;
}
