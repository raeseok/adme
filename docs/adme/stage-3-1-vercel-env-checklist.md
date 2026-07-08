# AdMe Stage 3-1 — Vercel 환경변수 분리 체크리스트

작성일: 2026-07-08

---

## Production env 체크리스트

- [ ] `NEXT_PUBLIC_SUPABASE_URL` → prod URL (`https://vupsalteyltjqumppltc.supabase.co`)
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` → prod anon key (Encrypted, raw 출력 금지)
- [ ] `ADME_EXPECTED_PROD_SUPABASE_REF` = `vupsalteyltjqumppltc`
- [ ] `ADME_EXPECTED_DEV_SUPABASE_REF` = `ogncvdxrrsjnwsuvgoyh`
- [ ] `ADME_POINT_LEDGER_ACTUAL_MUTATION_ENABLED` = `false`
- [ ] `ADME_QUIZ_REWARD_ACTUAL_MUTATION_ENABLED` = `false`
- [ ] `ADME_CAMPAIGN_BUDGET_ACTUAL_MUTATION_ENABLED` = `false`
- [ ] `/admin/diagnostics`: `stage30VercelEnv=production`
- [ ] `/admin/diagnostics`: `stage30CurrentSupabaseProjectRef` = prod ref
- [ ] `/admin/diagnostics`: `stage30DevProdSupabaseSeparated=true`

---

## Preview env 체크리스트

- [ ] `NEXT_PUBLIC_SUPABASE_URL` → dev URL (`https://ogncvdxrrsjnwsuvgoyh.supabase.co`)
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` → dev anon key
- [ ] `ADME_EXPECTED_PROD_SUPABASE_REF` = `vupsalteyltjqumppltc`
- [ ] `ADME_EXPECTED_DEV_SUPABASE_REF` = `ogncvdxrrsjnwsuvgoyh`
- [ ] actual mutation env 모두 `false`
- [ ] Preview deployment URL 확보 (`ADME_PREVIEW_URL`)
- [ ] `/admin/diagnostics`: `stage30VercelEnv=preview`
- [ ] `/admin/diagnostics`: current ref = dev ref

---

## Local env 체크리스트

- [ ] `.env.local` → dev Supabase URL/anon key
- [ ] `.env.local` git 미커밋
- [ ] local이 prod ref를 바라보지 않음
- [ ] `ADME_EXPECTED_*` ref env (선택, diagnostics 정확도 향상)

---

## secret 미노출 체크리스트

- [ ] anon key / service role key / OAuth secret / Vercel token을 로그·HTML·diagnostics에 raw 출력하지 않음
- [ ] 완료보고에 secret raw value 미포함 (project-ref 수준만)
- [ ] verify script secret pattern 검사 PASS

---

## NEXT_PUBLIC_ prefix 주의

- `NEXT_PUBLIC_`에는 **anon key만** (공개 anon key — 브라우저 노출 전제)
- service role key, OAuth client secret, DB password는 **절대** `NEXT_PUBLIC_` 금지
- Stage 3-1에서 service role key **미사용**

---

## service role key 사용 금지

- Stage 3-1 범위에서 service role client 생성·사용 금지
- `stage30ServiceRoleClientExposed=false` 유지
- Supabase Dashboard에서 service role key를 Vercel env에 넣지 않음
