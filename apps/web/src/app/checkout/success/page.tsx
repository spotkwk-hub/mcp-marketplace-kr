'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { REGISTRY } from '@mcp-kr/registry';
import Header from '@/components/Header';
import { CheckCircle, Download, FileText, ArrowRight, LayoutDashboard, Loader2, AlertCircle } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

function SuccessContent() {
  const params     = useSearchParams();
  const router     = useRouter();
  const serverId   = params.get('server') ?? '';
  const plan       = params.get('plan') === 'yearly' ? '연간' : '월간';
  const amount     = Number(params.get('amount') ?? 0);
  const paymentKey = params.get('paymentKey') ?? '';
  const orderId    = params.get('orderId') ?? '';
  const bizNo      = params.get('bizNo') ?? '';
  const server     = REGISTRY.find(s => s.id === serverId);

  const [status, setStatus] = useState<'confirming' | 'done' | 'error'>('confirming');
  const [errorMsg, setErrorMsg] = useState('');

  const today    = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
  const nextDate = (() => {
    const d = new Date();
    plan === '연간' ? d.setFullYear(d.getFullYear() + 1) : d.setMonth(d.getMonth() + 1);
    return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
  })();

  useEffect(() => {
    if (!paymentKey || !orderId || !amount) {
      setStatus('done');
      return;
    }
    fetch(`${API_BASE}/payments/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        paymentKey,
        orderId,
        amount,
        ...(bizNo ? { buyerBizNo: bizNo } : {}),
        itemName: `${server?.name ?? serverId} MCP 서버 이용료`,
      }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.ok) setStatus('done');
        else { setStatus('error'); setErrorMsg(data.error ?? '결제 승인 실패'); }
      })
      .catch(e => { setStatus('error'); setErrorMsg(e.message); });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (status === 'confirming') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-lg mx-auto px-4 py-24 flex flex-col items-center gap-3 text-gray-500">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <p className="text-sm">결제 승인 처리 중…</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-lg mx-auto px-4 py-24 flex flex-col items-center gap-4">
          <AlertCircle className="w-12 h-12 text-red-500" />
          <h1 className="text-xl font-bold text-gray-900">결제 승인 오류</h1>
          <p className="text-sm text-gray-500">{errorMsg}</p>
          <button onClick={() => router.back()} className="px-5 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl">
            돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-500" />
        </div>

        <h1 className="text-2xl font-extrabold text-gray-900 mb-2">결제가 완료되었습니다!</h1>
        <p className="text-gray-500 text-sm mb-8">
          {server?.name ?? serverId} {plan} 구독이 시작되었습니다.
        </p>

        <div className="bg-white border border-gray-200 rounded-2xl p-6 text-left space-y-3 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">결제 내역</h2>
          {[
            { label: '주문번호',    value: orderId || ('ORD-' + Math.random().toString(36).slice(2, 10).toUpperCase()) },
            { label: '결제 서버',   value: server?.name ?? serverId },
            { label: '구독 플랜',  value: `${plan} 구독` },
            { label: '결제 금액',  value: `₩${amount.toLocaleString()}` },
            { label: '결제일',     value: today },
            { label: '다음 결제일', value: nextDate },
          ].map(row => (
            <div key={row.label} className="flex justify-between text-sm">
              <span className="text-gray-500">{row.label}</span>
              <span className="font-medium text-gray-900">{row.value}</span>
            </div>
          ))}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-left mb-8 space-y-2">
          {[
            { icon: Download,    text: '설치 가이드가 등록 이메일로 발송되었습니다.' },
            { icon: FileText,    text: bizNo ? '세금계산서가 자동 발행 처리되었습니다.' : '세금계산서는 사업자번호 등록 후 발행 가능합니다.' },
            { icon: CheckCircle, text: '구독 관리는 대시보드에서 언제든 가능합니다.' },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-start gap-2.5 text-sm text-blue-800">
              <Icon className="w-4 h-4 shrink-0 mt-0.5 text-blue-500" />
              {text}
            </div>
          ))}
        </div>

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
