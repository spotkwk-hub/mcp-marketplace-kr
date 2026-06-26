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

// 결제 테이블
db.exec(`
  CREATE TABLE IF NOT EXISTS payments (
    payment_key   TEXT PRIMARY KEY,
    order_id      TEXT NOT NULL UNIQUE,
    amount        INTEGER NOT NULL,
    status        TEXT NOT NULL DEFAULT 'READY',
    buyer_name    TEXT,
    buyer_email   TEXT,
    buyer_biz_no  TEXT,
    method        TEXT,
    raw_response  TEXT,
    created_at    TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

// 세금계산서 발행 이력 테이블
db.exec(`
  CREATE TABLE IF NOT EXISTS tax_invoices (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    payment_key      TEXT NOT NULL REFERENCES payments(payment_key),
    invoice_no       TEXT,
    supplier_biz_no  TEXT NOT NULL,
    recipient_biz_no TEXT NOT NULL,
    supply_amount    INTEGER NOT NULL,
    tax_amount       INTEGER NOT NULL,
    item_name        TEXT NOT NULL,
    issue_date       TEXT NOT NULL,
    status           TEXT NOT NULL DEFAULT 'PENDING',
    error_message    TEXT,
    issued_at        TEXT,
    created_at       TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

// ── 결제 헬퍼 ──────────────────────────────────────────────
export type PaymentRow = {
  payment_key: string;
  order_id: string;
  amount: number;
  status: string;
  buyer_name: string | null;
  buyer_email: string | null;
  buyer_biz_no: string | null;
  method: string | null;
  raw_response: string | null;
  created_at: string;
  updated_at: string;
};

const stmtInsertPayment = db.prepare<[string, string, number, string, string|null, string|null, string|null, string|null, string|null]>(`
  INSERT OR REPLACE INTO payments
    (payment_key, order_id, amount, status, buyer_name, buyer_email, buyer_biz_no, method, raw_response, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
`);

const stmtGetPayment = db.prepare<[string], PaymentRow>(
  'SELECT * FROM payments WHERE payment_key = ?'
);

export function upsertPayment(p: {
  paymentKey: string;
  orderId: string;
  amount: number;
  status: string;
  buyerName?: string;
  buyerEmail?: string;
  buyerBizNo?: string;
  method?: string;
  rawResponse?: string;
}) {
  stmtInsertPayment.run(
    p.paymentKey, p.orderId, p.amount, p.status,
    p.buyerName ?? null, p.buyerEmail ?? null, p.buyerBizNo ?? null,
    p.method ?? null, p.rawResponse ?? null,
  );
}

export function getPayment(paymentKey: string): PaymentRow | undefined {
  return stmtGetPayment.get(paymentKey);
}

// ── 세금계산서 헬퍼 ────────────────────────────────────────
export type InvoiceRow = {
  id: number;
  payment_key: string;
  invoice_no: string | null;
  supplier_biz_no: string;
  recipient_biz_no: string;
  supply_amount: number;
  tax_amount: number;
  item_name: string;
  issue_date: string;
  status: string;
  error_message: string | null;
  issued_at: string | null;
  created_at: string;
};

const stmtInsertInvoice = db.prepare<[string, string, string, number, number, string, string]>(`
  INSERT INTO tax_invoices
    (payment_key, supplier_biz_no, recipient_biz_no, supply_amount, tax_amount, item_name, issue_date)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

const stmtUpdateInvoice = db.prepare<[string, string | null, string | null, number, string]>(`
  UPDATE tax_invoices
  SET status = ?, invoice_no = ?, error_message = ?, issued_at = CASE WHEN ? = 1 THEN datetime('now') ELSE NULL END
  WHERE id = (SELECT MAX(id) FROM tax_invoices WHERE payment_key = ?)
`);

const stmtGetInvoicesByPayment = db.prepare<[string], InvoiceRow>(
  'SELECT * FROM tax_invoices WHERE payment_key = ? ORDER BY id DESC'
);

export function createInvoiceRecord(p: {
  paymentKey: string;
  supplierBizNo: string;
  recipientBizNo: string;
  supplyAmount: number;
  taxAmount: number;
  itemName: string;
  issueDate: string;
}): number {
  const result = stmtInsertInvoice.run(
    p.paymentKey, p.supplierBizNo, p.recipientBizNo,
    p.supplyAmount, p.taxAmount, p.itemName, p.issueDate,
  );
  return result.lastInsertRowid as number;
}

export function updateInvoiceStatus(paymentKey: string, status: 'ISSUED' | 'FAILED', invoiceNo?: string, errorMsg?: string) {
  stmtUpdateInvoice.run(status, invoiceNo ?? null, errorMsg ?? null, status === 'ISSUED' ? 1 : 0, paymentKey);
}

export function getInvoicesByPayment(paymentKey: string): InvoiceRow[] {
  return stmtGetInvoicesByPayment.all(paymentKey);
}

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
