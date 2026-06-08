'use client';

import Header from '@/components/Header';
import Marketplace from '@/Marketplace';

export default function BrowsePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">MCP 서버 카탈로그</h1>
        <Marketplace />
      </div>
    </div>
  );
}
