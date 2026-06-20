/**
 * GCR (Goal-Conditioned Retry) loop.
 *
 * Drives the agentic execution cycle:
 *   1. Select model via UCB
 *   2. Generate response
 *   3. Evaluate quality against goal
 *   4. Update UCB arm with reward
 *   5. If composite < threshold AND retries remain → adapt & retry
 *
 * Adaptation strategy per iteration:
 *   iter 1: try compressed prompt on UCB-selected model
 *   iter 2: force escalation to next tier model
 *   iter 3: add quality critique into next prompt (self-healing)
 */

import Anthropic from "@anthropic-ai/sdk";
import { UCBState, ModelArm, selectArm, updateArm } from "./ucb-router.js";
import { evaluateQuality, QualityScore } from "./quality-eval.js";
import { compressPrompt } from "./optimizer.js";

export interface GCRIteration {
  iteration: number;
  model: string;
  modelLabel: string;
  prompt: string;
  response: string;
  inputTokens: number;
  outputTokens: number;
  costUSD: number;
  score: QualityScore;
  adaptationApplied: string;
}

export interface GCRResult {
  goal: string;
  iterations: GCRIteration[];
  finalResponse: string;
  finalScore: QualityScore;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCostUSD: number;
  convergedAt: number | null;
}

const ESCALATION_ORDER = [
  "claude-haiku-4-5-20251001",
  "claude-sonnet-4-6",
  "claude-opus-4-8",
];

function escalate(currentModelId: string): string {
  const idx = ESCALATION_ORDER.indexOf(currentModelId);
  return ESCALATION_ORDER[Math.min(idx + 1, ESCALATION_ORDER.length - 1)];
}

function armCostPerToken(arm: ModelArm, inputTokens: number, outputTokens: number): number {
  return (inputTokens * arm.costPer1MInput + outputTokens * arm.costPer1MOutput) / 1_000_000;
}

// Reward = quality score penalized by cost (normalized)
// Keeps UCB honest: a cheap model that's nearly as good will be preferred.
function computeReward(score: number, costUSD: number): number {
  const costPenalty = Math.min(0.3, costUSD * 1000); // cap penalty at 0.3
  return Math.max(0, score - costPenalty);
}

export async function runGCRLoop(
  client: Anthropic,
  ucbState: UCBState,
  goal: string,
  initialPrompt: string,
  options: {
    maxIterations?: number;
    qualityThreshold?: number;
    systemPrompt?: string;
    maxTokens?: number;
  } = {}
): Promise<GCRResult> {
  const {
    maxIterations = 3,
    qualityThreshold = 0.75,
    systemPrompt = "Be concise and accurate. Address the stated goal directly.",
    maxTokens = 1024,
  } = options;

  const iterations: GCRIteration[] = [];
  let currentPrompt = initialPrompt;
  let convergedAt: number | null = null;
  let lastScore: QualityScore | null = null;
  let lastResponse = "";
  let forcedModel: string | null = null;

  for (let i = 1; i <= maxIterations; i++) {
    // ── Model selection ──────────────────────────────────────────────────────
    let arm: ModelArm;
    if (forcedModel) {
      const forced = Object.values(ucbState.arms).find((a) => a.id === forcedModel);
      arm = forced ?? selectArm(ucbState);
    } else {
      arm = selectArm(ucbState);
    }

    // ── Adaptation strategy ──────────────────────────────────────────────────
    let adaptation = "UCB 선택";
    let promptToUse = currentPrompt;

    if (i === 1) {
      const compressed = compressPrompt(currentPrompt);
      if (compressed.reductionPct > 5) {
        promptToUse = compressed.compressed;
        adaptation = `프롬프트 압축 (${compressed.reductionPct}% 절감)`;
      }
    } else if (i === 2 && lastScore && lastScore.composite < qualityThreshold) {
      // Escalate model
      const escalated = escalate(arm.id);
      if (escalated !== arm.id) {
        forcedModel = escalated;
        arm = Object.values(ucbState.arms).find((a) => a.id === escalated) ?? arm;
        adaptation = `모델 에스컬레이션 → ${arm.label}`;
      }
    } else if (i === 3 && lastScore) {
      // Self-healing: inject critique into prompt
      promptToUse = `이전 응답이 부족했습니다. 평가 피드백: "${lastScore.critique}"\n\n원래 요청: ${currentPrompt}`;
      adaptation = "자가 수정 (비평 반영)";
    }

    // ── Generate response ────────────────────────────────────────────────────
    const apiResp = await client.messages.create({
      model: arm.id,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: "user", content: promptToUse }],
    });

    const responseText =
      apiResp.content[0]?.type === "text" ? apiResp.content[0].text : "";
    const inputTokens = apiResp.usage.input_tokens;
    const outputTokens = apiResp.usage.output_tokens;
    const costUSD = armCostPerToken(arm, inputTokens, outputTokens);

    // ── Quality evaluation ───────────────────────────────────────────────────
    const score = await evaluateQuality(client, goal, responseText, outputTokens);
    const reward = computeReward(score.composite, costUSD);

    // ── Update UCB ───────────────────────────────────────────────────────────
    updateArm(ucbState, arm.id, reward);

    iterations.push({
      iteration: i,
      model: arm.id,
      modelLabel: arm.label,
      prompt: promptToUse,
      response: responseText,
      inputTokens,
      outputTokens,
      costUSD,
      score,
      adaptationApplied: adaptation,
    });

    lastScore = score;
    lastResponse = responseText;

    // ── Convergence check ────────────────────────────────────────────────────
    if (score.composite >= qualityThreshold) {
      convergedAt = i;
      break;
    }
  }

  const totalInput = iterations.reduce((s, it) => s + it.inputTokens, 0);
  const totalOutput = iterations.reduce((s, it) => s + it.outputTokens, 0);
  const totalCost = iterations.reduce((s, it) => s + it.costUSD, 0);

  return {
    goal,
    iterations,
    finalResponse: lastResponse,
    finalScore: lastScore!,
    totalInputTokens: totalInput,
    totalOutputTokens: totalOutput,
    totalCostUSD: totalCost,
    convergedAt,
  };
}

export function formatGCRReport(result: GCRResult): string {
  const lines: string[] = [`## Outcome Maxxing 실행 결과`, ``, `**목표**: ${result.goal}`, ``];

  for (const it of result.iterations) {
    lines.push(`### 반복 ${it.iteration} — ${it.modelLabel} (${it.adaptationApplied})`);
    lines.push(`- 토큰: 입력 ${it.inputTokens} + 출력 ${it.outputTokens}`);
    lines.push(`- 비용: $${it.costUSD.toFixed(6)}`);
    lines.push(`- 품질: ${(it.score.composite * 100).toFixed(0)}% | 평가: ${it.score.critique}`);
    lines.push(``);
  }

  lines.push(`### 최종 응답`);
  lines.push(result.finalResponse);
  lines.push(``);
  lines.push(`---`);
  lines.push(
    result.convergedAt
      ? `수렴: ${result.convergedAt}회차에서 달성 (임계값 통과)`
      : `미수렴: 최대 반복 도달`
  );
  lines.push(`총 토큰: ${result.totalInputTokens + result.totalOutputTokens} | 총 비용: $${result.totalCostUSD.toFixed(6)}`);

  return lines.join("\n");
}
