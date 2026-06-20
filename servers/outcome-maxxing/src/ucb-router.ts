/**
 * UCB (Upper Confidence Bound) autonomous model router.
 *
 * Treats each model as a bandit arm. Balances exploitation of the
 * best-performing model against exploration of under-sampled ones.
 *
 * UCB1 score: μ_a + C * sqrt(ln(N) / n_a)
 *   μ_a = mean reward for arm a
 *   N   = total plays across all arms
 *   n_a = plays for arm a
 *   C   = exploration coefficient (higher → more exploration)
 */

export interface ModelArm {
  id: string;
  label: string;
  costPer1MInput: number;
  costPer1MOutput: number;
  plays: number;
  totalReward: number;
  meanReward: number;
  ucbScore: number;
  lastReward: number | null;
}

export interface UCBState {
  arms: Record<string, ModelArm>;
  totalPlays: number;
  explorationC: number;
}

const DEFAULT_ARMS: Omit<ModelArm, "plays" | "totalReward" | "meanReward" | "ucbScore" | "lastReward">[] = [
  { id: "claude-haiku-4-5-20251001", label: "haiku", costPer1MInput: 1.0, costPer1MOutput: 5.0 },
  { id: "claude-sonnet-4-6",         label: "sonnet", costPer1MInput: 3.0, costPer1MOutput: 15.0 },
  { id: "claude-opus-4-8",           label: "opus",   costPer1MInput: 5.0, costPer1MOutput: 25.0 },
];

export function createUCBState(explorationC = 1.4): UCBState {
  const arms: Record<string, ModelArm> = {};
  for (const a of DEFAULT_ARMS) {
    arms[a.id] = { ...a, plays: 0, totalReward: 0, meanReward: 0, ucbScore: Infinity, lastReward: null };
  }
  return { arms, totalPlays: 0, explorationC };
}

function computeUCBScore(arm: ModelArm, totalPlays: number, C: number): number {
  if (arm.plays === 0) return Infinity; // force exploration of unplayed arms
  return arm.meanReward + C * Math.sqrt(Math.log(totalPlays) / arm.plays);
}

export function selectArm(state: UCBState): ModelArm {
  // Refresh scores
  for (const arm of Object.values(state.arms)) {
    arm.ucbScore = computeUCBScore(arm, Math.max(state.totalPlays, 1), state.explorationC);
  }
  // Pick highest UCB score
  return Object.values(state.arms).reduce((best, arm) =>
    arm.ucbScore > best.ucbScore ? arm : best
  );
}

export function updateArm(state: UCBState, modelId: string, reward: number): void {
  const arm = state.arms[modelId];
  if (!arm) return;
  arm.plays++;
  arm.totalReward += reward;
  arm.meanReward = arm.totalReward / arm.plays;
  arm.lastReward = reward;
  state.totalPlays++;
}

export function getArmStats(state: UCBState): string {
  const rows = Object.values(state.arms)
    .sort((a, b) => b.meanReward - a.meanReward)
    .map((a) => {
      const ucb = a.ucbScore === Infinity ? "∞" : a.ucbScore.toFixed(3);
      return `  ${a.label.padEnd(8)} | plays: ${String(a.plays).padStart(3)} | μ: ${a.meanReward.toFixed(3)} | UCB: ${ucb} | last: ${a.lastReward?.toFixed(3) ?? "-"}`;
    });
  return `UCB Arm 통계 (총 ${state.totalPlays}회, C=${state.explorationC}):\n${rows.join("\n")}`;
}
