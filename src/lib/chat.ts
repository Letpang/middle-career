// Gemini 기반 AI 질문창을 위한 공통 함수
//
// 화면(React)에서는 Gemini API를 직접 호출하지 않고, 우리 서버(Worker)가 만들어둔
// /api/chat 경로로만 요청합니다. 실제 Gemini API 호출과 인증키 관리는
// worker/index.js 에서 처리합니다.

export interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
}

interface ChatApiResponse {
  reply?: string;
  error?: string;
}

export async function sendChatMessage(
  message: string,
  history: ChatMessage[],
): Promise<ChatApiResponse> {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history }),
  });

  const data = (await res.json()) as ChatApiResponse;

  if (!res.ok && !data.error) {
    return { error: `AI 질문창 호출에 실패했습니다 (HTTP ${res.status})` };
  }

  return data;
}
