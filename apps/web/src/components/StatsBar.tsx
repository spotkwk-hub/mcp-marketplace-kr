export default function StatsBar() {
  const stats = [
    { label: '등록 MCP 서버', value: '248개' },
    { label: '월간 설치', value: '18만+' },
    { label: '인증 공급자', value: '62개사' },
    { label: '지원 보안인증', value: 'ISMS-P · ISO27001 · CC인증' },
  ];

  return (
    <div className="bg-gray-50 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="text-center">
            <p className="text-lg font-bold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
