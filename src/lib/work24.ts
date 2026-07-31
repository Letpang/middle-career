// 고용24(work24) 채용정보를 불러오는 공통 함수
//
// 화면(React)에서는 고용24 API를 직접 호출하지 않고, 우리 서버(Worker)가 만들어둔
// /api/jobs 경로로만 요청합니다. 실제 고용24 API 호출과 인증키 관리는
// worker/index.js 에서 처리합니다.

export interface Work24Job {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  type: string;
  education: string;
  career: string;
  postedDate: string;
  closingDate: string;
  url: string;
}

export interface Work24JobsResponse {
  total: number;
  items: Work24Job[];
  error?: string;
}

interface FetchWork24JobsParams {
  display?: number;
  startPage?: number;
  keyword?: string;
}

export async function fetchWork24Jobs(
  params: FetchWork24JobsParams = {},
): Promise<Work24JobsResponse> {
  const search = new URLSearchParams();
  if (params.display) search.set('display', String(params.display));
  if (params.startPage) search.set('startPage', String(params.startPage));
  if (params.keyword) search.set('keyword', params.keyword);

  const res = await fetch(`/api/jobs?${search.toString()}`);

  if (!res.ok) {
    throw new Error(`고용24 데이터를 불러오지 못했습니다 (HTTP ${res.status})`);
  }

  return (await res.json()) as Work24JobsResponse;
}
