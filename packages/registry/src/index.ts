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
  featured: boolean;
  updatedAt: string;       // YYYY-MM-DD
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
    featured: true,
    updatedAt: '2026-06-07',
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
    featured: true,
    updatedAt: '2026-06-07',
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
    featured: true,
    updatedAt: '2026-06-01',
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
    featured: false,
    updatedAt: '2026-05-20',
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
    featured: false,
    updatedAt: '2026-05-15',
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
    featured: false,
    updatedAt: '2026-05-15',
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
    featured: true,
    updatedAt: '2026-06-01',
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
    featured: true,
    updatedAt: '2026-04-10',
    isSeed: true,
    tools: [
      { name: 'verify_business_registration', description: '사업자등록번호 진위 확인' },
      { name: 'issue_e_tax_invoice',           description: '전자세금계산서 발행' },
      { name: 'get_received_invoices',         description: '수신 세금계산서 목록 조회' },
      { name: 'aggregate_vat_data',            description: '부가세 신고용 데이터 집계' },
      { name: 'get_year_end_tax_docs',         description: '연말정산 간소화 자료 수집' },
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
