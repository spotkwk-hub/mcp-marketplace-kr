/**
 * ISMS-P 임포트 상태 카드 (Server Component)
 * data/isms-p.json 을 직접 읽어 상태 표시
 */

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Database, RefreshCcw, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface IsmsPCache {
  importedAt: string | null;
  count: number;
}

async function getIsmsPStatus(): Promise<{ importedAt: string | null; count: number; staleHours: number | null }> {
  try {
    const raw = await readFile(join(process.cwd(), 'data', 'isms-p.json'), 'utf-8');
    const cache: IsmsPCache = JSON.parse(raw);
    const staleHours = cache.importedAt
      ? Math.round((Date.now() - new Date(cache.importedAt).getTime()) / 36e5)
      : null;
    return { importedAt: cache.importedAt, count: cache.count, staleHours };
  } catch {
    return { importedAt: null, count: 0, staleHours: null };
  }
}

export default async function IsmsPStatusCard() {
  const { importedAt, count, staleHours } = await getIsmsPStatus();

  const isStale = staleHours !== null && staleHours > 24 * 35; // 35일 이상이면 갱신 필요
  const hasData = importedAt !== null && count > 0;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center">
          <Database className="w-4 h-4 text-blue-600" />
        </div>
        <h2 className="font-bold text-gray-900">ISMS-P 인증 DB</h2>
      </div>

      {hasData ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">총 인증 기업</span>
            <span className="text-lg font-bold text-gray-900">{count.toLocaleString()}건</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">마지막 갱신</span>
            <span className="text-sm text-gray-700">{importedAt!.slice(0, 10)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">경과 시간</span>
            <span className={`text-sm font-medium ${isStale ? 'text-amber-600' : 'text-green-600'}`}>
              {staleHours! < 24
                ? `${staleHours}시간 전`
                : `${Math.floor(staleHours! / 24)}일 전`}
            </span>
          </div>
          <div className={`flex items-center gap-1.5 mt-2 px-3 py-2 rounded-xl text-xs font-medium ${
            isStale ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-700'
          }`}>
            {isStale
              ? <><AlertTriangle className="w-3.5 h-3.5" /> 35일 초과 — 갱신 필요</>
              : <><CheckCircle2 className="w-3.5 h-3.5" /> 최신 상태</>
            }
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 py-4 text-center">
          <RefreshCcw className="w-8 h-8 text-gray-300" />
          <p className="text-sm text-gray-500">데이터 없음</p>
          <p className="text-xs text-gray-400">
            <code className="bg-gray-100 px-1 rounded">npm run import:isms-p</code> 실행 후<br />
            매월 1일 자동 갱신됩니다
          </p>
        </div>
      )}
    </div>
  );
}
