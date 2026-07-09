# AdMe Stage 3-C-K3 — Kakao OAuth E2E 성공 및 OAuth diagnostic redaction

작성일: 2026-07-09  
상태: **완료** (Production Kakao OAuth E2E 성공 + diagnostic redaction)

**선행:**
- [stage-3-c-k-prod-kakao-oauth-fix-result.md](./stage-3-c-k-prod-kakao-oauth-fix-result.md) (Stage 3-C-K)
- Stage 3-C-K2 OAuth 진단 보강 (`65d9597`)

---

## 원인 해소 흐름

### 1. Unsupported provider: provider is not enabled

| 항목 | 내용 |
|---|---|
| 증상 | prod authorize 400 / `provider is not enabled` |
| 원인 | prod Supabase backend `external_kakao_enabled=false`, Client ID/Secret 미설정 |
| 조치 | Management API로 prod Kakao provider 활성화 및 credentials 반영 (Stage 3-C-K) |
| 결과 | authorize 302 → Kakao login screen |

### 2. Kakao KOE006 — 등록되지 않은 Redirect URI

| 항목 | 내용 |
|---|---|
| 증상 | Kakao Developers KOE006 |
| 원인 | Kakao Developers에 prod Supabase callback URI 미등록 |
| 조치 | Redirect URI 추가: `https://vupsalteyltjqumppltc.supabase.co/auth/v1/callback` |
| 결과 | Kakao 인가 코드 발급 가능 |

### 3. OAuth2 invalid_client / Bad client credentials

| 항목 | 내용 |
|---|---|
| 증상 | Supabase Auth Logs: invalid client / Bad client credentials → AdMe `missing_code` / `#error=server_error&error_code=unexpected_failure` |
| 원인 후보 | Kakao Client Secret / REST API Key 조합 불일치 |
| 조치 | Kakao Client Secret 재확인·재발급 후 Supabase prod/dev 반영 (원문 미기록) |
| 결과 | Production Kakao 로그인 정상 완료 |

### 4. 최종 상태 (사용자 수동 확인)

| 단계 | 결과 |
|---|---|
| Production Kakao authorize | PASS |
| Kakao account login | PASS |
| `/auth/callback` | PASS |
| session 생성 | PASS |
| `/consumer/profile` authenticated | PASS |
| 표시 | 로그인됨 (`ra***@kakao.com` 마스킹) |

Production URL: https://web-ashen-xi-52.vercel.app  
prod Supabase: `vupsalteyltjqumppltc`  
dev Supabase: `ogncvdxrrsjnwsuvgoyh`

---

## OAuth diagnostic redaction (K3)

K2 진단 UI가 `error_description` 원문을 표시할 수 있어, external code 일부가 public login에 노출될 위험이 있었다.

| 정책 | 내용 |
|---|---|
| 허용 | `oauthError`, `oauthErrorCode`, `oauthErrorSummary`, `callbackCodeMissing` |
| 금지 | external code, authorization code, access/refresh/id token, client_secret 원문·일부 |
| 요약 예 | `oauthErrorSummary=external_code_exchange_failed` |
| 사용자 문구 | 소셜 로그인 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요. |

검증: `npm run verify:oauth-redaction-guard`

---

## Stage 3-C 보안 회귀

| 항목 | 값 |
|---|---|
| Production reward mutation | false |
| quiz_answer exposure | false |
| public marker exposed | false |
| client direct RPC | false |

---

## 다음 Stage

- **Stage 3-D** — Production reward open **preflight** (별도 승인). Auth E2E 성공 조건은 충족되었으나 reward open은 별도 preflight 필요.
- Kakao Client Secret은 이미지 노출 이력이 있으면 성공 확인 후 재발급·반영을 권장한다 (원문 미기록).
