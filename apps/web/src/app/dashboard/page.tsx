import Header from '@/components/Header';
import { TrendingUp, Download, CheckCircle, Clock, FileText, BarChart2 } from 'lucide-react';
import IsmsPStatusCard from './IsmsPStatusCard';
import { Suspense } from 'react';

const MONTHLY = [
  { month: '2월', revenue: 320000, installs: 48, invoiceIssued: true },
  { month: '3월', revenue: 580000, installs: 87, invoiceIssued: true },
  { month: '4월', revenue: 940000, installs: 141, invoiceIssued: true },
  { month: '5월', revenue: 1260000, installs: 189, invoiceIssued: true },
  { month: '6월', revenue: 870000, installs: 123, invoiceIssued: false },
];

const RECENT_INSTALLS = [
  { id: 'USR-0041', server: '더존 iCUBE MCP', plan: '유료 · ₩99,000', date: '2026-06-07', status: '정상' },
  { id: 'USR-0040', server: '더존 iCUBE MCP', plan: '유료 · ₩99,000', date: '2026-06-06', status: '정상' },
  { id: 'USR-0039', server: '더존 iCUBE MCP', plan: '프리미엄', date: '2026-06-05', status: '무료 사용 중' },
  { id: 'USR-0038', server: '더존 iCUBE MCP', plan: '유료 · ₩99,000', date: '2026-06-04', status: '정상' },
];

const maxRevenue = Math.max(...MONTHLY.map(m => m.revenue));

export default async function DashboardPage() {
  const current = MONTHLY[MONTHLY.length - 1];
  const prev = MONTHLY[MONTHLY.length - 2];
  const growth = (((current.revenue - prev.revenue) / prev.revenue) * 100).toFixed(1);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">공급자 대시보드</h1>
            <p className="text-sm text-gray-500 mt-0.5">MCP 마켓플레이스 (시드) · Founding Provider</p>
          </div>
          <span className="flex items-center gap-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-full">
            ✨ Founding Provider — 수수료 면제 D-142
          </span>
        </div>

        {/* KPI 카드 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: '이번 달 매출', value: `₩${current.revenue.toLocaleString()}`, sub: `전월 대비 ${growth}%`, icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: '이번 달 설치', value: `${current.installs}건`, sub: `전월 ${prev.installs}건`, icon: Download, color: 'text-indigo-600', bg: 'bg-indigo-50' },
            { label: '정산 예정일', value: '6월 30일', sub: '자동 정산', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
            { label: '누적 매출', value: `₩${MONTHLY.reduce((a, m) => a + m.revenue, 0).toLocaleString()}`, sub: '총 588건 설치', icon: BarChart2, color: 'text-violet-600', bg: 'bg-violet-50' },
          ].map(kpi => (
            <div key={kpi.label} className="bg-white border border-gray-200 rounded-2xl p-5">
              <div className={`w-9 h-9 ${kpi.bg} rounded-xl flex items-center justify-center mb-3`}>
                <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
              </div>
              <p className="text-xs text-gray-500">{kpi.label}</p>
              <p className="text-xl font-bold text-gray-900 mt-0.5">{kpi.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{kpi.sub}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* 월별 매출 차트 */}
          <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-6">
            <h2 className="font-bold text-gray-900 mb-4">월별 매출</h2>
            <div className="flex items-end gap-3 h-32">
              {MONTHLY.map(m => (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-1.5">
                  <span className="text-xs text-gray-500">₩{(m.revenue / 10000).toFixed(0)}만</span>
                  <div
                    className={`w-full rounded-t-lg transition-all ${m.month === '6월' ? 'bg-blue-400' : 'bg-blue-200'}`}
                    style={{ height: `${(m.revenue / maxRevenue) * 96}px` }}
                  />
                  <span className="text-xs text-gray-500">{m.month}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 세금계산서 */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h2 className="font-bold text-gray-900 mb-4">세금계산서</h2>
            <div className="space-y-2">
              {MONTHLY.map(m => (
                <div key={m.month} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-700">{m.month}월</span>
                  </div>
                  {m.invoiceIssued ? (
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-gray-500">₩{m.revenue.toLocaleString()}</span>
                      <span className="flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                        <CheckCircle className="w-3 h-3" /> 발행완료
                      </span>
                    </div>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                      <Clock className="w-3 h-3" /> 정산 예정
                    </span>
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-4">* 세금계산서는 정산일에 자동 발행됩니다</p>
          </div>

          {/* ISMS-P DB 상태 카드 */}
          <Suspense fallback={<div className="bg-white border border-gray-200 rounded-2xl p-6 animate-pulse h-48" />}>
            <IsmsPStatusCard />
          </Suspense>
        </div>

        {/* 최근 설치 내역 */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <h2 className="font-bold text-gray-900 mb-4">최근 설치 내역</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                  <th className="pb-2 pr-4 font-medium">사용자</th>
                  <th className="pb-2 pr-4 font-medium">서버</th>
                  <th className="pb-2 pr-4 font-medium">플랜</th>
                  <th className="pb-2 pr-4 font-medium">설치일</th>
                  <th className="pb-2 font-medium">상태</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {RECENT_INSTALLS.map(row => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    <td className="py-3 pr-4 font-mono text-xs text-gray-500">{row.id}</td>
                    <td className="py-3 pr-4 text-gray-800 font-medium">{row.server}</td>
                    <td className="py-3 pr-4 text-gray-600">{row.plan}</td>
                    <td className="py-3 pr-4 text-gray-500">{row.date}</td>
                    <td className="py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${row.status === '정상' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
