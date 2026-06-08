#!/usr/bin/env node
// =============================================================
// @mcp-kr/douzone-icube-mcp — 더존 iCUBE ERP MCP 서버
// 환경 변수: DOUZONE_API_KEY, DOUZONE_COMPANY_CD
// =============================================================
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';
const server = new Server({ name: 'douzone-icube-mcp', version: '0.1.0' }, { capabilities: { tools: {} } });
const API_KEY = process.env.DOUZONE_API_KEY ?? '';
const COMPANY_CD = process.env.DOUZONE_COMPANY_CD ?? '';
const BASE = 'https://ipartner.douzone.com/api/v1';
async function dFetch(path, params = {}) {
    const url = new URL(`${BASE}${path}`);
    url.searchParams.set('apiKey', API_KEY);
    url.searchParams.set('companyCd', COMPANY_CD);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    const res = await fetch(url.toString(), {
        headers: { 'Authorization': `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
    });
    if (!res.ok)
        throw new Error(`더존 iCUBE API 오류: ${res.status} ${res.statusText}`);
    return res.json();
}
server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
        {
            name: 'get_vouchers',
            description: '전표 조회 — 매출/매입/일반 전표 목록',
            inputSchema: {
                type: 'object',
                properties: {
                    voucher_type: { type: 'string', description: '전표 유형 (매출/매입/일반)', enum: ['매출', '매입', '일반'] },
                    start_date: { type: 'string', description: '조회 시작일 YYYYMMDD' },
                    end_date: { type: 'string', description: '조회 종료일 YYYYMMDD' },
                },
                required: ['voucher_type', 'start_date', 'end_date'],
            },
        },
        {
            name: 'create_voucher',
            description: '전표 생성 및 승인 요청',
            inputSchema: {
                type: 'object',
                properties: {
                    voucher_type: { type: 'string', description: '전표 유형' },
                    amount: { type: 'number', description: '금액 (원)' },
                    account_cd: { type: 'string', description: '계정 코드' },
                    memo: { type: 'string', description: '적요' },
                    voucher_date: { type: 'string', description: '전표 일자 YYYYMMDD' },
                },
                required: ['voucher_type', 'amount', 'account_cd', 'voucher_date'],
            },
        },
        {
            name: 'get_financial_summary',
            description: '손익계산서·재무상태표 집계',
            inputSchema: {
                type: 'object',
                properties: {
                    report_type: { type: 'string', description: '보고서 유형 (손익계산서/재무상태표)', enum: ['손익계산서', '재무상태표'] },
                    fiscal_year: { type: 'string', description: '회계연도 (YYYY)' },
                    period: { type: 'string', description: '기간 (월 MM 또는 분기 Q1~Q4)' },
                },
                required: ['report_type', 'fiscal_year'],
            },
        },
        {
            name: 'get_sales_purchase',
            description: '매출·매입 현황 조회',
            inputSchema: {
                type: 'object',
                properties: {
                    type: { type: 'string', description: '구분 (매출/매입)', enum: ['매출', '매입'] },
                    start_date: { type: 'string', description: '시작일 YYYYMMDD' },
                    end_date: { type: 'string', description: '종료일 YYYYMMDD' },
                },
                required: ['type', 'start_date', 'end_date'],
            },
        },
        {
            name: 'get_inventory',
            description: '품목·창고별 재고 현황 조회',
            inputSchema: {
                type: 'object',
                properties: {
                    item_cd: { type: 'string', description: '품목 코드 (전체 조회 시 생략)' },
                    warehouse: { type: 'string', description: '창고 코드 (전체 조회 시 생략)' },
                    base_date: { type: 'string', description: '기준일 YYYYMMDD' },
                },
                required: ['base_date'],
            },
        },
        {
            name: 'get_payroll',
            description: '직원 급여 대장 조회',
            inputSchema: {
                type: 'object',
                properties: {
                    pay_year_mo: { type: 'string', description: '급여 연월 YYYYMM' },
                    dept_cd: { type: 'string', description: '부서 코드 (전체 조회 시 생략)' },
                },
                required: ['pay_year_mo'],
            },
        },
    ],
}));
server.setRequestHandler(CallToolRequestSchema, async (req) => {
    const { name, arguments: args = {} } = req.params;
    try {
        if (!API_KEY)
            throw new Error('DOUZONE_API_KEY 환경 변수가 설정되지 않았습니다.');
        if (!COMPANY_CD)
            throw new Error('DOUZONE_COMPANY_CD 환경 변수가 설정되지 않았습니다.');
        if (name === 'get_vouchers') {
            const data = await dFetch('/accounting/vouchers', {
                voucherType: args.voucher_type,
                startDate: args.start_date, endDate: args.end_date,
            });
            return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
        }
        if (name === 'create_voucher') {
            const res = await fetch(`${BASE}/accounting/vouchers`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ companyCd: COMPANY_CD, voucherType: args.voucher_type,
                    amount: args.amount, accountCd: args.account_cd,
                    memo: args.memo, voucherDate: args.voucher_date }),
            });
            const data = await res.json();
            return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
        }
        if (name === 'get_financial_summary') {
            const data = await dFetch('/finance/summary', {
                reportType: args.report_type, fiscalYear: args.fiscal_year,
                period: args.period ?? '',
            });
            return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
        }
        if (name === 'get_sales_purchase') {
            const data = await dFetch('/sales/summary', {
                type: args.type, startDate: args.start_date, endDate: args.end_date,
            });
            return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
        }
        if (name === 'get_inventory') {
            const data = await dFetch('/inventory/status', {
                baseDate: args.base_date,
                ...(args.item_cd ? { itemCd: String(args.item_cd) } : {}),
                ...(args.warehouse ? { warehouse: String(args.warehouse) } : {}),
            });
            return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
        }
        if (name === 'get_payroll') {
            const data = await dFetch('/hr/payroll', {
                payYearMo: args.pay_year_mo,
                ...(args.dept_cd ? { deptCd: String(args.dept_cd) } : {}),
            });
            return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
        }
        throw new Error(`알 수 없는 도구: ${name}`);
    }
    catch (e) {
        return { content: [{ type: 'text', text: `오류: ${e.message}` }], isError: true };
    }
});
const transport = new StdioServerTransport();
await server.connect(transport);
