#!/usr/bin/env node
// =============================================================
// @mcp-kr/smartstore
// 네이버 스마트스토어 Connect API MCP 서버
//
// 필요 환경변수:
//   SMARTSTORE_CLIENT_ID      — 네이버 커머스 API 클라이언트 ID
//   SMARTSTORE_CLIENT_SECRET  — 네이버 커머스 API 클라이언트 시크릿
// =============================================================

import { Server }               from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type Tool,
} from '@modelcontextprotocol/sdk/types.js';

// ── 인증 토큰 캐시 ─────────────────────────────────────────
let cachedToken: string | null = null;
let tokenExpiry = 0;

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;

  const clientId     = process.env.SMARTSTORE_CLIENT_ID;
  const clientSecret = process.env.SMARTSTORE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('SMARTSTORE_CLIENT_ID, SMARTSTORE_CLIENT_SECRET 환경변수가 필요합니다.');
  }

  const timestamp = Date.now().toString();
  const password  = Buffer.from(`${clientId}_${timestamp}:${clientSecret}`).toString('base64');

  const res = await fetch('https://api.commerce.naver.com/external/v1/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id:     clientId,
      timestamp,
      client_secret_sign: password,
      grant_type:    'client_credentials',
      type:          'SELF',
    }),
  });

  if (!res.ok) throw new Error(`토큰 발급 실패: ${res.status} ${await res.text()}`);
  const data = await res.json() as { access_token: string; expires_in: number };
  cachedToken = data.access_token;
  tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
  return cachedToken;
}

