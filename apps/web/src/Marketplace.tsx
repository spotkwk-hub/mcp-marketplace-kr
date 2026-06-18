// ============================================================
// Marketplace.tsx — 마켓플레이스 핵심 UI 컴포넌트
// @mcp-kr/registry 에서 데이터를 직접 임포트
// ============================================================
'use client';

import { useState, useMemo } from 'react';
import {
  REGISTRY,
  CATEGORIES,
  type Category,
} from '@mcp-kr/registry';
import { Search, SlidersHorizontal, Sprout } from 'lucide-react';
import { cn } from './lib/utils';
import MCPCard from './components/MCPCard';

type SortKey = 'installs' | 'stars' | 'likes' | 'updatedAt' | 'publishedAt';

// ── 마켓플레이스 메인 컴포넌트 ───────────────────────────
export default function Marketplace() {
  const [search, setSearch]     = useState('');
  const [category, setCategory] = useState<Category | 'all'>('all');
  const [pricing, setPricing]   = useState('all');
  const [sort, setSort]         = useState<SortKey>('installs');
  const [seedOnly, setSeedOnly] = useState(false);

  const filtered = useMemo(() => {
    let r = [...REGISTRY];
    if (seedOnly)               r = r.filter(s => s.isSeed);
    if (category !== 'all')     r = r.filter(s => s.category === category);
    if (pricing !== 'all')      r = r.filter(s => s.pricing === pricing);
    if (search) {
      const q = search.toLowerCase();
      r = r.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.tags.some(t => t.toLowerCase().includes(q))
      );
    }
    r.sort((a, b) => {
      if (sort === 'stars')       return b.stars - a.stars;
      if (sort === 'likes')       return (b.likes ?? 0) - (a.likes ?? 0);
      if (sort === 'publishedAt') return (b.publishedAt ?? '').localeCompare(a.publishedAt ?? '');
      if (sort === 'updatedAt')   return b.updatedAt.localeCompare(a.updatedAt);
      return b.installs - a.installs;
    });
    return r;
  }, [search, category, pricing, sort, seedOnly]);

  return (
    <div className="space-y-6">
      {/* 검색·필터 바 */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="스마트스토어, 위택스, 국민연금..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
        </div>
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-gray-400" />
          <select value={pricing} onChange={e => setPricing(e.target.value)} className="text-sm border border-gray-200 rounded-xl px-3 py-2.5 bg-white focus:outline-none">
            <option value="all">전체 가격</option>
            <option value="free">무료</option>
            <option value="freemium">프리미엄</option>
            <option value="paid">유료</option>
          </select>
          <select value={sort} onChange={e => setSort(e.target.value as SortKey)} className="text-sm border border-gray-200 rounded-xl px-3 py-2.5 bg-white focus:outline-none">
            <option value="installs">설치 많은 순</option>
            <option value="stars">별점 높은 순</option>
            <option value="likes">좋아요 많은 순</option>
            <option value="updatedAt">최근 업데이트 순</option>
            <option value="publishedAt">최근 등록 순</option>
          </select>
        </div>
      </div>

      {/* 카테고리 탭 */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.id)}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all border',
              category === cat.id ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
            )}
          >
            {cat.emoji} {cat.label}
          </button>
        ))}
        <button
          onClick={() => setSeedOnly(!seedOnly)}
          className={cn(
            'flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all border',
            seedOnly ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-gray-600 border-gray-200 hover:border-amber-400'
          )}
        >
          <Sprout className="w-3.5 h-3.5" /> 시드 서버만
        </button>
      </div>

      {/* 결과 수 */}
      <p className="text-sm text-gray-500">{filtered.length}개 MCP 서버</p>

      {/* 그리드 */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-5xl mb-4">🔍</p>
          <p className="font-semibold text-gray-600">검색 결과가 없습니다</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(s => <MCPCard key={s.id} server={s} />)}
        </div>
      )}
    </div>
  );
}
