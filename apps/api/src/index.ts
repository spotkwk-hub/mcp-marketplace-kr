// ============================================================
// @mcp-kr/api — 한국 특화 MCP 마켓플레이스 REST API
// Framework: Hono  |  Port: 3001
// ============================================================

import { serve } from '@hono/node-server';
import { Hono }  from 'hono';
import { cors }  from 'hono/cors';
import { logger } from 'hono/logger';
import {
  REGISTRY,
  CATEGORIES,
  getById,
  getByCategory,
  getFeatured,
  getSeedServers,
  search,
  type Category,
  type MCPServerMeta,
} from '@mcp-kr/registry';

const app = new Hono();

// ── 미들웨어 ──────────────────────────────────────────────
app.use('*', logger());
app.use('*', cors({ origin: ['http://localhost:3000', 'https://mcp-kr.dev'] }));

// ── 헬스체크 ──────────────────────────────────────────────
app.get('/health', c => c.json({ ok: true, ts: new Date().toISOString() }));

// ── 카테고리 목록 ─────────────────────────────────────────
app.get('/categories', c => c.json(CATEGORIES));

// ── 서버 목록  GET /servers ────────────────────────────────
// Query params:
//   q         : 검색 키워드
//   category  : 카테고리 필터
//   pricing   : free | freemium | paid | enterprise
//   seed      : true  → 시드 서버만
//   featured  : true  → 추천 서버만
//   sort      : installs(기본) | stars | updatedAt
//   page      : 페이지 번호 (1-based, 기본 1)
//   limit     : 페이지 크기 (기본 20)
app.get('/servers', c => {
  const q         = c.req.query('q');
  const category  = c.req.query('category') as Category | undefined;
  const pricing   = c.req.query('pricing');
  const seedOnly  = c.req.query('seed')     === 'true';
  const featOnly  = c.req.query('featured') === 'true';
  const sort      = (c.req.query('sort') ?? 'installs') as 'installs' | 'stars' | 'updatedAt';
  const page      = Math.max(1, Number(c.req.query('page')  ?? 1));
  const limit     = Math.min(100, Math.max(1, Number(c.req.query('limit') ?? 20)));

  let results: MCPServerMeta[] = q ? search(q) : [...REGISTRY];

  if (category) results = results.filter(s => s.category === category);
  if (pricing)  results = results.filter(s => s.pricing === pricing);
  if (seedOnly) results = results.filter(s => s.isSeed);
  if (featOnly) results = results.filter(s => s.featured);

  results.sort((a, b) => {
    if (sort === 'stars')     return b.stars - a.stars;
    if (sort === 'updatedAt') return b.updatedAt.localeCompare(a.updatedAt);
    return b.installs - a.installs;
  });

  const total  = results.length;
  const offset = (page - 1) * limit;
  const items  = results.slice(offset, offset + limit);

  return c.json({
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    items,
  });
});

// ── 서버 단건  GET /servers/:id ───────────────────────────
app.get('/servers/:id', c => {
  const server = getById(c.req.param('id'));
  if (!server) return c.json({ error: 'Server not found' }, 404);
  return c.json(server);
});

// ── 카테고리별  GET /servers/category/:cat ────────────────
app.get('/servers/category/:cat', c => {
  const servers = getByCategory(c.req.param('cat') as Category);
  return c.json({ total: servers.length, items: servers });
});

// ── 추천 서버  GET /featured ──────────────────────────────
app.get('/featured', c => c.json(getFeatured()));

// ── 시드 서버  GET /seed ──────────────────────────────────
app.get('/seed', c => c.json(getSeedServers()));

// ── 설치 config 생성  GET /servers/:id/config ─────────────
app.get('/servers/:id/config', c => {
  const server = getById(c.req.param('id'));
  if (!server) return c.json({ error: 'Server not found' }, 404);

  const config = {
    mcpServers: {
      [server.id]: {
        command: 'npx',
        args: ['-y', server.npmPackage ?? `@mcp-kr/${server.id}`],
        ...(server.pricing !== 'free' && {
          env: { API_KEY: 'YOUR_API_KEY_HERE' },
        }),
      },
    },
  };

  return c.json({
    serverId: server.id,
    configPath: {
      windows: '%APPDATA%\\Claude\\claude_desktop_config.json',
      mac:     '~/Library/Application Support/Claude/claude_desktop_config.json',
    },
    config,
  });
});

// ── 서버 등록 신청  POST /register ───────────────────────
app.post('/register', async c => {
  const body = await c.req.json();
  const required = ['serverName', 'authorName', 'authorEmail', 'businessNumber', 'apiDocsUrl'];
  const missing  = required.filter(k => !body[k]);

  if (missing.length > 0) {
    return c.json({ error: 'Missing required fields', fields: missing }, 400);
  }

  // TODO: DB 저장 + Slack 알림 + 심사 큐 등록
  console.log('[Register] New submission:', body.serverName, body.authorEmail);

  return c.json({
    ok: true,
    message: '등록 신청이 완료되었습니다. 영업일 3일 내 이메일로 연락드립니다.',
    submittedAt: new Date().toISOString(),
  }, 201);
});

// ── 서버 시작 ─────────────────────────────────────────────
const PORT = Number(process.env.PORT ?? 3001);
serve({ fetch: app.fetch, port: PORT }, () => {
  console.log(`🚀 MCP 마켓플레이스 API  http://localhost:${PORT}`);
  console.log(`   등록 서버: ${REGISTRY.length}개`);
});

export default app;
