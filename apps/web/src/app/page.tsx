'use client';

import Link from 'next/link';
import { REGISTRY, getFeatured, type MCPServerMeta } from '@mcp-kr/registry';

const MVP_FEATURES = [
  { id: 'browse',   label: '검색·탐색',   done: true,  desc: '카테고리·키워드·가격 필터 검색' },
  { id: 'install',  label: '원클릭 설치', done: true,  desc: 'config.json 자동 생성 + 복사' },
  { id: 'auth',     label: '회원가입',    done: false, desc: 'GitHub/카카오 소셜 로그인' },
  { id: 'payment',  label: '결제',        done: false, desc: '토스페이먼츠 구독 결제' },
  { id: 'settle',   label: '공급자 정산', done: false, desc: '원화 정산 + 세금계산서 자동 발행' },
  { id: 'register', label: '서버 등록',   done: true,  desc: '공급자 MCP 서버 제출 폼 (5단계 검증 + 인증 API 확인)' },
];
import { ArrowRight, CheckCircle, Circle, Search, Package, CreditCard, BarChart2, UserPlus, Star, Sprout, Download, Shield, ChevronDown, ChevronUp, Copy, Check, X, ExternalLink } from 'lucide-react';
import Header from '@/components/Header';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const STATS = [
  { value: `${REGISTRY.length}개`, label: '등록 MCP 서버' },
  { value: `${REGISTRY.filter(s => s.isSeed).length}개`, label: '플랫폼 시드 서버' },
  { value: '₩0',  label: '등록 수수료' },
  { value: '원화', label: '정산 통화' },
];

const HOW_IT_WORKS = [
  { icon: Search,    step: '1', title: '검색·탐색',   desc: '카테고리·키워드로 필요한 MCP를 찾습니다.' },
  { icon: Package,   step: '2', title: '원클릭 설치', desc: 'config.json을 자동 생성해 Claude Desktop에 붙여넣기만 하면 됩니다.' },
  { icon: CreditCard,step: '3', title: '구독 결제',   desc: '토스페이먼츠로 원화 구독을 시작합니다. 첫 달 무료.' },
  { icon: BarChart2, step: '4', title: '즉시 사용',   desc: 'Claude에서 국내 서비스·ERP·공공데이터를 바로 다룹니다.' },
];

// ── 랜딩 전용 미니 카드 (설치 모달 포함) ──────────────────
const PRICING_BG: Record<string, string> = {
  free: 'bg-emerald-100 text-emerald-800', freemium: 'bg-sky-100 text-sky-800',
  paid: 'bg-violet-100 text-violet-800', enterprise: 'bg-amber-100 text-amber-800',
};
const CERT_COLORS: Record<string, string> = {
  'ISMS-P': 'bg-blue-100 text-blue-700', 'ISO27001': 'bg-indigo-100 text-indigo-700',
  'CC인증': 'bg-purple-100 text-purple-700', 'CSAP': 'bg-emerald-100 text-emerald-700',
};

