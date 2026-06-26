// 세금계산서 발행 모듈
// hometax-mcp의 issue_e_tax_invoice 도구를 HTTP 프록시로 호출
// 환경변수: SUPPLIER_BIZ_NO (공급자 사업자등록번호), HOMETAX_MCP_URL (선택)

import {
  createInvoiceRecord,
  updateInvoiceStatus,
  getPayment,
} from '../db.js';

export type InvoiceRequest = {
  paymentKey: string;
  recipientBizNo: string;   // 공급받는자 사업자등록번호
  itemName: string;         // 품목명 (예: "MCP 서버 구독료")
  totalAmount: number;      // 결제 총액 (VAT 포함)
};

// VAT 포함 금액 → 공급가액/세액 분리 (10%)
function splitVat(totalWithVat: number): { supplyAmount: number; taxAmount: number } {
  const supplyAmount = Math.round(totalWithVat / 1.1);
  return { supplyAmount, taxAmount: totalWithVat - supplyAmount };
}

// YYYYMMDD 형식 오늘 날짜
function todayKST(): string {
  return new Date().toLocaleDateString('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).replace(/\. /g, '').replace('.', '');
}

export async function issueInvoice(req: InvoiceRequest): Promise<{ invoiceNo?: string; error?: string }> {
  const supplierBizNo = process.env.SUPPLIER_BIZ_NO;
  if (!supplierBizNo) throw new Error('SUPPLIER_BIZ_NO not set');

  const { supplyAmount, taxAmount } = splitVat(req.totalAmount);
  const issueDate = todayKST();

  // DB에 PENDING 상태로 먼저 기록
  createInvoiceRecord({
    paymentKey: req.paymentKey,
    supplierBizNo,
    recipientBizNo: req.recipientBizNo,
    supplyAmount,
    taxAmount,
    itemName: req.itemName,
    issueDate,
  });

  // hometax-mcp 호출 — MCP proxy endpoint 경유
  // Claude Code 에이전트가 직접 issue_e_tax_invoice 도구를 호출하는 경우:
  //   이 함수 대신 /invoices/:paymentId/issue 엔드포인트를 통해 호출
  const mcpUrl = process.env.HOMETAX_MCP_URL;
  if (!mcpUrl) {
    // MCP URL 미설정 시: PENDING 상태 유지 (관리자 수동 처리)
    console.warn(`[Invoice] HOMETAX_MCP_URL not set — invoice PENDING for ${req.paymentKey}`);
    return {};
  }

  try {
    const res = await fetch(`${mcpUrl}/issue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        supplier_biz_no: supplierBizNo,
        recipient_biz_no: req.recipientBizNo,
        supply_amount: supplyAmount,
        tax_amount: taxAmount,
        issue_date: issueDate,
        item_name: req.itemName,
      }),
    });
    const data = await res.json() as { invoice_no?: string; error?: string };

    if (data.invoice_no) {
      updateInvoiceStatus(req.paymentKey, 'ISSUED', data.invoice_no);
      return { invoiceNo: data.invoice_no };
    } else {
      updateInvoiceStatus(req.paymentKey, 'FAILED', undefined, data.error);
      return { error: data.error };
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    updateInvoiceStatus(req.paymentKey, 'FAILED', undefined, msg);
    return { error: msg };
  }
}
