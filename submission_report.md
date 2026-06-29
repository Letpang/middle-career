# 📄 [1차 결과 제출 보고서] 중장년 커리어 브릿지 (Career Bridge)

---

## 1. 프로젝트 개요

* **프로젝트명:** 중장년 커리어 브릿지 (Career Bridge)
* **목적:** 4060 중장년 세대의 풍부한 경력과 노하우를 사회의 새로운 기회와 연결해 주기 위한 맞춤 교육 및 검증된 일자리 정보 매칭 플랫폼
* **개발 기간:** 2026년 6월 28일 ~ 29일 (1차 프로토타입 구현 완료)

---

## 2. 기술 스택 및 개발 환경

* **Core Library & Framework:** React (v19.0), TypeScript, Vite
* **Styling & Components:** Vanilla CSS (프리미엄 반응형 및 다크 모드 스타일 지원), Lucide React (아이콘 에셋)
* **API & 보안 환경:** `.env` 파일 기반 환경 변수 매핑 (`GOOGLE_API_KEY` 적용), `.gitignore`를 통한 보안 자격 증명 노출 방지
* **버전 관리:** Git & GitHub
* **호스팅 & 인프라:** Cloudflare Pages/Workers

---

## 3. 핵심 기능 설명

| 구분 | 주요 기능 세부 내용 | 구현 특징 |
|:---|:---|:---|
| **홈 (Home)** | • 4060 세대의 새로운 인생 2막을 여는 브랜드 아이덴티티 및 핵심 가치 전달<br>• 핵심 메뉴 탭(교육, 일자리, 프로필) 연결 링크 카드 배치<br>• 실시간 수강 신청 및 채용 현황 대시보드(수치) 노출 | 직관적인 카드형 UI와 부드러운 전환 효과 |
| **맞춤 교육 (Education)** | • 디지털/IT, 행정/경영, 생활/돌봄, 창업/부업 4개 카테고리별 동적 필터링 기능<br>• 실시간 키워드 검색 기능 제공<br>• 국비지원/정부지원 여부 및 비용 구분 표시 | 사용자 입력에 따른 즉각적인 코스 매칭 |
| **일자리 매칭 (Jobs)** | • 정규직, 파트타임, 인턴십, 공공일자리 등 직무 형태별 분류 필터링<br>• 구인 직무의 핵심 태그, 급여 정보, 상세 요건 및 근무지 카드 레이아웃 구성<br>• 1:1 빠른 지원하기 연계 모달 시뮬레이션 | 가독성을 극대화한 일자리 카드 설계 |
| **커리어 프로필 (Profile)** | • 이름, 출생년도, 연락처, 이력 및 자기소개 등의 커리어 기본 정보 폼 구현<br>• 데이터 실시간 '수정/저장' 토글 기능<br>• 작성 정보의 완성도에 따른 '프로필 완성도(%)' 차트 게이지 시각화 | `localStorage` 연동으로 브라우저를 껐다 켜도 데이터가 영구 보존 |

---

## 4. 인프라 및 소스 코드 관리

### 1) GitHub 원격 저장소 연동
* **저장소 주소:** [https://github.com/Letpang/middle-career](https://github.com/Letpang/middle-career)
* **보안 구성:** API 키가 유출되지 않도록 설정 파일(.env)을 깃(Git) 트래킹 대상에서 완전 제외하여 안전하게 커밋 완료.

### 2) Cloudflare를 이용한 실시간 배포
* **배포 사이트 URL:** [https://middle-career-platform.soujinne.workers.dev](https://middle-career-platform.soujinne.workers.dev)
* **배포 구성 및 빌드 설정:**
  * **프레임워크 프리셋:** Vite
  * **빌드 명령어 (Build Command):** `npm run build`
  * **출력 디렉토리 (Output Directory):** `dist`
  * **CI/CD 파이프라인:** GitHub `main` 브랜치에 코드가 push될 때마다 Cloudflare Pages 빌드가 자동 감지되어 1분 이내에 라이브 배포 자동 갱신.

---

## 5. 산출물 (화면 캡처본) 목록

프로젝트 폴더 내 `screenshots/` 디렉토리에 각 기능이 완전히 동작하는 고화질 캡처 이미지를 정리해 두었습니다.

1. **메인 홈 화면:** `screenshots/1_home.png`
2. **맞춤 교육 목록 화면:** `screenshots/2_education.png`
3. **일자리 채용 공고 화면:** `screenshots/3_jobs.png`
4. **커리어 프로필 편집 화면:** `screenshots/4_profile.png`

---
*본 프로젝트는 중장년 세대의 원활한 정보 접근과 사용 편의를 중점으로 직관적이고 현대적으로 설계되었습니다.*
