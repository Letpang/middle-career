// Cloudflare Worker: 고용24(work24) 채용정보 오픈API 중계 서버
//
// 브라우저(프론트엔드)가 고용24 API를 직접 호출하면 인증키가 그대로 노출되고,
// 고용24 쪽에서 브라우저 요청을 막아버리는 CORS 문제도 생깁니다.
// 그래서 이 Worker가 "중간 다리" 역할을 합니다:
//   화면(React) → 이 Worker(/api/jobs) → 고용24 API → 이 Worker가 가공 → 화면
//
// 인증키(WORK24_API_KEY)는 로컬에서는 .dev.vars 파일, 배포 후에는
// `npx wrangler secret put WORK24_API_KEY` 로 등록한 값을 사용합니다.
// 이 값은 코드에 절대 직접 적지 않습니다.

const WORK24_LIST_URL =
  'https://www.work24.go.kr/cm/openApi/call/wk/callOpenApiSvcInfo210L01.do';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/jobs') {
      return handleJobs(url, env);
    }

    // API 경로가 아니면 평소처럼 빌드된 화면(정적 파일)을 그대로 내려줍니다.
    return env.ASSETS.fetch(request);
  },
};

async function handleJobs(url, env) {
  const authKey = env.WORK24_API_KEY;

  if (!authKey) {
    return jsonResponse(
      {
        error: 'WORK24_API_KEY가 설정되어 있지 않습니다. (.dev.vars 또는 wrangler secret 확인 필요)',
        total: 0,
        items: [],
      },
      500,
    );
  }

  const display = clampNumber(url.searchParams.get('display'), 1, 100, 10);
  const startPage = clampNumber(url.searchParams.get('startPage'), 1, 1000, 1);
  const keyword = url.searchParams.get('keyword') || '';
  // regionKeyword: "고양", "파주" 처럼 지역명으로 좁혀서 보고 싶을 때 사용.
  const regionKeyword = url.searchParams.get('regionKeyword') || '';
  const debug = url.searchParams.get('debug') === '1';

  try {
    if (regionKeyword) {
      // 고용24 API의 keyword 검색은 "채용 제목"만 뒤지기 때문에, 제목에 지역명이
      // 안 들어간 공고(대부분)는 keyword 검색으론 못 찾습니다. 그래서 최신 공고를
      // 여러 페이지(최대 500건) 가져와서, 실제 근무지역(region) 값에 해당 지역명이
      // 들어있는 공고를 직접 찾아내는 방식으로 처리합니다.
      const MAX_PAGES = 5;
      const PAGE_SIZE = 100;
      const matched = [];

      for (let page = 1; page <= MAX_PAGES && matched.length < display; page++) {
        const rawText = await fetchWork24Raw(authKey, { startPage: page, display: PAGE_SIZE });
        const parsed = parseWork24Jobs(rawText);
        if (parsed.error) {
          return jsonResponse({ total: 0, items: [], error: parsed.error }, 200);
        }
        for (const job of parsed.items) {
          if (job.location.includes(regionKeyword)) matched.push(job);
        }
      }

      return jsonResponse(
        { total: matched.length, items: matched.slice(0, display) },
        200,
        { 'Cache-Control': 'public, max-age=20' },
      );
    }

    const rawText = await fetchWork24Raw(authKey, { startPage, display, keyword });

    // 진단용: ?debug=1 을 붙이면 고용24가 실제로 준 원본 XML을 그대로 보여줍니다.
    if (debug) {
      return new Response(rawText, {
        status: 200,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }

    const result = parseWork24Jobs(rawText);
    return jsonResponse(result, 200, { 'Cache-Control': 'public, max-age=20' });
  } catch (err) {
    return jsonResponse(
      { error: '고용24 API 호출 중 오류가 발생했습니다.', detail: String(err), total: 0, items: [] },
      502,
    );
  }
}

async function fetchWork24Raw(authKey, { startPage, display, keyword }) {
  const apiUrl = new URL(WORK24_LIST_URL);
  apiUrl.searchParams.set('authKey', authKey);
  apiUrl.searchParams.set('callTp', 'L');
  apiUrl.searchParams.set('returnType', 'XML');
  apiUrl.searchParams.set('startPage', String(startPage));
  apiUrl.searchParams.set('display', String(display));
  if (keyword) apiUrl.searchParams.set('keyword', keyword);

  const upstream = await fetch(apiUrl.toString(), {
    headers: { Accept: 'application/xml, text/xml' },
  });
  const text = await upstream.text();

  if (!upstream.ok) {
    throw new Error(`고용24 API 응답 오류 (HTTP ${upstream.status})`);
  }

  return text;
}

function clampNumber(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}

function jsonResponse(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      ...extraHeaders,
    },
  });
}

