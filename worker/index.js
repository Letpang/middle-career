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

// 고용24 API의 region 파라미터는 통계청 법정동코드(시군구 단위)를 씁니다.
// 고양시는 3개 구(덕양/일산동/일산서)로 나뉘어 있어서, 구 코드로 올라온 공고와
// 예전 방식대로 고양시 통합 코드로 올라온 공고가 섞여있을 수 있어 4개 코드를 모두 조회합니다.
const REGION_CODE_MAP = {
  고양: ['41280', '41281', '41285', '41287'],
  파주: ['41480'],
  김포: ['41570'],
};

const GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/jobs') {
      return handleJobs(url, env);
    }

    if (url.pathname === '/api/chat' && request.method === 'POST') {
      return handleChat(request, env);
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
      // 지역코드(통계청 법정동코드)로 직접 조회. 고양은 4개 코드(41280/41281/41285/41287)를
      // 전부 병렬로 호출해서 합치고, 코드당 여러 페이지를 이어서 가져와 "전부" 다 모읍니다.
      // (직종별로 묶어서 보여줘야 하므로 30건으로 자르지 않습니다.)
      const regionCodes = REGION_CODE_MAP[regionKeyword] || [];
      const regionDebug = [];

      const responses = await Promise.all(
        regionCodes.map(async (code) => {
          try {
            // 상한을 두지 않고 실제 등록된 공고를 끝까지 다 가져옵니다.
            const items = await fetchAllJobsForRegionCode(authKey, code);
            return { code, items };
          } catch (err) {
            return { code, items: [], fetchError: String(err) };
          }
        }),
      );

      const seen = new Set();
      const matched = [];
      for (const { code, items, fetchError } of responses) {
        regionDebug.push(
          fetchError ? { code, count: 0, error: fetchError } : { code, count: items.length },
        );
        for (const job of items) {
          if (seen.has(job.id)) continue;
          seen.add(job.id);
          matched.push(job);
        }
      }

      const body = { total: matched.length, items: matched };
      // ?debug=1 을 붙이면 코드별로 몇 건씩 나왔는지 볼 수 있습니다 (원인 확인용).
      if (debug) body._regionDebug = regionDebug;

      return jsonResponse(body, 200, { 'Cache-Control': 'public, max-age=20' });
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

async function fetchWork24Raw(authKey, { startPage, display, keyword, region }) {
  const apiUrl = new URL(WORK24_LIST_URL);
  apiUrl.searchParams.set('authKey', authKey);
  apiUrl.searchParams.set('callTp', 'L');
  apiUrl.searchParams.set('returnType', 'XML');
  apiUrl.searchParams.set('startPage', String(startPage));
  apiUrl.searchParams.set('display', String(display));
  if (keyword) apiUrl.searchParams.set('keyword', keyword);
  if (region) apiUrl.searchParams.set('region', region);

  const upstream = await fetch(apiUrl.toString(), {
    headers: { Accept: 'application/xml, text/xml' },
  });
  const text = await upstream.text();

  if (!upstream.ok) {
    throw new Error(`고용24 API 응답 오류 (HTTP ${upstream.status})`);
  }

  return text;
}

// 지역코드 하나에 대해, 여러 페이지(100건씩)를 이어서 호출해 등록된 공고를
// 상한 없이 끝까지 다 가져옵니다. (무한루프 방지용 하드 안전장치만 둡니다)
async function fetchAllJobsForRegionCode(authKey, code) {
  const perPage = 100;
  const HARD_SAFETY_LIMIT = 5000; // API가 이상 동작할 때의 최후 안전장치일 뿐, 평소엔 걸릴 일 없음
  let page = 1;
  const collected = [];

  while (collected.length < HARD_SAFETY_LIMIT) {
    const rawText = await fetchWork24Raw(authKey, { startPage: page, display: perPage, region: code });
    const parsed = parseWork24Jobs(rawText);
    if (parsed.error || parsed.items.length === 0) break;

    collected.push(...parsed.items);

    const total = Number(parsed.total) || Infinity;
    if (parsed.items.length < perPage) break; // 마지막 페이지
    if (collected.length >= total) break; // 전체 다 가져옴
    page++;
  }

  return collected;
}

// ---------------------------------------------------------------------------
// AI 질문창 (Gemini API 중계)
//
// 화면에서 GOOGLE_API_KEY를 직접 쓰면 키가 노출되니, 여기서도 work24와 같은
// 방식으로 중계합니다. 인증키는 로컬에서는 .dev.vars, 배포 후에는
// `npx wrangler secret put GOOGLE_API_KEY` 로 등록한 값을 사용합니다.
// ---------------------------------------------------------------------------

const CHAT_SYSTEM_INSTRUCTION = `당신은 "커리어 브릿지(Career Bridge)"라는, 4060 중장년 세대의 재취업과 인생 2막을 돕는 웹사이트의 AI 안내 도우미입니다.
이 사이트에는 홈, 일자리(고용24 실시간 채용정보), 교육, 지역(고양/파주 중장년내일센터 안내), 1:1 상담지원, 프로필 메뉴가 있습니다.
사용자는 대부분 컴퓨터나 인터넷 사용이 익숙하지 않은 중장년층입니다. 항상 정중한 존댓말을 쓰고, 어려운 IT 용어나 전문 용어는 피하고, 문장을 짧고 쉽게 답변하세요.
답변은 3~5문장 이내로 간결하게 하고, 필요하면 사이트의 어느 메뉴로 가면 되는지 안내해 주세요 (예: "일자리 메뉴에서 확인하실 수 있어요").
이력서 작성, 면접 준비, 재취업 관련 일반적인 조언도 친절하게 해주셔도 됩니다.
의료, 법률, 재정에 대한 전문적인 판단이 필요한 질문에는 전문가(상담사, 변호사, 세무사 등)와 상의하시라고 안내하세요.`;

async function handleChat(request, env) {
  const apiKey = env.GOOGLE_API_KEY;

  if (!apiKey) {
    return jsonResponse(
      { error: 'GOOGLE_API_KEY가 설정되어 있지 않습니다. (.dev.vars 또는 wrangler secret 확인 필요)' },
      500,
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: '요청 형식이 올바르지 않습니다.' }, 400);
  }

  const message = typeof body.message === 'string' ? body.message.trim() : '';
  const history = Array.isArray(body.history) ? body.history : [];

  if (!message) {
    return jsonResponse({ error: '메시지를 입력해 주세요.' }, 400);
  }

  // history: [{ role: 'user' | 'assistant', text: '...' }, ...] (최근 대화 몇 개만 프론트에서 보내줌)
  const contents = [
    ...history
      .filter((h) => h && typeof h.text === 'string' && h.text.trim())
      .map((h) => ({
        role: h.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: h.text }],
      })),
    { role: 'user', parts: [{ text: message }] },
  ];

  try {
    const geminiUrl = new URL(GEMINI_URL);
    geminiUrl.searchParams.set('key', apiKey);

    const upstream = await fetch(geminiUrl.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: CHAT_SYSTEM_INSTRUCTION }] },
        contents,
        generationConfig: { temperature: 0.6, maxOutputTokens: 400 },
      }),
    });

    const data = await upstream.json();

    if (!upstream.ok) {
      const detail = data?.error?.message || `HTTP ${upstream.status}`;
      return jsonResponse({ error: `AI 응답 중 오류가 발생했습니다. (${detail})` }, 502);
    }

    const reply = data?.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') || '';

    if (!reply) {
      return jsonResponse({ error: 'AI가 답변을 생성하지 못했습니다. 다시 시도해 주세요.' }, 502);
    }

    return jsonResponse({ reply: reply.trim() });
  } catch (err) {
    return jsonResponse({ error: 'AI 서버 호출 중 오류가 발생했습니다.', detail: String(err) }, 502);
  }
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
