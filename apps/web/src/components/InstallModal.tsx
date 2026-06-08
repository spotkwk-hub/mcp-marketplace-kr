'use client';

import { MCPServer } from '@/types';
import { X, Copy, Check, ExternalLink, Zap, BookOpen, Terminal, Monitor, Code2, Globe } from 'lucide-react';
import { useState } from 'react';

// ── MARKER_XYZ123 ────────────────────────────────────────────────────────────

function buildDesktopConfig(server: MCPServer): string {
  return JSON.stringify(
    {
      mcpServers: {
        [server.id]: {
          command: 'npx',
          args: ['-y', `@mcp-kr/${server.id}`],
          ...(server.pricing !== 'free' ? { env: { API_KEY: 'YOUR_API_KEY_HERE' } } : {}),
        },
      },
    },
    null,
    2
  );
}

function buildDesktopPSCommand(server: MCPServer): string {
  const pkg = `@mcp-kr/${server.id}`;
  const envPart = server.pricing !== 'free' ? `,"env":{"API_KEY":"YOUR_API_KEY_HERE"}` : '';
  return (
    `$cfg="$env:APPDATA\\Claude\\claude_desktop_config.json"; ` +
    `$obj=if(Test-Path $cfg){Get-Content $cfg -Raw|ConvertFrom-Json}else{[pscustomobject]@{mcpServers=[pscustomobject]@{}}}; ` +
    `if(-not $obj.mcpServers){$obj|Add-Member -NotePropertyName mcpServers -NotePropertyValue ([pscustomobject]@{})}; ` +
    `$obj.mcpServers|Add-Member -NotePropertyName "${server.id}" -NotePropertyValue (ConvertFrom-Json '{"command":"npx","args":["-y","${pkg}"]${envPart}}') -Force; ` +
    `$obj|ConvertTo-Json -Depth 10|Set-Content $cfg -Encoding UTF8; ` +
    `Write-Host "✅ ${server.name} 설치 완료! Claude Desktop을 재시작하세요."`
  );
}

function buildDesktopShCommand(server: MCPServer): string {
  const pkg = `@mcp-kr/${server.id}`;
  const entry = JSON.stringify({
    command: 'npx',
    args: ['-y', pkg],
    ...(server.pricing !== 'free' ? { env: { API_KEY: 'YOUR_API_KEY_HERE' } } : {}),
  });
  return (
    `CFG="$HOME/Library/Application Support/Claude/claude_desktop_config.json"; ` +
    `mkdir -p "$(dirname "$CFG")"; [ -f "$CFG" ] || echo '{"mcpServers":{}}' > "$CFG"; ` +
    `python3 -c "import json; d=json.load(open('$CFG')); d.setdefault('mcpServers',{})['${server.id}']=${entry}; json.dump(d,open('$CFG','w'),ensure_ascii=False,indent=2)"; ` +
    `echo "✅ ${server.name} 설치 완료! Claude Desktop을 재시작하세요."`
  );
}

function buildCodeCommand(server: MCPServer): string {
  const pkg = `@mcp-kr/${server.id}`;
  const envFlag = server.pricing !== 'free' ? ' -e API_KEY=YOUR_API_KEY_HERE' : '';
  return `claude mcp add ${server.id}${envFlag} npx -- -y ${pkg}`;
}

// ── constants ────────────────────────────────────────────────────────────────

const DESKTOP_CONFIG_PATH = {
  windows: '%APPDATA%\\Claude\\claude_desktop_config.json',
  mac: '~/Library/Application Support/Claude/claude_desktop_config.json',
};

const INSTALL_STEPS = [
  { label: 'Claude Desktop 설치', href: 'https://claude.ai/download' },
  { label: 'config.json에 아래 설정 추가', href: null },
  { label: 'Claude Desktop 재시작', href: null },
];

type Client = 'desktop' | 'code' | 'web';
type Tab = 'oneclick' | 'manual';
type OS = 'windows' | 'mac';

const CLIENT_LABELS: Record<Client, { label: string; icon: React.ReactNode; desc: string }> = {
  desktop: { label: 'Claude Desktop', icon: <Monitor className="w-3.5 h-3.5" />, desc: '데스크탑 앱' },
  code:    { label: 'Claude Code',    icon: <Code2 className="w-3.5 h-3.5" />,   desc: 'CLI 도구' },
  web:     { label: 'Claude.ai',      icon: <Globe className="w-3.5 h-3.5" />,   desc: '웹 브라우저' },
};

// ── component ────────────────────────────────────────────────────────────────

