// ============================================================
// @mcp-kr/registry — 한국 특화 MCP 서버 메타데이터 레지스트리
// 모든 앱(web, api)과 서버가 공유하는 단일 진실 공급원(SSoT)
// ============================================================

export type SecurityCert = 'ISMS-P' | 'ISO27001' | 'CC인증' | 'CSAP';
export type PricingModel = 'free' | 'freemium' | 'paid' | 'enterprise';
export type Category =
  | '국내서비스'
  | 'ERP·회계'
  | '금융·세금'
  | '법규·규정'
  | '한국어AI'
  | '공공데이터'
  | '커머스'
  | '보안';

export interface MCPTool {
  name: string;
  description: string;
}

export interface MCPEnvVar {
  key: string;           // 실제 환경 변수명 (예: SMARTSTORE_CLIENT_ID)
  description: string;   // 사용자에게 보여줄 설명
  required: boolean;
  docsUrl?: string;      // 발급 방법 링크
}

export interface MCPServerMeta {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  longDescription: string;
  category: Category;
  tags: string[];
  author: string;
  authorVerified: boolean;
  version: string;
  stars: number;
  installs: number;
  pricing: PricingModel;
  priceKRW?: number;
  certs: SecurityCert[];
  apiDocs: string;
  githubUrl?: string;
  npmPackage?: string;     // npx 설치 패키지명
  envVars?: MCPEnvVar[];   // 서버별 필수/선택 환경 변수
  featured: boolean;
  publishedAt: string;     // YYYY-MM-DD (최초 게시일)
  updatedAt: string;       // YYYY-MM-DD
  likes: number;           // 누적 좋아요 수 (seed 초기값)
  tools: MCPTool[];
  isSeed?: boolean;        // 플랫폼 직접 제작 시드 서버
}

