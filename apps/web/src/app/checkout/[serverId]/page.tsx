'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { REGISTRY } from '@mcp-kr/registry';
import Header from '@/components/Header';
import { Shield, CheckCircle, Lock, CreditCard, ChevronRight, AlertCircle } from 'lucide-react';

const PLANS = [
  { id: 'monthly', label: '월간 구독', discount: 0, badge: null },
  { id: 'yearly',  label: '연간 구독', discount: 20, badge: '20% 할인' },
];

type CardBrand = 'visa' | 'mastercard' | 'local';

function detectBrand(num: string): CardBrand {
  if (num.startsWith('4')) return 'visa';
  if (num.startsWith('5')) return 'mastercard';
  return 'local';
}

export default function CheckoutPage() {
  const params    = useParams();
  const router    = useRouter();
  const serverId  = params?.serverId as string;
  const server    = REGISTRY.find(s => s.id === serverId);

  const [plan, setPlan]         = useState<'monthly' | 'yearly'>('monthly');
  const [cardNum, setCardNum]   = useState('');
  const [expiry, setExpiry]     = useState('');
  const [cvc, setCvc]           = useState('');
  const [name, setName]         = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  if (!server || (server.pricing !== 'paid' && server.pricing !== 'freemium' && server.pricing !== 'enterprise')) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-lg mx-auto px-4 py-24 text-center text-gray-500">
          결제가 필요하지 않은 서버이거나 서버를 찾을 수 없습니다.
        </div>
      </div>
    );
  }

  const basePrice   = server.priceKRW ?? 0;
  const selectedPlan = PLANS.find(p => p.id === plan)!;
  const monthly     = plan === 'yearly' ? Math.round(basePrice * 0.8) : basePrice;
  const total       = plan === 'yearly' ? monthly * 12 : monthly;
  const vat         = Math.round(total * 0.1);
  const subtotal    = total - vat;

  function formatCard(raw: string) {
    return raw.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
  }
  function formatExpiry(raw: string) {
    const d = raw.replace(/\D/g, '').slice(0, 4);
    return d.length > 2 ? d.slice(0, 2) + ' / ' + d.slice(2) : d;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const digits = cardNum.replace(/\s/g, '');
    if (digits.length < 16) { setError('카드 번호 16자리를 입력하세요.'); return; }
    if (expiry.replace(/\s\/\s/g, '').length < 4) { setError('유효기간을 입력하세요.'); return; }
    if (cvc.length < 3) { setError('CVC 3자리를 입력하세요.'); return; }
    if (!name.trim()) { setError('카드 소지인 이름을 입력하세요.'); return; }

    setLoading(true);
    // 모의 결제 처리 (실제 토스페이먼츠 연동 시 /api/payment/confirm 호출)
    await new Promise(r => setTimeout(r, 1800));
    setLoading(false);

    const params = new URLSearchParams({
      server:  server!.id,
      plan,
      amount:  String(total),
    });
    router.push(`/checkout/success?${params.toString()}`);
  }

  const brand = detectBrand(cardNum.replace(/\s/g, ''));

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">구독 결제</h1>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

          {/* ── 왼쪽: 결제 폼 ── */}
          <form onSubmit={handleSubmit} className="lg:col-span-3 space-y-6">

            {/* 플랜 선택 */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <h2 className="font-semibold text-gray-900 mb-4">구독 플랜</h2>
              <div className="grid grid-cols-2 gap-3">
                {PLANS.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPlan(p.id as 'monthly' | 'yearly')}
                    className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                      plan === p.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {p.badge && (
                      <span className="absolute -top-2.5 left-3 bg-blue-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                        {p.badge}
                      </span>
                    )}
                    <p className="font-semibold text-sm text-gray-900">{p.label}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      ₩{(p.id === 'yearly' ? Math.round(basePrice * 0.8) : basePrice).toLocaleString()}/월
                      {p.id === 'yearly' && <span className="text-blue-600 font-medium"> · 연 청구</span>}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* 카드 정보 */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">카드 정보</h2>
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <Lock className="w-3 h-3" /> SSL 암호화
                </div>
              </div>

              {/* 카드 번호 */}
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1.5">카드 번호</label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="0000 0000 0000 0000"
                    value={cardNum}
                    onChange={e => setCardNum(formatCard(e.target.value))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 pr-12"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 uppercase">
                    {brand === 'visa' ? 'VISA' : brand === 'mastercard' ? 'MC' : '카드'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1.5">유효기간</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="MM / YY"
                    value={expiry}
                    onChange={e => setExpiry(formatExpiry(e.target.value))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1.5">CVC</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="000"
                    maxLength={4}
                    value={cvc}
                    onChange={e => setCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1.5">카드 소지인</label>
                <input
                  type="text"
                  placeholder="홍길동"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-4 rounded-2xl text-base transition-colors"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  결제 처리 중…
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5" />
                  ₩{total.toLocaleString()} 결제하기
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>

            <p className="text-xs text-center text-gray-400">
              결제 시 <span className="underline cursor-pointer">이용약관</span> 및 <span className="underline cursor-pointer">개인정보 처리방침</span>에 동의하는 것으로 간주됩니다.
            </p>
          </form>

          {/* ── 오른쪽: 주문 요약 ── */}
          <div className="lg:col-span-2 space-y-4">
            {/* 서버 정보 */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <p className="text-xs text-gray-400 mb-1">구독 서버</p>
              <h3 className="font-bold text-gray-900 text-base">{server.name}</h3>
              <p className="text-xs text-gray-500 mt-0.5">{server.author}</p>
              <p className="text-xs text-gray-400 mt-2 leading-relaxed line-clamp-3">{server.description}</p>
            </div>

            {/* 금액 요약 */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-2.5">
              <h3 className="font-semibold text-gray-900 mb-3">결제 금액</h3>
              <div className="flex justify-between text-sm text-gray-600">
                <span>{selectedPlan.label}</span>
                <span>₩{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>부가세 (10%)</span>
                <span>₩{vat.toLocaleString()}</span>
              </div>
              {plan === 'yearly' && (
                <div className="flex justify-between text-sm text-blue-600 font-medium">
                  <span>연간 할인 (20%)</span>
                  <span>-₩{(basePrice * 12 - total).toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-gray-900 pt-2 border-t border-gray-100 text-base">
                <span>합계</span>
                <span>₩{total.toLocaleString()}</span>
              </div>
              <p className="text-xs text-gray-400">
                {plan === 'yearly' ? '연 1회 청구 · 매년 자동 갱신' : '매월 자동 청구 · 언제든 해지 가능'}
              </p>
            </div>

            {/* 보안 배지 */}
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-2">
              {[
                '토스페이먼츠 PG 연동',
                'PCI-DSS Level 1 인증',
                '언제든 해지 가능',
                '세금계산서 자동 발행',
              ].map(item => (
                <div key={item} className="flex items-center gap-2 text-xs text-gray-500">
                  <Shield className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
