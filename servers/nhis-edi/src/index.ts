#!/usr/bin/env node
// =============================================================
// @mcp-kr/nhis-edi
// 국민건강보험공단 EDI API MCP 서버
//
// 필요 환경변수:
//   NHIS_EDI_CERT_PATH  — 공인인증서(.p12) 경로
//   NHIS_EDI_CERT_PASS  — 인증서 비밀번호
//   NHIS_EDI_BIZ_NO     — 사업장 사업자등록번호
// =============================================================

import { Server }               from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type Tool,
} from '@modelcontextprotocol/sdk/types.js';

const NHIS_BASE = 'https://edi.nhis.or.kr/ems/edi';

async function nhisCall(endpoint: string, body: Record<string, unknown>) {
  const bizNo = process.env.NHIS_EDI_BIZ_NO;
  if (!bizNo) throw new Error('NHIS_EDI_BIZ_NO 환경변수가 필요합니다.');

  const res = await fetch(`${NHIS_BASE}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json;charset=UTF-8' },
    body: JSON.stringify({ bizNo, ...body }),
  });

  if (!res.ok) throw new Error(`건강보험 EDI API 오류: ${res.status} ${await res.text()}`);
  return res.json();
}

// ── 툴 정의 ───────────────────────────────────────────────
const TOOLS: Tool[] = [
  {
    name: 'get_premium_amount',
    description: '사업장의 건강보험·장기요양 월별 보험료를 조회합니다.',
    inputSchema: {
      type: 'object',
      required: ['yearMonth'],
      properties: {
        yearMonth:    { type: 'string', description: '조회 연월 (YYYYMM)' },
        premiumType:  {
          type: 'string',
          description: '보험료 종류 (HEALTH:건강보험, LTCI:장기요양, ALL:전체)',
          default: 'ALL',
        },
      },
    },
  },
  {
    name: 'get_employee_premiums',
    description: '사업장 근로자별 건강보험 부과 내역을 조회합니다.',
    inputSchema: {
      type: 'object',
      required: ['yearMonth'],
      properties: {
        yearMonth: { type: 'string', description: '조회 연월 (YYYYMM)' },
        empName:   { type: 'string', description: '성명 검색 (선택)' },
        page:      { type: 'number', description: '페이지 번호 (1~)' },
        limit:     { type: 'number', description: '페이지 크기 (최대 100)' },
      },
    },
  },
  {
    name: 'report_acquisition',
    description: '신규 직원 건강보험 피부양자 취득 신고를 합니다.',
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
              workHours:       { type: 'number', description: '월 근무시간 (시간)' },
            },
          },
          description: '취득 신고 대상 직원 목록',
        },
      },
    },
  },
  {
    name: 'report_loss',
    description: '퇴직 직원 건강보험 상실 신고를 합니다.',
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
              empNo:      { type: 'string', description: '주민등록번호 (13자리)' },
              empName:    { type: 'string', description: '성명' },
              lossDate:   { type: 'string', description: '상실일 (YYYYMMDD)' },
              lossReason: { type: 'string', description: '상실 사유 (01:퇴직, 02:해고, 03:사망, 04:근무시간감소 등)' },
            },
          },
          description: '상실 신고 대상 직원 목록',
        },
      },
    },
  },
  {
    name: 'declare_annual_report',
    description: '연말 보수총액 신고를 처리합니다 (보수총액신고).',
    inputSchema: {
      type: 'object',
      required: ['reportYear', 'employees'],
      properties: {
        reportYear: { type: 'string', description: '신고 귀속연도 (YYYY)' },
        employees: {
          type:  'array',
          items: {
            type: 'object',
            required: ['empNo', 'empName', 'totalIncome'],
            properties: {
              empNo:        { type: 'string', description: '주민등록번호 (13자리)' },
              empName:      { type: 'string', description: '성명' },
              totalIncome:  { type: 'number', description: '연간 보수 총액 (원)' },
              workDays:     { type: 'number', description: '근무일수' },
            },
          },
          description: '보수총액 신고 대상 직원 목록',
        },
      },
    },
  },
  {
    name: 'get_payment_history',
    description: '건강보험 납부 내역을 조회합니다.',
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
    description: '건강보험 납부 확인서 또는 사업장 가입 확인서를 발급합니다.',
    inputSchema: {
      type: 'object',
      required: ['certType', 'yearMonth'],
      properties: {
        certType:  {
          type: 'string',
          description: '확인서 종류 (PAYMENT:납부확인서, SUBSCRIBE:사업장가입확인서, EMPLOYEE:직장가입자확인서)',
        },
        yearMonth: { type: 'string', description: '기준 연월 (YYYYMM)' },
        empNo:     { type: 'string', description: '특정 직원 주민등록번호 (미입력 시 사업장 전체)' },
      },
    },
  },
  {
    name: 'adjust_premium',
    description: '건강보험료 정산 내역을 조회하고 정산 처리합니다.',
    inputSchema: {
      type: 'object',
      required: ['adjustYear'],
      properties: {
        adjustYear: { type: 'string', description: '정산 귀속연도 (YYYY)' },
        empNo:      { type: 'string', description: '특정 직원 주민등록번호 (미입력 시 전체)' },
      },
    },
  },
];

// ── 툴 핸들러 ─────────────────────────────────────────────
async function handleTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    case 'get_premium_amount':
      return nhisCall('/api/premium/amount', {
        yearMonth:   args.yearMonth,
        premiumType: args.premiumType ?? 'ALL',
      });

    case 'get_employee_premiums':
      return nhisCall('/api/premium/employees', {
        yearMonth: args.yearMonth,
        ...(args.empName ? { empName: args.empName } : {}),
        page:  args.page  ?? 1,
        limit: Math.min(100, Number(args.limit ?? 50)),
      });

    case 'report_acquisition':
      return nhisCall('/api/report/acquisition', { employees: args.employees });

    case 'report_loss':
      return nhisCall('/api/report/loss', { employees: args.employees });

    case 'declare_annual_report':
      return nhisCall('/api/report/annual', {
        reportYear: args.reportYear,
        employees:  args.employees,
      });

    case 'get_payment_history': {
      const now = new Date();
      return nhisCall('/api/payment/history', {
        fromYearMonth: args.fromYearMonth ?? `${now.getFullYear()}01`,
        toYearMonth:   args.toYearMonth   ?? `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`,
      });
    }

    case 'get_certificate':
      return nhisCall('/api/certificate/issue', {
        certType:  args.certType,
        yearMonth: args.yearMonth,
        ...(args.empNo ? { empNo: args.empNo } : {}),
      });

    case 'adjust_premium':
      return nhisCall('/api/premium/adjust', {
        adjustYear: args.adjustYear,
        ...(args.empNo ? { empNo: args.empNo } : {}),
      });

    default:
      throw new Error(`알 수 없는 툴: ${name}`);
  }
}

// ── 서버 초기화 ───────────────────────────────────────────
const server = new Server(
  { name: 'nhis-edi-mcp', version: '0.1.0' },
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
console.error('건강보험 EDI MCP 서버 시작됨 (stdio)');
