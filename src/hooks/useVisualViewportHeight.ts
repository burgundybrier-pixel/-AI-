import { useEffect } from 'react';

/**
 * 모바일 키보드가 올라오면 실제로 보이는 높이(visualViewport)가 줄어든다.
 * 그 높이를 CSS 변수 --vvh로 넘겨서, 챗봇 화면이 키보드 위에 딱 맞게 줄어들도록 한다.
 * (100vh·100dvh만 쓰면 iOS에서 입력창이 키보드에 가려진다)
 */
export function useVisualViewportHeight() {
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => document.documentElement.style.setProperty('--vvh', `${vv.height}px`);
    update();
    vv.addEventListener('resize', update);
    return () => {
      vv.removeEventListener('resize', update);
      document.documentElement.style.removeProperty('--vvh');
    };
  }, []);
}
