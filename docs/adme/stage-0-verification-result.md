# AdMe Stage 0-F 검증 결과

작성일: 2026-07-06  
환경: Windows 10, `c:\Adme`

---

## 1. Docker / Supabase live 검증

| 항목 | 결과 |
|------|------|
| `docker --version` | **FAIL** — Docker Desktop 미설치 |
| `docker info` | **FAIL** — daemon 없음 |
| `npx supabase@latest --version` | **PASS** — 2.109.0 |
| `npx supabase@latest start` | **FAIL** — Docker prerequisite |
| `npx supabase@latest db reset` | **미실행** |
| `validate_stage0.sql` live | **미실행** |

### live 검증 불가 사유 (C안 + A안 권고)

1. **Docker Desktop 미설치** — `docker` 명령 없음
2. **Docker Desktop winget 설치 시도** — 관리자 권한(UAC) 필요로 실패 (exit `4294967291`)
3. **PostgreSQL 17 winget 설치** — 장시간 대기 중/UAC 대기 가능성
4. **원격 Supabase link** — 프로젝트 ref / credentials 미제공

### 권고 (A안)

기술 담당자가 **Docker Desktop 설치 및 실행** 후:

```powershell
cd c:\Adme
powershell -File scripts\run_live_validation.ps1
```

---

## 2. point_packages 정합화 (코드 완료)

| 항목 | 내용 |
|------|------|
| 선택 방식 | **B안** — compatibility VIEW |
| migration | `20260706100700_stage0_f_point_packages_compat_view.sql` |
| relation type | **VIEW** |
| 실데이터 | `advertiser_prepayments` |
| write 경로 | `record_advertiser_prepayment()` RPC only |
| 이중 원장 | 방지 (VIEW read-only, RPC가 단일 INSERT) |

---

## 3. validate_stage0.sql 보강

| 추가 항목 | 내용 |
|-----------|------|
| [15] | point_packages VIEW 존재, 필수 컬럼, BIGINT, write 트리거 없음 |
| [16] | VIEW 100/101원 배분 smoke test |

**live 실행**: Docker 준비 후 `scripts/run_live_validation.ps1` 참조

---

## 4. 정적 검증 (`validate_stage0_static.ps1`)

Stage 0-F migration 추가 후 재실행 필요.

---

## 5. live 검증 체크리스트 (미실행 — Docker 대기)

| 검증 항목 | 정적 | Live |
|---|---|---|
| migration 8개 적용 | PASS (파일) | **미검증** |
| validate_stage0.sql [1-16] | PASS (코드) | **미검증** |
| point_packages VIEW | PASS (migration) | **미검증** |
| quiz_answer 비노출 | PASS (0-R) | **미검증** |
| point_ledger append-only | PASS (0-R) | **미검증** |
| 100/101원 배분 | PASS (로직) | **미검증** |
| RLS 15 테이블 | PASS (0-R) | **미검증** |

---

## 6. Stage 1 진행 가능 여부

**판정: 조건부 가능**

| 조건 | 상태 |
|------|------|
| point_packages 해소 | ✅ 코드 완료 |
| live validate PASS | ❌ Docker 필요 |
| git clean + 커밋 | ✅ (0-F 커밋 후) |

### Stage 1 첫 작업

1. Docker 설치 → `run_live_validation.ps1` 실행 → Stage 0-F 최종 승인
2. 소비 의향 프로필 UI (Stage 1 scope)

---

## 7. 실행 이력

| 일시 | 명령 | 결과 |
|------|------|------|
| 2026-07-06 | `docker --version` | not found |
| 2026-07-06 | `winget install Docker.DockerDesktop` | UAC 실패 |
| 2026-07-06 | `npx supabase@latest --version` | 2.109.0 |
| 2026-07-06 | point_packages migration 작성 | 완료 |
