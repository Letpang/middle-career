// 채용 공고 제목을 보고 중장년층이 이해하기 쉬운 "직종" 단위로 묶어주는 함수입니다.
// 고용24 API가 표준화된 직종 분류값을 안정적으로 안 주는 경우가 있어서,
// 제목(title)에 자주 등장하는 단어를 기준으로 분류합니다.

export interface CategoryRule {
  name: string;
  keywords: string[];
}

// 우선순위 순서대로 검사합니다 (위에 있을수록 먼저 매칭).
const CATEGORY_RULES: CategoryRule[] = [
  { name: '요양보호사·간병·간호', keywords: ['요양보호사', '요양', '간병', '간호조무사', '간호사', '재가복지', '주간보호'] },
  { name: '경비·시설관리', keywords: ['경비', '시설관리', '보안', '방재', '전기안전', '설비'] },
  { name: '주택관리(관리소장)', keywords: ['관리소장', '주택관리', '아파트관리', '건물관리'] },
  { name: '청소·미화', keywords: ['청소', '미화원', '미화'] },
  { name: '조리·주방', keywords: ['조리', '주방', '식당', '급식', '조리사', '조리원'] },
  { name: '운전·배송', keywords: ['운전', '배송', '택배', '기사', '대리운전', '퀵서비스'] },
  { name: '사무·행정', keywords: ['사무', '행정', '경리', '총무', '회계', '비서', '접수'] },
  { name: '생산·제조', keywords: ['생산직', '제조', '조립', '포장', '검사원', '공정'] },
  { name: '판매·영업', keywords: ['판매', '매장', '영업', '캐셔', '카운터'] },
  { name: '교육·강사', keywords: ['강사', '교사', '방과후', '학원'] },
  { name: '상담·고객서비스', keywords: ['상담', '콜센터', '텔레마케터', 'CS'] },
];

const FALLBACK_CATEGORY = '기타';

export function classifyJobTitle(title: string): string {
  const normalized = (title || '').replace(/\s/g, '');
  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.some((kw) => normalized.includes(kw.replace(/\s/g, '')))) {
      return rule.name;
    }
  }
  return FALLBACK_CATEGORY;
}

export interface JobCategoryCount {
  name: string;
  count: number;
}

export function groupJobsByCategory<T extends { title: string }>(jobs: T[]): JobCategoryCount[] {
  const counts = new Map<string, number>();
  for (const job of jobs) {
    const category = classifyJobTitle(job.title);
    counts.set(category, (counts.get(category) || 0) + 1);
  }

  const entries = Array.from(counts.entries()).map(([name, count]) => ({ name, count }));

  // 기타는 항상 맨 뒤로, 나머지는 건수 많은 순
  entries.sort((a, b) => {
    if (a.name === FALLBACK_CATEGORY) return 1;
    if (b.name === FALLBACK_CATEGORY) return -1;
    return b.count - a.count;
  });

  return entries;
}
