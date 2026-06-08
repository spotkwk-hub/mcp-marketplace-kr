import { Search } from 'lucide-react';

interface Props {
  search: string;
  onSearch: (v: string) => void;
}

export default function HeroSection({ search, onSearch }: Props) {
  return (
    <section className="bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 text-white py-16 px-4">
      <div className="max-w-3xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur rounded-full px-4 py-1.5 text-sm font-medium mb-5">
          🇰🇷 한국 No.1 MCP 마켓플레이스
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight mb-4">
          한국 특화 MCP 서버를<br />한 곳에서 찾으세요
        </h1>
        <p className="text-blue-100 text-lg mb-8 leading-relaxed">
          카카오·네이버·토스 등 국내 서비스 연동부터 홈택스 세금 자동화,<br className="hidden sm:block" />
          법령 검색, 한국어 AI 모델까지 — ISMS-P 인증 보안으로 안심하세요.
        </p>

        <div className="relative max-w-xl mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="카카오, 세금계산서, 법령 검색..."
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-4 rounded-2xl text-gray-900 text-base shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
        </div>

        <div className="flex items-center justify-center gap-6 mt-8 text-sm text-blue-100">
          <span>✅ 12개 공식 인증 서버</span>
          <span>🔒 ISMS-P 보안</span>
          <span>💳 원화 정산 지원</span>
        </div>
      </div>
    </section>
  );
}
