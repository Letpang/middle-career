// 학습조직 논의 및 중장년 전문 상담 선생님 검토를 거쳐 확정된
// 외부 참고 사이트 리스트입니다. (워크넷/고용24 외에 현장에서 실제로 참고되는 사이트들)
// 정식 오픈API가 없는 사이트들이라, 실시간 데이터 연동이 아닌
// "바로가기 링크" 형태로 안내합니다.

export interface ExternalSite {
  name: string;
  url: string;
  desc: string;
}

export interface ExternalSiteGroup {
  category: string;
  sites: ExternalSite[];
}

// 중장년 특화 채용사이트
export const JOB_REFERENCE_SITES: ExternalSiteGroup[] = [
  {
    category: '종합 중장년·시니어 채용',
    sites: [
      { name: '원더풀시니어', url: 'https://senior.saramin.co.kr/', desc: '사람인 중장년 전용 채용관' },
      { name: '서울시 50+포털', url: 'https://50plus.or.kr/', desc: '서울시 시니어일자리지원센터 채용정보' },
      { name: '알바몬 중장년관', url: 'https://www.albamon.com/jobs/senior', desc: '40~60대 우대 일자리' },
    ],
  },
  {
    category: '요양보호사·간병·간호',
    sites: [
      { name: '너스잡', url: 'https://www.nursejob.co.kr/', desc: '간호사·간호조무사·요양보호사 전문' },
      { name: '케어파트너', url: 'https://www.carepartner.kr/jobs', desc: '방문·입주·시설요양 채용' },
      { name: '엔젤시터', url: 'https://angelsitter.co.kr/', desc: '요양보호사·사회복지사 구인구직' },
      { name: '요양나라', url: 'https://www.yoyangnara.com/', desc: '요양보호사 구인구직' },
      { name: '한국요양보호협회', url: 'http://www.silvercare.org/job/recruit.asp', desc: '협회 자체 구인 게시판' },
      { name: '복지넷', url: 'https://www.bokji.net/job/off/01.bokji', desc: '한국사회복지협의회 운영' },
    ],
  },
  {
    category: '주택관리(관리소장)',
    sites: [
      { name: '대한주택관리사협회', url: 'https://www.khma.org/', desc: '전국 공동주택 관리소장 구인' },
      { name: '한국주택관리협회', url: 'https://www.kabma.or.kr/', desc: '주택관리 분야 구인 게시판' },
    ],
  },
  {
    category: '경비·시설관리',
    sites: [
      { name: '한국경비협회', url: 'https://www.ksan.or.kr/comm/job.do', desc: '경비업 구인정보' },
      { name: '대한민국경비협회', url: 'https://www.roksa.or.kr/', desc: '경비업 구인·구직 정보' },
      { name: '시설잡', url: 'https://sisuljob.kr/', desc: '시설관리 전문 구인구직' },
    ],
  },
];

// 지역별(고양·파주·김포) 교육 참고 사이트
export const EDUCATION_REFERENCE_SITES: ExternalSiteGroup[] = [
  {
    category: '고양시',
    sites: [
      { name: '고양시 평생학습포털', url: 'https://www.goyang.go.kr/edu/index.do', desc: '평생학습 강좌 안내 및 신청' },
      { name: '고양시 신중년대학', url: 'https://www.goyang.go.kr/edu/M000050/S001/conts.do', desc: '50~65세 대상, 관내 대학 연계 특화과정' },
      { name: '국제대학교 평생교육원', url: 'https://dept.kookje.ac.kr/lifelong/', desc: '고양시 소재 대학 평생교육원' },
      { name: '고양여성인력개발센터(새일센터)', url: 'https://www.kycenter.or.kr/', desc: '경력단절 여성 재취업 상담·훈련·인턴십' },
    ],
  },
  {
    category: '파주시',
    sites: [
      { name: '파주시 평생교육포털', url: 'https://lll.paju.go.kr/', desc: '평생학습관 강좌 일정 및 신청' },
      { name: '두원공과대학교 파주캠퍼스 평생교육원', url: 'https://www.doowon.ac.kr/', desc: '파주 소재 대학 평생교육원 (031-935-7114)' },
      { name: '파주새일센터', url: 'https://saeil.mogef.go.kr/', desc: '여성새로일하기센터, 재취업 상담·훈련 (031-942-0281)' },
    ],
  },
  {
    category: '김포시',
    sites: [
      { name: '김포시 평생교육 통합 플랫폼', url: 'https://gimpo.gseek.kr/', desc: '취업·창업자격증 등 62개 정규강좌' },
      { name: '김포대학교 평생교육원', url: 'https://cec.ukp.ac.kr/', desc: '대학 연계 평생교육 프로그램' },
      { name: '김포새일센터', url: 'https://gimpo.go.kr/portal/contents.do?key=1274', desc: '여성새로일하기센터, 재취업 상담·훈련 (031-996-7607)' },
    ],
  },
];
