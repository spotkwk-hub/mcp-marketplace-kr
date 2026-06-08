/**
 * ISMS-P 인증현황 배치 임포트 스크립트
 *
 * 공공데이터포털 자동변환 오픈 API (odcloud.kr) 를 통해
 * ISMS-P 인증현황 전체를 가져와 data/isms-p.json 에 저장합니다.
 *
 * API 정보:
 *   Swagger : https://infuser.odcloud.kr/oas/docs?namespace=15114704/v1
 *   Endpoint: GET https://api.odcloud.kr/api/15114704/v1/uddi:95fc3c25-ce6c-4789-b13f-b2533bd4fce9
 *   인증방식: ?serviceKey=<인증키>  (data.go.kr 활용신청 후 발급)
 *
 * 필요 환경변수 (.env.local):
 *   ISMS_P_API_KEY — data.go.kr 에서 발급받은 서비스 인증키
 *
 * 실행:
 *   npx tsx scripts/import-isms-p.mts
 */

import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// .env.local 로드
const envPath = join(dirname(fileURLToPath(import.meta.url)), '..', '.env.local');
try {
  const envText = readFileSync(envPath, 'utf-8');
  for (const line of envText.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
    if (!(key in process.env)) process.env[key] = val;
  }
} catch { /* .env.local 없으면 무시 */ }

// ── 타입 (src/types/isms-p.ts 와 동일 — 스크립트는 tsconfig path alias 미지원)
export interface IsmsPRecord {
  certType: string;   // 인증구분 (ISMS | ISMS-P)
  certNo: string;     // 인증번호
  company: string;    // 기업명
  scope: string;      // 인증의 범위
  validFrom: string;  // 인증 시작일 (YYYY-MM-DD)
  validTo: string;    // 인증 만료일 (YYYY-MM-DD)
}

export interface IsmsPCache {
  importedAt: string | null;
  count: number;
  records: IsmsPRecord[];
}

const API_BASE = 'https://api.odcloud.kr/api/15114704/v1/uddi:95fc3c25-ce6c-4789-b13f-b2533bd4fce9';
const PER_PAGE = 1000;

// ── API 한 페이지 fetch ────────────────────────────────
async function fetchPage(serviceKey: string, page: number) {
  const url = `${API_BASE}?page=${page}&perPage=${PER_PAGE}&serviceKey=${encodeURIComponent(serviceKey)}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(30_000) });
  if (!res.ok) throw new Error(`API 오류: HTTP ${res.status} ${res.statusText}`);
  return res.json() as Promise<{
    page: number; perPage: number; totalCount: number; currentCount: number;
    data: Array<{ 인증구분: string; 인증번호: string; 기업명: string; '인증의 범위': string; 유효기간: string }>;
  }>;
}

// ── 유효기간 파싱 ("2026-04-15~2029-04-14" → from/to) ─
function parseValidity(raw: string): { validFrom: string; validTo: string } {
  const normalized = raw?.trim().replace(/\./g, '-') ?? '';
  const [from, to] = normalized.split('~').map(s => s.trim());
  return { validFrom: from ?? '', validTo: to ?? from ?? '' };
}

// ── 메인 ──────────────────────────────────────────────
async function main() {
  const serviceKey = process.env.ISMS_P_API_KEY;
  if (!serviceKey) {
    console.error('❌ ISMS_P_API_KEY 환경변수가 설정되지 않았습니다.');
    console.error('');
    console.error('   설정 방법:');
    console.error('   1. https://www.data.go.kr/data/15114704/fileData.do 접속');
    console.error('   2. 상단 [오픈 API] 탭 또는 [활용신청] 버튼 클릭');
    console.error('   3. 승인 후 마이페이지 → 활용신청 목록 → 인증키 복사');
    console.error('   4. .env.local 에 ISMS_P_API_KEY=<인증키> 추가');
    process.exit(1);
  }

  console.log('\n📡 ISMS-P 오픈 API 호출 중...');
  console.log(`   Endpoint: ${API_BASE}`);

  // 1페이지로 totalCount 파악
  const first = await fetchPage(serviceKey, 1);
  const totalCount = first.totalCount;
  const totalPages = Math.ceil(totalCount / PER_PAGE);

  console.log(`   총 레코드: ${totalCount}건 (${totalPages}페이지)`);

  const allData = [...first.data];

  // 나머지 페이지 순차 fetch
  for (let p = 2; p <= totalPages; p++) {
    process.stdout.write(`   페이지 ${p}/${totalPages} 로딩 중...\r`);
    const page = await fetchPage(serviceKey, p);
    allData.push(...page.data);
    await new Promise(r => setTimeout(r, 200)); // rate limit 방지
  }
  console.log('');

  // 변환
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

  const outDir  = join(dirname(fileURLToPath(import.meta.url)), '..', 'data');
  const outPath = join(outDir, 'isms-p.json');
  mkdirSync(outDir, { recursive: true });
  writeFileSync(outPath, JSON.stringify(cache, null, 2), 'utf-8');

  console.log(`✅ 완료!`);
  console.log(`   저장 위치 : ${outPath}`);
  console.log(`   총 레코드 : ${records.length}건`);
  console.log(`   임포트 시각: ${cache.importedAt}`);
  console.log(`\n샘플 (최초 3건):`);
  records.slice(0, 3).forEach((r, i) =>
    console.log(`  ${i + 1}. [${r.certType}] ${r.certNo} | ${r.company} | ${r.validFrom} ~ ${r.validTo}`));
}

main().catch(err => {
  console.error('❌ 임포트 실패:', err);
  process.exit(1);
});