async function apiCall(path: string, options?: RequestInit) {
  const token = await getAccessToken();
  const res   = await fetch(`https://api.commerce.naver.com/external${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options?.headers ?? {}),
    },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`API 오류 ${res.status}: ${text}`);
  return JSON.parse(text);
}

// ── 툴 정의 ───────────────────────────────────────────────
const TOOLS: Tool[] = [
  {
    name: 'get_orders',
    description: '스마트스토어 주문 목록을 조회합니다.',
    inputSchema: {
      type: 'object',
      properties: {
        lastChangedFrom: { type: 'string', description: '조회 시작일시 (yyyy-MM-ddTHH:mm:ss)' },
        lastChangedTo:   { type: 'string', description: '조회 종료일시 (yyyy-MM-ddTHH:mm:ss)' },
        orderStatusTypes: {
          type:  'array',
          items: { type: 'string' },
          description: '주문 상태 필터 (PAYMENT_WAITING, PAYED, DELIVERING, DELIVERED 등)',
        },
        page:  { type: 'number', description: '페이지 번호 (1~)' },
        limit: { type: 'number', description: '페이지 크기 (최대 300)' },
      },
    },
  },
  {
    name: 'get_order_detail',
    description: '특정 주문의 상세 정보를 조회합니다.',
    inputSchema: {
      type: 'object',
      required: ['orderId'],
      properties: {
        orderId: { type: 'string', description: '주문번호' },
      },
    },
  },
  {
    name: 'get_products',
    description: '스마트스토어 상품 목록을 조회합니다.',
    inputSchema: {
      type: 'object',
      properties: {
        page:    { type: 'number', description: '페이지 번호 (1~)' },
        size:    { type: 'number', description: '페이지 크기 (최대 100)' },
        keyword: { type: 'string', description: '상품명 검색 키워드' },
        statusTypes: {
          type:  'array',
          items: { type: 'string' },
          description: '상품 상태 필터 (SALE, SUSPENSION, OUTOFSTOCK 등)',
        },
      },
    },
  },
  {
    name: 'get_product_detail',
    description: '특정 상품의 상세 정보를 조회합니다.',
    inputSchema: {
      type: 'object',
      required: ['productId'],
      properties: {
        productId: { type: 'string', description: '상품 ID' },
      },
    },
  },
  {
    name: 'update_product_stock',
    description: '상품 재고 수량을 수정합니다.',
    inputSchema: {
      type: 'object',
      required: ['productId', 'stockQuantity'],
      properties: {
        productId:     { type: 'string', description: '상품 ID' },
        stockQuantity: { type: 'number', description: '변경할 재고 수량' },
        optionId:      { type: 'string', description: '옵션 ID (옵션 상품인 경우)' },
      },
    },
  },
  {
    name: 'dispatch_order',
    description: '주문을 발송 처리합니다.',
    inputSchema: {
      type: 'object',
      required: ['orderId', 'deliveryCompanyCode', 'trackingNumber'],
      properties: {
        orderId:             { type: 'string', description: '주문번호' },
        deliveryCompanyCode: { type: 'string', description: '택배사 코드 (CJ대한통운: CJGLS, 한진: HANJIN 등)' },
        trackingNumber:      { type: 'string', description: '운송장 번호' },
      },
    },
  },
  {
    name: 'get_settlements',
    description: '정산 내역을 조회합니다.',
    inputSchema: {
      type: 'object',
      properties: {
        settleDateFrom: { type: 'string', description: '정산 시작일 (yyyyMMdd)' },
        settleDateTo:   { type: 'string', description: '정산 종료일 (yyyyMMdd)' },
        page:  { type: 'number', description: '페이지 번호 (1~)' },
        limit: { type: 'number', description: '페이지 크기 (최대 100)' },
      },
    },
  },
  {
    name: 'get_reviews',
    description: '상품 리뷰 목록을 조회합니다.',
    inputSchema: {
      type: 'object',
      properties: {
        productId:   { type: 'string', description: '상품 ID (미입력 시 전체)' },
        page:        { type: 'number', description: '페이지 번호 (1~)' },
        limit:       { type: 'number', description: '페이지 크기 (최대 50)' },
        hasComment:  { type: 'boolean', description: '댓글 미작성 리뷰만 조회' },
      },
    },
  },
];

// ── 툴 핸들러 ─────────────────────────────────────────────
async function handleTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    case 'get_orders': {
      const params = new URLSearchParams();
      if (args.lastChangedFrom) params.set('lastChangedFrom', String(args.lastChangedFrom));
      if (args.lastChangedTo)   params.set('lastChangedTo',   String(args.lastChangedTo));
      if (Array.isArray(args.orderStatusTypes)) {
        args.orderStatusTypes.forEach((s: unknown) => params.append('orderStatusTypes', String(s)));
      }
      params.set('page',  String(args.page  ?? 1));
      params.set('limit', String(Math.min(300, Number(args.limit ?? 50))));
      return apiCall(`/v1/pay-order/seller/orders/last-changed-statuses?${params}`);
    }

    case 'get_order_detail':
      return apiCall(`/v1/pay-order/seller/orders/${args.orderId}`);

    case 'get_products': {
      const params = new URLSearchParams();
      params.set('page', String(args.page ?? 1));
      params.set('size', String(Math.min(100, Number(args.size ?? 50))));
      if (args.keyword) params.set('keyword', String(args.keyword));
      if (Array.isArray(args.statusTypes)) {
        args.statusTypes.forEach((s: unknown) => params.append('statusTypes', String(s)));
      }
      return apiCall(`/v2/products?${params}`);
    }

    case 'get_product_detail':
      return apiCall(`/v2/products/${args.productId}`);

    case 'update_product_stock': {
      const body: Record<string, unknown> = { stockQuantity: args.stockQuantity };
      if (args.optionId) body.optionId = args.optionId;
      return apiCall(`/v2/products/${args.productId}/stock`, {
        method: 'PUT',
        body:   JSON.stringify(body),
      });
    }

    case 'dispatch_order':
      return apiCall(`/v1/pay-order/seller/orders/${args.orderId}/dispatch`, {
        method: 'POST',
        body: JSON.stringify({
          dispatchProductOrders: [{
            productOrderId:      args.orderId,
            deliveryCompanyCode: args.deliveryCompanyCode,
            trackingNumber:      args.trackingNumber,
          }],
        }),
      });

    case 'get_settlements': {
      const params = new URLSearchParams();
      if (args.settleDateFrom) params.set('settleDateFrom', String(args.settleDateFrom));
      if (args.settleDateTo)   params.set('settleDateTo',   String(args.settleDateTo));
      params.set('page',  String(args.page  ?? 1));
      params.set('limit', String(Math.min(100, Number(args.limit ?? 50))));
      return apiCall(`/v1/seller/settlements?${params}`);
    }

    case 'get_reviews': {
      const params = new URLSearchParams();
      if (args.productId)  params.set('productId',  String(args.productId));
      if (args.hasComment) params.set('hasComment', 'false');
      params.set('page',  String(args.page  ?? 1));
      params.set('limit', String(Math.min(50, Number(args.limit ?? 20))));
      return apiCall(`/v1/seller/product-reviews?${params}`);
    }

    default:
      throw new Error(`알 수 없는 툴: ${name}`);
  }
}

// ── 서버 초기화 ───────────────────────────────────────────
const server = new Server(
  { name: 'smartstore-mcp', version: '0.1.0' },
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
console.error('스마트스토어 MCP 서버 시작됨 (stdio)');
