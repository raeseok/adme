# AdMe Stage 0.5 Vercel Shell

작성일: 2026-07-06  
Stage: 0.5-R — GitHub 저장소 확인, Supabase diagnostics, Vercel 자동 배포 정합화

---

## 1. Stage 0.5-R 목적

Stage 1-B 소비자 프로필 UI 전에 Vercel Production에서 다음을 안정화한다.

- GitHub `raeseok/adme` remote 정합성
- Vercel Root Directory `apps/web` (monorepo)
- Supabase anon read-only diagnostics
- GitHub push → Vercel Production 자동 배포

---

## 2. GitHub

| 항목 | 값 |
|------|-----|
| Repository URL | https://github.com/raeseok/adme |
| local origin | https://github.com/raeseok/adme.git |
| branch | `main` |

중복 저장소 생성 금지 — 기존 `raeseok/adme`만 사용.

---

## 3. Vercel

| 항목 | 값 |
|------|-----|
| Project name | `web` |
| Production URL | https://web-ashen-xi-52.vercel.app |
| Root Directory | **`apps/web`** (Vercel Dashboard → Settings → General) |
| Install Command | `npm install` |
| Build Command | `npm run build` |
| Framework | Next.js |
| GitHub 연동 | `raeseok/adme` |

> monorepo이므로 GitHub 자동 배포 시 Root Directory를 반드시 `apps/web`으로 설정한다.  
> 루트 `vercel.json`은 사용하지 않는다 (CLI 배포 충돌 방지).

---

## 4. Supabase env (Production)

| 변수 | 필수 |
|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ |

- **service role key 사용 금지**
- anon key 원문 화면/문서 출력 금지

설정 경로: Vercel Dashboard → Project `web` → Settings → Environment Variables → Production

---

## 5. diagnostics DB check

경로: `/admin/diagnostics`

| 항목 | 기대값 |
|------|--------|
| Supabase URL configured | `true` |
| Supabase anon key configured | `true` |
| DB check status | `ok` |
| Checked table | `regions` 또는 `interest_categories` |
| Stage marker | `stage-0-5-vercel-shell` |
| 추가 marker | `Stage 0.5-R diagnostics verified` |

조회: read-only `count` 1회 (regions → fallback interest_categories).

---

## 6. service role key

**미사용** — `apps/web`에 service role 참조 코드 없음.

---

## 7. GitHub push 자동 배포

1. `main`에 push
2. Vercel GitHub integration이 Production 배포 트리거
3. Production URL에서 `deploy commit` 및 marker 확인

---

## 8. Stage 1-B 전 설계 쟁점

### 소비자 지역 구조

| 구분 | 내용 |
|------|------|
| 현재 Stage 0 DB | `consumer_profiles.region_id` 단일 지역 (MVP) |
| 사업/개발 계획서 | 주거지역 1개 + 주활동지역 최대 2개 |
| 관심분야 | 다중 선택 (`consumer_category_interests`) |

### 선택지

1. MVP: 단일 `region_id`만 UI에 반영
2. UI만 2지역 표시, 저장은 단일 region (확장 예정 marker)
3. **권장**: Stage 0.6에서 `consumer_regions` 등 DB 확장 후 Stage 1-B 진입

---

## 9. 로컬 개발

```bash
cd apps/web
cp .env.example .env.local
npm run dev
```

```bash
powershell -File scripts/run_live_validation_pg17.ps1  # DB schema 검증
```
