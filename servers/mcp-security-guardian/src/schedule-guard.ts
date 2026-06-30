// 4. 스케줄/트리거(cron) 침투 차단: 외부 콘텐츠나 도구 결과를 경유해 예약 작업의
// prompt/cron/대상 세션이 의도치 않게 주입·변조되는 것을 탐지

export type ScheduleAction = {
  action: "create" | "update" | "delete" | "fire";
  prompt?: string;
  cronExpression?: string;
  runOnceAt?: string;
  targetSessionId?: string; // persistent_session_id — 다른 세션을 조준하면 위험
  requestedBySource: "user" | "tool_output" | "external_content"; // 이 요청이 어디서 비롯됐는지
};

export type ScheduleFlag = { rule: string; detail: string };

export type ScheduleVerdict = {
  allowed: boolean;
  risk: "none" | "low" | "high";
  flags: ScheduleFlag[];
};

const INJECTION_IN_PROMPT: { rule: string; regex: RegExp }[] = [
  { rule: "instruction_override", regex: /ignore (all|previous|above) instructions?/i },
  { rule: "instruction_override_kr", regex: /(이전|위)\s*(지시|명령|프롬프트).{0,10}(무시|무력화)/i },
  { rule: "self_replicating_schedule", regex: /(create|schedule|매번|다시)\s*(another|new|새로운)?\s*(trigger|routine|schedule|스케줄|트리거)/i },
  { rule: "credential_exfil", regex: /\b(api[_-]?key|token|password|secret|credential)s?\b.{0,30}\b(send|post|upload|전송|보내)\b/i },
];

const DESTRUCTIVE_KEYWORDS = [
  /rm\s+-rf/i,
  /force[-\s]?push/i,
  /--no-verify/i,
  /drop\s+table/i,
  /delete\s+(all|every)/i,
  /transfer\s+(money|funds|payment)/i,
  /git\s+reset\s+--hard/i,
  /(계좌|결제|송금).{0,20}(이체|전송|실행)/,
];

function isSuspiciouslyFrequent(cron: string): boolean {
  // 분 단위 와일드카드(* * * * *)나 매분 반복은 남용/감시 우회 목적일 수 있음
  const minuteField = cron.trim().split(/\s+/)[0];
  return minuteField === "*";
}

export function checkScheduleAction(a: ScheduleAction): ScheduleVerdict {
  const flags: ScheduleFlag[] = [];

  // 사용자가 직접 요청한 게 아니라 도구 출력/외부 콘텐츠가 스케줄 변경을 유발한 경우 — 가장 위험한 신호
  if (a.requestedBySource !== "user") {
    flags.push({
      rule: "non_user_initiated",
      detail: `요청 출처가 '${a.requestedBySource}' — 사용자가 직접 지시하지 않은 스케줄 변경 시도`,
    });
  }

  if (a.prompt) {
    for (const { rule, regex } of INJECTION_IN_PROMPT) {
      const m = a.prompt.match(regex);
      if (m) flags.push({ rule, detail: m[0] });
    }
    for (const re of DESTRUCTIVE_KEYWORDS) {
      const m = a.prompt.match(re);
      if (m) flags.push({ rule: "destructive_action_in_prompt", detail: m[0] });
    }
  }

  if (a.cronExpression && isSuspiciouslyFrequent(a.cronExpression)) {
    flags.push({ rule: "excessive_frequency", detail: a.cronExpression });
  }

  if (a.targetSessionId) {
    flags.push({
      rule: "cross_session_target",
      detail: `다른 세션(${a.targetSessionId})을 대상으로 지정 — 의도 확인 필요`,
    });
  }

  if ((a.action === "update" || a.action === "delete") && a.requestedBySource !== "user") {
    flags.push({ rule: "non_user_mutation", detail: `기존 트리거를 ${a.action} 시도 (비-사용자 출처)` });
  }

  const highRules = new Set([
    "non_user_initiated",
    "instruction_override",
    "instruction_override_kr",
    "credential_exfil",
    "destructive_action_in_prompt",
    "non_user_mutation",
  ]);
  const hasHigh = flags.some((f) => highRules.has(f.rule));
  const risk: ScheduleVerdict["risk"] = hasHigh ? "high" : flags.length > 0 ? "low" : "none";
  const allowed = risk !== "high";

  return { allowed, risk, flags };
}

export function formatScheduleReport(v: ScheduleVerdict): string {
  const status = v.allowed ? "허용" : "차단";
  if (v.flags.length === 0) {
    return `## 스케줄 작업 검사 결과\n\n판정: ${status} (${v.risk})\n특이사항 없음.`;
  }
  const lines = v.flags.map((f) => `- [${f.rule}] ${f.detail}`);
  return ["## 스케줄 작업 검사 결과", `판정: ${status} (${v.risk})`, ...lines].join("\n");
}
