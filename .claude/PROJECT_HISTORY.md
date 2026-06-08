# 한국특화 MCP 마켓플레이스 — 개발 히스토리

## 프로젝트 개요
- **저장소**: https://github.com/spotkwk-hub/mcp-marketplace-kr
- **프로덕션**: https://mcp-marketplace-kr.vercel.app
- **npm org**: https://www.npmjs.com/org/mcp-kr
- **모노레포**: npm workspaces (`packages/*`, `apps/*`, `servers/*`)

---

## 아키텍처 결정

### SSoT: `@mcp-kr/registry`
- `packages/registry/src/index.ts` — 단일 진실의 소스
- `MCPServerMeta` 타입 + `MCPEnvVar[]` 필드
- 웹앱과 서버 패키지 양쪽에서 import
- 이전에 `apps/web/src/lib/data.ts`와 이중 관리하던 문제를 완전 제거

### 설치 모달 `claude mcp add` 명령어 (최종 확정)
```
claude mcp add <server-id> [-e KEY=VALUE ...] npx @mcp-kr/<pkg>
```
- `--` 없음, `-y` / `--yes` 없음 — 붙이면 unknown option 에러
- 환경변수는 `-e KEY=VALUE` 형식으로 명령어 이름 뒤, `npx` 앞

### TypeScript 주의사항
- `args` 기본값: `const { name, arguments: args = {} } = req.params;`
- 조건부 spread: `...(x ? { key: String(x) } : {})` — `&&` 방식은 TS2698
- CERT_COLORS 인덱스: `CERT_COLORS[cert as SecurityCert]`

---

## 배포된 npm 패키지 (8개)

| 패키지 | 버전 | 환경변수 |
|--------|------|---------|
| `@mcp-kr/smartstore-mcp` | 0.1.0 | `SMARTSTORE_CLIENT_ID`, `SMARTSTORE_CLIENT_SECRET` |
| `@mcp-kr/witax-mcp` | 0.1.0 | `WETAX_API_KEY` |
| `@mcp-kr/nps-edi-mcp` | 0.1.0 | `NPS_EDI_BIZ_NO` |
| `@mcp-kr/nhis-edi-mcp` | 0.1.0 | `NHIS_EDI_BIZ_NO` |
| `@mcp-kr/hometax-mcp` | 0.1.0 | `HOMETAX_API_KEY` |
| `@mcp-kr/publicdata-mcp` | 0.1.0 | `PUBLIC_DATA_API_KEY` |
| `@mcp-kr/g2b-mcp` | 0.1.0 | `G2B_API_KEY` |
| `@mcp-kr/douzone-icube-mcp` | 0.1.0 | `DOUZONE_API_KEY`, `DOUZONE_COMPANY_CD` |

publish 명령어: `npm publish --access=public` (Granular Token with "Bypass 2FA" 필요)

---

## 알려진 함정 (Known Gotchas)

### registry dist는 gitignore — Vercel이 항상 재빌드
- `packages/registry/dist/`는 `.gitignore` 대상이라 git에 커밋 불가
- Vercel buildCommand에 `npm run build --workspace=packages/registry`가 포함되어 있어 배포 시 자동 재빌드됨
- **로컬 dev 서버**: `npm run dev` 전에 `npm run build --workspace=packages/registry` 필수 (dist가 오래됐으면 envVars 등 신규 필드 누락)

---

## Vercel 배포

- `vercel.json` 위치: 레포 루트
- buildCommand: `npm run build --workspace=packages/registry && npm run build --workspace=apps/web`
- outputDirectory: `apps/web/.next`
- framework: `nextjs`
- 환경변수: `NEXTAUTH_URL=https://mcp-marketplace-kr.vercel.app`
- 재배포: `npx vercel --prod`

---

## 로컬 개발

```bash
# 웹앱 실행
npm run dev --workspace=apps/web
# → http://localhost:3000

# 서버 단독 빌드
npm run build --workspace=servers/<name>

# 레지스트리 빌드
npm run build --workspace=packages/registry
```

---

## 주요 파일 구조

```
mcp-marketplace-kr/
├── apps/web/src/
│   ├── app/page.tsx          # 메인 마켓플레이스 (설치 모달 포함)
│   ├── app/register/page.tsx # 서버 등록 폼
│   └── components/
│       └── CategoryFilter.tsx
├── packages/registry/src/
│   └── index.ts              # MCPServerMeta, MCPEnvVar, CATEGORIES, CERT_COLORS
├── servers/
│   ├── smartstore/
│   ├── witax/
│   ├── nps-edi/
│   ├── nhis-edi/
│   ├── hometax/
│   ├── publicdata/
│   ├── g2b/
│   └── douzone-icube/
└── vercel.json
```

---

## 변경 이력 요약

| 날짜 | 작업 |
|------|------|
| 2026-06-08 | 이중 데이터 시스템 제거 (`@/lib/data` → `@mcp-kr/registry` SSoT) |
| 2026-06-08 | MCPEnvVar 타입 추가, 8개 서버 envVars 메타데이터 등록 |
| 2026-06-08 | 설치 모달 `claude mcp add` 명령어 문법 확정 및 수정 |
| 2026-06-08 | 4개 기존 서버 npm publish (smartstore, witax, nps-edi, nhis-edi) |
| 2026-06-08 | Vercel 프로덕션 배포 |
| 2026-06-08 | 신규 4개 서버 생성 + publish (hometax, publicdata, g2b, douzone-icube) |
| 2026-06-08 | Vercel 재배포 (envVars 반영) |
| 2026-06-08 | 버그 수정: registry dist 미빌드로 envVars 누락 → Vercel 재배포로 해결 |
| 2026-06-08 | UI 개선: 설치 모달 '환경 변수 설정 필요' 섹션 배경색 강조 (amber-50 → amber-400) |
