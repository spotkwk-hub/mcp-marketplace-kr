/**
 * SQLite persistence for evaluation history and token stats.
 * Uses better-sqlite3 (synchronous API — safe in MCP stdio server).
 */
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, "../data");
const DB_PATH = path.join(DATA_DIR, "evaluations.db");

fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS evaluations (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at       TEXT    DEFAULT (datetime('now', 'localtime')),
    tool             TEXT    NOT NULL,
    goal             TEXT,
    model_used       TEXT    NOT NULL,
    iterations       INTEGER NOT NULL DEFAULT 1,
    converged        INTEGER NOT NULL DEFAULT 1,
    input_tokens     INTEGER NOT NULL,
    output_tokens    INTEGER NOT NULL,
    total_tokens     INTEGER NOT NULL,
    cost_usd         REAL    NOT NULL,
    baseline_tokens  INTEGER NOT NULL,
    baseline_cost    REAL    NOT NULL,
    quality_score    REAL,
    goal_alignment   REAL,
    correctness      REAL,
    conciseness      REAL,
    token_efficiency REAL
  );

  CREATE INDEX IF NOT EXISTS idx_eval_created ON evaluations(created_at);
  CREATE INDEX IF NOT EXISTS idx_eval_tool    ON evaluations(tool);
`);

export interface EvalRecord {
  tool: string;
  goal?: string;
  modelUsed: string;
  iterations: number;
  converged: boolean;
  inputTokens: number;
  outputTokens: number;
  costUSD: number;
  baselineTokens: number;
  baselineCost: number;
  qualityScore?: number;
  goalAlignment?: number;
  correctness?: number;
  conciseness?: number;
  tokenEfficiency?: number;
}

const insertStmt = db.prepare(`
  INSERT INTO evaluations
    (tool, goal, model_used, iterations, converged,
     input_tokens, output_tokens, total_tokens, cost_usd,
     baseline_tokens, baseline_cost,
     quality_score, goal_alignment, correctness, conciseness, token_efficiency)
  VALUES
    (@tool, @goal, @modelUsed, @iterations, @converged,
     @inputTokens, @outputTokens, @totalTokens, @costUSD,
     @baselineTokens, @baselineCost,
     @qualityScore, @goalAlignment, @correctness, @conciseness, @tokenEfficiency)
`);

export function saveEvaluation(rec: EvalRecord): void {
  insertStmt.run({
    ...rec,
    totalTokens: rec.inputTokens + rec.outputTokens,
    converged: rec.converged ? 1 : 0,
    goal: rec.goal ?? null,
    qualityScore: rec.qualityScore ?? null,
    goalAlignment: rec.goalAlignment ?? null,
    correctness: rec.correctness ?? null,
    conciseness: rec.conciseness ?? null,
    tokenEfficiency: rec.tokenEfficiency ?? null,
  });
}

export interface AggStats {
  totalCalls: number;
  avgTotalTokens: number;
  avgBaselineTokens: number;
  avgCostUSD: number;
  avgBaselineCost: number;
  avgQualityScore: number | null;
  tokenSavingsPct: number;
  costSavingsPct: number;
  convergenceRate: number;
}

export function getAggStats(tool?: string): AggStats {
  const where = tool ? "WHERE tool = ?" : "";
  const params = tool ? [tool] : [];

  const row = db.prepare(`
    SELECT
      COUNT(*)                                    AS totalCalls,
      AVG(total_tokens)                           AS avgTotalTokens,
      AVG(baseline_tokens)                        AS avgBaselineTokens,
      AVG(cost_usd)                               AS avgCostUSD,
      AVG(baseline_cost)                          AS avgBaselineCost,
      AVG(quality_score)                          AS avgQualityScore,
      AVG(CAST(converged AS REAL))                AS convergenceRate
    FROM evaluations ${where}
  `).get(...params) as Record<string, number | null>;

  const avgTok = row.avgTotalTokens ?? 0;
  const avgBase = row.avgBaselineTokens ?? 1;
  const avgCost = row.avgCostUSD ?? 0;
  const avgBaseCost = row.avgBaselineCost ?? 1;

  return {
    totalCalls:      Number(row.totalCalls ?? 0),
    avgTotalTokens:  Math.round(avgTok),
    avgBaselineTokens: Math.round(avgBase),
    avgCostUSD:      avgCost,
    avgBaselineCost: avgBaseCost,
    avgQualityScore: row.avgQualityScore != null ? Number(row.avgQualityScore) : null,
    tokenSavingsPct: avgBase > 0 ? Math.round((1 - avgTok / avgBase) * 100) : 0,
    costSavingsPct:  avgBaseCost > 0 ? Math.round((1 - avgCost / avgBaseCost) * 100) : 0,
    convergenceRate: Math.round(Number(row.convergenceRate ?? 0) * 100),
  };
}

export function getRecentEvaluations(limit = 20): unknown[] {
  return db.prepare(`
    SELECT id, created_at, tool, model_used, iterations, converged,
           total_tokens, baseline_tokens, cost_usd, baseline_cost,
           quality_score, goal
    FROM evaluations
    ORDER BY created_at DESC
    LIMIT ?
  `).all(limit);
}

export function getModelDistribution(): unknown[] {
  return db.prepare(`
    SELECT model_used,
           COUNT(*)         AS calls,
           AVG(total_tokens) AS avg_tokens,
           AVG(cost_usd)    AS avg_cost
    FROM evaluations
    GROUP BY model_used
    ORDER BY calls DESC
  `).all();
}