// ---------------------------------------------------------------------------
// 아주 작은 범용 XML 파서
//
// 고용24 채용정보 API는 XML로 응답을 줍니다. 문서 구조(태그 이름)가 정확히
// 확인되지 않은 상태라, 특정 태그 이름에 딱 맞춰 파싱하면 배포 후 실제 응답과
// 달라 화면이 깨질 위험이 있습니다. 그래서 아래 파서는 "어떤 XML이 오든" 일단
// 중첩 객체(JS Object)로 통째로 변환해두고, 그 다음 normalize 단계에서
// 있을 법한 태그 이름 후보들을 순서대로 찾아보는 방식(느슨한 매칭)으로
// 값을 뽑아냅니다.
// ---------------------------------------------------------------------------

function parseXmlToNode(xml) {
  const cleaned = xml.replace(/<\?xml[^>]*\?>/, '').trim();
  let i = 0;

  function skipWhitespace() {
    while (i < cleaned.length && /\s/.test(cleaned[i])) i++;
  }

  function parseNode() {
    skipWhitespace();
    if (cleaned[i] !== '<') return null;
    const openMatch = /^<([a-zA-Z0-9_]+)[^>]*?(\/)?>/.exec(cleaned.slice(i));
    if (!openMatch) return null;
    const tag = openMatch[1];
    const selfClosing = !!openMatch[2];
    i += openMatch[0].length;

    const node = { tag, children: [], text: '' };
    if (selfClosing) return node;

    const closeTag = `</${tag}>`;
    while (i < cleaned.length) {
      if (cleaned.startsWith(closeTag, i)) {
        i += closeTag.length;
        break;
      }
      if (cleaned[i] === '<') {
        if (cleaned.startsWith('<!--', i)) {
          const endComment = cleaned.indexOf('-->', i);
          i = endComment === -1 ? cleaned.length : endComment + 3;
          continue;
        }
        const child = parseNode();
        if (child) node.children.push(child);
        else i++; // 이상한 태그는 건너뜁니다 (안전장치)
      } else {
        const nextLt = cleaned.indexOf('<', i);
        const chunk = nextLt === -1 ? cleaned.slice(i) : cleaned.slice(i, nextLt);
        node.text += chunk;
        i = nextLt === -1 ? cleaned.length : nextLt;
      }
    }
    return node;
  }

  return parseNode();
}

