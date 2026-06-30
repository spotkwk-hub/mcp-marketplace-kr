// 2. 도구 오남용에 따른 의도치 않은 외부 통신: URL/엔드포인트를 허용목록·위험 패턴 기준으로 판정

export type OutboundVerdict = {
  url: string;
  allowed: boolean;
  risk: "none" | "low" | "high";
  reasons: string[];
};

// 데이터 유출 채널로 흔히 악용되는 서비스 (요청 바디를 그대로 받아주는 익명 엔드포인트)
// 도메인 경계(정확히 일치하거나 서브도메인)로만 매칭 — "notwebhook.site" 같은 무관한
// 도메인이 문자열 끝부분만 같다는 이유로 오탐되지 않도록 함
const EXFIL_DOMAINS = [
  "webhook.site",
  "requestbin.com",
  "pipedream.net",
  "pastebin.com",
  "transfer.sh",
  "ngrok.app",
  "ngrok-free.app",
  "ngrok.io",
  "burpcollaborator.net",
  "interact.sh",
];

function matchesDomain(host: string, domain: string): boolean {
  return host === domain || host.endsWith(`.${domain}`);
}

function getHost(url: string): string | null {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

function isIpLiteral(host: string): boolean {
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(host) || host.includes(":"); // IPv4 or IPv6 literal
}

export function checkOutbound(url: string, allowlist: string[] = []): OutboundVerdict {
  const reasons: string[] = [];
  const host = getHost(url);

  if (!host) {
    return { url, allowed: false, risk: "high", reasons: ["URL을 파싱할 수 없음"] };
  }

  if (allowlist.length > 0) {
    const inAllowlist = allowlist.some((a) => host === a || host.endsWith(`.${a}`));
    if (!inAllowlist) {
      reasons.push(`허용목록(${allowlist.join(", ")})에 없는 호스트: ${host}`);
    }
  }

  if (EXFIL_DOMAINS.some((d) => matchesDomain(host, d))) {
    reasons.push(`알려진 데이터 유출 악용 서비스 패턴과 일치: ${host}`);
  }

  if (isIpLiteral(host)) {
    // IP 리터럴 직접 접근은 도메인 우회(허용목록 회피)·디코딩 트릭(10진수 IP 등)에 흔히 쓰이므로 고위험으로 취급
    reasons.push(`도메인이 아닌 IP 리터럴 직접 접근(우회 가능성): ${host}`);
  }

  if (!url.startsWith("https://")) {
    reasons.push("비-HTTPS(평문) 요청");
  }

  const high = reasons.some((r) => r.includes("유출 악용") || r.includes("허용목록") || r.includes("우회 가능성"));
  const risk: OutboundVerdict["risk"] = high ? "high" : reasons.length > 0 ? "low" : "none";
  const allowed = risk !== "high";

  return { url, allowed, risk, reasons };
}

// 텍스트(도구 응답/LLM 출력) 안에 박혀있는 URL을 모두 추출해 각각 판정
export function scanTextForOutboundRisk(text: string, allowlist: string[] = []): OutboundVerdict[] {
  const urls = text.match(/https?:\/\/[^\s"'<>)]+/g) ?? [];
  return urls.map((u) => checkOutbound(u, allowlist));
}

export function formatOutboundReport(verdicts: OutboundVerdict[]): string {
  if (verdicts.length === 0) return "## 외부 통신 스캔 결과\n\n탐지된 URL 없음.";
  const lines = verdicts.map((v) => {
    const tag = v.allowed ? "OK" : "BLOCK";
    const why = v.reasons.length ? ` — ${v.reasons.join("; ")}` : "";
    return `- [${tag}/${v.risk}] ${v.url}${why}`;
  });
  return ["## 외부 통신 스캔 결과", ...lines].join("\n");
}
