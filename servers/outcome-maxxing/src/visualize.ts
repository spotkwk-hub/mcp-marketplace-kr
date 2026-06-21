/**
 * ASCII visualization helpers for token/cost comparisons.
 * MCP tools return text, so we render bar charts as Unicode art.
 * Renders as a markdown code block — displays correctly in
 * VS Code (Continue / Copilot Chat) and Claude Code.
 */

const BAR_FULL = "█";
const BAR_EMPTY = "░";
const BAR_WIDTH = 24;

// ── Inline efficiency bar ─────────────────────────────────────────────────
// Appended to every outcome_query / ucb_query response automatically.
export function inlineEfficiencyBar(opts: {
  mcpInputTokens: number;
  mcpOutputTokens: number;
  baselineTokens: number;
  mcpCostUSD: number;
  baselineCostUSD: number;
  qualityScore?: number;
  modelLabel: string;
  iterations?: number;
}): string {
  const {
    mcpInputTokens, mcpOutputTokens, baselineTokens,
    mcpCostUSD, baselineCostUSD, qualityScore, modelLabel, iterations,
  } = opts;

  const mcpTokens = mcpInputTokens + mcpOutputTokens;
  const maxTok    = Math.max(mcpTokens, baselineTokens, 1);
  const maxCost   = Math.max(mcpCostUSD, baselineCostUSD, 0.000001);

  function b(v: number, max: number, w = 20): string {
    const f = Math.round((v / max) * w);
    return BAR_FULL.repeat(f) + BAR_EMPTY.repeat(w - f);
  }

  const tokSave  = Math.round((1 - mcpTokens / Math.max(baselineTokens, 1)) * 100);
  const costSave = Math.round((1 - mcpCostUSD / Math.max(baselineCostUSD, 0.000001)) * 100);
  const iterLabel = iterations && iterations > 1 ? ` (${iterations}회 반복)` : "";

  const lines: string[] = [
    "```",
    "┌─ 효율성 리포트 (vs Sonnet 기준선) " + "─".repeat(22) + "┐",
    `│ 모델   ${modelLabel.padEnd(8)}${iterLabel}`,
    "│",
    `│ 토큰   Sonnet  ${b(baselineTokens, maxTok)}  ${baselineTokens.toLocaleString().padStart(6)}`,
    `│        이 MCP  ${b(mcpTokens,      maxTok)}  ${mcpTokens.toLocaleString().padStart(6)}  ▼${Math.abs(tokSave)}%`,
    "│",
    `│ 비용   Sonnet  ${b(baselineCostUSD, maxCost)}  $${baselineCostUSD.toFixed(6)}`,
    `│        이 MCP  ${b(mcpCostUSD,      maxCost)}  $${mcpCostUSD.toFixed(6)}  ▼${Math.abs(costSave)}%`,
  ];

  if (qualityScore != null) {
    const q = Math.round(qualityScore * 100);
    lines.push("│");
    lines.push(`│ 품질   ${b(q, 100)}  ${q}%`);
  }

  lines.push("└" + "─".repeat(58) + "┘");
  lines.push("```");

  return "\n\n" + lines.join("\n");
}

function bar(value: number, max: number, width = BAR_WIDTH): string {
  const filled = Math.round((value / Math.max(max, 1)) * width);
  return BAR_FULL.repeat(filled) + BAR_EMPTY.repeat(width - filled);
}

function pct(n: number, sign = true): string {
  const s = Math.abs(n).toFixed(0) + "%";
  if (!sign) return s;
  return n >= 0 ? `▼${s}` : `▲${Math.abs(n).toFixed(0)}%`;
}

function money(usd: number): string {
  return `$${usd.toFixed(6)}`;
}

// ── Session stats (current session, in-memory) ────────────────────────────
export interface SessionEntry {
  tool: string;
  modelUsed: string;
  inputTokens: number;
  outputTokens: number;
  costUSD: number;
  baselineTokens: number;
  baselineCost: number;
  qualityScore?: number;
  timestamp: number;
}

export class SessionStats {
  private entries: SessionEntry[] = [];