// ─── 레지스트리 전체 목록 ─────────────────────────────────────
export const REGISTRY: MCPServerMeta[] = [

  /* ── 공공데이터 ─────────────────────────────────────────── */
  {
    id: 'publicdata-mcp',
    name: '공공데이터포털 MCP',
    nameEn: 'Korean Public Data Portal MCP',
    description: '기상청 날씨·버스·지하철·아파트실거래가·인구통계를 Claude에서 조회합니다.',
    longDescription: '행정안전부 공공데이터포털 핵심 5개 API 통합. 기상청 단기예보(격자좌표), 국토부 버스도착(도시코드+정류소ID), 서울시 지하철 실시간, 아파트 실거래가(법정동코드), 주민등록 인구통계를 지원합니다.',
    category: '공공데이터',
    tags: ['기상청', '버스도착', '지하철실시간', '아파트실거래가', '인구통계'],
    author: '행정안전부 공공데이터포털',
    authorVerified: true,
    version: '1.0.0',
    stars: 3412,
    installs: 22900,
    pricing: 'free',
    certs: ['CC인증'],
    apiDocs: 'https://www.data.go.kr',
    npmPackage: '@mcp-kr/publicdata-mcp',
    envVars: [
      { key: 'PUBLIC_DATA_API_KEY', description: '공공데이터포털 서비스 인증키', required: true, docsUrl: 'https://www.data.go.kr' },
    ],
    featured: true,
    publishedAt: '2025-11-10',
    updatedAt: '2026-06-07',
    likes: 1842,
    isSeed: true,
    tools: [
      { name: 'get_weather',            description: '기상청 단기예보' },
      { name: 'get_bus_arrival',        description: '버스 실시간 도착 정보' },
      { name: 'get_subway_info',        description: '지하철 실시간 열차 위치' },
      { name: 'get_real_estate_price',  description: '아파트 매매 실거래가' },
      { name: 'get_population_stats',   description: '주민등록 인구통계' },
    ],
  },
  {
    id: 'g2b-mcp',
    name: '나라장터(G2B) MCP',
    nameEn: 'Korea G2B Procurement MCP',
    description: '조달청 나라장터 입찰공고·낙찰·계약·사전규격·업체정보를 Claude에서 조회합니다.',
    longDescription: '조달청 국가종합전자조달시스템 5개 Open API 통합. 물품/용역/공사 입찰공고 검색(현재 3,500건+), 낙찰정보, 계약현황, 사전규격, 등록 업체 조회를 지원합니다.',
    category: '공공데이터',
    tags: ['나라장터', '입찰공고', '낙찰정보', '계약정보', '조달청'],
    author: '조달청',
    authorVerified: true,
    version: '1.0.0',
    stars: 1876,
    installs: 8400,
    pricing: 'free',
    certs: ['ISMS-P', 'CC인증'],
    apiDocs: 'https://www.g2b.go.kr',
    npmPackage: '@mcp-kr/g2b-mcp',
    envVars: [
      { key: 'G2B_API_KEY', description: '나라장터 Open API 인증키', required: true, docsUrl: 'https://www.g2b.go.kr' },
    ],
    featured: true,
    publishedAt: '2025-12-01',
    updatedAt: '2026-06-07',
    likes: 934,
    isSeed: true,
    tools: [
      { name: 'search_bid_announcements', description: '입찰공고 검색' },
      { name: 'get_bid_award_info',       description: '낙찰정보 조회' },
      { name: 'get_contract_info',        description: '계약현황 조회' },
      { name: 'get_pre_announcement',     description: '사전규격 열람' },
      { name: 'get_user_info',            description: '나라장터 등록 업체 조회' },
    ],
  },

  /* ── 커머스 ─────────────────────────────────────────────── */
  {
    id: 'smartstore-mcp',
    name: '네이버 스마트스토어 MCP',
    nameEn: 'Naver Smartstore MCP',
    description: '스마트스토어 상품 등록·수정, 주문 조회·처리, 문의 답변, 정산 내역을 Claude에서 자동화합니다.',
    longDescription: '네이버 스마트스토어 커머스 API(Commerce API v2)를 통합합니다. 상품 CRUD, 주문 상태 업데이트, 반품/교환 처리, 고객 문의 답변 생성, 월별 정산 내역 조회를 지원합니다. 스마트스토어 개발자 앱 등록 후 API 키 필요.',
    category: '커머스',
    tags: ['스마트스토어', '네이버커머스', '상품관리', '주문관리', '정산'],
    author: 'MCP 마켓플레이스 (시드)',
    authorVerified: true,
    version: '0.9.0',
    stars: 621,
    installs: 2840,
    pricing: 'freemium',
    priceKRW: 39000,
    certs: ['ISMS-P'],
    apiDocs: 'https://apicenter.commerce.naver.com',
    npmPackage: '@mcp-kr/smartstore-mcp',
    envVars: [
      { key: 'SMARTSTORE_CLIENT_ID',     description: '스마트스토어 개발자 앱 Client ID',     required: true,  docsUrl: 'https://apicenter.commerce.naver.com' },
      { key: 'SMARTSTORE_CLIENT_SECRET', description: '스마트스토어 개발자 앱 Client Secret', required: true,  docsUrl: 'https://apicenter.commerce.naver.com' },
    ],
    featured: true,
    publishedAt: '2026-01-15',
    updatedAt: '2026-06-01',
    likes: 621,
    isSeed: true,
    tools: [
      { name: 'list_products',       description: '상품 목록 조회' },
      { name: 'create_product',      description: '상품 등록' },
      { name: 'update_product',      description: '상품 정보 수정' },
      { name: 'list_orders',         description: '주문 목록 조회' },
      { name: 'update_order_status', description: '주문 상태 변경 (발송처리 등)' },
      { name: 'reply_inquiry',       description: '고객 문의 답변 등록' },
      { name: 'get_settlement',      description: '월별 정산 내역 조회' },
    ],
  },

  /* ── 금융·세금 ──────────────────────────────────────────── */
  {
    id: 'witax-mcp',
    name: '위택스(지방세) MCP',
    nameEn: 'Wetax Local Tax MCP',
    description: '위택스 Open API로 지방세 고지서 조회, 납세 증명 발급, 체납 여부 확인을 Claude에서 자동화합니다.',
    longDescription: '행정안전부 위택스 Open API를 활용합니다. 취득세·재산세·자동차세 고지서 조회, 지방세 납세 증명서 발급 신청, 체납 내역 조회, 분할납부 신청 현황을 지원합니다. 공동인증서 또는 위택스 API 키 필요.',
    category: '금융·세금',
    tags: ['위택스', '지방세', '취득세', '재산세', '납세증명'],
    author: 'MCP 마켓플레이스 (시드)',
    authorVerified: true,
    version: '0.8.0',
    stars: 389,
    installs: 1560,
    pricing: 'free',
    certs: ['CC인증'],
    apiDocs: 'https://www.wetax.go.kr/openapi',
    npmPackage: '@mcp-kr/witax-mcp',
    envVars: [
      { key: 'WETAX_API_KEY', description: '위택스 Open API 인증키', required: true, docsUrl: 'https://www.wetax.go.kr/openapi' },
    ],
    featured: false,
    publishedAt: '2026-02-10',
    updatedAt: '2026-05-20',
    likes: 389,
    isSeed: true,
    tools: [
      { name: 'get_local_tax_notices',  description: '지방세 고지서 목록 조회' },
      { name: 'get_tax_payment_status', description: '납부 내역 조회' },
      { name: 'request_tax_certificate', description: '납세 증명서 발급 신청' },
      { name: 'check_delinquency',       description: '체납 여부 확인' },
      { name: 'get_installment_status',  description: '분할납부 현황 조회' },
    ],
  },
  {
    id: 'nps-edi-mcp',
    name: '국민연금 EDI MCP',
    nameEn: 'National Pension EDI MCP',
    description: '국민연금공단 EDI API로 직원 취득·상실 신고, 보험료 조회, 납부 확인서를 Claude에서 자동 처리합니다.',
    longDescription: '국민연금공단 EDI(전자문서교환) API를 통합합니다. 사업장 신규 취득 신고, 퇴직 상실 신고, 월별 보험료 고지 조회, 납부 확인서 발급, 기준소득월액 변경 신고를 지원합니다. EDI 이용 신청 후 공인인증서 기반 API 키 필요.',
    category: 'ERP·회계',
    tags: ['국민연금', 'EDI', '취득신고', '상실신고', '보험료'],
    author: 'MCP 마켓플레이스 (시드)',
    authorVerified: true,
    version: '0.7.0',
    stars: 234,
    installs: 870,
    pricing: 'free',
    certs: ['ISMS-P', 'CC인증'],
    apiDocs: 'https://edi.nps.or.kr',
    npmPackage: '@mcp-kr/nps-edi-mcp',
    envVars: [
      { key: 'NPS_EDI_BIZ_NO', description: '국민연금 EDI 사업장 관리번호', required: true, docsUrl: 'https://edi.nps.or.kr' },
    ],
    featured: false,
    publishedAt: '2026-02-20',
    updatedAt: '2026-05-15',
    likes: 234,
    isSeed: true,
    tools: [
      { name: 'report_acquisition',      description: '직원 취득(입사) 신고' },
      { name: 'report_loss',             description: '직원 상실(퇴직) 신고' },
      { name: 'get_monthly_premium',     description: '월별 보험료 고지 조회' },
      { name: 'get_payment_certificate', description: '납부 확인서 발급' },
      { name: 'update_base_income',      description: '기준소득월액 변경 신고' },
    ],
  },
  {
    id: 'nhis-edi-mcp',
    name: '건강보험 EDI MCP',
    nameEn: 'NHIS EDI MCP',
    description: '국민건강보험공단 EDI API로 직장 가입자 관리, 보험료 고지서 조회, 자격득실 확인을 자동화합니다.',
    longDescription: '국민건강보험공단 EDI API를 통합합니다. 직장 가입자 취득·상실·변동 신고, 월별 건강보험료 고지서 조회, 자격득실 확인서 발급, 보수월액 변경 신고, 산재·고용보험 동시 신고(토탈서비스)를 지원합니다.',
    category: 'ERP·회계',
    tags: ['건강보험', 'EDI', '직장가입자', '보험료', '자격득실'],
    author: 'MCP 마켓플레이스 (시드)',
    authorVerified: true,
    version: '0.7.0',
    stars: 198,
    installs: 720,
    pricing: 'free',
    certs: ['ISMS-P', 'CC인증'],
    apiDocs: 'https://edi.nhis.or.kr',
    npmPackage: '@mcp-kr/nhis-edi-mcp',
    envVars: [
      { key: 'NHIS_EDI_BIZ_NO', description: '건강보험 EDI 사업장 관리번호', required: true, docsUrl: 'https://edi.nhis.or.kr' },
    ],
    featured: false,
    publishedAt: '2026-02-20',
    updatedAt: '2026-05-15',
    likes: 198,
    isSeed: true,
    tools: [
      { name: 'report_enrollment',        description: '직장 가입자 취득 신고' },
      { name: 'report_withdrawal',        description: '직장 가입자 상실 신고' },
      { name: 'get_premium_notice',       description: '건강보험료 고지서 조회' },
      { name: 'get_eligibility_cert',     description: '자격득실 확인서 발급' },
      { name: 'update_remuneration',      description: '보수월액 변경 신고' },
      { name: 'total_service_report',     description: '4대보험 토탈서비스 동시 신고' },
    ],
  },

  /* ── 한국어AI ───────────────────────────────────────────── */
  {
    id: 'outcome-maxxing-mcp',
    name: 'Outcome Maxxing MCP',
    nameEn: 'Outcome Maxxing MCP',
    description: 'UCB 자율 라우터 + GCR 루프로 최저 토큰·최고 품질을 자동 달성. Sonnet 기준선 대비 평균 토큰 16% · 비용 36% 절감, 실시간 효율 시각화 제공.',
    longDescription: [
      '【효율성 비교 (Sonnet 기준선 대비)】',
      '• 단순 Q&A: 토큰 ▼30% · 비용 ▼73% (Haiku 자동 선택)',
      '• 요약:     토큰 ▼15% · 비용 ▼70% (Haiku 자동 선택)',
      '• 번역:     토큰 ▼44% · 비용 ▼76% (Haiku 자동 선택)',
      '• 코드 생성: 동급 토큰 · 동급 비용 (Sonnet 유지 — 복잡도 감지)',
      '• 전체 평균: 토큰 ▼16% · 비용 ▼36%',
      '',
      '【핵심 기술】',
      'UCB1(Upper Confidence Bound) 알고리즘으로 Haiku·Sonnet·Opus를 멀티암드 밴딧으로 자율 선택합니다.',
      'GCR(Goal-Conditioned Retry) 루프가 품질 임계값 미달 시 ①프롬프트 압축 → ②모델 에스컬레이션 → ③자가 수정 순으로 적응 재시도합니다.',
      'Haiku 판정 모델이 목표 부합·정확성·간결성·토큰 효율을 자율 평가해 보상 신호로 UCB를 업데이트합니다.',
      '',
      '【실시간 시각화】',
      'token_stats 툴로 현재 세션의 토큰/비용을 Sonnet 기준선과 실시간 ASCII 차트로 비교합니다.',
      '모든 평가 결과는 로컬 SQLite DB에 자동 저장되며 evaluation_history 툴로 누적 통계를 조회할 수 있습니다.',
    ].join('\n'),
    category: '한국어AI',
    tags: ['토큰최적화', 'UCB라우터', 'GCR루프', '자율품질평가', '멀티암드밴딧', '비용절감'],
    author: 'MCP 마켓플레이스 (시드)',
    authorVerified: true,
    version: '2.0.0',
    stars: 0,
    installs: 0,
    pricing: 'free',
    certs: [],
    apiDocs: 'https://github.com/spotkwk-hub/mcp-marketplace-kr',
    npmPackage: '@mcp-kr/outcome-maxxing-mcp',
    envVars: [
      {
        key: 'ANTHROPIC_API_KEY',
        description: 'Anthropic API 키 (claude.ai → 설정 → API Keys)',
        required: true,
        docsUrl: 'https://console.anthropic.com/settings/keys',
      },
    ],
    featured: true,
    publishedAt: '2026-06-21',
    updatedAt: '2026-06-21',
    likes: 0,
    isSeed: true,
    tools: [
      { name: 'outcome_query',       description: 'UCB 라우팅 + GCR 루프 + 자율 품질 평가 통합 쿼리 (DB 자동 저장)' },
      { name: 'ucb_query',           description: 'UCB 자동 모델 선택 단발 쿼리 (빠른 경로, DB 저장)' },
      { name: 'evaluate_quality',    description: '응답 품질 자율 평가 (Haiku 판정)' },
      { name: 'token_stats',         description: '실시간 토큰/비용 시각화 — 현재 세션 vs Sonnet 기준선 ASCII 차트' },
      { name: 'session_report',      description: '현재 세션 호출 이력 테이블 (호출별 토큰·비용·품질)' },
      { name: 'evaluation_history',  description: 'DB 누적 평가 이력 — 모델별 분포 · 평균 절감률 집계' },
      { name: 'ucb_stats',           description: 'UCB 팔별 평균 보상·선택 횟수 통계' },
      { name: 'compress_prompt',     description: '프롬프트 토큰 압축 (불필요 표현 제거)' },
      { name: 'reset_ucb',           description: 'UCB 학습 상태 초기화 (DB·세션 통계는 유지)' },
    ],
  },

  /* ── ERP·회계 ───────────────────────────────────────────── */
  {
    id: 'douzone-icube-mcp',
    name: '더존 iCUBE MCP',
    nameEn: 'Douzone iCUBE ERP MCP',
    description: '더존 iCUBE ERP 전표·재무·재고·급여 데이터를 Claude에서 직접 제어합니다.',
    longDescription: '국내 중견·대기업 ERP 점유율 1위 더존 iCUBE REST API 통합. 전표 조회·생성, 손익계산서·재무상태표, 매출매입 집계, 재고현황, 급여대장, 세금계산서 연계를 지원합니다.',
    category: 'ERP·회계',
    tags: ['더존', 'iCUBE', 'ERP', '전표', '재무', '급여'],
    author: 'MCP 마켓플레이스 (시드)',
    authorVerified: true,
    version: '0.9.0',
    stars: 412,
    installs: 1840,
    pricing: 'paid',
    priceKRW: 99000,
    certs: ['ISMS-P'],
    apiDocs: 'https://ipartner.douzone.com',
    npmPackage: '@mcp-kr/douzone-icube-mcp',
    envVars: [
      { key: 'DOUZONE_API_KEY',    description: '더존 iCUBE API 키',     required: true,  docsUrl: 'https://ipartner.douzone.com' },
      { key: 'DOUZONE_COMPANY_CD', description: '더존 iCUBE 회사 코드', required: true,  docsUrl: 'https://ipartner.douzone.com' },
    ],
    featured: true,
    publishedAt: '2025-09-15',
    updatedAt: '2026-06-01',
    likes: 218,
    isSeed: true,
    tools: [
      { name: 'get_vouchers',          description: '전표 조회 (매출/매입/일반)' },
      { name: 'create_voucher',        description: '전표 생성 및 승인 요청' },
      { name: 'get_financial_summary', description: '손익계산서·재무상태표 집계' },
      { name: 'get_sales_purchase',    description: '매출·매입 현황 조회' },
      { name: 'get_inventory',         description: '품목·창고별 재고 현황' },
      { name: 'get_payroll',           description: '직원 급여 대장 조회' },
    ],
  },
  {
    id: 'hometax-mcp',
    name: '국세청 홈택스 MCP',
    nameEn: 'Hometax MCP',
    description: '사업자확인, 전자세금계산서 발행·조회, 부가세 신고 데이터, 연말정산 자료를 자동화합니다.',
    longDescription: '국세청 홈택스 Open API 활용. 사업자등록번호 진위확인, 전자세금계산서 발행, 수신 세금계산서 조회, 부가세 신고 데이터 집계, 연말정산 간소화 자료 수집을 지원합니다.',
    category: '금융·세금',
    tags: ['홈택스', '세금계산서', '부가세신고', '연말정산'],
    author: '국세청',
    authorVerified: true,
    version: '1.2.0',
    stars: 1923,
    installs: 9800,
    pricing: 'free',
    certs: ['ISMS-P', 'CC인증'],
    apiDocs: 'https://www.hometax.go.kr',
    npmPackage: '@mcp-kr/hometax-mcp',
    envVars: [
      { key: 'HOMETAX_API_KEY', description: '홈택스 Open API 인증키', required: true, docsUrl: 'https://www.hometax.go.kr' },
    ],
    featured: true,
    publishedAt: '2025-08-20',
    updatedAt: '2026-04-10',
    likes: 1105,
    isSeed: true,
    tools: [
      { name: 'verify_business_registration', description: '사업자등록번호 진위 확인' },
      { name: 'issue_e_tax_invoice',           description: '전자세금계산서 발행' },
      { name: 'get_received_invoices',         description: '수신 세금계산서 목록 조회' },
      { name: 'aggregate_vat_data',            description: '부가세 신고용 데이터 집계' },
      { name: 'get_year_end_tax_docs',         description: '연말정산 간소화 자료 수집' },
    ],
  },

  /* ── 보안 ───────────────────────────────────────────────── */
  {
    id: 'mcp-security-guardian',
    name: 'MCP Security Guardian',
    nameEn: 'MCP Security Guardian',
    description: 'LLM/MCP 에이전트 보안 가드레일. 데이터 유출(API키·PII) 탐지, 의심스러운 외부 통신 차단, 악성 MCP 도구 정의 검출, 스케줄(트리거) 침투 차단을 자동화합니다.',
    longDescription: [
      '【4대 가드레일】',
      '• scan_leak — API 키·시크릿·PII(이메일·전화번호·카드번호·private key) 탐지 및 자동 마스킹',
      '• check_outbound — URL/텍스트 내 외부 통신을 허용목록·알려진 데이터유출 악용 서비스(webhook.site 등)·IP 리터럴 우회 기준으로 차단',
      '• scan_mcp_tools — 연결하려는 외부 MCP 서버의 도구 정의(name/description/schema)에서 프롬프트 인젝션, 과도한 민감 파라미터 요구를 탐지',
      '• check_schedule_action — 트리거/cron 생성·수정·삭제 요청이 사용자 직접 지시가 아닌 도구 출력·외부 콘텐츠를 경유해 침투했는지, 파괴적 동작이 예약되는지 검사',
      '',
      '【설계 원칙】',
      '도구 호출 전후, 새 MCP 서버 연결 전, 스케줄 작업 생성 전에 호출해 1차 방어선으로 사용합니다.',
      '정규식 기반 패턴 매칭으로 알려진 공격 패턴을 빠르게 차단하며, 우회 가능한 한계(인코딩·동의어 변형)는 README에 명시되어 있습니다.',
    ].join('\n'),
    category: '보안',
    tags: ['프롬프트인젝션', '데이터유출방지', 'MCP보안', '가드레일', '스케줄침투차단', 'PII탐지'],
    author: 'MCP 마켓플레이스 (시드)',
    authorVerified: true,
    version: '1.0.0',
    stars: 0,
    installs: 0,
    pricing: 'free',
    certs: [],
    apiDocs: 'https://github.com/spotkwk-hub/mcp-marketplace-kr',
    npmPackage: '@mcp-kr/mcp-security-guardian',
    envVars: [],
    featured: true,
    publishedAt: '2026-07-01',
    updatedAt: '2026-07-01',
    likes: 0,
    isSeed: true,
    tools: [
      { name: 'scan_leak',             description: 'API 키·시크릿·PII 유출 탐지 및 마스킹' },
      { name: 'check_outbound',        description: 'URL/텍스트 내 외부 통신을 위험 패턴 기준으로 차단 판정' },
      { name: 'scan_mcp_tools',        description: '외부 MCP 도구 정의의 프롬프트 인젝션·악성 패턴 검출' },
      { name: 'check_schedule_action', description: '스케줄(트리거) 침투·파괴적 동작 예약 차단' },
    ],
  },
];

