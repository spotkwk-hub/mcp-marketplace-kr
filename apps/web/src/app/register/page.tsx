'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import { CATEGORIES, CERT_COLORS, type SecurityCert } from '@mcp-kr/registry';
import { CheckCircle, ChevronRight, Plus, Trash2, Loader2, ShieldCheck, ShieldX } from 'lucide-react';

const STEPS = ['기본 정보', '서버 정보', '도구 정의', '가격·인증', '검토·제출'];

const CERTS = Object.keys(CERT_COLORS) as string[];

const BENEFITS = [
  '수수료 0원 (Founding Provider 6개월)',
  '공식 배지 부여 + 마켓플레이스 상단 노출',
  '원화 자동 정산 + 세금계산서 자동 발행',
  '보안 인증 취득 가이드 무료 제공',
];

interface Tool { name: string; description: string }

type CertVerifyState = { status: 'idle' } | { status: 'loading' } | { status: 'verified'; certNo: string; expiry: string } | { status: 'failed'; reason: string };

interface FormState {
  authorName: string; authorEmail: string; businessNumber: string; companyName: string;
  serverName: string; serverNameEn: string; category: string; description: string;
  githubUrl: string; apiDocsUrl: string;
  tools: Tool[];
  pricing: string; priceKRW: string;
  certs: string[];
  certFiles: Record<string, File>;
  certVerify: Record<string, CertVerifyState>;
}

const INITIAL_FORM: FormState = {
  authorName: '', authorEmail: '', businessNumber: '', companyName: '',
  serverName: '', serverNameEn: '', category: 'ERP·회계', description: '',
  githubUrl: '', apiDocsUrl: '',
  tools: [{ name: '', description: '' }],
  pricing: 'free', priceKRW: '',
  certs: [],
  certFiles: {},
  certVerify: {},
};

function validateStep(step: number, form: FormState): string | null {
  if (step === 0) {
    if (!form.authorName.trim()) return '담당자 이름을 입력해주세요.';
    if (!form.authorEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.authorEmail)) return '유효한 이메일을 입력해주세요.';
    if (!form.businessNumber.trim()) return '사업자등록번호를 입력해주세요.';
  }
  if (step === 1) {
    if (!form.serverName.trim()) return '서버 이름(한국어)을 입력해주세요.';
    if (!form.description.trim()) return '서버 설명을 입력해주세요.';
    if (!form.apiDocsUrl.trim()) return 'API 문서 URL을 입력해주세요.';
  }
  if (step === 2) {
    const valid = form.tools.filter(t => t.name.trim() && t.description.trim());
    if (valid.length === 0) return '최소 1개의 도구(tool)를 입력해주세요.';
  }
  return null;
}