export default function InstallModal({ server, onClose }: { server: MCPServer; onClose: () => void }) {
  const [client, setClient] = useState<Client>('desktop');
  const [tab, setTab]       = useState<Tab>('oneclick');
  const [os, setOs]         = useState<OS>('windows');
  const [copied, setCopied] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const CopyBtn = ({ text }: { text: string }) => (
    <button
      onClick={() => handleCopy(text)}
      className="absolute top-3 right-3 flex items-center gap-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs px-2.5 py-1.5 rounded-lg transition-colors"
    >
      {copied ? <><Check className="w-3.5 h-3.5 text-green-400" /> 복사됨</> : <><Copy className="w-3.5 h-3.5" /> 복사</>}
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div>
            <h2 className="font-bold text-gray-900 text-lg">{server.name} 설치</h2>
            <p className="text-xs text-gray-500 mt-0.5">v{server.version} · {server.author}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors mt-0.5">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">

          {/* 클라이언트 선택 */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">클라이언트 선택</p>
            <div className="flex gap-1.5">
              {(Object.entries(CLIENT_LABELS) as [Client, typeof CLIENT_LABELS[Client]][]).map(([key, val]) => (
                <button
                  key={key}
                  onClick={() => { setClient(key); setTab('oneclick'); }}
                  className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl border text-xs font-semibold transition-colors ${
                    client === key
                      ? 'bg-blue-50 border-blue-400 text-blue-700'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  {val.icon}
                  <span>{val.label}</span>
                  <span className={`font-normal ${client === key ? 'text-blue-500' : 'text-gray-400'}`}>{val.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* ── Claude Desktop ── */}
          {client === 'desktop' && (
            <>
              <div className="flex gap-1">
                {([['oneclick', <Zap key="z" className="w-3.5 h-3.5" />, '원클릭 설치'], ['manual', <BookOpen key="b" className="w-3.5 h-3.5" />, '수동 설치']] as const).map(([t, icon, label]) => (
                  <button key={t} onClick={() => setTab(t as Tab)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${tab === t ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                    {icon}{label}
                  </button>
                ))}
              </div>

              {tab === 'oneclick' && (
                <>
                  <div className="flex gap-2">
                    {(['windows', 'mac'] as OS[]).map(o => (
                      <button key={o} onClick={() => setOs(o)}
                        className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-colors ${os === o ? 'bg-blue-50 border-blue-400 text-blue-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                        {o === 'windows' ? '🪟 Windows' : '🍎 macOS'}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl p-3.5">
                    <Terminal className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                    <p className="text-xs text-blue-800 leading-relaxed">
                      {os === 'windows' ? 'PowerShell' : '터미널 앱'}을 열고 아래 명령어를 붙여넣으면 설정 파일이 자동으로 업데이트됩니다.
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                      {os === 'windows' ? 'PowerShell 명령어' : 'Terminal 명령어'}
                    </p>
                    <div className="relative">
                      <pre className="bg-gray-900 text-green-400 text-xs rounded-xl p-4 overflow-x-auto leading-relaxed font-mono whitespace-pre-wrap break-all">
                        {os === 'windows' ? buildDesktopPSCommand(server) : buildDesktopShCommand(server)}
                      </pre>
                      <CopyBtn text={os === 'windows' ? buildDesktopPSCommand(server) : buildDesktopShCommand(server)} />
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3.5 text-xs text-gray-600 space-y-1.5">
                    <p className="font-semibold text-gray-700">실행 후</p>
                    <ol className="space-y-1 list-decimal list-inside">
                      <li>터미널에 <span className="text-green-600 font-mono">✅ 설치 완료</span> 메시지 확인</li>
                      <li>Claude Desktop 완전 종료 후 재시작</li>
                      <li><span className="font-mono bg-white border border-gray-200 px-1 rounded">{server.tools[0]?.name ?? server.id}</span> 도구 사용 가능</li>
                    </ol>
                  </div>
                </>
              )}

              {tab === 'manual' && (
                <>
                  <ol className="space-y-2.5">
                    {INSTALL_STEPS.map((s, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-gray-700">
                        <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                        {s.href
                          ? <a href={s.href} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">{s.label} <ExternalLink className="w-3.5 h-3.5" /></a>
                          : <span>{s.label}</span>}
                      </li>
                    ))}
                  </ol>
                  <div className="text-xs text-gray-500 bg-gray-50 rounded-xl p-3 space-y-1">
                    <p className="font-semibold text-gray-600">config.json 위치</p>
                    <p>🪟 Windows: <code className="bg-white border border-gray-200 px-1.5 py-0.5 rounded text-gray-700">{DESKTOP_CONFIG_PATH.windows}</code></p>
                    <p>🍎 macOS: <code className="bg-white border border-gray-200 px-1.5 py-0.5 rounded text-gray-700">{DESKTOP_CONFIG_PATH.mac}</code></p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">claude_desktop_config.json</p>
                    <div className="relative">
                      <pre className="bg-gray-900 text-green-400 text-xs rounded-xl p-4 overflow-x-auto leading-relaxed font-mono">
                        {buildDesktopConfig(server)}
                      </pre>
                      <CopyBtn text={buildDesktopConfig(server)} />
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          {/* ── Claude Code ── */}
          {client === 'code' && (
            <>
              <div className="flex items-start gap-3 bg-violet-50 border border-violet-200 rounded-xl p-3.5">
                <Terminal className="w-4 h-4 text-violet-600 mt-0.5 shrink-0" />
                <div className="text-xs text-violet-800 leading-relaxed">
                  <p className="font-semibold mb-0.5">터미널에서 한 줄로 설치</p>
                  <p>Claude Code CLI가 설치되어 있으면 아래 명령어로 바로 MCP 서버를 등록합니다. 설정 파일은 <code className="bg-white px-1 rounded">~/.claude/claude_mcp_settings.json</code>에 자동 저장됩니다.</p>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">설치 명령어</p>
                <div className="relative">
                  <pre className="bg-gray-900 text-green-400 text-xs rounded-xl p-4 overflow-x-auto leading-relaxed font-mono">
                    {buildCodeCommand(server)}
                  </pre>
                  <CopyBtn text={buildCodeCommand(server)} />
                </div>
              </div>
              <div className="text-xs text-gray-500 bg-gray-50 rounded-xl p-3 space-y-2">
                <p className="font-semibold text-gray-600">범위 옵션</p>
                <div className="space-y-1">
                  <p><code className="bg-white border border-gray-200 px-1.5 rounded">--scope user</code> 모든 프로젝트에서 사용 (기본값)</p>
                  <p><code className="bg-white border border-gray-200 px-1.5 rounded">--scope project</code> 현재 프로젝트에서만 사용</p>
                </div>
              </div>
            </>
          )}

          {/* ── Claude.ai 웹 ── */}
          {client === 'web' && (
            <>
              <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-3.5">
                <Globe className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                <div className="text-xs text-emerald-800 leading-relaxed">
                  <p className="font-semibold mb-0.5">원격 MCP 서버 연결</p>
                  <p>Claude.ai 웹에서는 <strong>원격 MCP 서버(HTTPS URL)</strong>를 UI에서 직접 등록합니다. Pro·Team·Enterprise 플랜 필요.</p>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">설치 방법</p>
                <ol className="space-y-3">
                  {[
                    { step: 'claude.ai 접속 후 좌측 하단 프로필 → Settings 클릭', href: 'https://claude.ai' },
                    { step: 'Integrations 메뉴 선택', href: null },
                    { step: 'Add integration 버튼 클릭', href: null },
                    { step: '아래 서버 URL 입력 후 저장', href: null },
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-gray-700">
                      <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                      {item.href
                        ? <a href={item.href} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">{item.step} <ExternalLink className="w-3.5 h-3.5" /></a>
                        : <span>{item.step}</span>}
                    </li>
                  ))}
                </ol>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">원격 서버 URL</p>
                <div className="relative">
                  <pre className="bg-gray-900 text-green-400 text-xs rounded-xl p-4 overflow-x-auto leading-relaxed font-mono">
                    {`https://mcp.kr/servers/${server.id}`}
                  </pre>
                  <CopyBtn text={`https://mcp.kr/servers/${server.id}`} />
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-800">
                <p className="font-semibold mb-1">⚠️ 참고사항</p>
                <p>로컬 PC 파일·앱 접근이 필요한 서버는 Claude Desktop 또는 Claude Code를 사용하세요.</p>
              </div>
            </>
          )}

          {/* API 키 안내 (유료 서버) */}
          {server.pricing !== 'free' && client !== 'web' && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
              <p className="font-semibold mb-1">🔑 API 키 필요</p>
              <p className="text-xs leading-relaxed">
                <code className="bg-white px-1 rounded">YOUR_API_KEY_HERE</code>를 실제 API 키로 교체하세요.
                API 키는 <a href={server.apiDocs} target="_blank" rel="noopener noreferrer" className="underline font-medium">공식 문서</a>에서 발급받을 수 있습니다.
              </p>
            </div>
          )}

          {/* 제공 도구 */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">제공 도구 ({server.tools.length}개)</p>
            <div className="space-y-1.5">
              {server.tools.map(tool => (
                <div key={tool.name} className="flex items-start gap-2">
                  <code className="text-xs bg-blue-50 border border-blue-100 text-blue-700 px-2 py-0.5 rounded shrink-0">{tool.name}</code>
                  <span className="text-xs text-gray-400 pt-0.5 leading-relaxed">{tool.description}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 pb-5">
          <button onClick={onClose} className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-xl transition-colors">
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
