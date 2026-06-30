import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import { scanForLeaks, formatLeakReport } from "./leak-scanner.js";
import { checkOutbound, scanTextForOutboundRisk, formatOutboundReport } from "./outbound-guard.js";
import { scanToolList, formatToolScanReport, type McpToolDef } from "./mcp-tool-scanner.js";
import { checkScheduleAction, formatScheduleReport, type ScheduleAction } from "./schedule-guard.js";

const server = new McpServer({
  name: "mcp-security-guardian",
  version: "1.0.0",
});

// ── Tool 1: scan_leak ────────────────────────────────────────────────────────
server.tool(
  "scan_leak",
  "텍스트(LLM 응답/도구 출력)에서 API 키·시크릿·PII 유출 여부를 스캔하고 마스킹",
  {
    text: z.string().describe("스캔할 텍스트"),
  },
  async ({ text }) => {
    const result = scanForLeaks(text);
    return { content: [{ type: "text", text: formatLeakReport(result) }] };
  }
);

// ── Tool 2: check_outbound ───────────────────────────────────────────────────
server.tool(
  "check_outbound",
  "단일 URL 또는 텍스트 내 모든 URL을 허용목록·위험 패턴 기준으로 판정 (의도치 않은 외부 통신/데이터 유출 차단)",
  {
    url: z.string().optional().describe("판정할 단일 URL"),
    text: z.string().optional().describe("URL을 추출해서 일괄 판정할 텍스트"),
    allowlist: z.array(z.string()).optional().default([]).describe("허용 도메인 목록 (예: api.anthropic.com)"),
  },
  async ({ url, text, allowlist }) => {
    if (!url && !text) {
      return { content: [{ type: "text", text: "url 또는 text 중 하나는 필수입니다." }], isError: true };
    }
    const verdicts = url
      ? [checkOutbound(url, allowlist ?? [])]
      : scanTextForOutboundRisk(text!, allowlist ?? []);
    return { content: [{ type: "text", text: formatOutboundReport(verdicts) }] };
  }
);

// ── Tool 3: scan_mcp_tools ────────────────────────────────────────────────────
server.tool(
  "scan_mcp_tools",
  "외부 MCP 서버가 제공하는 도구 정의 목록(name/description/inputSchema)을 검사해 프롬프트 인젝션·과도한 권한 요구 등 악성 패턴 탐지",
  {
    tools: z
      .array(
        z.object({
          name: z.string(),
          description: z.string().optional(),
          inputSchema: z.unknown().optional(),
        })
      )
      .describe("검사할 MCP 도구 정의 배열"),
  },
  async ({ tools }) => {
    const results = scanToolList(tools as McpToolDef[]);
    return { content: [{ type: "text", text: formatToolScanReport(results) }] };
  }
);

// ── Tool 4: check_schedule_action ────────────────────────────────────────────
server.tool(
  "check_schedule_action",
  "트리거/스케줄(cron) 생성·수정·삭제·즉시실행 요청을 검사해 외부 콘텐츠를 경유한 침투, 프롬프트 인젝션, 파괴적 동작 예약, 비사용자 출처 변조를 차단",
  {
    action: z.enum(["create", "update", "delete", "fire"]).describe("요청된 스케줄 작업 종류"),
    prompt: z.string().optional().describe("트리거에 등록될 프롬프트 내용"),
    cron_expression: z.string().optional().describe("cron 표현식"),
    run_once_at: z.string().optional().describe("1회성 실행 시각 (RFC3339)"),
    target_session_id: z.string().optional().describe("대상 세션 ID (다른 세션을 조준하는 경우)"),
    requested_by_source: z
      .enum(["user", "tool_output", "external_content"])
      .describe("이 스케줄 변경 요청이 어디서 비롯됐는지 — 사용자가 채팅으로 직접 요청했는지, 도구 결과/외부 콘텐츠에서 유발됐는지"),
  },
  async ({ action, prompt, cron_expression, run_once_at, target_session_id, requested_by_source }) => {
    const verdict = checkScheduleAction({
      action,
      prompt,
      cronExpression: cron_expression,
      runOnceAt: run_once_at,
      targetSessionId: target_session_id,
      requestedBySource: requested_by_source,
    } satisfies ScheduleAction);
    return { content: [{ type: "text", text: formatScheduleReport(verdict) }] };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
console.error("MCP Security Guardian 서버 v1.0 시작됨");
