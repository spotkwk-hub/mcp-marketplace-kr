import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

import { createUCBState, selectArm, updateArm, getArmStats } from "./ucb-router.js";
import { evaluateQuality, formatScore } from "./quality-eval.js";
import { runGCRLoop, formatGCRReport } from "./gcr-loop.js";
import { compressPrompt } from "./optimizer.js";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const ucbState = createUCBState(1.4);

const server = new McpServer({
  name: "outcome-maxxing-mcp",
  version: "2.0.0",
});

// Zod 스키마를 변수로 분리 — TS2589(타입 추론 깊이 초과) 방지
const OutcomeQuerySchema = {
  goal: z.string().describe("달성하려는 목표 (품질 평가 기준)"),
  prompt: z.string().describe("LLM에게 보낼 프롬프트"),
  system: z.string().optional().describe("시스템 프롬프트 (선택)"),
  max_iterations: z.number().int().min(1).max(5).optional().describe("최대 반복 횟수 (기본 3)"),
  quality_threshold: z.number().min(0).max(1).optional().describe("수렴 품질 임계값 0-1 (기본 0.75)"),
  max_tokens: z.number().int().optional().describe("응답 최대 토큰 (기본 1024)"),
};

const UCBQuerySchema = {
  prompt: z.string().describe("쿼리 프롬프트"),
  system: z.string().optional().describe("시스템 프롬프트"),
  compress: z.boolean().optional().describe("프롬프트 자동 압축 (기본 true)"),
  max_tokens: z.number().int().optional().describe("최대 토큰 (기본 1024)"),
};

const EvalSchema = {
  goal: z.string().describe("달성 목표"),
  response: z.string().describe("평가할 응답 텍스트"),
  output_tokens: z.number().int().optional().describe("응답 생성에 사용된 토큰 수 (기본 256)"),
};

const CompressSchema = {
  prompt: z.string().describe("압축할 프롬프트"),
};

// ── Tool 1: outcome_query ────────────────────────────────────────────────────
server.tool(
  "outcome_query",
  "UCB 자율 라우터 + GCR 루프 + 자율 품질 평가로 목표 달성까지 반복 실행",
  OutcomeQuerySchema,
  async ({ goal, prompt, system, max_iterations, quality_threshold, max_tokens }) => {
    const result = await runGCRLoop(client, ucbState, goal, prompt, {
      maxIterations: max_iterations ?? 3,
      qualityThreshold: quality_threshold ?? 0.75,
      systemPrompt: system,
      maxTokens: max_tokens ?? 1024,
    });
    return { content: [{ type: "text", text: formatGCRReport(result) }] };
  }
);

// ── Tool 2: ucb_query ────────────────────────────────────────────────────────
server.tool(
  "ucb_query",
  "UCB로 최적 모델 자동 선택 후 단발 쿼리 (GCR 루프 없음)",
  UCBQuerySchema,
  async ({ prompt, system, compress, max_tokens }) => {
    const effectivePrompt = (compress !== false) ? compressPrompt(prompt).compressed : prompt;
    const arm = selectArm(ucbState);

    const resp = await client.messages.create({
      model: arm.id,
      max_tokens: max_tokens ?? 1024,
      ...(system ? { system } : {}),
      messages: [{ role: "user", content: effectivePrompt }],
    });

    const text = resp.content[0]?.type === "text" ? resp.content[0].text : "";
    const { input_tokens: inp, output_tokens: out } = resp.usage;
    const cost = (inp * arm.costPer1MInput + out * arm.costPer1MOutput) / 1_000_000;

    updateArm(ucbState, arm.id, 0.7);

    return {
      content: [{
        type: "text",
        text: `${text}\n\n---\n모델: ${arm.label} (UCB 선택) | 토큰: ${inp}+${out} | 비용: $${cost.toFixed(6)}`,
      }],
    };
  }
);

// ── Tool 3: evaluate_quality ─────────────────────────────────────────────────
server.tool(
  "evaluate_quality",
  "응답 품질을 목표 대비 자율 평가 (판정 모델: Haiku)",
  EvalSchema,
  async ({ goal, response, output_tokens }) => {
    const score = await evaluateQuality(client, goal, response, output_tokens ?? 256);
    return { content: [{ type: "text", text: formatScore(score) }] };
  }
);

// ── Tool 4: ucb_stats ────────────────────────────────────────────────────────
server.tool(
  "ucb_stats",
  "UCB 모델 선택 통계 및 평균 보상 조회",
  {},
  async () => ({ content: [{ type: "text", text: getArmStats(ucbState) }] })
);

// ── Tool 5: compress_prompt ──────────────────────────────────────────────────
server.tool(
  "compress_prompt",
  "프롬프트 압축 — 불필요한 표현 제거로 토큰 절감",
  CompressSchema,
  async ({ prompt }) => {
    const r = compressPrompt(prompt);
    return {
      content: [{
        type: "text",
        text: `## 압축 결과\n\n**원본** (≈${r.originalTokens} 토큰):\n${r.original}\n\n**압축** (≈${r.compressedTokens} 토큰):\n${r.compressed}\n\n**절감: ${r.reductionPct}%**`,
      }],
    };
  }
);

// ── Tool 6: reset_ucb ───────────────────────────────────────────────────────
server.tool(
  "reset_ucb",
  "UCB 학습 상태 초기화 (새 세션 시작)",
  {},
  async () => {
    Object.assign(ucbState, createUCBState(1.4));
    return { content: [{ type: "text", text: "UCB 상태 초기화 완료." }] };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
console.error("Outcome Maxxing MCP 서버 v2.0 시작됨");
