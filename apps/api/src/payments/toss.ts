// 토스페이먼츠 API 클라이언트
// 환경변수: TOSS_SECRET_KEY, TOSS_WEBHOOK_SECRET

const TOSS_API = 'https://api.tosspayments.com/v1';

function authHeader(): string {
  const key = process.env.TOSS_SECRET_KEY;
  if (!key) throw new Error('TOSS_SECRET_KEY not set');
  return 'Basic ' + Buffer.from(`${key}:`).toString('base64');
}

export type TossPayment = {
  paymentKey: string;
  orderId: string;
  orderName: string;
  status: string;
  totalAmount: number;
  method: string;
  customerName?: string;
  customerEmail?: string;
};

// 결제 승인 (프론트에서 paymentKey/orderId/amount 수신 후 호출)
export async function confirmPayment(
  paymentKey: string,
  orderId: string,
  amount: number,
): Promise<TossPayment> {
  const res = await fetch(`${TOSS_API}/payments/confirm`, {
    method: 'POST',
    headers: {
      Authorization: authHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ paymentKey, orderId, amount }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw Object.assign(new Error((err as any).message ?? 'Toss confirm failed'), { status: res.status, toss: err });
  }
  return res.json() as Promise<TossPayment>;
}

// 결제 단건 조회
export async function getPayment(paymentKey: string): Promise<TossPayment> {
  const res = await fetch(`${TOSS_API}/payments/${paymentKey}`, {
    headers: { Authorization: authHeader() },
  });
  if (!res.ok) throw new Error('Toss getPayment failed');
  return res.json() as Promise<TossPayment>;
}

// 웹훅 시크릿 검증
export function verifyWebhookSecret(authorizationHeader: string | null): boolean {
  const secret = process.env.TOSS_WEBHOOK_SECRET;
  if (!secret) return false;
  const expected = 'Basic ' + Buffer.from(`${secret}:`).toString('base64');
  return authorizationHeader === expected;
}

// 웹훅 이벤트 타입
export type TossWebhookEvent = {
  eventType: 'PAYMENT_STATUS_CHANGED' | 'PAYMENT_CANCEL_STATUS_CHANGED';
  createdAt: string;
  data: {
    paymentKey: string;
    orderId: string;
    status: string;
    totalAmount?: number;
  };
};