function MiniInstallModal({ server, onClose }: { server: MCPServerMeta; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const config = JSON.stringify({
    mcpServers: {
      [server.id]: {
        command: 'npx',
        args: ['-y', server.npmPackage ?? `@mcp-kr/${server.id}`],
        ...(server.pricing !== 'free' && { env: { API_KEY: 'YOUR_API_KEY_HERE' } }),
      },
    },
  }, null, 2);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-gray-100 sticky top-0 bg-white">
          <div><h2 className="font-bold text-gray-900 text-lg">{server.name} 설치</h2><p className="text-xs text-gray-500 mt-0.5">v{server.version} · {server.author}</p></div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="px-6 py-5 space-y-5">
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
            <pre className="bg-gray-900 text-green-400 text-xs rounded-xl p-4 overflow-x-auto leading-relaxed font-mono">{config}</pre>
            <button onClick={() => { navigator.clipboard.writeText(config); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="absolute top-3 right-3 flex items-center gap-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs px-2.5 py-1.5 rounded-lg transition-colors">
              {copied ? <><Check className="w-3.5 h-3.5 text-green-400" /> 복사됨</> : <><Copy className="w-3.5 h-3.5" /> 복사</>}
            </button>
          </div>
          {server.pricing !== 'free' && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
              <p className="font-semibold mb-1">🔑 API 키 필요</p>
              <p className="text-xs leading-relaxed"><code className="bg-white px-1 rounded">YOUR_API_KEY_HERE</code>를 실제 API 키로 교체하세요. <a href={server.apiDocs} target="_blank" rel="noopener noreferrer" className="underline font-medium">공식 문서</a>에서 발급받을 수 있습니다.</p>
            </div>
          )}
        </div>
        <div className="px-6 pb-5"><button onClick={onClose} className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-xl transition-colors">닫기</button></div>
      </div>
    </div>
  );
}

function FeaturedCard({ server }: { server: MCPServerMeta }) {
  const [showInstall, setShowInstall] = useState(false);
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-md hover:border-blue-300 transition-all duration-200 flex flex-col gap-3">
      {server.isSeed && (
        <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-xl px-2.5 py-1 w-fit -mt-1">
          <Sprout className="w-3 h-3 text-amber-600" /><span className="text-xs font-semibold text-amber-700">플랫폼 시드</span>
        </div>
      )}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-900 text-base leading-tight">{server.name}</h3>
          <p className="text-xs text-gray-500 mt-0.5">{server.author} · v{server.version}</p>
        </div>
        <span className={`text-xs font-semibold px-2 py-1 rounded-full shrink-0 ${PRICING_BG[server.pricing]}`}>
          {server.pricing === 'free' ? '무료' : server.priceKRW ? `₩${server.priceKRW.toLocaleString()}/월` : server.pricing}
        </span>
      </div>
      <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">{server.description}</p>
      {server.certs.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          <Shield className="w-3.5 h-3.5 text-gray-400" />
          {server.certs.map(c => <span key={c} className={`text-xs font-medium px-1.5 py-0.5 rounded ${CERT_COLORS[c] ?? 'bg-gray-100 text-gray-600'}`}>{c}</span>)}
        </div>
      )}
      <div className="flex items-center gap-4 text-sm text-gray-500 pt-1 border-t border-gray-100">
        <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />{server.stars.toLocaleString()}</span>
        <span className="flex items-center gap-1"><Download className="w-3.5 h-3.5" />{server.installs.toLocaleString()}</span>
      </div>
      <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium">
        {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}제공 도구 {server.tools.length}개
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
      {showInstall && <MiniInstallModal server={server} onClose={() => setShowInstall(false)} />}
      <div className="flex gap-2 mt-1">
        <button onClick={() => setShowInstall(true)} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors">설치하기</button>
        <a href={server.apiDocs} target="_blank" rel="noopener noreferrer" className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors">문서</a>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const featuredServers = getFeatured().slice(0, 6);

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* ── Hero ─────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-900 text-white">
        {/* 배경 그리드 */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:48px_48px]" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-sm font-medium mb-6">
            🇰🇷 한국 No.1 MCP 서버 마켓플레이스
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight max-w-4xl">
            Claude에 한국 업무를<br />
            <span className="text-blue-400">원클릭으로 연결</span>하세요
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-300 max-w-2xl leading-relaxed">
            더존 iCUBE ERP·홈택스·나라장터·카카오까지 — 국내 업무에 필요한 MCP 서버를 찾고, 설치하고, 결제하는 모든 것을 한 곳에서.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/browse"
              className="flex items-center gap-2 bg-blue-500 hover:bg-blue-400 text-white font-semibold px-6 py-3 rounded-xl text-base transition-colors"
            >
              MCP 서버 찾기 <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/register"
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/30 text-white font-semibold px-6 py-3 rounded-xl text-base transition-colors"
            >
              공급자로 등록
            </Link>
          </div>

        </div>
      </section>

      {/* ── Stats ───────────────────────────────── */}
      <section className="border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {STATS.map(s => (
            <div key={s.label}>
              <p className="text-2xl font-extrabold text-gray-900">{s.value}</p>
              <p className="text-sm text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">어떻게 사용하나요?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {HOW_IT_WORKS.map(({ icon: Icon, step, title, desc }) => (
            <div key={step} className="flex flex-col items-start gap-3 p-5 bg-gray-50 rounded-2xl">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">{step}</span>
                <Icon className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="font-bold text-gray-900">{title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Featured Servers ────────────────────── */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
              <h2 className="text-2xl font-bold text-gray-900">추천 MCP 서버</h2>
            </div>
            <Link href="/browse" className="text-sm font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1">
              전체 보기 <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {featuredServers.map(s => (
              <FeaturedCard key={s.id} server={s} />
            ))}
          </div>
        </div>
      </section>

      {/* ── 원화 정산 + 보안 ───────────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-8">
          <div className="text-4xl mb-4">💳</div>
          <h3 className="text-xl font-bold text-gray-900 mb-3">공급자 원화 정산 자동화</h3>
          <p className="text-sm text-gray-600 leading-relaxed mb-5">
            글로벌 플랫폼에선 달러 결제에 직접 세금계산서를 처리해야 합니다. 여기서는 다릅니다. 매월 원화 자동 정산 → 세금계산서 자동 발행 → 부가세 신고 데이터 추출까지 모두 자동으로 처리됩니다.
          </p>
          <ul className="space-y-1.5 text-sm text-emerald-800">
            {['매월 자동 정산 (수수료 15%)', '전자세금계산서 자동 발행', '부가세 신고 데이터 자동 추출', '정산 대시보드 실시간 확인'].map(item => (
              <li key={item} className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />{item}</li>
            ))}
          </ul>
          <Link href="/register" className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 hover:text-emerald-900">
            공급자로 등록하기 <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-8">
          <div className="text-4xl mb-4">🛡️</div>
          <h3 className="text-xl font-bold text-gray-900 mb-3">엔터프라이즈 보안 인증 선제 취득</h3>
          <p className="text-sm text-gray-600 leading-relaxed mb-5">
            대기업·공공기관에 MCP를 도입할 때 가장 큰 장벽은 보안 검토입니다. 등록된 MCP 서버는 ISMS-P, ISO 27001 취득 여부를 사전 검증합니다.
          </p>
          <ul className="space-y-1.5 text-sm text-blue-800">
            {['ISMS-P 인증 서버만 엔터프라이즈 배지 부여', 'ISO 27001·CC인증 검증', '보안 취약점 정기 스캔', '계약서·개인정보 처리방침 표준 제공'].map(item => (
              <li key={item} className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-blue-500 shrink-0" />{item}</li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── MVP 로드맵 ──────────────────────────── */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">MVP 구현 현황</h2>
          <p className="text-sm text-gray-500 text-center mb-8">6개 기능이 모두 완성되면 정식 런칭합니다</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {MVP_FEATURES.map(f => (
              <div key={f.id} className={`flex items-start gap-3 p-4 rounded-xl border ${f.done ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}`}>
                {f.done
                  ? <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                  : <Circle className="w-5 h-5 text-gray-300 shrink-0 mt-0.5" />}
                <div>
                  <p className={`text-sm font-semibold ${f.done ? 'text-green-800' : 'text-gray-500'}`}>{f.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5 leading-snug">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Provider CTA ───────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl px-8 py-14 text-white">
          <h2 className="text-3xl font-extrabold mb-3">Founding Provider 100명을 모집합니다</h2>
          <p className="text-blue-100 text-lg mb-2">플랫폼과 함께 MCP 생태계를 만들어 가실 초기 공급자를 찾습니다.</p>
          <p className="text-blue-200 text-sm mb-8">수수료 면제 (6개월) · 배지 부여 · 공동 마케팅 지원</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/register"
              className="flex items-center gap-2 bg-white text-blue-700 hover:bg-blue-50 font-bold px-8 py-3 rounded-xl text-base transition-colors"
            >
              <UserPlus className="w-5 h-5" /> 공급자 등록
            </Link>
            <a
              href="mailto:founding@mcp-kr.dev"
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 border border-white/40 text-white font-semibold px-8 py-3 rounded-xl text-base transition-colors"
            >
              문의하기
            </a>
          </div>
        </div>
      </section>

      <footer className="border-t border-gray-100 py-8 text-center text-sm text-gray-400">
        <p>© 2026 MCP 마켓플레이스 | 한국 특화 MCP 서버 허브</p>
        <p className="mt-1">문의: founding@mcp-kr.dev</p>
      </footer>
    </div>
  );
}
