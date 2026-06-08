#!/usr/bin/env node
// =============================================================
// @mcp-kr/publicdata-mcp — 행정안전부 공공데이터포털 MCP 서버
// 환경 변수: PUBLIC_DATA_API_KEY (공공데이터포털 서비스 인증키)
// =============================================================
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';

const server = new Server(
  { name: 'publicdata-mcp', version: '0.1.0' },
  { capabilities: { tools: {} } }
);

const API_KEY = process.env.PUBLIC_DATA_API_KEY ?? '';

async function dataFetch(url: string, params: Record<string, string> = {}) {
  const u = new URL(url);
  u.searchParams.set('serviceKey', API_KEY);
  u.searchParams.set('_type', 'json');
  Object.entries(params).forEach(([k, v]) => u.searchParams.set(k, v));
  const res = await fetch(u.toString());
  if (!res.ok) throw new Error(`공공데이터 API 오류: ${res.status} ${res.statusText}`);
  return res.json();
}

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'get_weather',
      description: '기상청 단기예보 조회 (격자 좌표 기반)',
      inputSchema: {
        type: 'object',
        properties: {
          nx: { type: 'string', description: '격자 X 좌표 (예: 55 → 서울)' },
          ny: { type: 'string', description: '격자 Y 좌표 (예: 127 → 서울)' },
          base_date: { type: 'string', description: '발표일자 YYYYMMDD' },
          base_time: { type: 'string', description: '발표시각 HHmm (예: 0500)' },
        },
        required: ['nx', 'ny', 'base_date', 'base_time'],
      },
    },
    {
      name: 'get_bus_arrival',
      description: '버스 실시간 도착 정보 조회',
      inputSchema: {
        type: 'object',
        properties: {
          city_code:  { type: 'string', description: '도시 코드 (예: 25 → 서울)' },
          node_id:    { type: 'string', description: '정류소 ID' },
        },
        required: ['city_code', 'node_id'],
      },
    },
    {
      name: 'get_subway_info',
      description: '지하철 실시간 열차 위치 조회 (서울)',
      inputSchema: {
        type: 'object',
        properties: {
          line_name: { type: 'string', description: '노선명 (예: 1호선)' },
        },
        required: ['line_name'],
      },
    },
    {
      name: 'get_real_estate_price',
      description: '아파트 매매 실거래가 조회',
      inputSchema: {
        type: 'object',
        properties: {
          lawd_cd:  { type: 'string', description: '법정동 코드 앞 5자리 (예: 11110 → 서울 종로구)' },
          deal_ymd: { type: 'string', description: '계약월 YYYYMM' },
        },
        required: ['lawd_cd', 'deal_ymd'],
      },
    },
    {
      name: 'get_population_stats',
      description: '주민등록 인구통계 조회',
      inputSchema: {
        type: 'object',
        properties: {
          adm_cd:   { type: 'string', description: '행정구역 코드' },
          year_mo:  { type: 'string', description: '기준 연월 YYYYMM' },
        },
        required: ['adm_cd', 'year_mo'],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: args = {} } = req.params;
  try {
    if (!API_KEY) throw new Error('PUBLIC_DATA_API_KEY 환경 변수가 설정되지 않았습니다.');

    if (name === 'get_weather') {
      const data = await dataFetch(
        'http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst',
        { numOfRows: '100', pageNo: '1', dataType: 'JSON',
          base_date: args.base_date as string, base_time: args.base_time as string,
          nx: args.nx as string, ny: args.ny as string }
      );
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
    if (name === 'get_bus_arrival') {
      const data = await dataFetch(
        'http://apis.data.go.kr/1613000/ArvlInfoInqireService/getSttnAcctoArvlPrearngeInfoList',
        { cityCode: args.city_code as string, nodeId: args.node_id as string }
      );
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
    if (name === 'get_subway_info') {
      const data = await dataFetch(
        'http://swopenAPI.seoul.go.kr/api/subway/' + API_KEY + '/json/realtimePosition/0/50/' + encodeURIComponent(args.line_name as string)
      );
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
    if (name === 'get_real_estate_price') {
      const data = await dataFetch(
        'http://apis.data.go.kr/1613000/RTMSDataSvcAptTradeDev/getRTMSDataSvcAptTradeDev',
        { LAWD_CD: args.lawd_cd as string, DEAL_YMD: args.deal_ymd as string, numOfRows: '100' }
      );
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
    if (name === 'get_population_stats') {
      const data = await dataFetch(
        'http://apis.data.go.kr/1741000/regnPopService1/regnPopService1',
        { admCd: args.adm_cd as string, yearMonth: args.year_mo as string }
      );
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
    throw new Error(`알 수 없는 도구: ${name}`);
  } catch (e) {
    return { content: [{ type: 'text', text: `오류: ${(e as Error).message}` }], isError: true };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
