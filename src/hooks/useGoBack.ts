import { useNavigate } from 'react-router-dom';

/** 앱 안에서 이동해 온 경우 브라우저 뒤로가기, 바로 들어온 경우 홈으로 (명세서 F "브라우저 뒤로가기 정상 작동") */
export function useGoBack() {
  const navigate = useNavigate();
  return () => {
    const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0;
    if (idx > 0) navigate(-1);
    else navigate('/');
  };
}
