# AdMe Stage 3-0 — Supabase dev/prod 분리 및 환경변수 원칙

작성일: 2026-07-08  
목적: Stage 3 actual mutation 진입 전 dev/prod Supabase 분리 상태를 진단하고 Vercel env 분리 기준을 문서화한다.

---

## 현재 상태 요약

| 항목 | 값 |
|---|---|
| Production URL | https://web-ashen-xi-52.vercel.app |
| Production deploy commit | 28c1460 (Stage 3-0 작업 시작 기준) |
| Supabase project-ref | `ogncvdxrrsjnwsuvgoyh` |
| dev/prod Supabase 분리 | **미분리** — Production·Preview·Local 모두 동일 project-ref |
| point_ledger mutation | false (Stage 3-0까지 유지) |
| service role client exposure | false |

Stage 3-0은 **실적립 구현 단계가 아니라**, 분리·readiness·safety gate를 먼저 구축하는 preflight 단계이다.

---

## 권장 분리 전략

### 권장안 A: 현재 project-ref를 dev로 고정, 별도 prod 생성

- `ogncvdxrrsjnwsuvgoyh` → **dev** Supabase project로 고정
- 새 Supabase project를 **prod**로 생성
- Vercel **Production** env만 prod URL/anon key로 전환
- Vercel **Preview** / **Local**은 dev ref 유지

| 장점 | 단점 |
|---|---|
| 기존 개발·seed·migration 검증 이력 유지 | prod project 신규 생성·migration 재적용 필요 |
| Preview/Local 실수로 prod 데이터 손상 위험 낮음 | Vercel Production env 전환 시점에 배포 검수 필요 |
| Stage 2까지 쌓인 dev 데이터를 그대로 dev로 사용 | prod 초기 seed·RLS·정책 재검증 필요 |

### 대안 B: 현재 project-ref를 prod로 승격, 별도 dev 생성

- `ogncvdxrrsjnwsuvgoyh` → **prod** Supabase project로 승격
- 새 Supabase project를 **dev**로 생성
- Local/Preview를 dev ref로 전환

| 장점 | 단점 |
|---|---|
| Production URL이 이미 바라보는 DB를 prod로 유지 | dev project 신규 생성·migration·seed 재적용 |
| Production env 전환 범위가 Preview/Local에 한정 | Local/Preview가 prod를 가리키던 기간의 혼선 위험 |
| 운영 데이터가 이미 존재하면 prod 승격이 자연스러움 | dev 환경 재구성 비용 |

**Stage 3-0 권장:** 아직 actual mutation 전이므로 **권장안 A**가 안전하다. dev에서 migration·RPC dry-run 후 prod를 분리하는 흐름이 Stage 3 본작업과 맞는다.

---

## Vercel 환경변수 분리 원칙

| 환경 | Supabase URL/anon key | 비고 |
|---|---|---|
| **Production** | prod project-ref만 | `ADME_EXPECTED_PROD_SUPABASE_REF`와 일치해야 함 |
| **Preview** | dev project-ref | PR·브랜치 배포는 prod DB에 쓰기 금지 |
| **Local** | dev project-ref | `.env.local`은 dev ref만 사용 |

### 필수 env (Stage 3-0 diagnostics)

| 변수 | 용도 |
|---|---|
| `ADME_EXPECTED_PROD_SUPABASE_REF` | prod project-ref (secret 아님) |
| `ADME_EXPECTED_DEV_SUPABASE_REF` | dev project-ref (secret 아님) |
| `ADME_POINT_LEDGER_ACTUAL_MUTATION_ENABLED` | intent only — Stage 3-0에서 effective=false 강제 |
| `ADME_QUIZ_REWARD_ACTUAL_MUTATION_ENABLED` | intent only — Stage 3-0에서 effective=false 강제 |
| `ADME_CAMPAIGN_BUDGET_ACTUAL_MUTATION_ENABLED` | intent only — Stage 3-0에서 effective=false 강제 |

### 절대 금지

- `SUPABASE_SERVICE_ROLE_KEY`를 `NEXT_PUBLIC_*` 또는 client component에 노출
- anon key / service role key / OAuth secret / Vercel token을 diagnostics·로그·HTML에 raw 출력
- Preview/Local이 prod ref를 가리키는 채 actual mutation enable

---

## migration 적용 원칙

1. **dev에 먼저 적용** — migration SQL·RPC·RLS 변경은 dev project에서 검증
2. **검증 후 prod 적용** — Stage verify·수동 smoke PASS 후 prod에 동일 migration 적용
3. **`supabase db reset` 금지** — 운영·공유 dev 데이터 삭제 방지
4. **`supabase migration repair` 금지** — migration history 수동 조작 금지
5. **운영 데이터 삭제 금지** — prod에서 destructive DDL/DML 금지

---

## Stage 3 actual mutation 진입 조건

다음 **모두** 충족 시에만 Stage 3 본작업(actual mutation RPC) 착수 가능:

1. dev/prod Supabase **project-ref가 서로 다름**
2. Vercel **Production** env가 **prod ref**를 바라봄
3. Vercel **Preview** / **Local** env가 **dev ref**를 바라봄
4. `point_ledger` safety gate가 false → true로 전환될 **명시 승인 절차** 완료 (별도 문서·PR)
5. Stage 3-0 verify 전체 **PASS**
6. `/admin/diagnostics`에서 `stage30ReadinessStatus=READY_FOR_STAGE3_DESIGN_ONLY` (분리 완료 시)

**현재 (Stage 3-0):** `stage30ReadinessStatus=BLOCKED_DEV_PROD_NOT_SEPARATED` — actual mutation **진입 불가**.

---

## diagnostics 확인 경로

- Production: https://web-ashen-xi-52.vercel.app/admin/diagnostics
- Stage 3-0 section: `stage30Build=stage3-0-supabase-ledger-safety-readiness-production`
- public route(`/`, `/consumer`, `/advertiser` 등)에는 stage30 marker **미노출**
