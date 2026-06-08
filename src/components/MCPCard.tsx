'use client';

import { MCPServer } from '@/types';
import { CERT_COLORS, PRICING_LABELS } from '@/lib/data';
import { formatKRW, formatNumber } from '@/lib/utils';
import { Star, Download, Shield, CheckCircle, ChevronDown, ChevronUp, Sprout, CreditCard } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import InstallModal from './InstallModal';

const PRICING_BG: Record<string, string> = {
  free:       'bg-emerald-100 text-emerald-800',
  freemium:   'bg-sky-100 text-sky-800',
  paid:       'bg-violet-100 text-violet-800',
  enterprise: 'bg-amber-100 text-amber-800',
};

export default function MCPCard({ server }: { server: MCPServer }) {
  const [expanded, setExpanded]     = useState(false);
  const [showInstall, setShowInstall] = useState(false);
  const router = useRouter();

  const isPaid = server.pricing === 'paid' || server.pricing === 'enterprise';

  const priceLabel =
    (server.pricing === 'paid' || server.pricing === 'enterprise') && server.priceKRW
      ? formatKRW(server.priceKRW) + '/월'
      : (server.pricing === 'freemium' && server.priceKRW)
      ? `${PRICING_LABELS[server.pricing]} · ₩${server.priceKRW.toLocaleString()}~`
      : PRICING_LABELS[server.pricing];

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-md hover:border-blue-300 transition-all duration-200 flex flex-col gap-3">

      {/* 시드 배지 (플랫폼 직접 제작) */}
      {server.isSeed && (
        <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-xl px-2.5 py-1 w-fit -mt-1">
          <Sprout className="w-3 h-3 text-amber-600" />
          <span className="text-xs font-semibold text-amber-700">플랫폼 시드 서버</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-gray-900 text-base leading-tight">{server.name}</h3>
            {server.authorVerified && (
              <CheckCircle className="w-4 h-4 text-blue-500 shrink-0" aria-label="공식 인증 공급자" />
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5">{server.author} · v{server.version}</p>
        </div>
        <span className={`text-xs font-semibold px-2 py-1 rounded-full shrink-0 ${PRICING_BG[server.pricing]}`}>
          {priceLabel}
        </span>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">{server.description}</p>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5">
        {server.tags.slice(0, 4).map(tag => (
          <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
            #{tag}
          </span>
        ))}
      </div>

      {/* Security Certs */}
      {server.certs.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          <Shield className="w-3.5 h-3.5 text-gray-400" />
          {server.certs.map(cert => (
            <span key={cert} className={`text-xs font-medium px-1.5 py-0.5 rounded ${CERT_COLORS[cert]}`}>
              {cert}
            </span>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="flex items-center gap-4 text-sm text-gray-500 pt-1 border-t border-gray-100">
        <span className="flex items-center gap-1">
          <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
          {formatNumber(server.stars)}
        </span>
        <span className="flex items-center gap-1">
          <Download className="w-3.5 h-3.5" />
          {formatNumber(server.installs)}
        </span>
        <span className="ml-auto text-xs text-gray-400">업데이트 {server.updatedAt}</span>
      </div>

      {/* Tool list toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
      >
        {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        제공 도구 {server.tools.length}개 보기
      </button>

      {expanded && (
        <div className="bg-gray-50 rounded-xl p-3 space-y-1.5">
          {server.tools.map(tool => (
            <div key={tool.name} className="flex items-start gap-2">
              <code className="text-xs bg-white border border-gray-200 text-gray-700 px-2 py-0.5 rounded shrink-0">
                {tool.name}
              </code>
              <span className="text-xs text-gray-400 leading-relaxed pt-0.5">{tool.description}</span>
            </div>
          ))}
        </div>
      )}

      {/* CTA */}
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
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
          >
            설치하기
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
        <a
          href={server.apiDocs}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors"
        >
          문서
        </a>
      </div>
    </div>
  );
}
