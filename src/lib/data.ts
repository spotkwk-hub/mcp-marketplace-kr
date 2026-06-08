import { MCPServer, Category } from '@/types';

export const MCP_SERVERS: MCPServer[] = [

  // ─── LIVE: 실제 연결·검증된 MCP ───────────────────────────
  {
    id: 'publicdata-mcp',
    name: '공공데이터포털 MCP',
    nameEn: 'Korean Public Data Portal MCP',
    description: '기상청 날씨, 버스·지하철 실시간, 아파트 실거래가, 인구통계를 Claude에서 바로 조회합니다.',
    longDescription: `행정안전부 공공데이터포털의 핵심 4개 API를 단일 MCP로 통합했습니다.

• 기상청 단기예보: 격자 좌표(nx/ny) 기반 기온·강수·풍속 예보
• 국토교통부 버스도착: 도시코드+정류소ID로 실시간 버스 도착 정보
• 서울시 지하철 위치: 호선명으로 현재 운행 열차 실시간 위치
• 국토교통부 아파트 실거래가: 법정동 코드+연월로 실거래 가격·면적·층수
• 행정안전부 인구통계: 행정기관코드+연월로 인구수·세대수

현재 세션에 실제 연결되어 있어 별도 설치 없이 즉시 사용 가능합니다.`,
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
    featured: true,
    updatedAt: '2026-06-07',
    isLive: true,
    isSeed: true,
    tools: [
      { name: 'get_weather', description: '기상청 단기예보 (기온·강수·풍속)' },
      { name: 'get_bus_arrival', description: '국토교통부 버스 실시간 도착 정보' },
      { name: 'get_subway_info', description: '서울시 지하철 실시간 열차 위치' },
      { name: 'get_real_estate_price', description: '아파트 매매 실거래가 조회' },
      { name: 'get_population_stats', description: '행정안전부 주민등록 인구통계' },
    ],
  },
  {
    id: 'g2b-mcp',
    name: '나라장터(G2B) MCP',
    nameEn: 'Korea G2B Procurement MCP',
    description: '조달청 나라장터 입찰공고 검색, 낙찰결과, 계약현황, 사전규격, 업체정보를 Claude에서 조회합니다.',
    longDescription: `조달청 국가종합전자조달시스템(나라장터)의 5개 Open API를 통합했습니다.

• 입찰공고 검색: 물품/용역/공사/외자 구분·공고명·발주기관·기간으로 검색 (현재 3,500건+)
• 낙찰정보: 낙찰업체·낙찰금액·낙찰일자 등 입찰 결과 조회
• 계약정보: 계약금액·계약업체·계약기간 등 계약 현황
• 사전규격: 입찰공고 전 공개된 규격·과업지시서 열람
• 업체정보: 사업자등록번호·업체명으로 나라장터 등록 공급자 조회

현재 세션에 실제 연결되어 있어 별도 설치 없이 즉시 사용 가능합니다.`,
    category: '공공데이터',
    tags: ['나라장터', '입찰공고', '낙찰정보', '계약정보', '사전규격', '조달청'],
    author: '조달청',
    authorVerified: true,
    version: '1.0.0',
    stars: 1876,
    installs: 8400,
    pricing: 'free',
    certs: ['ISMS-P', 'CC인증'],
    apiDocs: 'https://www.g2b.go.kr',
    featured: true,
    updatedAt: '2026-06-07',
    isLive: true,
    isSeed: true,
    tools: [
      { name: 'search_bid_announcements', description: '입찰공고 검색 (물품/용역/공사/외자)' },
      { name: 'get_bid_award_info', description: '낙찰정보 조회' },
      { name: 'get_contract_info', description: '계약현황 조회' },
      { name: 'get_pre_announcement', description: '사전규격 열람' },
      { name: 'get_user_info', description: '나라장터 등록 업체 조회' },
    ],
  },

  // ─── SEED: 플랫폼 직접 제작 시드 MCP ──────────────────────
  {
    id: 'douzone-icube-mcp',
    name: '더존 iCUBE MCP',
    nameEn: 'Douzone iCUBE ERP MCP',
    description: '더존 iCUBE ERP의 전표 조회·생성, 매출·매입 집계, 재고현황, 인사급여 데이터를 Claude에서 직접 제어합니다.',
    longDescription: `국내 중견·대기업 ERP 점유율 1위인 더존 iCUBE와 Claude를 연결하는 최초의 MCP 서버입니다.

더존 iCUBE REST API를 통해 다음 기능을 지원합니다:
• 전표 조회·생성: 매출·매입·일반 전표 생성 및 승인 요청
• 재무 집계: 손익계산서·재무상태표 데이터 추출
• 매출·매입 현황: 기간별·거래처별 매출매입 집계
• 재고 현황: 품목별·창고별 재고 잔량 조회
• 인사급여: 직원 급여 대장·근태 현황 조회
• 세금계산서 연계: 홈택스 세금계산서 자동 매핑

국내 기업 95%가 더존 iCUBE를 사용합니다. 이 MCP 하나로 ERP 업무의 80%를 자동화합니다.`,
    category: 'ERP·회계',
    tags: ['더존', 'iCUBE', 'ERP', '전표', '재무', '급여', '재고'],
    author: 'MCP 마켓플레이스 (시드)',
    authorVerified: true,
    version: '0.9.0',
    stars: 412,
    installs: 1840,
    pricing: 'paid',
    priceKRW: 99000,
    certs: ['ISMS-P'],
    apiDocs: 'https://ipartner.douzone.com',
    featured: true,
    updatedAt: '2026-06-01',
    isSeed: true,
    tools: [
      { name: 'get_vouchers', description: '전표 조회 (매출/매입/일반)' },
      { name: 'create_voucher', description: '전표 생성 및 승인 요청' },
      { name: 'get_financial_summary', description: '손익계산서·재무상태표 집계' },
      { name: 'get_sales_purchase', description: '매출·매입 현황 조회' },
      { name: 'get_inventory', description: '품목·창고별 재고 현황' },
      { name: 'get_payroll', description: '직원 급여 대장 조회' },
    ],
  },
  {
    id: 'youngrimwon-mcp',
    name: '영림원 K-System MCP',
    nameEn: 'Youngrimwon K-System ERP MCP',
    description: '영림원 K-System ERP의 생산·물류·구매·회계 모듈을 Claude에서 쿼리하고 보고서를 자동 생성합니다.',
    longDescription: `국내 제조업 ERP 시장에서 강세인 영림원 K-System과 Claude를 연결합니다.

영림원 K-System은 MS-SQL 기반으로 직접 DB 쿼리가 가능합니다:
• 생산관리: 작업지시서 조회·BOM 분석·공정별 실적 집계
• 물류·창고: 입출고 현황·재고 실사·LOT 추적
• 구매관리: 발주서 생성·거래처 단가 비교·납기 추적
• 회계: 전표 조회·원가 분석·부서별 예산 실적
• 보고서 자동화: 경영진용 월간 요약 보고서 자동 생성

제조·유통 기업의 일일 운영 리포트를 Claude가 자동으로 작성합니다.`,
    category: 'ERP·회계',
    tags: ['영림원', 'K-System', 'ERP', '생산관리', '물류', '구매', '제조'],
    author: 'MCP 마켓플레이스 (시드)',
    authorVerified: true,
    version: '0.8.0',
    stars: 287,
    installs: 960,
    pricing: 'paid',
    priceKRW: 89000,
    certs: ['ISMS-P'],
    apiDocs: 'https://www.youngrimwon.com',
    featured: false,
    updatedAt: '2026-05-28',
    isSeed: true,
    tools: [
      { name: 'query_production', description: '작업지시·BOM·공정 실적 조회' },
      { name: 'query_inventory', description: '입출고·재고·LOT 추적' },
      { name: 'create_purchase_order', description: '발주서 생성 및 거래처 비교' },
      { name: 'query_accounting', description: '전표·원가·예산 실적 조회' },
      { name: 'generate_management_report', description: '경영진용 월간 요약 보고서 생성' },
    ],
  },
  {
    id: 'hometax-mcp',
    name: '국세청 홈택스 MCP',
    nameEn: 'Hometax MCP',
    description: '사업자 진위확인, 전자세금계산서 발행·수신조회, 부가세 신고 데이터 집계, 연말정산 자료 수집을 자동화합니다.',
    longDescription: `국세청 홈택스 Open API를 활용해 세금 업무를 Claude에서 자동화합니다.

• 사업자 등록 진위확인: 사업자등록번호로 유효성 즉시 확인
• 전자세금계산서 발행: 공급가액·세액·거래처 정보 입력 후 즉시 발행
• 수신 세금계산서 조회: 기간별 수취 세금계산서 목록 및 집계
• 부가세 신고 데이터: 과세기간별 매출·매입 세액 자동 집계
• 연말정산 간소화: 직원별 소득공제 항목 자동 수집

토스페이먼츠 MCP와 연동하면 매출→세금계산서→부가세 신고 전 과정이 자동화됩니다.`,
    category: '금융·세금',
    tags: ['홈택스', '세금계산서', '부가세신고', '연말정산', '사업자확인'],
    author: '국세청',
    authorVerified: true,
    version: '1.2.0',
    stars: 1923,
    installs: 9800,
    pricing: 'free',
    certs: ['ISMS-P', 'CC인증'],
    apiDocs: 'https://www.hometax.go.kr',
    featured: true,
    updatedAt: '2026-04-10',
    isSeed: true,
    tools: [
      { name: 'verify_business_registration', description: '사업자등록번호 진위 확인' },
      { name: 'issue_e_tax_invoice', description: '전자세금계산서 발행' },
      { name: 'get_received_invoices', description: '수신 세금계산서 목록 조회' },
      { name: 'aggregate_vat_data', description: '부가세 신고용 데이터 집계' },
      { name: 'get_year_end_tax_docs', description: '연말정산 간소화 자료 수집' },
    ],
  },
  {
    id: 'toss-payments-mcp',
    name: '토스페이먼츠 MCP',
    nameEn: 'TossPayments MCP',
    description: '결제 승인·취소·부분취소, 정산 내역 조회, 원화 자동 정산 파이프라인을 Claude에서 관리합니다.',
    longDescription: `토스페이먼츠 API를 통해 결제 전 과정과 원화 정산을 자동화합니다.

• 결제 승인: paymentKey·orderId·amount로 결제 확정
• 결제 취소·부분취소: 전액/부분 취소 및 사유 기록
• 정산 내역: 일별·월별 정산 현황 및 수수료 내역
• 세금계산서 발행: 정산금 기준 세금계산서 자동 생성
• 부가세 리포트: 분기별 부가세 신고 데이터 자동 추출
• 에스크로: 구매확정 전 자금 보호 처리

홈택스 MCP와 연동하면 결제→정산→세금계산서→부가세신고 전 과정이 완전 자동화됩니다.`,
    category: '금융·세금',
    tags: ['결제승인', '결제취소', '정산조회', '세금계산서', '원화정산'],
    author: '토스페이먼츠',
    authorVerified: true,
    version: '3.0.1',
    stars: 2847,
    installs: 15600,
    pricing: 'freemium',
    priceKRW: 49000,
    certs: ['ISMS-P', 'ISO27001', 'CC인증'],
    apiDocs: 'https://docs.tosspayments.com',
    featured: false,
    updatedAt: '2026-06-01',
    tools: [
      { name: 'confirm_payment', description: '결제 승인 처리' },
      { name: 'cancel_payment', description: '결제 전액 취소' },
      { name: 'partial_cancel_payment', description: '결제 부분 취소' },
      { name: 'get_settlement', description: '정산 내역 조회' },
      { name: 'issue_tax_invoice', description: '정산금 기준 세금계산서 발행' },
      { name: 'export_vat_report', description: '부가세 신고용 리포트 추출' },
    ],
  },
  {
    id: 'kakao-mcp',
    name: '카카오 통합 MCP',
    nameEn: 'Kakao Integrated MCP',
    description: '카카오톡 메시지·알림톡 전송, 카카오페이 결제 요청, 카카오맵 장소 검색을 Claude에서 사용합니다.',
    longDescription: `카카오 전체 API를 단일 MCP로 통합합니다.

• 카카오톡 메시지: 친구에게 텍스트·이미지·링크 메시지 전송
• 알림톡: 사업자용 카카오 알림톡 발송 (주문확인, 배송, 인증 등)
• 카카오페이: 결제 요청 QR/링크 생성 및 결제 상태 조회
• 카카오맵: 키워드·카테고리·좌표 기반 장소 검색 및 길찾기
• 카카오 로그인: OAuth 2.0 소셜 로그인 및 사용자 프로필 조회

카카오 개발자센터에서 앱 등록 후 API 키를 발급받아 사용하세요.`,
    category: '국내서비스',
    tags: ['카카오톡', '알림톡', '카카오페이', '카카오맵', 'OAuth2'],
    author: '카카오엔터프라이즈',
    authorVerified: true,
    version: '2.1.0',
    stars: 4821,
    installs: 32400,
    pricing: 'freemium',
    priceKRW: 29000,
    certs: ['ISMS-P', 'ISO27001'],
    apiDocs: 'https://developers.kakao.com',
    featured: false,
    updatedAt: '2026-05-20',
    tools: [
      { name: 'send_message', description: '카카오톡 메시지 전송' },
      { name: 'send_alimtalk', description: '카카오 알림톡 발송' },
      { name: 'request_payment', description: '카카오페이 결제 요청' },
      { name: 'search_place', description: '카카오맵 장소 검색' },
      { name: 'get_directions', description: '카카오맵 길찾기' },
    ],
  },
  {
    id: 'dart-mcp',
    name: '금융감독원 DART MCP',
    nameEn: 'FSS DART MCP',
    description: '상장법인 재무제표, 사업보고서 원문, 대량보유 공시 등 DART 전자공시 자료를 자동 수집합니다.',
    longDescription: `금융감독원 DART Open API로 상장 기업 공시 자료를 자동화합니다.

• 기업 개황: 상장법인 기본 정보 (대표자·자본금·결산월)
• 재무제표: 연결·별도 재무상태표, 손익계산서, 현금흐름표
• 사업보고서: 연간·반기·분기 보고서 원문 다운로드
• 공시 목록: 기업·기간별 전체 공시 목록 검색
• 대량보유: 5% 이상 주식 보유 변동 공시

DART API 키는 DART 홈페이지에서 무료 발급 가능합니다.`,
    category: '법규·규정',
    tags: ['DART', '재무제표', '사업보고서', '전자공시', '상장법인'],
    author: '금융감독원',
    authorVerified: true,
    version: '1.9.0',
    stars: 2103,
    installs: 13500,
    pricing: 'free',
    certs: ['ISMS-P'],
    apiDocs: 'https://opendart.fss.or.kr',
    featured: false,
    updatedAt: '2026-05-25',
    tools: [
      { name: 'get_company_overview', description: '상장법인 기본 정보 조회' },
      { name: 'get_financial_statements', description: '연결·별도 재무제표 조회' },
      { name: 'list_disclosures', description: '공시 목록 검색' },
      { name: 'get_report_document', description: '사업보고서 원문 조회' },
      { name: 'search_bulk_holding', description: '대량보유 공시 조회' },
    ],
  },
  {
    id: 'hyperclova-mcp',
    name: 'HyperCLOVA X MCP',
    nameEn: 'HyperCLOVA X MCP',
    description: '네이버 HyperCLOVA X 한국어 특화 LLM으로 장문 요약·번역·감성분석을 Claude 워크플로우에 통합합니다.',
    longDescription: `네이버 HyperCLOVA X를 Claude의 서브 모델로 활용합니다.

• 한국어 장문 요약: 계약서·보고서·뉴스 등 긴 한국어 문서 핵심 요약
• 한영/영한 번역: 특허·법률·기술 문서의 전문 번역
• 감성 분석: 리뷰·댓글·SNS 텍스트의 긍정/부정/중립 분류
• 카테고리 분류: 텍스트를 지정 카테고리로 자동 분류
• 채팅 완성: HyperCLOVA X 기반 멀티턴 대화 생성

NAVER Cloud Platform 콘솔에서 API 키를 발급받아 사용하세요.`,
    category: '한국어AI',
    tags: ['HyperCLOVA X', '한국어LLM', '장문요약', '번역', '감성분석'],
    author: 'NAVER Cloud Platform',
    authorVerified: true,
    version: '1.5.0',
    stars: 2134,
    installs: 11200,
    pricing: 'paid',
    priceKRW: 99000,
    certs: ['ISO27001'],
    apiDocs: 'https://www.ncloud.com/product/aiService/clovaStudio',
    featured: false,
    updatedAt: '2026-05-28',
    tools: [
      { name: 'chat_completion', description: 'HyperCLOVA X 기반 채팅 완성' },
      { name: 'summarize_korean', description: '한국어 장문 요약' },
      { name: 'translate', description: '한영/영한 전문 번역' },
      { name: 'analyze_sentiment', description: '텍스트 감성 분석' },
      { name: 'classify_category', description: '카테고리 자동 분류' },
    ],
  },
];

