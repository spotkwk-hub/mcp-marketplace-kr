'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Cpu } from 'lucide-react';
import LoginModal from './LoginModal';

export default function Header() {
  const [showLogin, setShowLogin] = useState(false);

  return (
    <>
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Cpu className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-bold text-gray-900 text-base leading-none">MCP 마켓플레이스</span>
              <span className="block text-xs text-gray-400 leading-none mt-0.5">한국 특화 MCP 허브</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-5 text-sm font-medium text-gray-600">
            <Link href="/browse"    className="hover:text-blue-600 transition-colors">카탈로그</Link>
            <Link href="/register"  className="hover:text-blue-600 transition-colors">공급자 등록</Link>
            <Link href="/dashboard" className="hover:text-blue-600 transition-colors">대시보드</Link>
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowLogin(true)}
              className="text-sm text-gray-600 hover:text-blue-600 px-3 py-1.5 transition-colors"
            >
              로그인
            </button>
            <Link
              href="/register"
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
            >
              MCP 등록
            </Link>
          </div>
        </div>
      </header>

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </>
  );
}
