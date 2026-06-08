// ============================================================
// Marketplace.tsx — 마켓플레이스 핵심 UI 컴포넌트
// @mcp-kr/registry 에서 데이터를 직접 임포트
// ============================================================
'use client';

import { useState, useMemo } from 'react';
import {
  REGISTRY,
  CATEGORIES,
  PRICING_LABELS,
  CERT_COLORS,
  type MCPServerMeta,
  type Category,
} from '@mcp-kr/registry';
import { Search, SlidersHorizontal, Star, Download, Shield, Sprout, ChevronDown, ChevronUp, Copy, Check, X, ExternalLink, CreditCard, Zap, BookOpen, Terminal, Monitor, Code2, Globe } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from './lib/utils';

// ── 가격 배지 색상 ────────────────────────────────────────
const PRICING_BG: Record<string, string> = {
  free:       'bg-emerald-100 text-emerald-800',
  freemium:   'bg-sky-100 text-sky-800',
  paid:       'bg-violet-100 text-violet-800',
  enterprise: 'bg-amber-100 text-amber-800',
};

function formatNum(n: number): string {
  if (n >= 10000) return `${(n / 10000).toFixed(1)}만`;
  if (n >= 1000)  return `${(n / 1000).toFixed(1)}천`;
  return String(n);
}

// ── 설치 모달 ────────────────────────────────────────────
type InstallClient = 'desktop' | 'code' | 'web';
type InstallTab = 'oneclick' | 'manual';
type InstallOS = 'windows' | 'mac';

