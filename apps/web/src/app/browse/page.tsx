'use client';

import { useState, useMemo } from 'react';
import { MCP_SERVERS, CATEGORIES } from '@/lib/data';
import { Category } from '@/types';
import MCPCard from '@/components/MCPCard';
import Header from '@/components/Header';
import { Search, SlidersHorizontal, Sprout } from 'lucide-react';
import { cn } from '@/lib/utils';

type SortKey = 'installs' | 'stars' | 'likes' | 'updatedAt' | 'publishedAt';

export default function BrowsePage() {
  const [search, setSearch]     = useState('');
  const [category, setCategory] = useState<Category | 'all'>('all');
  const [sort, setSort]         = useState<SortKey>('installs');
  const [pricing, setPricing]   = useState('all');
  const [seedOnly, setSeedOnly] = useState(false);

  const filtered = useMemo(() => {
    return MCP_SERVERS.filter(s => {
      if (seedOnly && !s.isSeed) return false;
      if (category !== 'all' && s.category !== category) return false;
      if (pricing !== 'all' && s.pricing !== pricing) return false;
      const q = search.toLowerCase();
      if (q) {
        const hit = s.name.includes(q) || s.description.includes(q) ||
          s.tags.some(t => t.includes(q)) || s.author.toLowerCase().includes(q);
        if (!hit) return false;
      }
      return true;
    }).sort((a, b) => {
      if (sort === 'installs')    return b.installs - a.installs;
      if (sort === 'stars')       return b.stars - a.stars;
      if (sort === 'likes')       return b.likes - a.likes;
      if (sort === 'publishedAt') return b.publishedAt.localeCompare(a.publishedAt);
      return b.updatedAt.localeCompare(a.updatedAt);
    });
  }, [search, category, sort, pricing, seedOnly]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* 검색 헤더 */}
      <div className="bg-white border-b border-gray-200 py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">MCP 서버 카탈로그</h1>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
              <input
                type="text"
                placeholder="더존, 세금계산서, 나라장터..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
              />
            </div>
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-gray-400" />
              <select
                value={pricing}
                onChange={e => setPricing(e.target.value)}
                className="text-sm border border-gray-200 rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
              >
                <option value="all">전체 가격</option>
                <option value="free">무료</option>
                <option value="freemium">프리미엄</option>
                <option value="paid">유료</option>
                <option value="enterprise">기업용</option>
              </select>
              <select
                value={sort}
                onChange={e => setSort(e.target.value as SortKey)}
                className="text-sm border border-gray-200 rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
              >
                <option value="installs">설치 많은 순</option>
                <option value="stars">별점 높은 순</option>
                <option value="likes">좋아요 많은 순</option>
                <option value="updatedAt">최근 업데이트 순</option>
                <option value="publishedAt">최근 등록 순</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* 카테고리 + 필터 칩 */}
        <div className="flex flex-wrap gap-2 mb-6">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all border',
                category === cat.id
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600'
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

        {/* 결과 카운트 + 배지 */}
        <div className="flex items-center gap-3 mb-4">
          <span className="text-sm font-semibold text-gray-700">{filtered.length}개 서버</span>
          <span className="flex items-center gap-1 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
            <Sprout className="w-3 h-3" /> {MCP_SERVERS.filter(s => s.isSeed).length}개 플랫폼 시드
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-5xl mb-4">🔍</p>
            <p className="font-semibold text-gray-600">검색 결과가 없습니다</p>
            <p className="text-sm mt-1">다른 키워드나 카테고리를 시도해보세요</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(s => <MCPCard key={s.id} server={s} />)}
          </div>
        )}
      </div>
    </div>
  );
}
