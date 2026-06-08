/**
 * POST /api/verify-cert
 * 보안 인증 확인 API
 *
 * ISMS-P  → data/isms-p.json 캐시 조회 (월 1회 배치 임포트)
 * ISO27001 → IAF CertSearch API (유료, 미연동 시 mock)
 * CC인증   → itscc.kr HTML 스크래핑 (미연동 시 mock)
 * CSAP    → isms-p.or.kr HTML 스크래핑 (미연동 시 mock)
 */

import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { IsmsPCache } from '@/types/isms-p';

// ── ISMS-P: JSON 캐시 조회 ─────────────────────────────
async function verifyIsmsPFromCache(businessName: string) {
  try {
    const raw = await readFile(join(process.cwd(), 'data', 'isms-p.json'), 'utf-8');
    const cache: IsmsPCache = JSON.parse(raw);

    if (!cache.importedAt || cache.count === 0) {
      return {
        verified: false,
        reason: 'ISMS-P 인증 데이터가 아직 임포트되지 않았습니다. 관리자에게 문의하세요.',
        source: 'cache-empty',
      };
    }

    // 기업명 부분 일치 검색 (대소문자·공백 정규화)
    const needle = businessName.replace(/\s/g, '').toLowerCase();
    const match = cache.records.find((r: import('@/types/isms-p').IsmsPRecord) =>
      r.company.replace(/\s/g, '').toLowerCase().includes(needle)
    );

    if (!match) {
      const staleHours = Math.round(
        (Date.now() - new Date(cache.importedAt).getTime()) / 36e5
      );
      return {
        verified: false,
        reason: `ISMS-P 인증 이력을 찾을 수 없습니다. (데이터 기준: ${cache.importedAt.slice(0, 10)}, ${staleHours}시간 전)`,
        source: 'cache',
      };
    }

    // 유효기간 확인 (validTo = 만료일 YYYY-MM-DD)
    const today = new Date().toISOString().slice(0, 10);
    const expiry = match.validTo;
    const isValid = !expiry || expiry >= today;

    if (!isValid) {
      return {
        verified: false,
        reason: `ISMS-P 인증이 만료되었습니다. (만료일: ${expiry})`,
        source: 'cache',
      };
    }

    return {
      verified: true,
      certNo: match.certNo,
      expiry,
      certType: match.certType,
      scope: match.scope,
      message: `${match.certType} 인증 확인 완료 (${match.validFrom} ~ ${expiry})`,
      source: 'cache',
      dataAsOf: cache.importedAt.slice(0, 10),
    };

  } catch (err) {
    // 캐시 파일 없으면 mock으로 폴백
    return verifyMock('ISMS-P', '');
  }
}

// ── ISO27001: IAF CertSearch API (미연동 시 mock) ─────────
async function verifyISO27001(businessName: string) {
  const apiKey = process.env.IAF_CERTSEARCH_API_KEY;
  if (!apiKey) return verifyMock('ISO27001', businessName);

  try {
    const res = await fetch(
      `https://api.iafcertsearch.org/v1/certifications?standard=ISO%2FIEC+27001&companyName=${encodeURIComponent(businessName)}`,
      {
        headers: { Authorization: `Bearer ${apiKey}`, Accept: 'application/json' },
        signal: AbortSignal.timeout(10_000),
      }
    );
    if (!res.ok) return verifyMock('ISO27001', businessName);

    const data = await res.json();
    const cert = data?.items?.[0];
    if (!cert) {
      return { verified: false, reason: 'ISO 27001 인증 이력을 찾을 수 없습니다.', source: 'iaf' };
    }
    return {
      verified: true,
      certNo: cert.certificateNumber,
      expiry: cert.expiryDate,
      message: `ISO 27001 인증 확인 완료 (유효기간: ${cert.expiryDate})`,
      source: 'iaf',
    };
  } catch {
    return verifyMock('ISO27001', businessName);
  }
}