export default function RegisterPage() {
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);

  const set = (k: keyof FormState, v: unknown) => setForm(prev => ({ ...prev, [k]: v }));

  const handleNext = () => {
    const err = validateStep(step, form);
    if (err) { setError(err); return; }
    setError(null);
    setStep(s => s + 1);
  };

  const verifyCert = async (cert: string) => {
    set('certVerify', { ...form.certVerify, [cert]: { status: 'loading' } });
    try {
      const res = await fetch('/api/verify-cert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ certType: cert, businessNumber: form.businessNumber, companyName: form.companyName || undefined }),
      });
      const data = await res.json();
      if (data.verified) {
        set('certVerify', { ...form.certVerify, [cert]: { status: 'verified', certNo: data.certNo, expiry: data.expiry } });
      } else {
        set('certVerify', { ...form.certVerify, [cert]: { status: 'failed', reason: data.reason } });
      }
    } catch {
      set('certVerify', { ...form.certVerify, [cert]: { status: 'failed', reason: '네트워크 오류가 발생했습니다.' } });
    }
  };

  const categoryLabel = CATEGORIES.find(c => c.id === form.category);

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-lg mx-auto px-4 py-24 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">등록 신청 완료!</h1>
          <p className="text-gray-500 mb-6">
            영업일 기준 3일 내로 검토 후 이메일({form.authorEmail})로 연락드립니다.
            <br />Founding Provider 혜택은 승인 즉시 적용됩니다.
          </p>
          <a href="/" className="inline-flex items-center gap-2 bg-blue-600 text-white font-semibold px-6 py-3 rounded-xl">
            홈으로 돌아가기
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">MCP 서버 등록</h1>
          <p className="text-gray-500">Founding Provider 100명 중 한 명이 되세요</p>
        </div>

        {/* 혜택 배너 */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 mb-8">
          <p className="text-sm font-bold text-blue-800 mb-3">🎁 Founding Provider 혜택</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {BENEFITS.map(b => (
              <div key={b} className="flex items-start gap-2 text-sm text-blue-700">
                <CheckCircle className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                {b}
              </div>
            ))}
          </div>
        </div>

        {/* 스텝 인디케이터 */}
        <div className="flex items-center gap-0 mb-8">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center flex-1 last:flex-none">
              <div className={`flex flex-col items-center gap-1 ${i <= step ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 ${i < step ? 'bg-blue-600 border-blue-600 text-white' : i === step ? 'border-blue-600 text-blue-600' : 'border-gray-300'}`}>
                  {i < step ? '✓' : i + 1}
                </div>
                <span className="text-xs font-medium hidden sm:block">{label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 ${i < step ? 'bg-blue-600' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* 폼 카드 */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
          {step === 0 && (
            <>
              <h2 className="font-bold text-gray-900 text-lg">기본 정보</h2>
              <Field label="담당자 이름" required><input value={form.authorName} onChange={e=>set('authorName',e.target.value)} placeholder="홍길동" /></Field>
              <Field label="이메일" required><input value={form.authorEmail} onChange={e=>set('authorEmail',e.target.value)} placeholder="contact@company.com" type="email" /></Field>
              <Field label="회사명"><input value={form.companyName} onChange={e=>set('companyName',e.target.value)} placeholder="(주)예시" /></Field>
              <Field label="사업자등록번호" required hint="세금계산서 발행에 사용됩니다"><input value={form.businessNumber} onChange={e=>set('businessNumber',e.target.value)} placeholder="000-00-00000" /></Field>
            </>
          )}

          {step === 1 && (
            <>
              <h2 className="font-bold text-gray-900 text-lg">서버 정보</h2>
              <Field label="서버 이름 (한국어)" required><input value={form.serverName} onChange={e=>set('serverName',e.target.value)} placeholder="홈택스 세금계산서 MCP" /></Field>
              <Field label="서버 이름 (영문)"><input value={form.serverNameEn} onChange={e=>set('serverNameEn',e.target.value)} placeholder="Hometax Invoice MCP" /></Field>
              <Field label="카테고리" required>
                <select value={form.category} onChange={e=>set('category',e.target.value)}>
                  {CATEGORIES.filter(c => c.id !== 'all').map(c => <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>)}
                </select>
              </Field>
              <Field label="설명" required hint="100자 이내로 핵심 기능을 설명하세요">
                <textarea value={form.description} onChange={e=>set('description',e.target.value)} rows={3} placeholder="어떤 MCP 서버인지 설명해주세요" maxLength={100} />
              </Field>
              <Field label="GitHub URL"><input value={form.githubUrl} onChange={e=>set('githubUrl',e.target.value)} placeholder="https://github.com/..." /></Field>
              <Field label="API 문서 URL" required><input value={form.apiDocsUrl} onChange={e=>set('apiDocsUrl',e.target.value)} placeholder="https://docs.example.com" /></Field>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="font-bold text-gray-900 text-lg">도구(Tool) 정의</h2>
              <p className="text-sm text-gray-500">이 MCP 서버가 Claude에 노출할 도구 목록을 입력하세요.</p>
              <div className="space-y-3">
                {form.tools.map((tool, i) => (
                  <div key={i} className="border border-gray-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Tool #{i + 1}</span>
                      {form.tools.length > 1 && (
                        <button
                          onClick={() => set('tools', form.tools.filter((_, j) => j !== i))}
                          className="text-red-400 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <div className="[&_input]:w-full [&_input]:border [&_input]:border-gray-200 [&_input]:rounded-xl [&_input]:px-3 [&_input]:py-2.5 [&_input]:text-sm [&_input]:focus:outline-none [&_input]:focus:ring-2 [&_input]:focus:ring-blue-300">
                      <label className="block text-xs font-medium text-gray-600 mb-1">함수명 <span className="text-red-500">*</span></label>
                      <input
                        value={tool.name}
                        onChange={e => {
                          const updated = [...form.tools];
                          updated[i] = { ...updated[i], name: e.target.value };
                          set('tools', updated);
                        }}
                        placeholder="get_invoice_list"
                      />
                    </div>
                    <div className="[&_input]:w-full [&_input]:border [&_input]:border-gray-200 [&_input]:rounded-xl [&_input]:px-3 [&_input]:py-2.5 [&_input]:text-sm [&_input]:focus:outline-none [&_input]:focus:ring-2 [&_input]:focus:ring-blue-300">
                      <label className="block text-xs font-medium text-gray-600 mb-1">설명 <span className="text-red-500">*</span></label>
                      <input
                        value={tool.description}
                        onChange={e => {
                          const updated = [...form.tools];
                          updated[i] = { ...updated[i], description: e.target.value };
                          set('tools', updated);
                        }}
                        placeholder="세금계산서 목록을 조회합니다"
                      />
                    </div>
                  </div>
                ))}
              </div>
              {form.tools.length < 10 && (
                <button
                  onClick={() => set('tools', [...form.tools, { name: '', description: '' }])}
                  className="flex items-center gap-2 text-sm text-blue-600 font-medium hover:text-blue-700"
                >
                  <Plus className="w-4 h-4" /> 도구 추가
                </button>
              )}
            </>
          )}

          {step === 3 && (
            <>
              <h2 className="font-bold text-gray-900 text-lg">가격 설정 및 보안 인증</h2>
              <Field label="가격 모델" required>
                <select value={form.pricing} onChange={e=>set('pricing',e.target.value)}>
                  <option value="free">무료</option>
                  <option value="freemium">프리미엄 (기본 무료 + 유료 플랜)</option>
                  <option value="paid">유료 구독</option>
                  <option value="enterprise">기업용 (문의)</option>
                </select>
              </Field>
              {(form.pricing === 'paid' || form.pricing === 'freemium') && (
                <Field label="월 구독료 (원화)" hint="플랫폼 수수료 15%가 제외된 정산 금액을 기준으로 설정하세요">
                  <div className="flex items-center gap-2">
                    <input value={form.priceKRW} onChange={e=>set('priceKRW',e.target.value)} placeholder="49000" type="number" className="flex-1" />
                    <span className="text-sm text-gray-500 font-medium">원/월</span>
                  </div>
                </Field>
              )}
              <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600 space-y-1">
                <p className="font-semibold text-gray-800">정산 안내</p>
                <p>• 플랫폼 수수료: 15% (Founding Provider는 6개월 0%)</p>
                <p>• 정산 주기: 매월 말일 기준, 익월 10일 지급</p>
                <p>• 세금계산서: 정산 시 자동 발행</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">보안 인증 <span className="text-xs text-gray-400">(선택, 복수 선택 가능)</span></label>
                <p className="text-xs text-gray-400 mb-3">인증이 있으면 패스트트랙 심사(1일)가 적용됩니다.</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {CERTS.map(cert => {
                    const selected = form.certs.includes(cert);
                    return (
                      <button
                        key={cert}
                        onClick={() => {
                          const next = selected ? form.certs.filter(c => c !== cert) : [...form.certs, cert];
                          const files = { ...form.certFiles };
                          if (selected) delete files[cert];
                          set('certs', next);
                          set('certFiles', files);
                        }}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${selected ? CERT_COLORS[cert as SecurityCert] + ' border-transparent' : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'}`}
                      >
                        {selected ? '✓ ' : ''}{cert}
                      </button>
                    );
                  })}
                </div>
                {form.certs.length > 0 && (
                  <div className="space-y-3">
                    {form.certs.map(cert => {
                      const vState: CertVerifyState = form.certVerify[cert] ?? { status: 'idle' };
                      const file = form.certFiles[cert];
                      const isApiVerified = vState.status === 'verified';
                      return (
                        <div key={cert} className="border border-gray-200 rounded-xl p-4 space-y-3">
                          {/* 인증 배지 + API 확인 버튼 */}
                          <div className="flex items-center justify-between gap-3">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${CERT_COLORS[cert as SecurityCert]}`}>{cert}</span>
                            <button
                              type="button"
                              disabled={vState.status === 'loading' || !form.businessNumber.trim()}
                              onClick={() => verifyCert(cert)}
                              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-40 disabled:cursor-not-allowed border-blue-300 text-blue-700 hover:bg-blue-50"
                            >
                              {vState.status === 'loading'
                                ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> 확인 중…</>
                                : <><ShieldCheck className="w-3.5 h-3.5" /> 인증기관 API 확인</>}
                            </button>
                          </div>

                          {/* API 결과 */}
                          {vState.status === 'verified' && (
                            <div className="flex items-start gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-xs text-green-800">
                              <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-green-600" />
                              <div>
                                <p className="font-semibold">인증 확인 완료</p>
                                <p>인증번호: {vState.certNo} · 유효기간: {vState.expiry}</p>
                                <p className="text-green-600 mt-0.5">패스트트랙 심사(1일) 자동 적용됩니다.</p>
                              </div>
                            </div>
                          )}
                          {vState.status === 'failed' && (
                            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-800">
                              <ShieldX className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                              <div>
                                <p className="font-semibold">API 확인 실패</p>
                                <p>{vState.reason}</p>
                              </div>
                            </div>
                          )}

                          {/* 파일 업로드 (API 미확인 시 대안) */}
                          {!isApiVerified && (
                            <label className="flex items-center gap-3 border border-dashed border-gray-300 rounded-xl px-4 py-3 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
                              <span className="text-xs text-gray-400 shrink-0">또는 인증서 직접 첨부</span>
                              <span className="text-sm text-gray-500 flex-1 truncate">
                                {file ? file.name : 'PDF·JPG·PNG (10MB 이하)'}
                              </span>
                              {file && <span className="text-xs text-green-600 font-medium shrink-0">✓ 첨부됨</span>}
                              <input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                className="hidden"
                                onChange={e => {
                                  const f = e.target.files?.[0];
                                  if (f) set('certFiles', { ...form.certFiles, [cert]: f });
                                }}
                              />
                            </label>
                          )}
                        </div>
                      );
                    })}
                    <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
                      API 확인 또는 인증서 첨부 시 패스트트랙 심사(1일)가 적용됩니다. 둘 다 없으면 일반 심사(3일)입니다.
                    </p>
                  </div>
                )}
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <h2 className="font-bold text-gray-900 text-lg">검토·제출</h2>
              <div className="bg-gray-50 rounded-xl p-4 space-y-3 text-sm">
                <Row label="담당자" value={form.authorName} />
                <Row label="이메일" value={form.authorEmail} />
                {form.companyName && <Row label="회사명" value={form.companyName} />}
                <Row label="사업자번호" value={form.businessNumber} />
                <div className="border-t border-gray-200 my-2" />
                <Row label="서버명" value={form.serverName} />
                {form.serverNameEn && <Row label="서버명 (영문)" value={form.serverNameEn} />}
                <Row label="카테고리" value={categoryLabel ? `${categoryLabel.emoji} ${categoryLabel.label}` : form.category} />
                <Row label="API 문서" value={form.apiDocsUrl} />
                <div className="border-t border-gray-200 my-2" />
                <Row label="도구 수" value={`${form.tools.filter(t => t.name.trim()).length}개`} />
                <div className="border-t border-gray-200 my-2" />
                <Row label="가격 모델" value={form.pricing + (form.priceKRW ? ` — ₩${Number(form.priceKRW).toLocaleString()}/월` : '')} />
                {form.certs.length > 0 && (
                  <Row
                    label="보안 인증"
                    value={form.certs.map(c => {
                      const v = form.certVerify[c];
                      if (v?.status === 'verified') return `${c} ✓ API확인`;
                      if (form.certFiles[c]) return `${c} ✓ 서류첨부`;
                      return `${c} (미확인)`;
                    }).join('  |  ')}
                  />
                )}
              </div>

              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">등록 도구 목록</p>
                <div className="space-y-1.5">
                  {form.tools.filter(t => t.name.trim()).map((t, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm bg-gray-50 rounded-lg px-3 py-2">
                      <code className="text-blue-700 font-mono shrink-0">{t.name}</code>
                      <span className="text-gray-500">— {t.description}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
                ⚠️ 제출 후 영업일 기준 3일 내 심사가 진행됩니다. ISMS-P·ISO 27001 인증이 있으면 패스트트랙 심사(1일)가 적용됩니다.
              </div>
            </>
          )}
        </div>

        {/* 버튼 */}
        <div className="flex justify-between mt-5">
          {step > 0
            ? <button onClick={() => { setError(null); setStep(s => s - 1); }} className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">이전</button>
            : <div />}
          {step < STEPS.length - 1
            ? <button onClick={handleNext} className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold">다음 <ChevronRight className="w-4 h-4" /></button>
            : <button onClick={() => setSubmitted(true)} className="flex items-center gap-2 px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-semibold"><CheckCircle className="w-4 h-4" /> 등록 신청</button>}
        </div>
      </div>
    </div>
  );
}

function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
      <div className="[&_input]:w-full [&_input]:border [&_input]:border-gray-200 [&_input]:rounded-xl [&_input]:px-3 [&_input]:py-2.5 [&_input]:text-sm [&_input]:focus:outline-none [&_input]:focus:ring-2 [&_input]:focus:ring-blue-300 [&_select]:w-full [&_select]:border [&_select]:border-gray-200 [&_select]:rounded-xl [&_select]:px-3 [&_select]:py-2.5 [&_select]:text-sm [&_select]:focus:outline-none [&_select]:bg-white [&_textarea]:w-full [&_textarea]:border [&_textarea]:border-gray-200 [&_textarea]:rounded-xl [&_textarea]:px-3 [&_textarea]:py-2.5 [&_textarea]:text-sm [&_textarea]:focus:outline-none [&_textarea]:focus:ring-2 [&_textarea]:focus:ring-blue-300 [&_textarea]:resize-none">
        {children}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-gray-500 shrink-0">{label}</span>
      <span className="font-medium text-gray-800 text-right break-all">{value || '—'}</span>
    </div>
  );
}
