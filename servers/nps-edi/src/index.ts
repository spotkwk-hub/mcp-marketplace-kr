#!/usr/bin/env node
// =============================================================
// @mcp-kr/nps-edi
// 국민연금공단 EDI API MCP 서버
//
// 필요 환경변수:
//   NPS_EDI_CERT_PATH   — 공인인증서(.p12) 경로
//   NPS_EDI_CERT_PASS   — 인증서 비밀번호
//   NPS_EDI_BIZ_NO      — 사업장 사업자등록번호
// =============================================================

import { Server }               from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type Tool,
} from '@modelcontextprotocol/sdk/types.js';

const NPS_BASE = 'https://edi.nps.or.kr/edi';

// 국민연금 EDI API 호출 헬퍼
async function npsCall(endpoint: string, body: Record<string, unknown>) {
  const bizNo = process.env.NPS_EDI_BIZ_NO;
  if (!bizNo) throw new Error('NPS_EDI_BIZ_NO 환경변수가 필요합니다.');

  const res = await fetch(`${NPS_BASE}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json;charset=UTF-8' },
    body: JSON.stringify({ bizNo, ...body }),
  });

  if (!res.ok) throw new Error(`국민연금 EDI API 오류: ${res.status} ${await res.text()}`);
  return res.json();
}

// ── 툴 정의 ───────────────────────────────────────────────
const TOOLS: Tool[] = [
  {
    name: 'get_contribution_amount',
    description: '사업장의 국민연금 월별 보험료를 조회합니다.',
    inputSchema: {
      type: 'object',
      required: ['yearMonth'],
      properties: {
        yearMonth: { type: 'string', description: '조회 연월 (YYYYMM)' },
      },
    },
  },
  {
    name: 'get_employee_contributions',
    description: '사업장 근로자별 국민연금 부과 내역을 조회합니다.',
    inputSchema: {
      type: 'object',
      required: ['yearMonth'],
      properties: {
        yearMonth:   { type: 'string', description: '조회 연월 (YYYYMM)' },
        empName:     { type: 'string', description: '성명 검색 (선택)' },
        page:        { type: 'number', description: '페이지 번호 (1~)' },
        limit:       { type: 'number', description: '페이지 크기 (최대 100)' },
      },
    },
  },
  {
    name: 'declare_monthly_report',
    description: '월별 국민연금 보수 변경 신고를 처리합니다 (내역변경신고).',
    inputSchema: {
      type: 'object',
      required: ['yearMonth', 'employees'],
      properties: {
        yearMonth: { type: 'string', description: '신고 연월 (YYYYMM)' },
        employees: {
          type:  'array',
          items: {
            type: 'object',
            required: ['empNo', 'monthlyIncome'],
            properties: {
              empNo:         { type: 'string', description: '주민등록번호 (13자리)' },
              empName:       { type: 'string', description: '성명' },
              monthlyIncome: { type: 'number', description: '월 보수액 (원)' },
              changeReason:  { type: 'string', description: '변경 사유 (01:승급, 02:승진, 03:직종변경 등)' },
            },
          },
          description: '신고 대상 근로자 목록',
        },
      },
    },
  },
  {
    name: 'report_acquisition',
    description: '신규 직원 국민연금 취득 신고를 합니다.',
    inputSchema: {
      type: 'object',
      required: ['employees'],
      properties: {
        employees: {
          type:  'array',
          items: {
            type: 'object',
            required: ['empNo', 'empName', 'acquisitionDate', 'monthlyIncome'],
            properties: {
              empNo:           { type: 'string', description: '주민등록번호 (13자리)' },
              empName:         { type: 'string', description: '성명' },
              acquisitionDate: { type: 'string', description: '취득일 (YYYYMMDD)' },
              monthlyIncome:   { type: 'number', description: '월 보수액 (원)' },
              empType:         { type: 'string', description: '사원 유형 (01:상용, 02:일용 등)' },
            },
          },
          description: '취득 신고 대상 직원 목록',
        },
      },
    },
  },
  {
    name: 'report_loss',
    description: '퇴직 직원 국민연금 상실 신고를 합니다.',
    inputSchema: {
      type: 'object',
      required: ['employees'],
      properties: {
        employees: {
          type:  'array',
          items: {
            type: 'object',
            required: ['empNo', 'empName', 'lossDate', 'lossReason'],
            properties: {
              empNo:       { type: 'string', description: '주민등록번호 (13자리)' },
              empName:     { type: 'string', description: '성명' },
              lossDate:    { type: 'string', description: '상실일 (YYYYMMDD)' },
              lossReason:  { type: 'string', description: '상실 사유 코드 (01:퇴직, 02:해고, 03:사망 등)' },
            },
          },
          description: '상실 신고 대상 직원 목록',
        },
      },
    },
  },
  {
    name: 'get_payment_history',
    description: '국민연금 납부 내역을 조회합니다.',
    inputSchema: {
      type: 'object',
      properties: {
        fromYearMonth: { type: 'string', description: '조회 시작 연월 (YYYYMM)' },
        toYearMonth:   { type: 'string', description: '조회 종료 연월 (YYYYMM)' },
      },
    },
  },
  {
    name: 'get_certificate',
    description: '국민연금 납부 확인서를 발급합니다.',
    inputSchema: {
      type: 'object',
      required: ['certType', 'yearMonth'],
      properties: {
        certType:  { type: 'string', description: '확인서 종류 (PAYMENT:납부확인서, SUBSCRIBE:가입확인서)' },
        yearMonth: { type: 'string', description: '기준 연월 (YYYYMM)' },
        empNo:     { type: 'string', description: '특정 직원 주민등록번호 (미입력 시 사업장 전체)' },
      },
    },
  },
];

// ── 툴 핸들러 ─────────────────────────────────────────────
async function handleTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    case 'get_contribution_amount':
      return npsCall('/api/contribution/amount', { yearMonth: args.yearMonth });

    case 'get_employee_contributions':
      return npsCall('/api/contribution/employees', {
        yearMonth: args.yearMonth,
        ...(args.empName ? { empName: args.empName } : {}),
        page:  args.page  ?? 1,
        limit: Math.min(100, Number(args.limit ?? 50)),
      });

    case 'declare_monthly_report':
      return npsCall('/api/report/monthly', {
        yearMonth: args.yearMonth,
        employees: args.employees,
      });

    case 'report_acquisition':
      return npsCall('/api/report/acquisition', { employees: args.employees });

    case 'report_loss':
      return npsCall('/api/report/loss', { employees: args.employees });

    case 'get_payment_history':
      return npsCall('/api/payment/history', {
        fromYearMonth: args.fromYearMonth ?? `${new Date().getFullYear()}01`,
        toYearMonth:   args.toYearMonth   ?? `${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}`,
      });

    case 'get_certificate':
      return npsCall('/api/certificate/issue', {
        certType:  args.certType,
        yearMonth: args.yearMonth,
        ...(args.empNo ? { empNo: args.empNo } : {}),
      });

    default:
      throw new Error(`알 수 없는 툴: ${name}`);
  }
}

// ── 서버 초기화 ───────────────────────────────────────────
const server = new Server(
  { name: 'nps-edi-mcp', version: '0.1.0' },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: args = {} } = req.params;
  try {
    const result = await handleTool(name, args as Record<string, unknown>);
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      content: [{ type: 'text', text: `오류: ${msg}` }],
      isError: true,
    };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
console.error('국민연금 EDI MCP 서버 시작됨 (stdio)');
