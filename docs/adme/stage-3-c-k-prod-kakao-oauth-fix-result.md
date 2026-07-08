# AdMe Stage 3-C-K — Production Kakao OAuth 보류 해소 결과

작성일: 2026-07-09  
상태: **보류 해소** (authorize → Kakao login screen)

**선행:** [stage-3-c-consumer-quiz-submit-ui-controlled-integration.md](./stage-3-c-consumer-quiz-submit-ui-controlled-integration.md)

---

## 오류

Production(`vupsalteyltjqumppltc`)에서 카카오 로그인 클릭 시:

```json
{"code":400,"error_code":"validation_failed","msg":"Unsupported provider: provider is not enabled"}
```

## 원인

| 계층 | 판정 |
|---|---|
| 앱 코드 | **문제 없음** — `provider: 'kakao'`, prod Supabase URL, redirectTo 정상 |
| Supabase prod auth backend | **원인** — Management API 기준 `external_kakao_enabled=false`, Client ID/Secret 미설정 |
| Dashboard UI vs backend | **불일치 가능** — UI Enabled 표시와 backend disabled 공존 (Stage 3-1-R 문서의 “수동 복제 필요” 잔여) |
| Kakao Developers | dev에서 authorize 성공 → REST API Key·Login 설정은 dev와 동일 앱 기준으로 prod sync 가능 |

## 조치

dev Supabase(`ogncvdxrrsjnwsuvgoyh`)의 Kakao provider 설정을 Management API로 prod에 복제:

- `external_kakao_enabled=true`
- Client ID / Secret (dev와 동일, secret 미기록)
- `external_kakao_email_optional=false`

앱 코드 변경 없음.

## 검증

| 항목 | 결과 |
|---|---|
| prod authorize 302 → kauth.kakao.com | PASS |
| Production UI 버튼 → accounts.kakao.com | PASS |
| Unsupported provider 재현 | false |
| Stage 3-C reward mutation | false (회귀 PASS) |

검증 명령: `npm run verify:prod-kakao-oauth-authorize`

## Kakao Developers 확인 (운영 체크리스트)

prod callback URI 등록 권장:

- `https://vupsalteyltjqumppltc.supabase.co/auth/v1/callback`
- Web platform: `https://web-ashen-xi-52.vercel.app`

인터랙티브 로그인 완료(callback → session) E2E는 사용자 카카오 계정 필요.

## Stage 3-C 보안

OAuth 수정 후에도 Production reward mutation=false, quiz_answer exposure=false, public marker exposed=false 유지 확인.

## 다음 Stage

Stage 3-D 착수 가능 (Production reward open은 별도 승인).