export const CATEGORIES: { id: Category | 'all'; label: string; emoji: string }[] = [
  { id: 'all',      label: '전체',      emoji: '🌐' },
  { id: 'ERP·회계', label: 'ERP·회계',  emoji: '🏢' },
  { id: '공공데이터', label: '공공데이터', emoji: '📊' },
  { id: '금융·세금', label: '금융·세금', emoji: '💰' },
  { id: '국내서비스', label: '국내 서비스', emoji: '🇰🇷' },
  { id: '법규·규정', label: '법규·규정', emoji: '⚖️' },
  { id: '한국어AI',  label: '한국어 AI', emoji: '🤖' },
  { id: '커머스',   label: '커머스',    emoji: '🛒' },
  { id: '보안',     label: '보안',      emoji: '🔒' },
];

export const PRICING_LABELS: Record<string, string> = {
  free:       '무료',
  freemium:   '프리미엄',
  paid:       '유료',
  enterprise: '기업용',
};

export const CERT_COLORS: Record<string, string> = {
  'ISMS-P':   'bg-blue-100 text-blue-800',
  'ISO27001': 'bg-green-100 text-green-800',
  'CC인증':   'bg-purple-100 text-purple-800',
  'CSAP':     'bg-orange-100 text-orange-800',
};

/** MVP 로드맵 — 현재 구현 상태 */
export const MVP_FEATURES = [
  { id: 'browse',   label: '검색·탐색',   done: true,  desc: '카테고리·키워드·가격 필터 검색' },
  { id: 'install',  label: '원클릭 설치', done: true,  desc: 'config.json 자동 생성 + 복사' },
  { id: 'auth',     label: '회원가입',    done: false, desc: 'GitHub/카카오 소셜 로그인' },
  { id: 'payment',  label: '결제',        done: true,  desc: '토스페이먼츠 구독 결제' },
  { id: 'settle',   label: '공급자 정산', done: false, desc: '원화 정산 + 세금계산서 자동 발행' },
  { id: 'register', label: '서버 등록',   done: false, desc: '공급자 MCP 서버 제출 폼' },
];
