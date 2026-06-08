#!/usr/bin/env node
// =============================================================
// @mcp-kr/witax
// 위택스(Wetax) 지방세 API MCP 서버
//
// 필요 환경변수:
//   WETAX_API_KEY   — 행정안전부 위택스 API 키 (공공데이터포털)
//   WETAX_USER_ID   — 위택스 사용자 ID (납세자 인증 사용 시)
// =============================================================

import { Server }               from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type Tool,
} from '@modelcontextprotocol/sdk/types.js';

const BASE_URL = 'https://api.wetax.go.kr/vtx/data/getVtxData.do';

async function apiCall(serviceKey: string, params: Record<string, string>) {
  const url = new URL(BASE_URL);
  url.searchParams.set('serviceKey', serviceKey);
  url.searchParams.set('returnType', 'json');
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`위택스 API 오류: ${res.status} ${await res.text()}`);
  return res.json();
}

// ── 툴 정의 ───────────────────────────────────────────────
const TOOLS: Tool[] = [
  {
    name: 'get_local_tax_info',
    description: '지방세 납부 내역을 조회합니다 (재산세, 자동차세, 주민세 등).',
    inputSchema: {
      type: 'object',
      required: ['bizNo'],
      properties: {
        bizNo:    { type: 'string', description: '사업자등록번호 또는 주민등록번호 (10자리)' },
        taxYear:  { type: 'string', description: '조회 연도 (YYYY, 기본: 현재 연도)' },
        taxType:  {
          type: 'string',
          description: '세목 코드 (11:주민세, 21:재산세, 31:자동차세, 41:지방소득세)',
        },
      },
    },
  },
  {
    name: 'get_vehicle_tax',
    description: '자동차세 조회 및 납부 정보를 반환합니다.',
    inputSchema: {
      type: 'object',
      required: ['vehicleNo'],
      properties: {
        vehicleNo: { type: 'string', description: '자동차 등록번호 (예: 12가3456)' },
        taxYear:   { type: 'string', description: '조회 연도 (YYYY)' },
      },
    },
  },
  {
    name: 'get_property_tax',
    description: '재산세 과세 정보를 조회합니다.',
    inputSchema: {
      type: 'object',
      required: ['ownerNo'],
      properties: {
        ownerNo:    { type: 'string', description: '소유자 주민(법인)등록번호' },
        taxYear:    { type: 'string', description: '조회 연도 (YYYY)' },
        regionCode: { type: 'string', description: '지자체 코드 (5자리, 미입력 시 전국)' },
      },
    },
  },
  {
    name: 'get_resident_tax',
    description: '주민세(개인분·사업소분·종업원분) 납부 정보를 조회합니다.',
    inputSchema: {
      type: 'object',
      required: ['bizNo'],
      properties: {
        bizNo:   { type: 'string', description: '사업자등록번호' },
        taxYear: { type: 'string', description: '조회 연도 (YYYY)' },
        subType: {
          type: 'string',
          description: '주민세 유형 (PERSONAL:개인분, BUSINESS:사업소분, EMPLOYEE:종업원분)',
        },
      },
    },
  },
  {
    name: 'get_local_income_tax',
    description: '지방소득세 신고·납부 내역을 조회합니다.',
    inputSchema: {
      type: 'object',
      required: ['bizNo'],
      properties: {
        bizNo:      { type: 'string', description: '사업자등록번호' },
        taxYear:    { type: 'string', description: '귀속연도 (YYYY)' },
        reportType: {
          type: 'string',
          description: '신고유형 (CORP:법인, IND:개인사업자)',
        },
      },
    },
  },
  {
    name: 'get_payment_virtual_account',
    description: '지방세 고지서 가상계좌를 발급합니다 (납부용).',
    inputSchema: {
      type: 'object',
      required: ['billId'],
      properties: {
        billId: { type: 'string', description: '고지서 ID (전자납부번호)' },
        bank:   {
          type: 'string',
          description: '은행 코드 (004:KB국민, 020:우리, 023:SC제일 등)',
        },
      },
    },
  },
  {
    name: 'check_delinquent_tax',
    description: '지방세 체납 여부를 확인합니다.',
    inputSchema: {
      type: 'object',
      required: ['bizNo'],
      properties: {
        bizNo:      { type: 'string', description: '사업자등록번호 또는 주민등록번호' },
        regionCode: { type: 'string', description: '지자체 코드 (미입력 시 전국 조회)' },
      },
    },
  },
];

// ── 툴 핸들러 ─────────────────────────────────────────────
async function handleTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  const apiKey = process.env.WETAX_API_KEY;
  if (!apiKey) throw new Error('WETAX_API_KEY 환경변수가 필요합니다.');

  const year = String(args.taxYear ?? new Date().getFullYear());

  switch (name) {
    case 'get_local_tax_info':
      return apiCall(apiKey, {
        serviceId: 'VTX001',
        bizNo:     String(args.bizNo),
        taxYear:   year,
        ...(args.taxType ? { taxType: String(args.taxType) } : {}),
      });

    case 'get_vehicle_tax':
      return apiCall(apiKey, {
        serviceId: 'VTX002',
        vehicleNo: String(args.vehicleNo),
        taxYear:   year,
      });

    case 'get_property_tax':
      return apiCall(apiKey, {
        serviceId:  'VTX003',
        ownerNo:    String(args.ownerNo),
        taxYear:    year,
        ...(args.regionCode ? { regionCode: String(args.regionCode) } : {}),
      });

    case 'get_resident_tax':
      return apiCall(apiKey, {
        serviceId: 'VTX004',
        bizNo:     String(args.bizNo),
        taxYear:   year,
        ...(args.subType ? { subType: String(args.subType) } : {}),
      });

    case 'get_local_income_tax':
      return apiCall(apiKey, {
        serviceId:  'VTX005',
        bizNo:      String(args.bizNo),
        taxYear:    year,
        ...(args.reportType ? { reportType: String(args.reportType) } : {}),
      });

    case 'get_payment_virtual_account':
      return apiCall(apiKey, {
        serviceId: 'VTX006',
        billId:    String(args.billId),
        ...(args.bank ? { bank: String(args.bank) } : {}),
      });

    case 'check_delinquent_tax':
      return apiCall(apiKey, {
        serviceId:  'VTX007',
        bizNo:      String(args.bizNo),
        ...(args.regionCode ? { regionCode: String(args.regionCode) } : {}),
      });

    default:
      throw new Error(`알 수 없는 툴: ${name}`);
  }
}

// ── 서버 초기화 ───────────────────────────────────────────
const server = new Server(
  { name: 'witax-mcp', version: '0.1.0' },
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
console.error('위택스 MCP 서버 시작됨 (stdio)');