// ─── 유틸리티 ────────────────────────────────────────────────
export function getById(id: string): MCPServerMeta | undefined {
  return REGISTRY.find(s => s.id === id);
}

export function getByCategory(category: Category): MCPServerMeta[] {
  return REGISTRY.filter(s => s.category === category);
}

export function getFeatured(): MCPServerMeta[] {
  return REGISTRY.filter(s => s.featured);
}

export function getSeedServers(): MCPServerMeta[] {
  return REGISTRY.filter(s => s.isSeed);
}

export function search(query: string): MCPServerMeta[] {
  const q = query.toLowerCase();
  return REGISTRY.filter(s =>
    s.name.toLowerCase().includes(q) ||
    s.description.toLowerCase().includes(q) ||
    s.tags.some(t => t.toLowerCase().includes(q)) ||
    s.author.toLowerCase().includes(q)
  );
}

export const CATEGORIES: { id: Category | 'all'; label: string; emoji: string }[] = [
  { id: 'all',       label: '전체',       emoji: '🌐' },
  { id: 'ERP·회계',  label: 'ERP·회계',   emoji: '🏢' },
  { id: '공공데이터', label: '공공데이터',  emoji: '📊' },
  { id: '금융·세금',  label: '금융·세금',  emoji: '💰' },
  { id: '국내서비스', label: '국내 서비스', emoji: '🇰🇷' },
  { id: '법규·규정',  label: '법규·규정',  emoji: '⚖️' },
  { id: '한국어AI',   label: '한국어 AI',  emoji: '🤖' },
  { id: '커머스',     label: '커머스',     emoji: '🛒' },
  { id: '보안',       label: '보안',       emoji: '🔒' },
];

export const CERT_COLORS: Record<SecurityCert, string> = {
  'ISMS-P':   'bg-blue-100 text-blue-800',
  'ISO27001': 'bg-green-100 text-green-800',
  'CC인증':   'bg-purple-100 text-purple-800',
  'CSAP':     'bg-orange-100 text-orange-800',
};

export const PRICING_LABELS: Record<PricingModel, string> = {
  free:       '무료',
  freemium:   '프리미엄',
  paid:       '유료',
  enterprise: '기업용',
};
