// 1. 데이터 유출/프라이버시: 텍스트에서 시크릿·PII 패턴을 찾아 자동 차단/마스킹 판단에 사용

export type LeakFinding = {
  type: string;
  match: string;
  index: number;
};

export type LeakScanResult = {
  hasLeak: boolean;
  findings: LeakFinding[];
  redacted: string;
  severity: "none" | "low" | "high";
};

const PATTERNS: { type: string; regex: RegExp; severity: "low" | "high" }[] = [
  { type: "anthropic_api_key", regex: /sk-ant-[A-Za-z0-9\-_]{20,}/gi, severity: "high" },
  { type: "openai_api_key", regex: /sk-[A-Za-z0-9]{20,}/gi, severity: "high" },
  { type: "aws_access_key", regex: /AKIA[0-9A-Z]{16}/g, severity: "high" },
  { type: "google_api_key", regex: /AIza[0-9A-Za-z\-_]{35}/g, severity: "high" },
  { type: "github_token", regex: /gh[pousr]_[A-Za-z0-9]{36,}/g, severity: "high" },
  { type: "slack_token", regex: /xox[baprs]-[A-Za-z0-9\-]{10,}/g, severity: "high" },
  { type: "private_key_block", regex: /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g, severity: "high" },
  { type: "jwt", regex: /eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, severity: "high" },
  { type: "email", regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, severity: "low" },
  { type: "kr_phone", regex: /01[016789][-.\s]?\d{3,4}[-.\s]?\d{4}/g, severity: "low" },
  { type: "credit_card", regex: /\b(?:\d[ -]*?){13,16}\b/g, severity: "high" },
  { type: "generic_secret_assignment", regex: /(api[_-]?key|secret|token|password|passwd)\s*[:=]\s*['"][^'"\s]{8,}['"]/gi, severity: "high" },
];

export function scanForLeaks(text: string): LeakScanResult {
  const findings: LeakFinding[] = [];
  let redacted = text;

  for (const { type, regex, severity } of PATTERNS) {
    let m: RegExpExecArray | null;
    const re = new RegExp(regex.source, regex.flags);
    while ((m = re.exec(text)) !== null) {
      findings.push({ type, match: m[0], index: m.index });
      void severity;
    }
  }

  for (const f of findings) {
    redacted = redacted.split(f.match).join(`[REDACTED:${f.type}]`);
  }

  const hasLeak = findings.length > 0;
  const severity: LeakScanResult["severity"] = findings.some((f) =>
    PATTERNS.find((p) => p.type === f.type)?.severity === "high"
  )
    ? "high"
    : hasLeak
    ? "low"
    : "none";

  return { hasLeak, findings, redacted, severity };
}

export function formatLeakReport(r: LeakScanResult): string {
  if (!r.hasLeak) return "## 유출 스캔 결과\n\n탐지된 민감정보 없음.";
  const lines = r.findings.map((f) => `- [${f.type}] @${f.index}: ${f.match.slice(0, 12)}...`);
  return [
    "## 유출 스캔 결과",
    `심각도: ${r.severity.toUpperCase()} | 탐지 ${r.findings.length}건`,
    ...lines,
    "",
    "### 마스킹된 텍스트",
    r.redacted,
  ].join("\n");
}
