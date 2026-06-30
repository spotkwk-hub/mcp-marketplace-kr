// 3. 외부 MCP 서버/플러그인의 악성 도구 정의 자동 검출
// 도구의 name/description/inputSchema 자체에 숨겨진 프롬프트 인젝션, 과도한 권한 요구를 탐지

export type McpToolDef = {
  name: string;
  description?: string;
  inputSchema?: unknown;
};

export type ToolFlag = { rule: string; detail: string };

export type ToolScanResult = {
  name: string;
  riskScore: number; // 0-100
  flags: ToolFlag[];
};

const INJECTION_PATTERNS: { rule: string; regex: RegExp }[] = [
  { rule: "instruction_override", regex: /ignore (all|previous|above) instructions?/i },
  { rule: "instruction_override_kr", regex: /(이전|위)\s*(지시|명령|프롬프트).{0,10}(무시|무력화)/i },
  { rule: "system_prompt_probe", regex: /system prompt|reveal.*(prompt|instructions)/i },
  { rule: "always_call_first", regex: /always (call|use|invoke) this (tool|function) (first|before)/i },
  { rule: "hidden_unicode", regex: /[​-‏‪-‮﻿]/ },
  { rule: "exfil_hint", regex: /(send|upload|post).{0,30}(data|file|content|secret|credential).{0,30}(to|via)\s+https?:\/\//i },
  { rule: "credential_request", regex: /\b(api[_-]?key|password|secret|token|credential)s?\b.{0,20}\b(input|provide|enter|include)\b/i },
];

const SENSITIVE_PARAM_NAMES = /^(api[_-]?key|password|secret|token|credential|private[_-]?key)$/i;

function flattenSchemaParamNames(schema: unknown, out: string[] = []): string[] {
  if (!schema || typeof schema !== "object") return out;
  const obj = schema as Record<string, unknown>;
  if (obj.properties && typeof obj.properties === "object") {
    for (const key of Object.keys(obj.properties as object)) {
      out.push(key);
      flattenSchemaParamNames((obj.properties as Record<string, unknown>)[key], out);
    }
  }
  return out;
}

export function scanToolDefinition(tool: McpToolDef): ToolScanResult {
  const flags: ToolFlag[] = [];
  const text = `${tool.name} ${tool.description ?? ""}`;

  for (const { rule, regex } of INJECTION_PATTERNS) {
    const m = text.match(regex);
    if (m) flags.push({ rule, detail: m[0] });
  }

  const paramNames = flattenSchemaParamNames(tool.inputSchema);
  for (const p of paramNames) {
    if (SENSITIVE_PARAM_NAMES.test(p)) {
      flags.push({ rule: "sensitive_param_requested", detail: p });
    }
  }

  if ((tool.description?.length ?? 0) > 2000) {
    flags.push({ rule: "oversized_description", detail: `${tool.description!.length} chars` });
  }

  // 위험도 가중치: injection류는 높게, 단순 민감 파라미터는 중간
  const riskScore = Math.min(
    100,
    flags.reduce((acc, f) => acc + (f.rule === "sensitive_param_requested" ? 20 : f.rule === "oversized_description" ? 10 : 35), 0)
  );

  return { name: tool.name, riskScore, flags };
}

export function scanToolList(tools: McpToolDef[]): ToolScanResult[] {
  return tools.map(scanToolDefinition);
}

export function formatToolScanReport(results: ToolScanResult[]): string {
  if (results.length === 0) return "## MCP 도구 정의 스캔 결과\n\n검사할 도구 없음.";
  const lines = results.map((r) => {
    const status = r.riskScore >= 50 ? "위험" : r.riskScore > 0 ? "주의" : "정상";
    const flagLines = r.flags.map((f) => `    - ${f.rule}: ${f.detail.slice(0, 60)}`).join("\n");
    return `- [${status}/${r.riskScore}] ${r.name}${flagLines ? "\n" + flagLines : ""}`;
  });
  return ["## MCP 도구 정의 스캔 결과", ...lines].join("\n");
}
