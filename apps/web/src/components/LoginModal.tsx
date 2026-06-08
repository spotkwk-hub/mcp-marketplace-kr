'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { X, Cpu, Eye, EyeOff } from 'lucide-react';

type Mode = 'login' | 'signup' | 'forgot';

interface Props {
  onClose: () => void;
}

export default function LoginModal({ onClose }: Props) {
  const [mode, setMode] = useState<Mode>('login');
  const [showPw, setShowPw] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', name: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const set = (k: string, v: string) => { setError(''); setForm(prev => ({ ...prev, [k]: v })); };

  const handleSocial = async (provider: string) => {
    setLoading(true);
    await signIn(provider, { callbackUrl: '/' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (mode === 'forgot') {
      await new Promise(r => setTimeout(r, 800));
      setLoading(false);
      setDone(true);
      return;
    }

    if (mode === 'signup') {
      if (form.password !== form.confirmPassword) {
        setError('비밀번호가 일치하지 않습니다.');
        setLoading(false);
        return;
      }
      // TODO: 회원가입 API 호출 후 자동 로그인
      await new Promise(r => setTimeout(r, 800));
      setLoading(false);
      onClose();
      return;
    }

    const result = await signIn('credentials', {
      email: form.email,
      password: form.password,
      redirect: false,
    });

    setLoading(false);
    if (result?.error) {
      setError('이메일 또는 비밀번호가 올바르지 않습니다.');
    } else {
      onClose();
    }
  };

  const SOCIAL = [
    { id: 'kakao',  label: '카카오로 계속하기',  bg: 'bg-[#FEE500]',               text: 'text-[#191919]', logo: '💬' },
    { id: 'naver',  label: '네이버로 계속하기',  bg: 'bg-[#03C75A]',               text: 'text-white',     logo: 'N'  },
    { id: 'google', label: 'Google로 계속하기',  bg: 'bg-white border border-gray-200', text: 'text-gray-700',  logo: 'G'  },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors z-10">
          <X className="w-4 h-4" />
        </button>

        <div className="px-8 py-8">
          {/* 로고 */}
          <div className="flex justify-center mb-6">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
                <Cpu className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-gray-900 text-lg">MCP 마켓플레이스</span>
            </div>
          </div>

          {/* 탭 */}
          {mode !== 'forgot' && (
            <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
              {(['login', 'signup'] as const).map(m => (
                <button key={m} onClick={() => { setMode(m); setError(''); }} className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${mode === m ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                  {m === 'login' ? '로그인' : '회원가입'}
                </button>
              ))}
            </div>
          )}

          {mode === 'forgot' && (
            <div className="mb-6">
              <button onClick={() => setMode('login')} className="text-sm text-blue-600 hover:underline">← 로그인으로 돌아가기</button>
              <h2 className="text-xl font-bold text-gray-900 mt-2">비밀번호 재설정</h2>
              <p className="text-sm text-gray-500 mt-1">가입한 이메일로 재설정 링크를 보내드립니다.</p>
            </div>
          )}

          {done ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">✉️</span>
              </div>
              <p className="font-semibold text-gray-900 mb-1">이메일을 확인하세요</p>
              <p className="text-sm text-gray-500">{form.email}로 재설정 링크를 발송했습니다.</p>
              <button onClick={onClose} className="mt-5 w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors">닫기</button>
            </div>
          ) : (
            <>
              {mode !== 'forgot' && (
                <div className="space-y-2.5 mb-5">
                  {SOCIAL.map(s => (
                    <button key={s.id} onClick={() => handleSocial(s.id)} disabled={loading} className={`w-full flex items-center justify-center gap-2.5 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-50 ${s.bg} ${s.text}`}>
                      <span className="w-5 h-5 flex items-center justify-center font-bold text-base leading-none">{s.logo}</span>
                      {s.label}
                    </button>
                  ))}
                </div>
              )}

              {mode !== 'forgot' && (
                <div className="flex items-center gap-3 mb-5">
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-xs text-gray-400 font-medium">또는 이메일로</span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3.5">
                {mode === 'signup' && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">이름</label>
                    <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="홍길동" required className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">이메일</label>
                  <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="example@email.com" required className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
                </div>

                {mode !== 'forgot' && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">비밀번호</label>
                    <div className="relative">
                      <input type={showPw ? 'text' : 'password'} value={form.password} onChange={e => set('password', e.target.value)} placeholder="비밀번호 입력" required minLength={8} className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
                      <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}

                {mode === 'signup' && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">비밀번호 확인</label>
                    <input type="password" value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)} placeholder="비밀번호 재입력" required className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
                  </div>
                )}

                {error && <p className="text-xs text-red-500 font-medium">{error}</p>}

                {mode === 'login' && (
                  <div className="flex justify-end">
                    <button type="button" onClick={() => setMode('forgot')} className="text-xs text-blue-600 hover:underline">비밀번호를 잊으셨나요?</button>
                  </div>
                )}

                <button type="submit" disabled={loading} className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl text-sm font-semibold transition-colors mt-1">
                  {loading ? '처리 중...' : mode === 'login' ? '로그인' : mode === 'signup' ? '회원가입' : '재설정 링크 보내기'}
                </button>

                {mode === 'signup' && (
                  <p className="text-xs text-gray-400 text-center leading-relaxed">
                    가입 시 <span className="text-blue-600 cursor-pointer hover:underline">이용약관</span> 및 <span className="text-blue-600 cursor-pointer hover:underline">개인정보처리방침</span>에 동의하는 것으로 간주됩니다.
                  </p>
                )}
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
