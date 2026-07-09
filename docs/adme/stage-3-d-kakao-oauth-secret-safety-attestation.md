# Stage 3-D-R — Kakao OAuth Secret Safety Attestation

작성일: 2026-07-09  
상태: **safety attestation completed**  
기준: Stage 3-D 조건부 완료 보류 해소 (rotation 필수 아님)

관련:
- [stage-3-d-kakao-secret-rotation-preflight.md](./stage-3-d-kakao-secret-rotation-preflight.md) (superseded)
- [stage-3-d-production-reward-preflight-result.md](./stage-3-d-production-reward-preflight-result.md)
- [adme-decision-log.md](./adme-decision-log.md) — ADME-DECISION-20260709-006

---

## 판정 요약

| 항목 | 결과 |
|---|---|
| safety attestation completed | **true** |
| exposure suspected | **false** |
| rotation required | **false** |
| rotation performed | **false** |
| dev Supabase Kakao provider configured | **true** |
| prod Supabase Kakao provider configured | **true** |
| dev authorize reverified | **true** |
| prod authorize reverified | **true** |
| prod OAuth E2E reverified | **true** |
| raw secret recorded | **false** |
| partial/hash/digest recorded | **false** |
| code/token recorded | **false** |
| Production reward open remains | **false** |

---

## 핵심 원칙

- Kakao Client Secret 노출 증거·합리적 의심이 없으면 **재발급하지 않는다**.
- Stage 3-D-R blocker는 **Kakao OAuth Secret Safety Attestation**으로 해소한다.
- Secret 원문 / 일부값 / prefix / suffix / hash / digest는 어떤 경로에도 기록하지 않는다.
- authorization code / access token / refresh token도 기록하지 않는다.
- Production reward open은 Stage 3-E 별도 승인 전까지 **금지**한다.

---

## Attestation 환경변수 (secret 아님 — 운영 확인값만)

| 변수 | 의미 | 목표값 |
|---|---|---|
| `ADME_KAKAO_SECRET_SAFETY_ATTESTATION_REQUIRED` | safety attestation 필요 | `true` |
| `ADME_KAKAO_SECRET_SAFETY_ATTESTATION_CONFIRMED` | 운영자 확인 완료 | `true` |
| `ADME_KAKAO_SECRET_ATTESTED_AT` | 확인일 `YYYY-MM-DD` | 실제 확인일 |
| `ADME_KAKAO_SECRET_EXPOSURE_SUSPECTED` | 노출 의심 | `false` |
| `ADME_KAKAO_SECRET_RAW_RECORDED` | 원문 기록 여부 | `false` |
| `ADME_KAKAO_SECRET_PARTIAL_HASH_DIGEST_RECORDED` | 일부/해시/digest 기록 | `false` |
| `ADME_KAKAO_SECRET_DEV_PROVIDER_CONFIGURED` | dev provider 정상 | `true` |
| `ADME_KAKAO_SECRET_PROD_PROVIDER_CONFIGURED` | prod provider 정상 | `true` |
| `ADME_KAKAO_OAUTH_DEV_AUTHORIZE_REVERIFIED` | dev authorize 재확인 | `true` |
| `ADME_KAKAO_OAUTH_PROD_AUTHORIZE_REVERIFIED` | prod authorize 재확인 | `true` |
| `ADME_KAKAO_OAUTH_PROD_E2E_REVERIFIED` | prod E2E 재확인 | `true` |
| `ADME_KAKAO_SECRET_ROTATION_REQUIRED` | rotation 필요 | `false` |
| `ADME_KAKAO_SECRET_ROTATION_PERFORMED` | rotation 수행 | `false` |

구현: `apps/web/src/lib/rewards/kakao-secret-attestation.ts`  
Vercel 반영 스크립트: `apps/web/scripts/setup-stage3d-r-kakao-safety-attestation-vercel-env.mjs`

---

## Diagnostics markers (admin only)

- `stage3DKakaoSecretSafetyAttestationRequired=true`
- `stage3DKakaoSecretSafetyAttestationConfirmed=true`
- `stage3DKakaoSecretAttestedAt=YYYY-MM-DD`
- `stage3DKakaoSecretExposureSuspected=false`
- `stage3DKakaoSecretRawRecorded=false`
- `stage3DKakaoSecretPartialHashDigestRecorded=false`
- `stage3DKakaoSecretDevProviderConfigured=true`
- `stage3DKakaoSecretProdProviderConfigured=true`
- `stage3DKakaoOauthDevAuthorizeReverified=true`
- `stage3DKakaoOauthProdAuthorizeReverified=true`
- `stage3DKakaoOauthProdE2EReverified=true`
- `stage3DKakaoSecretRotationRequired=false`
- `stage3DKakaoSecretRotationPerformed=false`
- `stage3DKakaoSecretRawExposed=false`
- `stage3DOAuthCodeTokenExposed=false`
- `stage3DProductionRewardOpenReady=false` (유지)

경로: `/admin/reward-preflight`, `/admin/diagnostics`

---

## 노출 의심 시 즉시 중단

`exposure_suspected=true`이면 이 Stage를 중단하고 별도 **Kakao Secret Emergency Rotation** 작업으로 분리한다.