  add(e: SessionEntry): void {
    this.entries.push(e);
  }

  get count(): number { return this.entries.length; }

  render(): string {
    if (this.entries.length === 0) {
      return "세션 데이터 없음. outcome_query 또는 ucb_query를 먼저 실행하세요.";
    }

    const totalMCP      = this.entries.reduce((s, e) => s + e.inputTokens + e.outputTokens, 0);
    const totalBaseline = this.entries.reduce((s, e) => s + e.baselineTokens, 0);
    const totalCostMCP  = this.entries.reduce((s, e) => s + e.costUSD, 0);
    const totalCostBase = this.entries.reduce((s, e) => s + e.baselineCost, 0);
    const avgQuality    = this.entries.filter(e => e.qualityScore != null)
                              .reduce((s, e, _, a) => s + (e.qualityScore! / a.length), 0);
    const maxTok = Math.max(totalMCP, totalBaseline);

    const tokenSave = Math.round((1 - totalMCP / Math.max(totalBaseline, 1)) * 100);
    const costSave  = Math.round((1 - totalCostMCP / Math.max(totalCostBase, 1)) * 100);

    // Model usage count
    const modelCount: Record<string, number> = {};
    for (const e of this.entries) modelCount[e.modelUsed.split("-")[1] ?? e.modelUsed] = (modelCount[e.modelUsed.split("-")[1] ?? e.modelUsed] ?? 0) + 1;
    const modelSummary = Object.entries(modelCount).map(([k, v]) => `${k}×${v}`).join(" | ");

    const lines: string[] = [
      "╔══════════════════════════════════════════════╗",
      "║     실시간 토큰 효율 모니터 (현재 세션)          ║",
      "╚══════════════════════════════════════════════╝",
      "",
      `  호출 수: ${this.entries.length}회  |  모델: ${modelSummary}`,
      "",
      "  토큰 사용량",
      `  Sonnet 기준선  ${bar(totalBaseline, maxTok)}  ${totalBaseline.toLocaleString()} tok`,
      `  이 MCP         ${bar(totalMCP, maxTok)}  ${totalMCP.toLocaleString()} tok  ${pct(tokenSave)}`,
      "",
      "  비용 (USD)",
      `  Sonnet 기준선  ${bar(totalCostBase, Math.max(totalCostMCP, totalCostBase))}  ${money(totalCostBase)}`,
      `  이 MCP         ${bar(totalCostMCP, Math.max(totalCostMCP, totalCostBase))}  ${money(totalCostMCP)}  ${pct(costSave)}`,
      "",
    ];

    if (avgQuality > 0) {
      const q = Math.round(avgQuality * 100);
      lines.push(`  평균 품질 점수  ${bar(q, 100)}  ${q}%`);
      lines.push("");
    }

    lines.push(`  ┌─ 절감 요약 ${"─".repeat(32)}┐`);
    lines.push(`  │  토큰 절감: ${String(tokenSave + "%").padEnd(6)}  비용 절감: ${String(costSave + "%").padEnd(6)}              │`);
    lines.push(`  └${"─".repeat(44)}┘`);

    return lines.join("\n");
  }

  renderHistory(): string {
    if (this.entries.length === 0) return "세션 기록 없음";
    const header = "  #   도구              모델      토큰   기준   비용        품질";
    const sep    = "  " + "─".repeat(62);
    const rows = this.entries.map((e, i) => {
      const tok  = e.inputTokens + e.outputTokens;
      const tool = e.tool.replace("_", " ").slice(0, 16).padEnd(16);
      const model = (e.modelUsed.split("-")[1] ?? "?").padEnd(7);
      const q = e.qualityScore != null ? `${(e.qualityScore * 100).toFixed(0)}%` : "  -";
      return `  ${String(i + 1).padStart(2)}  ${tool}  ${model}  ${String(tok).padStart(5)}  ${String(e.baselineTokens).padStart(5)}  ${money(e.costUSD)}  ${q}`;
    });
    return [header, sep, ...rows].join("\n");
  }
}
