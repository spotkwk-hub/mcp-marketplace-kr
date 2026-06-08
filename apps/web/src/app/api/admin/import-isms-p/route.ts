/**
 * POST /api/admin/import-isms-p
 *
 * 공공데이터포털 오픈 API (odcloud.kr) 로 ISMS-P 인증현황 전체를 가져와
 * data/isms-p.json 에 저장합니다. 크론 서비스에서 매월 1일 자정에 호출됩니다.
 *
 * 보안: x-cron-secret 헤더 (환경변수 CRON_SECRET 과 일치해야 함)
 * 필요: ISMS_P_API_KEY (data.go.kr 서비스 인증키)
 */

import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import type { IsmsPRecord, IsmsPCache } from '@/types/isms-p';

const API_BASE = 'https://api.odcloud.kr/api/15114704/v1/uddi:95fc3c25-ce6c-4789-b13f-b2533bd4fce9';
const PER_PAGE = 1000;

function parseValidity(raw: string): { validFrom: string; validTo: string } {
  const normalized = raw?.trim().replace(/\./g, '-') ?? '';
  const [from, to] = normalized.split('~').map(s => s.trim());
  return { validFrom: from ?? '', validTo: to ?? from ?? '' };
}

async function fetchPage(serviceKey: string, page: number) {
  const url = `${API_BASE}?page=${page}&perPage=${PER_PAGE}&serviceKey=${encodeURIComponent(serviceKey)}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(30_000) });
  if (!res.ok) throw new Error(`API 오류: HTTP ${res.status} ${res.statusText}`);
  return res.json() as Promise<{
    totalCount: number;
    data: Array<{ 인증구분: string; 인증번호: string; 기업명: string; '인증의 범위': string; 유효기간: string }>;
  }>;
}

// ── POST: 임포트 실행 ──────────────────────────────────
export async function POST(req: NextRequest) {
  if (req.headers.get('x-cron-secret') !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const serviceKey = process.env.ISMS_P_API_KEY;
  if (!serviceKey) {
    return NextResponse.json(
      { error: 'ISMS_P_API_KEY 환경변수가 설정되지 않았습니다.' },
      { status: 500 }
    );
  }

  const startedAt = new Date().toISOString();

  try {
    const first = await fetchPage(serviceKey, 1);
    const totalCount = first.totalCount;
    const totalPages = Math.ceil(totalCount / PER_PAGE);
    const allData = [...first.data];

    for (let p = 2; p <= totalPages; p++) {
      const page = await fetchPage(serviceKey, p);
      allData.push(...page.data);
      await new Promise(r => setTimeout(r, 200));
    }

    const records: IsmsPRecord[] = allData
      .filter(d => d.기업명?.trim())
      .map(d => {
        const { validFrom, validTo } = parseValidity(d.유효기간);
        return {
          certType: d.인증구분?.trim() ?? '',
          certNo:   d.인증번호?.trim() ?? '',
          company:  d.기업명?.trim() ?? '',
          scope:    d['인증의 범위']?.trim() ?? '',
          validFrom,
          validTo,
        };
      });

    const cache: IsmsPCache = {
      importedAt: new Date().toISOString(),
      count: records.length,
      records,
    };

    const dataDir = join(process.cwd(), 'data');
    await mkdir(dataDir, { recursive: true });
    await writeFile(join(dataDir, 'isms-p.json'), JSON.stringify(cache, null, 2), 'utf-8');

    return NextResponse.json({
      ok: true,
      startedAt,
      completedAt: new Date().toISOString(),
      totalCount,
      count: records.length,
      pages: totalPages,
      sample: records.slice(0, 3),
    });

  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err), startedAt },
      { status: 500 }
    );
  }
}

// ── GET: 마지막 임포트 상태 확인 ──────────────────────
export async function GET(req: NextRequest) {
  if (req.headers.get('x-cron-secret') !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { readFile } = await import('node:fs/promises');
    const raw = await readFile(join(process.cwd(), 'data', 'isms-p.json'), 'utf-8');
    const cache: IsmsPCache = JSON.parse(raw);
    return NextResponse.json({
      importedAt: cache.importedAt,
      count: cache.count,
      staleHours: cache.importedAt
        ? Math.round((Date.now() - new Date(cache.importedAt).getTime()) / 36e5)
        : null,
    });
  } catch {
    return NextResponse.json({ importedAt: null, count: 0, staleHours: null });
  }
}
