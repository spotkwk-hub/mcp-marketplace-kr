import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import Anthropic from "@anthropic-ai/sdk";

import { createUCBState, selectArm, updateArm, getArmStats } from "./ucb-router.js";
import { evaluateQuality, formatScore } from "./quality-eval.js";
import { runGCRLoop, formatGCRReport } from "./gcr-loop.js";
import { compressPrompt } from "./optimizer.js";
import { saveEvaluation, getAggStats, getRecentEvaluations, getModelDistribution } from "./db.js";
import { SessionStats, inlineEfficiencyBar } from "./visualize.js";

const client  = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const ucbState = createUCBState(1.4);
const session  = new SessionStats();

// Sonnet 기준선 비용 추정 (입력 토큰 수 기준)
function baselineEstimate(inputTokens: number, outputTokens: number) {
  return {
    baselineTokens: Math.round((inputTokens + outputTokens) * 1.05), // Sonnet은 약간 더 verbose
    baselineCost:   (inputTokens * 3.0 + outputTokens * 15.0) / 1_000_000,
  };
}

const server = new Server(
  { name: "outcome-maxxing-mcp", version: "2.1.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "outcome_query",
      description: "UCB 자율 라우터 + GCR 루프 + 자율 품질 평가로 목표 달성까지 반복 실행. 결과는 DB에 저장됩니다.",
      inputSchema: {
        type: "object",
        properties: {
          goal:              { type: "string",  description: "달성하려는 목표 (품질 평가 기준)" },
          prompt:            { type: "string",  description: "LLM에게 보낼 프롬프트" },
          system:            { type: "string",  description: "시스템 프롬프트 (선택)" },
          max_iterations:    { type: "number",  description: "최대 반복 횟수 (기본 3)" },
          quality_threshold: { type: "number",  description: "수렴 품질 임계값 0-1 (기본 0.75)" },
          max_tokens:        { type: "number",  description: "응답 최대 토큰 (기본 1024)" },
        },
        required: ["goal", "prompt"],
      },
    },
    {
      name: "ucb_query",
      description: "UCB로 최적 모델 자동 선택 후 단발 쿼리. 결과는 DB에 저장됩니다.",
      inputSchema: {
        type: "object",
        properties: {
          prompt:     { type: "string",  description: "쿼리 프롬프트" },
          system:     { type: "string",  description: "시스템 프롬프트 (선택)" },
          compress:   { type: "boolean", description: "프롬프트 자동 압축 (기본 true)" },
          max_tokens: { type: "number",  description: "최대 토큰 (기본 1024)" },
        },
        required: ["prompt"],
      },
    },
    {
      name: "evaluate_quality",
      description: "응답 품질을 목표 대비 자율 평가 (판정 모델: Haiku)",
      inputSchema: {
        type: "object",
        properties: {
          goal:          { type: "string", description: "달성 목표" },
          response:      { type: "string", description: "평가할 응답 텍스트" },
          output_tokens: { type: "number", description: "응답 토큰 수 (기본 256)" },
        },
        required: ["goal", "response"],
      },
    },
    {
      name: "token_stats",
      description: "실시간 토큰 사용량 시각화 — 현재 세션의 이 MCP vs Sonnet 기준선 비교 차트",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "session_report",
      description: "현재 세션 전체 호출 이력 테이블 (호출별 토큰·비용·품질 점수)",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "evaluation_history",
      description: "DB에 저장된 누적 평가 이력 — 모델별 분포, 평균 토큰/비용/품질 집계",
      inputSchema: {
        type: "object",
        properties: {
          limit: { type: "number", description: "최근 N건 조회 (기본 20)" },
          tool:  { type: "string", description: "툴 필터 (outcome_query / ucb_query)" },
        },
      },
    },
    {
      name: "ucb_stats",
      description: "UCB 팔별 평균 보상·선택 횟수 통계",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "compress_prompt",
      description: "프롬프트 압축 — 불필요한 표현 제거로 토큰 절감",
      inputSchema: {
        type: "object",
        properties: {
          prompt: { type: "string", description: "압축할 프롬프트" },
        },
        required: ["prompt"],
      },
    },
    {
      name: "reset_ucb",
      description: "UCB 학습 상태 초기화 (세션 통계는 유지, DB 이력은 유지)",
      inputSchema: { type: "object", properties: {} },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: args = {} } = req.params;

  // ── outcome_query ─────────────────────────────────────────────────────────
  if (name === "outcome_query") {
    const result = await runGCRLoop(
      client, ucbState,
      String(args.goal),
      String(args.prompt),
      {
        maxIterations:    typeof args.max_iterations    === "number" ? args.max_iterations    : 3,
        qualityThreshold: typeof args.quality_threshold === "number" ? args.quality_threshold : 0.75,
        systemPrompt:     typeof args.system            === "string"  ? args.system            : undefined,
        maxTokens:        typeof args.max_tokens        === "number"  ? args.max_tokens        : 1024,
      }
    );

    const lastIter = result.iterations[result.iterations.length - 1];
    const { baselineTokens, baselineCost } = baselineEstimate(
      result.totalInputTokens, result.totalOutputTokens
    );

    // DB 저장
    saveEvaluation({
      tool: "outcome_query",
      goal: String(args.goal),
      modelUsed: lastIter?.model ?? "unknown",
      iterations: result.iterations.length,
      converged: result.convergedAt !== null,
      inputTokens: result.totalInputTokens,
      outputTokens: result.totalOutputTokens,
      costUSD: result.totalCostUSD,
      baselineTokens,
      baselineCost,
      qualityScore:    result.finalScore?.composite,
      goalAlignment:   result.finalScore?.goalAlignment,
      correctness:     result.finalScore?.correctness,
      conciseness:     result.finalScore?.conciseness,
      tokenEfficiency: result.finalScore?.tokenEfficiency,
    });

    // 세션 추가
    session.add({
      tool: "outcome_query",
      modelUsed: lastIter?.model ?? "unknown",
      inputTokens: result.totalInputTokens,
      outputTokens: result.totalOutputTokens,
      costUSD: result.totalCostUSD,
      baselineTokens,
      baselineCost,
      qualityScore: result.finalScore?.composite,
      timestamp: Date.now(),
    });

    const bar = inlineEfficiencyBar({
      mcpInputTokens:  result.totalInputTokens,
      mcpOutputTokens: result.totalOutputTokens,
      baselineTokens,
      mcpCostUSD:      result.totalCostUSD,
      baselineCostUSD: baselineCost,
      qualityScore:    result.finalScore?.composite,
      modelLabel:      lastIter?.modelLabel ?? "?",
      iterations:      result.iterations.length,
    });

    return { content: [{ type: "text", text: formatGCRReport(result) + bar }] };
  }

  // ── ucb_query ─────────────────────────────────────────────────────────────
  if (name === "ucb_query") {
    const compress = args.compress !== false;
    const prompt = String(args.prompt);
    const effectivePrompt = compress ? compressPrompt(prompt).compressed : prompt;
    const arm = selectArm(ucbState);

    const resp = await client.messages.create({
      model: arm.id,
      max_tokens: typeof args.max_tokens === "number" ? args.max_tokens : 1024,
      ...(typeof args.system === "string" ? { system: args.system } : {}),
      messages: [{ role: "user", content: effectivePrompt }],
    });
    const text = resp.content[0]?.type === "text" ? resp.content[0].text : "";
    const { input_tokens: inp, output_tokens: out } = resp.usage;
    const costUSD = (inp * arm.costPer1MInput + out * arm.costPer1MOutput) / 1_000_000;
    const { baselineTokens, baselineCost } = baselineEstimate(inp, out);

    updateArm(ucbState, arm.id, 0.7);

    saveEvaluation({
      tool: "ucb_query",
      modelUsed: arm.id,
      iterations: 1,
      converged: true,
      inputTokens: inp,
      outputTokens: out,
      costUSD,
      baselineTokens,
      baselineCost,
    });

    session.add({
      tool: "ucb_query",
      modelUsed: arm.id,
      inputTokens: inp,
      outputTokens: out,
      costUSD,
      baselineTokens,
      baselineCost,
      timestamp: Date.now(),
    });

    const bar = inlineEfficiencyBar({
      mcpInputTokens:  inp,
      mcpOutputTokens: out,
      baselineTokens,
      mcpCostUSD:      costUSD,
      baselineCostUSD: baselineCost,
      modelLabel:      arm.label,
    });

    return {
      content: [{
        type: "text",
        text: `${text}${bar}`,
      }],
    };
  }

  // ── evaluate_quality ──────────────────────────────────────────────────────
  if (name === "evaluate_quality") {
    const score = await evaluateQuality(
      client,
      String(args.goal),
      String(args.response),
      typeof args.output_tokens === "number" ? args.output_tokens : 256
    );
    return { content: [{ type: "text", text: formatScore(score) }] };
  }

  // ── token_stats ───────────────────────────────────────────────────────────
  if (name === "token_stats") {
    const dbStats = getAggStats();
    const sessionViz = session.render();

    let dbSection = "";
    if (dbStats.totalCalls > 0) {
      dbSection = [
        "",
        "╔══════════════════════════════════════════════╗",
        "║     누적 DB 통계 (전체 세션 합산)               ║",
        "╚══════════════════════════════════════════════╝",
        "",
        `  총 호출: ${dbStats.totalCalls}회`,
        `  평균 토큰  이 MCP: ${dbStats.avgTotalTokens.toLocaleString()}  기준선: ${dbStats.avgBaselineTokens.toLocaleString()}  절감: ▼${dbStats.tokenSavingsPct}%`,
        `  평균 비용  이 MCP: $${dbStats.avgCostUSD.toFixed(6)}  기준선: $${dbStats.avgBaselineCost.toFixed(6)}  절감: ▼${dbStats.costSavingsPct}%`,
        dbStats.avgQualityScore != null
          ? `  평균 품질 점수: ${(dbStats.avgQualityScore * 100).toFixed(0)}%`
          : "",
        `  수렴률: ${dbStats.convergenceRate}%`,
      ].filter(Boolean).join("\n");
    }

    return { content: [{ type: "text", text: sessionViz + dbSection }] };
  }

  // ── session_report ────────────────────────────────────────────────────────
  if (name === "session_report") {
    return { content: [{ type: "text", text: session.renderHistory() }] };
  }

  // ── evaluation_history ────────────────────────────────────────────────────
  if (name === "evaluation_history") {
    const limit = typeof args.limit === "number" ? args.limit : 20;
    const tool  = typeof args.tool  === "string"  ? args.tool  : undefined;

    const agg     = getAggStats(tool);
    const recent  = getRecentEvaluations(limit) as Array<Record<string, unknown>>;
    const models  = getModelDistribution()       as Array<Record<string, unknown>>;

    const header = tool
      ? `평가 이력 — ${tool} (최근 ${limit}건)`
      : `평가 이력 — 전체 (최근 ${limit}건)`;

    const aggLines = [
      `  총 호출: ${agg.totalCalls}회`,
      `  평균 토큰 절감: ▼${agg.tokenSavingsPct}%  |  평균 비용 절감: ▼${agg.costSavingsPct}%`,
      agg.avgQualityScore != null
        ? `  평균 품질 점수: ${(agg.avgQualityScore * 100).toFixed(0)}%`
        : "",
      `  수렴률: ${agg.convergenceRate}%`,
    ].filter(Boolean).join("\n");

    const modelLines = models.map(m =>
      `  ${String(m.model_used).split("-")[1]?.padEnd(8) ?? "?"} | ${m.calls}회 | 평균 ${Math.round(Number(m.avg_tokens))} tok | $${Number(m.avg_cost).toFixed(6)}`
    ).join("\n");

    const recLines = recent.length === 0 ? "  (기록 없음)" : recent.map(r =>
      `  ${String(r.created_at).slice(5, 16)}  ${String(r.tool).padEnd(13)}  ` +
      `${String(r.model_used).split("-")[1]?.padEnd(7) ?? "?"}  ` +
      `${String(r.total_tokens).padStart(5)} tok  ` +
      `$${Number(r.cost_usd).toFixed(6)}  ` +
      (r.quality_score != null ? `${(Number(r.quality_score) * 100).toFixed(0)}%` : "  -")
    ).join("\n");

    const text = [
      `## ${header}`,
      "",
      "### 집계 통계",
      aggLines,
      "",
      "### 모델별 사용 분포",
      modelLines || "  (기록 없음)",
      "",
      "### 최근 호출 이력",
      "  날짜/시간      툴             모델      토큰     비용        품질",
      "  " + "─".repeat(68),
      recLines,
    ].join("\n");

    return { content: [{ type: "text", text }] };
  }

  // ── ucb_stats ─────────────────────────────────────────────────────────────
  if (name === "ucb_stats") {
    return { content: [{ type: "text", text: getArmStats(ucbState) }] };
  }

  // ── compress_prompt ───────────────────────────────────────────────────────
  if (name === "compress_prompt") {
    const r = compressPrompt(String(args.prompt));
    return {
      content: [{
        type: "text",
        text: `## 압축 결과\n\n**원본** (≈${r.originalTokens} 토큰):\n${r.original}\n\n**압축** (≈${r.compressedTokens} 토큰):\n${r.compressed}\n\n**절감: ${r.reductionPct}%**`,
      }],
    };
  }

  // ── reset_ucb ─────────────────────────────────────────────────────────────
  if (name === "reset_ucb") {
    Object.assign(ucbState, createUCBState(1.4));
    return { content: [{ type: "text", text: "UCB 상태 초기화 완료. (DB 이력 및 세션 통계는 유지됩니다)" }] };
  }

  throw new Error(`Unknown tool: ${name}`);
});

const transport = new StdioServerTransport();
await server.connect(transport);
console.error("Outcome Maxxing MCP 서버 v2.1 시작됨");
