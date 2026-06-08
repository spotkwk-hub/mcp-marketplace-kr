import Database from 'better-sqlite3';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdirSync } from 'node:fs';
import { REGISTRY } from '@mcp-kr/registry';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR  = join(__dirname, '..', 'data');
const DB_PATH   = join(DATA_DIR, 'marketplace.db');

mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(DB_PATH);

// WAL 모드: 읽기 성능 향상
db.pragma('journal_mode = WAL');

// 좋아요 테이블 생성
db.exec(`
  CREATE TABLE IF NOT EXISTS likes (
    server_id  TEXT PRIMARY KEY,
    count      INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT    NOT NULL DEFAULT (datetime('now'))
  );
`);

// 신규 서버 seed — 테이블에 없는 서버만 삽입
const insertDefault = db.prepare(`
  INSERT OR IGNORE INTO likes (server_id, count)
  VALUES (?, ?)
`);
const seedAll = db.transaction(() => {
  for (const s of REGISTRY) {
    const initCount = (s as unknown as { likes?: number }).likes ?? 0;
    insertDefault.run(s.id, initCount);
  }
});
seedAll();

// ── 쿼리 헬퍼 ──────────────────────────────────────────────
const stmtGet = db.prepare<[string], { count: number }>(
  'SELECT count FROM likes WHERE server_id = ?'
);

const stmtUpsert = db.prepare<[string, number]>(`
  INSERT INTO likes (server_id, count, updated_at)
  VALUES (?, ?, datetime('now'))
  ON CONFLICT(server_id) DO UPDATE SET
    count      = MAX(0, excluded.count),
    updated_at = excluded.updated_at
`);

export function getLikes(serverId: string): number | null {
  const row = stmtGet.get(serverId);
  return row ? row.count : null;
}

export function addLike(serverId: string, delta: 1 | -1): number | null {
  const row = stmtGet.get(serverId);
  if (!row) return null;
  const next = Math.max(0, row.count + delta);
  stmtUpsert.run(serverId, next);
  return next;
}

export default db;