// ── CC인증: itscc.kr 스크래핑 (미연동 시 mock) ────────────
async function verifyCCFromScrape(businessName: string) {
  try {
    const url = `https://www.itscc.kr/certprod/listA.do?searchCertHolder=${encodeURIComponent(businessName)}&pageIndex=1`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return verifyMock('CC인증', businessName);

    const html = await res.text();

    // 결과 없음 패턴
    if (html.includes('검색된 결과가 없습니다') || html.includes('조회된 정보가 없습니다')) {
      return { verified: false, reason: 'CC인증 이력을 찾을 수 없습니다.', source: 'itscc-scrape' };
    }

    // 인증번호 추출 (NISS-XXXX-XXXX 패턴)
    const certNoMatch = html.match(/NISS-[\d-]+/);
    // 유효기간 추출 (YYYY-MM-DD 패턴, 2번째 등장이 만료일)
    const dates = [...html.matchAll(/\d{4}-\d{2}-\d{2}/g)].map(m => m[0]);
    const expiry = dates[1] ?? dates[0] ?? '';

    return {
      verified: true,
      certNo: certNoMatch?.[0] ?? '확인됨',
      expiry,
      message: `CC인증 확인 완료${expiry ? ` (유효기간: ${expiry})` : ''}`,
      source: 'itscc-scrape',
    };
  } catch {
    return verifyMock('CC인증', businessName);
  }
}

// ── CSAP: isms-p.or.kr 스크래핑 (미연동 시 mock) ─────────
async function verifyCSAPFromScrape(businessName: string) {
  try {
    const url = `https://isms-p.or.kr/sttus/cert/selectCrtfctIsueList.do?searchKeyword=${encodeURIComponent(businessName)}&certGubun=CSAP`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return verifyMock('CSAP', businessName);

    const html = await res.text();
    if (html.includes('검색된 결과가 없습니다') || html.includes('조회된 정보가 없습니다')) {
      return { verified: false, reason: 'CSAP 인증 이력을 찾을 수 없습니다.', source: 'isms-p-scrape' };
    }

    const certNoMatch = html.match(/CSAP-[\w-]+/);
    const dates = [...html.matchAll(/\d{4}-\d{2}-\d{2}/g)].map(m => m[0]);
    const expiry = dates[1] ?? dates[0] ?? '';

    return {
      verified: true,
      certNo: certNoMatch?.[0] ?? '확인됨',
      expiry,
      message: `CSAP 인증 확인 완료${expiry ? ` (유효기간: ${expiry})` : ''}`,
      source: 'isms-p-scrape',
    };
  } catch {
    return verifyMock('CSAP', businessName);
  }
}

// ── Mock 폴백 (연동 미완료 인증 타입) ─────────────────────
const MOCK_DB: Record<string, Record<string, { certNo: string; expiry: string }>> = {
  'ISO27001': { '테스트': { certNo: 'KAB-ISO-2024-088', expiry: '2026-12-31' } },
  'CC인증':   {},
  'CSAP':     {},
};

function verifyMock(certType: string, company: string) {
  const record = MOCK_DB[certType]?.[company];
  if (record) {
    return { verified: true, certNo: record.certNo, expiry: record.expiry, source: 'mock' };
  }
  return {
    verified: false,
    reason: `${certType} 인증기관 연동 준비 중입니다. 인증서를 직접 첨부해 주세요.`,
    source: 'mock',
  };
}

// ── 라우트 핸들러 ──────────────────────────────────────
export async function POST(req: NextRequest) {
  const { certType, businessNumber, companyName } = await req.json() as {
    certType: string;
    businessNumber?: string;
    companyName?: string;
  };

  if (!certType) {
    return NextResponse.json({ error: 'certType은 필수입니다.' }, { status: 400 });
  }

  // 사업자번호 형식 검증
  if (businessNumber) {
    const biz = businessNumber.replace(/[^0-9]/g, '');
    if (biz.length !== 10) {
      return NextResponse.json({ verified: false, reason: '사업자등록번호 형식이 올바르지 않습니다.' });
    }
  }

  // 검색 키워드: 회사명 우선, 없으면 사업자번호
  const searchKey = (companyName ?? businessNumber ?? '').trim();

  // 300ms 지연 (UX — 즉각 응답 시 버튼 클릭감 없음)
  await new Promise(r => setTimeout(r, 300));

  let result;
  switch (certType) {
    case 'ISMS-P':
      result = await verifyIsmsPFromCache(searchKey);
      break;
    case 'ISO27001':
      result = await verifyISO27001(searchKey);
      break;
    case 'CC인증':
      result = await verifyCCFromScrape(searchKey);
      break;
    case 'CSAP':
      result = await verifyCSAPFromScrape(searchKey);
      break;
    default:
      result = { verified: false, reason: `지원하지 않는 인증 타입: ${certType}`, source: 'unknown' };
  }

  return NextResponse.json(result);
}
