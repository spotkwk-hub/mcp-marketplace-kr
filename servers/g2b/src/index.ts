#!/usr/bin/env node
// =============================================================
// @mcp-kr/g2b-mcp — 조달청 나라장터(G2B) MCP 서버
// 환경 변수: G2B_API_KEY (나라장터 Open API 인증키)
// =============================================================
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';

const server = new Server(
  { name: 'g2b-mcp', version: '0.1.0' },
  { capabilities: { tools: {} } }
);

const API_KEY = process.env.G2B_API_KEY ?? '';
const BASE    = 'https://apis.data.go.kr/1230000';

async function g2bFetch(path: string, params: Record<string, string> = {}) {
  const url = new URL(`${BASE}${path}`);
  url.searchParams.set('serviceKey', API_KEY);
  url.searchParams.set('type', 'json');
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`나라장터 API 오류: ${res.status} ${res.statusText}`);
  return res.json();
}

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'search_bid_announcements',
      description: '입찰공고 검색 — 물품/용역/공사 입찰공고 목록 조회',
      inputSchema: {
        type: 'object',
        properties: {
          keyword:    { type: 'string', description: '검색 키워드' },
          bid_type:   { type: 'string', description: '입찰 유형 (물품/용역/공사)', enum: ['물품', '용역', '공사'] },
          start_date: { type: 'string', description: '공고일 시작 YYYYMMDD' },
          end_date:   { type: 'string', description: '공고일 종료 YYYYMMDD' },
          num_of_rows: { type: 'string', description: '결과 건수 (기본 10)', default: '10' },
        },
        required: ['keyword'],
      },
    },
    {
      name: 'get_bid_award_info',
      description: '낙찰 정보 조회',
      inputSchema: {
        type: 'object',
        properties: {
          bid_no:      { type: 'string', description: '입찰공고번호' },
          bid_seq:     { type: 'string', description: '차수 (기본 00)', default: '00' },
        },
        required: ['bid_no'],
      },
    },
    {
      name: 'get_contract_info',
      description: '계약 현황 조회',
      inputSchema: {
        type: 'object',
        properties: {
          contract_no: { type: 'string', description: '계약번호' },
        },
        required: ['contract_no'],
      },
    },
    {
      name: 'get_pre_announcement',
      description: '사전규격 열람 — 조달 사업 사전 규격 조회',
      inputSchema: {
        type: 'object',
        properties: {
          keyword:    { type: 'string', description: '사업명 키워드' },
          start_date: { type: 'string', description: '등록일 시작 YYYYMMDD' },
          end_date:   { type: 'string', description: '등록일 종료 YYYYMMDD' },
        },
        required: ['keyword'],
      },
    },
    {
      name: 'get_user_info',
      description: '나라장터 등록 업체 정보 조회',
      inputSchema: {
        type: 'object',
        properties: {
          biz_no: { type: 'string', description: '사업자등록번호 (10자리)' },
        },
        required: ['biz_no'],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: args = {} } = req.params;
  try {
    if (!API_KEY) throw new Error('G2B_API_KEY 환경 변수가 설정되지 않았습니다.');

    if (name === 'search_bid_announcements') {
      const data = await g2bFetch('/ad/bidpblancList', {
        inqryDiv: '1', inqryBgnDt: args.start_date as string ?? '',
        inqryEndDt: args.end_date as string ?? '',
        bidNtceNm: args.keyword as string,
        numOfRows: args.num_of_rows as string ?? '10',
      });
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
    if (name === 'get_bid_award_info') {
      const data = await g2bFetch('/ad/scsbidList', {
        bidNtceNo: args.bid_no as string, bidNtceOrd: args.bid_seq as string ?? '00',
      });
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
    if (name === 'get_contract_info') {
      const data = await g2bFetch('/cn/cntrctInfoList', { cntrctNo: args.contract_no as string });
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
    if (name === 'get_pre_announcement') {
      const data = await g2bFetch('/ad/preAnncmntList', {
        prdctClsfcNoNm: args.keyword as string,
        inqryBgnDt: args.start_date as string ?? '',
        inqryEndDt: args.end_date as string ?? '',
      });
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
    if (name === 'get_user_info') {
      const data = await g2bFetch('/us/usrInfoList', { bizno: args.biz_no as string });
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
    throw new Error(`알 수 없는 도구: ${name}`);
  } catch (e) {
    return { content: [{ type: 'text', text: `오류: ${(e as Error).message}` }], isError: true };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
