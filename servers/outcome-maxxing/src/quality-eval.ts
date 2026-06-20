/**
 * Autonomous quality evaluator.
 *
 * Uses a lightweight judge model (haiku) to score a response against
 * the stated goal. Returns a normalized reward in [0, 1].
 *
 * Scoring dimensions:
 *   - goal_alignment  : does the response satisfy the stated goal?
 *   - correctness     : is the content factually/logically sound?
 *   - conciseness     : is it appropriately brief without losing quality?
 *   - token_efficiency: penalizes unnecessary verbosity
 */

import Anthropic from "@anthropic-ai/sdk";

export interface QualityScore {
  goalAlignment: number;   // 0-1
  correctness: number;     // 0-1
  conciseness: number;     // 0-1
  tokenEfficiency: number; // 0-1 (derived from token count)
  composite: number;       // weighted average → reward signal
  critique: string;
  outputTokens: number;
}

const JUDGE_MODEL = "claude-haiku-4-5-20251001";

const JUDGE_SYSTEM = `You are a strict, concise response quality judge.
Given a GOAL and a RESPONSE, score each dimension from 0.0 to 1.0.
Return ONLY valid JSON, no prose. Format:
{"goal_alignment":0.0,"correctness":0.0,"conciseness":0.0,"critique":"one sentence"}`;

const WEIGHTS = {
  goalAlignment: 0.45,
  correctness: 0.30,
  conciseness: 0.15,
  tokenEfficiency: 0.10,
};

function tokenEfficiencyScore(outputTokens: number, targetMaxTokens = 512): number {
  if (outputTokens <= targetMaxTokens) return 1.0;
  // Linear decay above target
  return Math.max(0, 1 - (outputTokens - targetMaxTokens) / targetMaxTokens);
}

export async function evaluateQuality(
  client: Anthropic,
  goal: string,
  response: string,
  outputTokens: number
): Promise<QualityScore> {
  const userMsg = `GOAL: ${goal}\n\nRESPONSE:\n${response.slice(0, 2000)}`;

  let raw: { goal_alignment: number; correctness: number; conciseness: number; critique: string };
  try {
    const judgeResp = await client.messages.create({
      model: JUDGE_MODEL,
      max_tokens: 256,
      system: JUDGE_SYSTEM,
      messages: [{ role: "user", content: userMsg }],
    });
    const text = judgeResp.content[0]?.type === "text" ? judgeResp.content[0].text : "{}";
    raw = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] ?? "{}");
  } catch {
    raw = { goal_alignment: 0.5, correctness: 0.5, conciseness: 0.5, critique: "평가 실패" };
  }

  const goalAlignment = Math.min(1, Math.max(0, raw.goal_alignment ?? 0.5));
  const correctness = Math.min(1, Math.max(0, raw.correctness ?? 0.5));
  const conciseness = Math.min(1, Math.max(0, raw.conciseness ?? 0.5));
  const tokenEff = tokenEfficiencyScore(outputTokens);

  const composite =
    goalAlignment * WEIGHTS.goalAlignment +
    correctness * WEIGHTS.correctness +
    conciseness * WEIGHTS.conciseness +
    tokenEff * WEIGHTS.tokenEfficiency;

  return {
    goalAlignment,
    correctness,
    conciseness,
    tokenEfficiency: tokenEff,
    composite,
    critique: raw.critique ?? "",
    outputTokens,
  };
}

export function formatScore(score: QualityScore): string {
  return [
    `목표 부합: ${(score.goalAlignment * 100).toFixed(0)}%`,
    `정확성:    ${(score.correctness * 100).toFixed(0)}%`,
    `간결성:    ${(score.conciseness * 100).toFixed(0)}%`,
    `토큰 효율: ${(score.tokenEfficiency * 100).toFixed(0)}%`,
    `종합 점수: ${(score.composite * 100).toFixed(0)}% (보상: ${score.composite.toFixed(3)})`,
    `평가: ${score.critique}`,
  ].join("\n");
}
