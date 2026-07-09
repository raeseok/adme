# Stage 3-D — Kakao Client Secret Rotation Preflight

작성일: 2026-07-09  
상태: **preflight gate (첫 번째)**  
기준 HEAD: `dc025a0` 이후 Stage 3-D

---

## 왜 필요한가

과거 작업 중 Kakao Client Secret 또는 관련 민감값이 **화면 이미지에 노출된 이력**이 있다.  
Stage 3-D의 **첫 번째 gate**는 Client Secret **재발급·재반영·재검증** 확인이다.

Production reward open과 무관하게, Auth 보안 위생을 위해 rotation을 완료해야 한다.

---

## 절대 금지

다음을 코드·로그·화면·문서·완료보고에 **절대** 남기지 않는다.

- Client Secret 원문
- Client Secret 일부값 (prefix/suffix 포함)
- Client Secret hash / digest
- authorization code
- access token / refresh token
- OAuth callback `code` 원문

확인 결과는 **boolean / 날짜(YYYY-MM-DD)** 만 기록한다.

---

## 운영자 수행 체크리스트

1. Kakao Developers에서 Client Secret **재발급**
2. Supabase **dev** (`ogncvdxrrsjnwsuvgoyh`) Kakao provider에 새 Secret 반영
3. Supabase **prod** (`vupsalteyltjqumppltc`) Kakao provider에 새 Secret 반영
4. dev Kakao authorize 확인
5. prod Kakao authorize 확인
6. prod Kakao OAuth E2E 재확인 (`/consumer/profile`, provider=kakao, email 마스킹)

---

## Attestation 환경변수 (secret 아님)

| 변수 | 의미 | 기본 |
|---|---|---|
| `ADME_KAKAO_SECRET_ROTATION_REQUIRED` | rotation 필요 | `true` |
| `ADME_KAKAO_SECRET_ROTATED_AT` | 재발급일 `YYYY-MM-DD` | (비움) |
| `ADME_KAKAO_SECRET_ROTATION_CONFIRMED` | 운영자 확인 | `false` |
| `ADME_KAKAO_SECRET_DEV_REAPPLIED` | dev 반영 | `false` |
| `ADME_KAKAO_SECRET_PROD_REAPPLIED` | prod 반영 | `false` |
| `ADME_KAKAO_OAUTH_PROD_E2E_REVERIFIED` | prod E2E 재확인 | `false` |

코드는 secret을 검증·표시하지 않고, 위 attestation만 읽는다.  
구현: `apps/web/src/lib/rewards/kakao-secret-attestation.ts`

---

## Diagnostics markers (admin only)

- `stage3DKakaoSecretRotationRequired=true/false`
- `stage3DKakaoSecretRotationConfirmed=true/false`
- `stage3DKakaoSecretDevReapplied=true/false`
- `stage3DKakaoSecretProdReapplied=true/false`
- `stage3DKakaoOauthProdE2EReverified=true/false`
- `stage3DKakaoSecretRawExposed=false`
- `stage3DOAuthCodeTokenExposed=false`

경로: `/admin/reward-preflight`, `/admin/diagnostics` 요약

---

## 완료보고 기록 형식

- Kakao Client Secret 재발급 여부: true/false
- dev Supabase 반영 여부: true/false
- prod Supabase 반영 여부: true/false
- prod Kakao OAuth E2E 재확인 여부: true/false
- raw secret 기록 여부: **false**
- code/token 기록 여부: **false**

운영자가 Vercel/로컬에 attestation env를 아직 넣지 않았다면 diagnostics는 `Confirmed/Reapplied/Reverified=false`로 표시되며, 이는 **blocker**로 보고한다.
