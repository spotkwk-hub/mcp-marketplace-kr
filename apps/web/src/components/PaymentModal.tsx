'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { loadPaymentWidget, PaymentWidgetInstance } from '@tosspayments/payment-widget-sdk';
import { X, Loader2 } from 'lucide-react';

const CLIENT_KEY = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY ?? 'test_ck_placeholder';
const API_BASE   = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

// 테스트 금액 — 프로덕션에서는 server.priceKRW 사용
const TEST_AMOUNT = 10;

function makeOrderId() {
  return 'ORD-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7).toUpperCase();
}

type Props = {
  serverId: string;
  serverName: string;
  onClose: () => void;
};

export default function PaymentModal({ serverId, serverName, onClose }: Props) {
  const widgetRef   = useRef<PaymentWidgetInstance | null>(null);
  const methodRef   = useRef<ReturnType<PaymentWidgetInstance['renderPaymentMethods']> | null>(null);
  const orderIdRef  = useRef(makeOrderId());
  const [loading, setLoading]   = useState(true);
  const [paying,  setPaying]    = useState(false);
  const [error,   setError]     = useState('');
  const [bizNo,   setBizNo]     = useState('');

  // 배경 스크롤 잠금
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // Toss 위젯 초기화
  useEffect(() => {
    const customerKey = 'guest-' + Math.random().toString(36).slice(2, 10);
    let cancelled = false;

    loadPaymentWidget(CLIENT_KEY, customerKey).then(widget => {
      if (cancelled) return;
      widgetRef.current = widget;
      methodRef.current = widget.renderPaymentMethods(
        '#toss-payment-widget',
        { value: TEST_AMOUNT },
        { variantKey: 'DEFAULT' },
      );
      widget.renderAgreement('#toss-agreement-widget', { variantKey: 'AGREEMENT' });
      setLoading(false);
    }).catch(e => {
      if (!cancelled) setError('결제 위젯 로드 실패: ' + e.message);
    });

    return () => { cancelled = true; };
  }, []);

  const handlePay = useCallback(async () => {
    if (!widgetRef.current) return;
    setPaying(true);
    setError('');
    try {
      await widgetRef.current.requestPayment({
        orderId:   orderIdRef.current,
        orderName: `${serverName} MCP 서버 이용료`,
        successUrl: `${window.location.origin}/checkout/success?server=${serverId}&amount=${TEST_AMOUNT}&bizNo=${encodeURIComponent(bizNo)}`,
        failUrl:    `${window.location.origin}/checkout/fail`,
        customerName: '테스트 고객',
      });
    } catch (e: any) {
      if (e?.code !== 'USER_CANCEL') {
        setError(e?.message ?? '결제 요청 실패');
      }
      setPaying(false);
    }
  }, [serverId, serverName, bizNo]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <p className="text-xs text-gray-400 mb-0.5">구독 결제</p>
            <h2 className="font-bold text-gray-900 text-base leading-tight">{serverName}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* 금액 요약 */}
        <div className="px-6 py-3 bg-blue-50 border-b border-blue-100 flex justify-between items-center text-sm">
          <span className="text-blue-700 font-medium">테스트 결제 금액</span>
          <span className="font-extrabold text-blue-900">₩{TEST_AMOUNT.toLocaleString()}</span>
        </div>

        <div className="px-6 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* 사업자번호 (선택) */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              사업자번호 <span className="text-gray-400 font-normal">(세금계산서 발행 시 입력)</span>
            </label>
            <input
              type="text"
              value={bizNo}
              onChange={e => setBizNo(e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder="1234567890"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>

          {/* Toss 결제 위젯 */}
          {loading && (
            <div className="flex items-center justify-center py-10 text-gray-400 gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">결제 수단 불러오는 중…</span>
            </div>
          )}
          <div id="toss-payment-widget" />
          <div id="toss-agreement-widget" />

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}
        </div>

        {/* 결제 버튼 */}
        <div className="px-6 py-4 border-t border-gray-100">
          <button
            onClick={handlePay}
            disabled={loading || paying}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl py-3 text-sm transition-colors flex items-center justify-center gap-2"
          >
            {paying ? <><Loader2 className="w-4 h-4 animate-spin" /> 결제 진행 중…</> : `₩${TEST_AMOUNT.toLocaleString()} 결제하기`}
          </button>
        </div>
      </div>
    </div>
  );
}
