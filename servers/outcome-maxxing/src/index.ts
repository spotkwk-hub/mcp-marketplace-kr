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

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const ucbState = createUCBState(1.4);

const server = new Server(
  { name: "outcome-maxxing-mcp", version: "2.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "outcome_query",
      description: "UCB 자율 라우터 + GCR 루프 + 자율 품질 평가로 목표 달성까지 반복 실행",
      inputSchema: {
        type: "object",
        properties: {
          goal:              { type: "string",  description: "달성하려는 목표 (품질 평가 기준)" },
          prompt:            { type: "string",  description: "LLM에게 보낼 프롬프트" },
          system:            { type: "string",  description: "시스템 프롬프트 (선택)" },
          max_iterations:    { type: "number",  description: "최대 반복 횟수 (기본 3, 최대 5)" },
          quality_threshold: { type: "number",  description: "수렴 품질 임계값 0-1 (기본 0.75)" },
          max_tokens:        { type: "number",  description: "응답 최대 토큰 (기본 1024)" },
        },
        required: ["goal", "prompt"],
      },
    },
    {
      name: "ucb_query",
      description: "UCB로 최적 모델 자동 선택 후 단발 쿼리 (GCR 루프 없음, 빠른 경로)",
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
          output_tokens: { type: "number", description: "응답 생성에 사용된 토큰 수 (기본 256)" },
        },
        required: ["goal", "response"],
      },
    },
    {
      name: "ucb_stats",
      description: "UCB 팔별 평균 보상·선택 횟수 통계 조회",
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
      description: "UCB 학습 상태 초기화 (새 세션 시작)",
      inputSchema: { type: "object", properties: {} },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: args = {} } = req.params;

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
    return { content: [{ type: "text", text: formatGCRReport(result) }] };
  }

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
    const cost = (inp * arm.costPer1MInput + out * arm.costPer1MOutput) / 1_000_000;
    updateArm(ucbState, arm.id, 0.7);
    return {
      content: [{
        type: "text",
        text: `${text}\n\n---\n모델: ${arm.label} (UCB) | 토큰: ${inp}+${out} | 비용: $${cost.toFixed(6)}`,
      }],
    };
  }

  if (name === "evaluate_quality") {
    const score = await evaluateQuality(
      client,
      String(args.goal),
      String(args.response),
      typeof args.output_tokens === "number" ? args.output_tokens : 256
    );
    return { content: [{ type: "text", text: formatScore(score) }] };
  }

  if (name === "ucb_stats") {
    return { content: [{ type: "text", text: getArmStats(ucbState) }] };
  }

  if (name === "compress_prompt") {
    const r = compressPrompt(String(args.prompt));
    return {
      content: [{
        type: "text",
        text: `## 압축 결과\n\n**원본** (≈${r.originalTokens} 토큰):\n${r.original}\n\n**압축** (≈${r.compressedTokens} 토큰):\n${r.compressed}\n\n**절감: ${r.reductionPct}%**`,
      }],
    };
  }

  if (name === "reset_ucb") {
    Object.assign(ucbState, createUCBState(1.4));
    return { content: [{ type: "text", text: "UCB 상태 초기화 완료." }] };
  }

  throw new Error(`Unknown tool: ${name}`);
});

const transport = new StdioServerTransport();
await server.connect(transport);
console.error("Outcome Maxxing MCP 서버 v2.0 시작됨");
