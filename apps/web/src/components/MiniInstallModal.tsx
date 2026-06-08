'use client';

import { type MCPServerMeta } from '@mcp-kr/registry';
import { useState } from 'react';
import { Copy, Check, X, Terminal, Globe, Zap, BookOpen, Monitor, Code2 } from 'lucide-react';

type MiniClient = 'desktop' | 'code' | 'web';
type MiniTab    = 'oneclick' | 'manual';
type MiniOS     = 'windows' | 'mac';

// MCPServerMeta의 부분집합만 필요한 필드
type InstallableServer = Pick<
  MCPServerMeta,
  'id' | 'name' | 'version' | 'author' | 'npmPackage' | 'envVars'
>;

export default function MiniInstallModal({ server, onClose }: { server: InstallableServer; onClose: () => void }) {
  const [client, setClient] = useState<MiniClient>('desktop');
  const [tab, setTab]       = useState<MiniTab>('oneclick');
  const [os, setOs]         = useState<MiniOS>('windows');
  const [copied, setCopied] = useState(false);

  const pkg     = server.npmPackage ?? `@mcp-kr/${server.id}`;
  const envVars = server.envVars ?? [];
  const envObj  = envVars.reduce<Record<string, string>>((acc, v) => ({ ...acc, [v.key]: `YOUR_${v.key}` }), {});
  const hasEnv  = envVars.length > 0;

  const desktopConfig = JSON.stringify({
    mcpServers: { [server.id]: { command: 'npx', args: ['-y', pkg], ...(hasEnv && { env: envObj }) } },
  }, null, 2);

  const psEnv = hasEnv ? Object.entries(envObj).map(([k, v]) => `"${k}":"${v}"`).join(',') : '';
  const psCmd =
    `$cfg="$env:APPDATA\\Claude\\claude_desktop_config.json"; ` +
    `$obj=if(Test-Path $cfg){Get-Content $cfg -Raw|ConvertFrom-Json}else{[pscustomobject]@{mcpServers=[pscustomobject]@{}}}; ` +
    `if(-not $obj.mcpServers){$obj|Add-Member -NotePropertyName mcpServers -NotePropertyValue ([pscustomobject]@{})}; ` +
    `$obj.mcpServers|Add-Member -NotePropertyName "${server.id}" -NotePropertyValue (ConvertFrom-Json '{"command":"npx","args":["-y","${pkg}"]${hasEnv ? `,"env":{${psEnv}}` : ""}}') -Force; ` +
    `$obj|ConvertTo-Json -Depth 10|Set-Content $cfg -Encoding UTF8; Write-Host "✅ ${server.name} 설치 완료!"`;

  const shCmd =
    `CFG="$HOME/Library/Application Support/Claude/claude_desktop_config.json"; ` +
    `mkdir -p "$(dirname "$CFG")"; [ -f "$CFG" ] || echo '{"mcpServers":{}}' > "$CFG"; ` +
    `python3 -c "import json; d=json.load(open('$CFG')); d.setdefault('mcpServers',{})['${server.id}']=${JSON.stringify({ command: 'npx', args: ['-y', pkg], ...(hasEnv && { env: envObj }) })}; json.dump(d,open('$CFG','w'),ensure_ascii=False,indent=2)"; ` +
    `echo "✅ ${server.name} 설치 완료!"`;

  const envFlags = envVars.map(v => `-e ${v.key}=YOUR_${v.key}`).join(' ');
  const codeCmd  = `claude mcp add ${server.id}${envFlags ? ' ' + envFlags : ''} npx ${pkg}`;

  const copy = (text: string) => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  const CopyBtn = ({ text }: { text: string }) => (
    <button onClick={() => copy(text)} className="absolute top-3 right-3 flex items-center gap-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs px-2.5 py-1.5 rounded-lg transition-colors">
      {copied ? <><Check className="w-3.5 h-3.5 text-green-400" />복사됨</> : <><Copy className="w-3.5 h-3.5" />복사</>}
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-gray-100 sticky top-0 bg-white">
          <div>
            <h2 className="font-bold text-gray-900 text-lg">{server.name} 설치</h2>
            <p className="text-xs text-gray-500 mt-0.5">v{server.version} · {server.author}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* 클라이언트 선택 */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">클라이언트 선택</p>
            <div className="flex gap-1.5">
              {([
                ['desktop', <Monitor key="d" className="w-3.5 h-3.5" />, 'Claude Desktop', '데스크탑 앱'],
                ['code',    <Code2   key="c" className="w-3.5 h-3.5" />, 'Claude Code',    'CLI 도구'],
                ['web',     <Globe   key="w" className="w-3.5 h-3.5" />, 'Claude.ai',      '웹 브라우저'],
              ] as [MiniClient, React.ReactNode, string, string][]).map(([key, icon, label, desc]) => (
                <button key={key} onClick={() => { setClient(key); setTab('oneclick'); }}
                  className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl border text-xs font-semibold transition-colors ${client === key ? 'bg-blue-50 border-blue-400 text-blue-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                  {icon}<span>{label}</span>
                  <span className={`font-normal ${client === key ? 'text-blue-500' : 'text-gray-400'}`}>{desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Claude Desktop */}
          {client === 'desktop' && (
            <>
              <div className="flex gap-1">
                {([['oneclick', <Zap key="z" className="w-3.5 h-3.5" />, '원클릭 설치'], ['manual', <BookOpen key="b" className="w-3.5 h-3.5" />, '수동 설치']] as const).map(([t, icon, label]) => (
                  <button key={t} onClick={() => setTab(t as MiniTab)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${tab === t ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                    {icon}{label}
                  </button>
                ))}
              </div>
              {tab === 'oneclick' && (
                <>
                  <div className="flex gap-2">
                    {(['windows', 'mac'] as MiniOS[]).map(o => (
                      <button key={o} onClick={() => setOs(o)}
                        className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-colors ${os === o ? 'bg-blue-50 border-blue-400 text-blue-700' : 'border-gray-200 text-gray-500'}`}>
                        {o === 'windows' ? '🪟 Windows' : '🍎 macOS'}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl p-3.5">
                    <Terminal className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                    <p className="text-xs text-blue-800">{os === 'windows' ? 'PowerShell' : '터미널'}을 열고 아래 명령어를 붙여넣으세요.</p>
                  </div>
                  <div className="relative">
                    <pre className="bg-gray-900 text-green-400 text-xs rounded-xl p-4 overflow-x-auto leading-relaxed font-mono whitespace-pre-wrap break-all">{os === 'windows' ? psCmd : shCmd}</pre>
                    <CopyBtn text={os === 'windows' ? psCmd : shCmd} />
                  </div>
                </>
              )}
              {tab === 'manual' && (
                <>
                  <div className="text-xs text-gray-500 bg-gray-50 rounded-xl p-3 space-y-1">
                    <p className="font-semibold text-gray-600">config.json 위치</p>
                    <p>🪟 Windows: <code className="bg-white border border-gray-200 px-1.5 py-0.5 rounded">%APPDATA%\Claude\claude_desktop_config.json</code></p>
                    <p>🍎 macOS: <code className="bg-white border border-gray-200 px-1.5 py-0.5 rounded">~/Library/Application Support/Claude/</code></p>
                  </div>
                  <div className="relative">
                    <pre className="bg-gray-900 text-green-400 text-xs rounded-xl p-4 overflow-x-auto leading-relaxed font-mono">{desktopConfig}</pre>
                    <CopyBtn text={desktopConfig} />
                  </div>
                </>
              )}
            </>
          )}

          {/* Claude Code */}
          {client === 'code' && (
            <>
              <div className="flex items-start gap-3 bg-violet-50 border border-violet-200 rounded-xl p-3.5">
                <Terminal className="w-4 h-4 text-violet-600 mt-0.5 shrink-0" />
                <p className="text-xs text-violet-800">Claude Code CLI가 설치되어 있으면 아래 명령어로 바로 등록합니다.</p>
              </div>
              <div className="relative">
                <pre className="bg-gray-900 text-green-400 text-xs rounded-xl p-4 font-mono">{codeCmd}</pre>
                <CopyBtn text={codeCmd} />
              </div>
            </>
          )}

          {/* Claude.ai 웹 */}
          {client === 'web' && (
            <>
              <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-3.5">
                <Globe className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                <p className="text-xs text-emerald-800">Claude.ai 웹은 원격 MCP 서버(HTTPS)를 UI에서 직접 등록합니다. Pro·Team·Enterprise 플랜 필요.</p>
              </div>
              <div className="relative">
                <pre className="bg-gray-900 text-green-400 text-xs rounded-xl p-4 font-mono">{`https://mcp.kr/servers/${server.id}`}</pre>
                <CopyBtn text={`https://mcp.kr/servers/${server.id}`} />
              </div>
            </>
          )}

          {/* 🔑 환경 변수 설정 필요 */}
          {hasEnv && client !== 'web' && (
            <div className="bg-amber-400 border-2 border-amber-500 rounded-xl p-4 space-y-2 shadow-sm">
              <p className="text-sm font-bold text-amber-950">🔑 환경 변수 설정 필요</p>
              {envVars.map(v => (
                <div key={v.key} className="flex items-start gap-2 text-xs text-amber-900">
                  <code className="bg-white/70 border border-amber-600 px-1.5 py-0.5 rounded shrink-0 font-semibold">{v.key}</code>
                  <span>{v.description}{v.docsUrl && <> · <a href={v.docsUrl} target="_blank" rel="noopener noreferrer" className="underline font-bold">발급 방법</a></>}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="px-6 pb-5">
          <button onClick={onClose} className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-xl transition-colors">닫기</button>
        </div>
      </div>
    </div>
  );
}
