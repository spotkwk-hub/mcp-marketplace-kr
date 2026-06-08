'use client';

import Link from 'next/link';
import { MCP_SERVERS, MVP_FEATURES } from '@/lib/data';
import { formatNumber } from '@/lib/utils';
import { ArrowRight, CheckCircle, Circle, Search, Package, CreditCard, BarChart2, UserPlus, Star, Sprout } from 'lucide-react';
import MCPCard from '@/components/MCPCard';
import Header from '@/components/Header';

const STATS = [
  { value: '9개',  label: '등록 MCP 서버' },
  { value: '6개',  label: '플랫폼 시드 서버' },
  { value: '₩0',  label: '등록 수수료' },
  { value: '원화', label: '정산 통화' },
];

const HOW_IT_WORKS = [
  { icon: Search,    step: '1', title: '검색·탐색',   desc: '카테고리·키워드로 필요한 MCP를 찾습니다.' },
  { icon: Package,   step: '2', title: '원클릭 설치', desc: 'config.json을 자동 생성해 Claude Desktop에 붙여넣기만 하면 됩니다.' },
  { icon: CreditCard,step: '3', title: '구독 결제',   desc: '토스페이먼츠로 원화 구독을 시작합니다. 첫 달 무료.' },
  { icon: BarChart2, step: '4', title: '즉시 사용',   desc: 'Claude에서 국내 서비스·ERP·공공데이터를 바로 다룹니다.' },
];

export default function LandingPage() {
  const seedServers = MCP_SERVERS.filter(s => s.isSeed);
  const featuredServers = MCP_SERVERS.filter(s => s.featured).slice(0, 6);

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
              <MCPCard key={s.id} server={s} />
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