function InstallModal({ server, onClose }: { server: MCPServerMeta; onClose: () => void }) {
  const [client, setClient] = useState<InstallClient>('desktop');
  const [tab, setTab]       = useState<InstallTab>('oneclick');
  const [os, setOs]         = useState<InstallOS>('windows');
  const [copied, setCopied] = useState(false);

  const pkg = server.npmPackage ?? `@mcp-kr/${server.id}`;
  const envVars = server.envVars ?? [];
  const envObj  = envVars.reduce<Record<string, string>>((acc, v) => ({ ...acc, [v.key]: `YOUR_${v.key}` }), {});
  const hasEnv  = envVars.length > 0;

  const desktopConfig = JSON.stringify({
    mcpServers: { [server.id]: { command: 'npx', args: ['-y', pkg], ...(hasEnv && { env: envObj }) } },
  }, null, 2);

  const psEnv = hasEnv
    ? Object.entries(envObj).map(([k, v]) => `"${k}":"${v}"`).join(',')
    : '';
  const psCmd =
    `$cfg="$env:APPDATA\\Claude\\claude_desktop_config.json"; ` +
    `$obj=if(Test-Path $cfg){Get-Content $cfg -Raw|ConvertFrom-Json}else{[pscustomobject]@{mcpServers=[pscustomobject]@{}}}; ` +
    `if(-not $obj.mcpServers){$obj|Add-Member -NotePropertyName mcpServers -NotePropertyValue ([pscustomobject]@{})}; ` +
    `$obj.mcpServers|Add-Member -NotePropertyName "${server.id}" -NotePropertyValue (ConvertFrom-Json '{"command":"npx","args":["-y","${pkg}"]${hasEnv ? `,"env":{${psEnv}}` : ""}}') -Force; ` +
    `$obj|ConvertTo-Json -Depth 10|Set-Content $cfg -Encoding UTF8; Write-Host "✅ ${server.name} 설치 완료! Claude Desktop을 재시작하세요."`;

  const shEnvObj = hasEnv ? { ...envObj } : undefined;
  const shCmd =
    `CFG="$HOME/Library/Application Support/Claude/claude_desktop_config.json"; ` +
    `mkdir -p "$(dirname "$CFG")"; [ -f "$CFG" ] || echo '{"mcpServers":{}}' > "$CFG"; ` +
    `python3 -c "import json; d=json.load(open('$CFG')); d.setdefault('mcpServers',{})['${server.id}']=${JSON.stringify({ command: 'npx', args: ['-y', pkg], ...(shEnvObj && { env: shEnvObj }) })}; json.dump(d,open('$CFG','w'),ensure_ascii=False,indent=2)"; ` +
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

        {/* 헤더 */}
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
              ] as [InstallClient, React.ReactNode, string, string][]).map(([key, icon, label, desc]) => (
                <button key={key} onClick={() => { setClient(key); setTab('oneclick'); }}
                  className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl border text-xs font-semibold transition-colors ${client === key ? 'bg-blue-50 border-blue-400 text-blue-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                  {icon}
                  <span>{label}</span>
                  <span className={`font-normal ${client === key ? 'text-blue-500' : 'text-gray-400'}`}>{desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* ── Claude Desktop ── */}
          {client === 'desktop' && (
            <>
              <div className="flex gap-1">
                {([['oneclick', <Zap key="z" className="w-3.5 h-3.5" />, '원클릭 설치'], ['manual', <BookOpen key="b" className="w-3.5 h-3.5" />, '수동 설치']] as const).map(([t, icon, label]) => (
                  <button key={t} onClick={() => setTab(t as InstallTab)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${tab === t ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                    {icon}{label}
                  </button>
                ))}
              </div>

              {tab === 'oneclick' && (
                <>
                  <div className="flex gap-2">
                    {(['windows', 'mac'] as InstallOS[]).map(o => (
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
                  <ol className="space-y-2.5">
                    {[{ label: 'Claude Desktop 설치', href: 'https://claude.ai/download' }, { label: 'config.json에 아래 설정 추가', href: null }, { label: 'Claude Desktop 재시작', href: null }].map((s, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-gray-700">
                        <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                        {s.href ? <a href={s.href} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">{s.label} <ExternalLink className="w-3.5 h-3.5" /></a> : <span>{s.label}</span>}
                      </li>
                    ))}
                  </ol>
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

          {/* ── Claude Code ── */}
          {client === 'code' && (
            <>
              <div className="flex items-start gap-3 bg-violet-50 border border-violet-200 rounded-xl p-3.5">
                <Terminal className="w-4 h-4 text-violet-600 mt-0.5 shrink-0" />
                <p className="text-xs text-violet-800">Claude Code CLI가 설치되어 있으면 아래 명령어로 바로 등록합니다.</p>
              </div>
              <div className="relative">
                <pre className="bg-gray-900 text-green-400 text-xs rounded-xl p-4 overflow-x-auto leading-relaxed font-mono">{codeCmd}</pre>
                <CopyBtn text={codeCmd} />
              </div>
              <div className="text-xs text-gray-500 bg-gray-50 rounded-xl p-3 space-y-1">
                <p className="font-semibold text-gray-600">범위 옵션</p>
                <p><code className="bg-white border border-gray-200 px-1.5 rounded">--scope user</code> 모든 프로젝트 (기본값)</p>
                <p><code className="bg-white border border-gray-200 px-1.5 rounded">--scope project</code> 현재 프로젝트만</p>
              </div>
            </>
          )}

          {/* ── Claude.ai 웹 ── */}
          {client === 'web' && (
            <>
              <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-3.5">
                <Globe className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                <p className="text-xs text-emerald-800">Claude.ai 웹은 원격 MCP 서버(HTTPS)를 UI에서 직접 등록합니다. Pro·Team·Enterprise 플랜 필요.</p>
              </div>
              <ol className="space-y-2.5">
                {[{ label: 'claude.ai → 프로필 → Settings', href: 'https://claude.ai' }, { label: 'Integrations 메뉴 선택', href: null }, { label: 'Add integration → 아래 URL 입력', href: null }].map((s, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-gray-700">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                    {s.href ? <a href={s.href} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">{s.label} <ExternalLink className="w-3.5 h-3.5" /></a> : <span>{s.label}</span>}
                  </li>
                ))}
              </ol>
              <div className="relative">
                <pre className="bg-gray-900 text-green-400 text-xs rounded-xl p-4 font-mono">{`https://mcp.kr/servers/${server.id}`}</pre>
                <CopyBtn text={`https://mcp.kr/servers/${server.id}`} />
              </div>
            </>
          )}

          {/* 환경 변수 안내 */}
          {hasEnv && client !== 'web' && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
              <p className="text-sm font-semibold text-amber-800">🔑 환경 변수 설정 필요</p>
              {envVars.map(v => (
                <div key={v.key} className="flex items-start gap-2 text-xs text-amber-700">
                  <code className="bg-white border border-amber-200 px-1.5 py-0.5 rounded shrink-0">{v.key}</code>
                  <span>{v.description}{v.docsUrl && <> · <a href={v.docsUrl} target="_blank" rel="noopener noreferrer" className="underline font-medium">발급 방법</a></>}</span>
                </div>
              ))}
            </div>
          )}

          {/* 제공 도구 */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">제공 도구 ({server.tools.length}개)</p>
            <div className="space-y-1.5">
              {server.tools.map(t => (
                <div key={t.name} className="flex items-start gap-2">
                  <code className="text-xs bg-blue-50 border border-blue-100 text-blue-700 px-2 py-0.5 rounded shrink-0">{t.name}</code>
                  <span className="text-xs text-gray-400 pt-0.5">{t.description}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 pb-5">
          <button onClick={onClose} className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-xl transition-colors">닫기</button>
        </div>
      </div>
    </div>
  );
}

// ── 서버 카드 ────────────────────────────────────────────
function ServerCard({ server }: { server: MCPServerMeta }) {
  const [expanded, setExpanded]     = useState(false);
  const [showInstall, setShowInstall] = useState(false);
  const router = useRouter();

  const isPaid = server.pricing === 'paid' || server.pricing === 'enterprise';

  const priceLabel =
    server.pricing === 'free'
      ? '무료'
      : server.priceKRW
      ? `₩${server.priceKRW.toLocaleString()}/월`
      : PRICING_LABELS[server.pricing];

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-md hover:border-blue-300 transition-all duration-200 flex flex-col gap-3">
      {server.isSeed && (
        <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-xl px-2.5 py-1 w-fit -mt-1">
          <Sprout className="w-3 h-3 text-amber-600" />
          <span className="text-xs font-semibold text-amber-700">플랫폼 시드</span>
        </div>
      )}

      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-900 text-base leading-tight">{server.name}</h3>
          <p className="text-xs text-gray-500 mt-0.5">{server.author} · v{server.version}</p>
        </div>
        <span className={`text-xs font-semibold px-2 py-1 rounded-full shrink-0 ${PRICING_BG[server.pricing]}`}>
          {priceLabel}
        </span>
      </div>

      <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">{server.description}</p>

      <div className="flex flex-wrap gap-1.5">
        {server.tags.slice(0, 4).map(t => (
          <span key={t} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">#{t}</span>
        ))}
      </div>

      {server.certs.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          <Shield className="w-3.5 h-3.5 text-gray-400" />
          {server.certs.map(c => (
            <span key={c} className={`text-xs font-medium px-1.5 py-0.5 rounded ${CERT_COLORS[c]}`}>{c}</span>
          ))}
        </div>
      )}

      <div className="flex items-center gap-4 text-sm text-gray-500 pt-1 border-t border-gray-100">
        <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />{formatNum(server.stars)}</span>
        <span className="flex items-center gap-1"><Download className="w-3.5 h-3.5" />{formatNum(server.installs)}</span>
        <span className="ml-auto text-xs text-gray-400">{server.updatedAt}</span>
      </div>

      <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium">
        {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        제공 도구 {server.tools.length}개
      </button>

      {expanded && (
        <div className="bg-gray-50 rounded-xl p-3 space-y-1.5">
          {server.tools.map(t => (
            <div key={t.name} className="flex items-start gap-2">
              <code className="text-xs bg-white border border-gray-200 text-gray-700 px-2 py-0.5 rounded shrink-0">{t.name}</code>
              <span className="text-xs text-gray-400 pt-0.5">{t.description}</span>
            </div>
          ))}
        </div>
      )}

      {showInstall && <InstallModal server={server} onClose={() => setShowInstall(false)} />}
      <div className="flex gap-2 mt-1">
        {isPaid ? (
          <button
            onClick={() => router.push(`/checkout/${server.id}`)}
            className="flex-1 flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
          >
            <CreditCard className="w-3.5 h-3.5" /> 구독하기
          </button>
        ) : (
          <button
            onClick={() => setShowInstall(true)}
            className="flex-1 flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
          >
            <Download className="w-3.5 h-3.5" /> 설치하기
          </button>
        )}
        {server.pricing === 'freemium' && (
          <button
            onClick={() => router.push(`/checkout/${server.id}`)}
            className="flex items-center gap-1 px-3 py-2.5 border border-blue-200 rounded-xl text-sm text-blue-600 hover:bg-blue-50 transition-colors font-semibold"
          >
            <CreditCard className="w-3.5 h-3.5" /> 업그레이드
          </button>
        )}
        <a href={server.apiDocs} target="_blank" rel="noopener noreferrer" className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors">문서</a>
      </div>
    </div>
  );
}

// ── 마켓플레이스 메인 컴포넌트 ───────────────────────────
export default function Marketplace() {
  const [search, setSearch]     = useState('');
  const [category, setCategory] = useState<Category | 'all'>('all');
  const [pricing, setPricing]   = useState('all');
  const [sort, setSort]         = useState<'installs' | 'stars' | 'updatedAt'>('installs');
  const [seedOnly, setSeedOnly] = useState(false);

  const filtered = useMemo(() => {
    let r = [...REGISTRY];
    if (seedOnly)               r = r.filter(s => s.isSeed);
    if (category !== 'all')     r = r.filter(s => s.category === category);
    if (pricing !== 'all')      r = r.filter(s => s.pricing === pricing);
    if (search) {
      const q = search.toLowerCase();
      r = r.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.tags.some(t => t.toLowerCase().includes(q))
      );
    }
    r.sort((a, b) => {
      if (sort === 'stars')     return b.stars - a.stars;
      if (sort === 'updatedAt') return b.updatedAt.localeCompare(a.updatedAt);
      return b.installs - a.installs;
    });
    return r;
  }, [search, category, pricing, sort, seedOnly]);

  return (
    <div className="space-y-6">
      {/* 검색·필터 바 */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="스마트스토어, 위택스, 국민연금..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
        </div>
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-gray-400" />
          <select value={pricing} onChange={e => setPricing(e.target.value)} className="text-sm border border-gray-200 rounded-xl px-3 py-2.5 bg-white focus:outline-none">
            <option value="all">전체 가격</option>
            <option value="free">무료</option>
            <option value="freemium">프리미엄</option>
            <option value="paid">유료</option>
          </select>
          <select value={sort} onChange={e => setSort(e.target.value as typeof sort)} className="text-sm border border-gray-200 rounded-xl px-3 py-2.5 bg-white focus:outline-none">
            <option value="installs">설치 많은 순</option>
            <option value="stars">별점 높은 순</option>
            <option value="updatedAt">최신 순</option>
          </select>
        </div>
      </div>

      {/* 카테고리 탭 */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.id)}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all border',
              category === cat.id ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
            )}
          >
            {cat.emoji} {cat.label}
          </button>
        ))}
        <button
          onClick={() => setSeedOnly(!seedOnly)}
          className={cn(
            'flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all border',
            seedOnly ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-gray-600 border-gray-200 hover:border-amber-400'
          )}
        >
          <Sprout className="w-3.5 h-3.5" /> 시드 서버만
        </button>
      </div>

      {/* 결과 수 */}
      <p className="text-sm text-gray-500">{filtered.length}개 MCP 서버</p>

      {/* 그리드 */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-5xl mb-4">🔍</p>
          <p className="font-semibold text-gray-600">검색 결과가 없습니다</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(s => <ServerCard key={s.id} server={s} />)}
        </div>
      )}
    </div>
  );
}