function decodeEntities(str) {
  // 고용24 응답 중 일부는 &(앰퍼샌드)가 두 번 이스케이프되어 "&amp;lt;" 처럼
  // 오는 경우가 있어서, &amp; 를 먼저 풀고 나서 나머지 기호를 풀어야
  // "&lt;부천고강동..." 처럼 안 풀린 채로 남는 걸 방지할 수 있습니다.
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

// 중첩 XML 노드를 { 태그이름: 값 또는 배열 } 형태의 순수 객체로 변환
function nodeToObject(node) {
  if (!node) return null;
  if (node.children.length === 0) {
    return decodeEntities(node.text).trim();
  }
  const obj = {};
  for (const child of node.children) {
    const value = nodeToObject(child);
    if (Object.prototype.hasOwnProperty.call(obj, child.tag)) {
      if (!Array.isArray(obj[child.tag])) obj[child.tag] = [obj[child.tag]];
      obj[child.tag].push(value);
    } else {
      obj[child.tag] = value;
    }
  }
  return obj;
}

// 트리 전체에서 "배열이고, 그 배열의 첫 항목이 sampleKey 라는 필드를 가진" 배열을 찾음
// (채용공고 목록이 어떤 이름의 태그로 감싸여 있든 상관없이 찾아내기 위함)
function findListByShape(obj, sampleKeys) {
  const queue = [obj];
  const visited = new Set();
  while (queue.length) {
    const cur = queue.shift();
    if (!cur || typeof cur !== 'object' || visited.has(cur)) continue;
    visited.add(cur);
    for (const key of Object.keys(cur)) {
      const val = cur[key];
      if (Array.isArray(val) && val.length > 0 && typeof val[0] === 'object') {
        if (sampleKeys.some((k) => k in val[0])) return val;
      }
      if (val && typeof val === 'object') queue.push(val);
    }
  }
  return [];
}

// 트리 전체에서 특정 태그 이름 후보들 중 하나라도 있으면 그 문자열 값을 반환
function findValueByKeys(obj, keys) {
  const queue = [obj];
  const visited = new Set();
  while (queue.length) {
    const cur = queue.shift();
    if (!cur || typeof cur !== 'object' || visited.has(cur)) continue;
    visited.add(cur);
    for (const key of Object.keys(cur)) {
      if (keys.includes(key)) {
        const val = cur[key];
        if (typeof val === 'string' && val !== '') return val;
      }
    }
    for (const key of Object.keys(cur)) {
      const val = cur[key];
      if (val && typeof val === 'object' && !Array.isArray(val)) queue.push(val);
    }
  }
  return '';
}

// "부모 태그 이름에 sectionPattern 이 포함된" 하위 트리 안에서 leafKeys 를 찾음
// (예: company 섹션 안의 name 과 region 섹션 안의 name 을 구분하기 위함)
function findValueUnderSection(obj, sectionPattern, leafKeys) {
  const queue = [obj];
  const visited = new Set();
  while (queue.length) {
    const cur = queue.shift();
    if (!cur || typeof cur !== 'object' || visited.has(cur)) continue;
    visited.add(cur);
    for (const key of Object.keys(cur)) {
      const val = cur[key];
      if (val && typeof val === 'object' && !Array.isArray(val)) {
        if (sectionPattern.test(key)) {
          const found = findValueByKeys(val, leafKeys);
          if (found) return found;
        }
        queue.push(val);
      }
    }
  }
  return '';
}

function normalizeJob(raw, index) {
  const id =
    findValueByKeys(raw, ['wantedAuthNo', 'empSeqno', 'authNo', 'wantSeqno']) || `job-${index}`;
  const title = findValueByKeys(raw, ['title', 'wantedTitle', 'jobTitle']);
  const company =
    findValueUnderSection(raw, /compan|corp|co(?:_|$)/i, ['name', 'coNm']) ||
    findValueByKeys(raw, ['coNm', 'company']);
  const location =
    findValueByKeys(raw, ['region', 'regionNm', 'workRegion', 'basicAddr']) ||
    findValueUnderSection(raw, /region|area|work[_]?place/i, ['name']);
  const salaryType = findValueByKeys(raw, ['salTpNm', 'wageTpNm']);
  const salaryAmount = findValueByKeys(raw, ['sal', 'wage']);
  const education = findValueByKeys(raw, ['minEdubg', 'minEdubgNm']);
  const career = findValueByKeys(raw, ['career', 'careerNm']);
  const employmentType = findValueByKeys(raw, ['holidayTpNm', 'empTpNm', 'empGbNm']);
  const regDt = findValueByKeys(raw, ['regDt', 'regDate']);
  const closeDt = findValueByKeys(raw, ['closeDt', 'closeDate']);
  const infoUrl = findValueByKeys(raw, ['wantedInfoUrl', 'infoUrl']);

  const salary = [salaryType, salaryAmount].filter(Boolean).join(' ') || '급여 정보 미제공';

  return {
    id: String(id),
    title: title || '(제목 정보 없음)',
    company: company || '기업명 비공개',
    location: location || '지역 정보 미제공',
    salary,
    type: employmentType || '고용형태 미제공',
    education: education || '',
    career: career || '경력무관',
    postedDate: regDt || '',
    closingDate: closeDt || '',
    url: infoUrl || '',
  };
}

function parseWork24Jobs(xmlText) {
  const root = nodeToObject(parseXmlToNode(xmlText));

  if (!root) {
    return { total: 0, items: [], error: '고용24 응답을 해석할 수 없습니다.' };
  }

  // 고용24가 에러를 XML로 내려주는 경우 (인증키 오류 등) 최대한 메시지를 찾아본다
  const errMsg = findValueByKeys(root, ['resultMsg', 'errMsg', 'message', 'returnReasonCode']);
  const items = findListByShape(root, ['wantedAuthNo', 'title', 'empSeqno']);

  if (items.length === 0 && errMsg) {
    return { total: 0, items: [], error: errMsg };
  }

  const totalRaw = findValueByKeys(root, ['total', 'scn_cnt', 'totalCount', 'count']);
  const total = Number(totalRaw) || items.length;

  return {
    total,
    items: items.map((item, idx) => normalizeJob(item, idx)),
  };
}
