'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';
import { REGISTRY } from '@mcp-kr/registry';
import Header from '@/components/Header';
import { CheckCircle, Download, FileText, ArrowRight, LayoutDashboard } from 'lucide-react';

function SuccessContent() {
  const params   = useSearchParams();
  const serverId = params.get('server') ?? '';
  const plan     = params.get('plan') === 'yearly' ? '연간' : '월간';
  const amount   = Number(params.get('amount') ?? 0);
  const server   = REGISTRY.find(s => s.id === serverId);

  const orderId  = 'ORD-' + Math.random().toString(36).slice(2, 10).toUpperCase();
  const today    = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
  const nextDate = (() => {
    const d = new Date();
    plan === '연간' ? d.setFullYear(d.getFullYear() + 1) : d.setMonth(d.getMonth() + 1);
    return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
  })();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        {/* 성공 아이콘 */}
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-500" />
        </div>

        <h1 className="text-2xl font-extrabold text-gray-900 mb-2">결제가 완료되었습니다!</h1>
        <p className="text-gray-500 text-sm mb-8">
          {server?.name ?? '서버'} {plan} 구독이 시작되었습니다.
        </p>

        {/* 주문 요약 카드 */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 text-left space-y-3 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">결제 내역</h2>
          {[
            { label: '주문번호',   value: orderId },
            { label: '결제 서버',  value: server?.name ?? serverId },
            { label: '구독 플랜', value: `${plan} 구독` },
            { label: '결제 금액', value: `₩${amount.toLocaleString()}` },
            { label: '결제일',    value: today },
            { label: '다음 결제일', value: nextDate },
          ].map(row => (
            <div key={row.label} className="flex justify-between text-sm">
              <span className="text-gray-500">{row.label}</span>
              <span className="font-medium text-gray-900">{row.value}</span>
            </div>
          ))}
        </div>

        {/* 안내 메시지 */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-left mb-8 space-y-2">
          {[
            { icon: Download,    text: '설치 가이드가 등록 이메일로 발송되었습니다.' },
            { icon: FileText,    text: '세금계산서는 매월 정산일에 자동 발행됩니다.' },
            { icon: CheckCircle, text: '구독 관리는 대시보드에서 언제든 가능합니다.' },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-start gap-2.5 text-sm text-blue-800">
              <Icon className="w-4 h-4 shrink-0 mt-0.5 text-blue-500" />
              {text}
            </div>
          ))}
        </div>

        {/* CTA 버튼 */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/browse"
            className="flex-1 flex items-center justify-center gap-2 border border-gray-200 rounded-xl py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            다른 MCP 둘러보기 <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/dashboard"
            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 text-sm font-semibold transition-colors"
          >
            <LayoutDashboard className="w-4 h-4" /> 대시보드로 이동
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense>
      <SuccessContent />
    </Suspense>
  );
}
