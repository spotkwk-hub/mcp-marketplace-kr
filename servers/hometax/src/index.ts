#!/usr/bin/env node
// =============================================================
// @mcp-kr/hometax-mcp — 국세청 홈택스 Open API MCP 서버
// 환경 변수: HOMETAX_API_KEY (홈택스 Open API 인증키)
// =============================================================
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';

const server = new Server(
  { name: 'hometax-mcp', version: '0.1.0' },
  { capabilities: { tools: {} } }
);

const API_KEY = process.env.HOMETAX_API_KEY ?? '';
const BASE    = 'https://api.hometax.go.kr/v1';

async function htFetch(path: string, params: Record<string, string> = {}) {
  const url = new URL(`${BASE}${path}`);
  url.searchParams.set('serviceKey', API_KEY);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`홈택스 API 오류: ${res.status} ${res.statusText}`);
  return res.json();
}

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'verify_business_registration',
      description: '사업자등록번호 진위 확인 — 사업자 상태(정상/휴업/폐업) 조회',
      inputSchema: {
        type: 'object',
        properties: {
          biz_no: { type: 'string', description: '사업자등록번호 (하이픈 없이 10자리)' },
        },
        required: ['biz_no'],
      },
    },
    {
      name: 'issue_e_tax_invoice',
      description: '전자세금계산서 발행',
      inputSchema: {
        type: 'object',
        properties: {
          supplier_biz_no:   { type: 'string', description: '공급자 사업자등록번호' },
          recipient_biz_no:  { type: 'string', description: '공급받는자 사업자등록번호' },
          supply_amount:     { type: 'number', description: '공급가액 (원)' },
          tax_amount:        { type: 'number', description: '세액 (원)' },
          issue_date:        { type: 'string', description: '작성일자 (YYYYMMDD)' },
          item_name:         { type: 'string', description: '품목명' },
        },
        required: ['supplier_biz_no', 'recipient_biz_no', 'supply_amount', 'tax_amount', 'issue_date', 'item_name'],
      },
    },
    {
      name: 'get_received_invoices',
      description: '수신 전자세금계산서 목록 조회',
      inputSchema: {
        type: 'object',
        properties: {
          biz_no:     { type: 'string', description: '사업자등록번호' },
          start_date: { type: 'string', description: '조회 시작일 (YYYYMMDD)' },
          end_date:   { type: 'string', description: '조회 종료일 (YYYYMMDD)' },
        },
        required: ['biz_no', 'start_date', 'end_date'],
      },
    },
    {
      name: 'aggregate_vat_data',
      description: '부가세 신고용 데이터 집계 — 과세기간 매출·매입 합계',
      inputSchema: {
        type: 'object',
        properties: {
          biz_no:     { type: 'string', description: '사업자등록번호' },
          tax_period: { type: 'string', description: '과세기간 (예: 2026-1기 → 202601)' },
        },
        required: ['biz_no', 'tax_period'],
      },
    },
    {
      name: 'get_year_end_tax_docs',
      description: '연말정산 간소화 자료 수집',
      inputSchema: {
        type: 'object',
        properties: {
          resident_no: { type: 'string', description: '주민등록번호 (앞 6자리-뒤 7자리)' },
          year:        { type: 'string', description: '귀속연도 (YYYY)' },
        },
        required: ['resident_no', 'year'],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: args = {} } = req.params;
  try {
    if (!API_KEY) throw new Error('HOMETAX_API_KEY 환경 변수가 설정되지 않았습니다.');

    if (name === 'verify_business_registration') {
      const data = await htFetch('/bizInfo', { bizNo: args.biz_no as string });
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
    if (name === 'issue_e_tax_invoice') {
      const body = { supplierBizNo: args.supplier_biz_no, recipientBizNo: args.recipient_biz_no,
        supplyAmount: args.supply_amount, taxAmount: args.tax_amount,
        issueDate: args.issue_date, itemName: args.item_name };
      const res = await fetch(`${BASE}/taxInvoice`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'serviceKey': API_KEY },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
    if (name === 'get_received_invoices') {
      const data = await htFetch('/taxInvoice/received', {
        bizNo: args.biz_no as string, startDate: args.start_date as string, endDate: args.end_date as string,
      });
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
    if (name === 'aggregate_vat_data') {
      const data = await htFetch('/vat/aggregate', { bizNo: args.biz_no as string, taxPeriod: args.tax_period as string });
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
    if (name === 'get_year_end_tax_docs') {
      const data = await htFetch('/yearEndTax', { residentNo: args.resident_no as string, year: args.year as string });
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
    throw new Error(`알 수 없는 도구: ${name}`);
  } catch (e) {
    return { content: [{ type: 'text', text: `오류: ${(e as Error).message}` }], isError: true };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
