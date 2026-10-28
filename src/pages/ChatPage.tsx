import { Header } from '../components/layout/Header';

/** AI 챗봇 화면 (S05). B가 이어서 구현할 자리 — 지금은 진입 경로 연결 확인용 */
export function ChatPage() {
  return (
    <>
      <Header back query={null} />
      <main className="chat-stub">
        <strong>무시니 AI 쇼핑 도우미</strong>
        <p>챗봇 화면을 준비하고 있어요.</p>
      </main>
    </>
  );
}
