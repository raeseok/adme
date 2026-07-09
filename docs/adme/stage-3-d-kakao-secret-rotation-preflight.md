# Stage 3-D — Kakao Client Secret Rotation Preflight

작성일: 2026-07-09  
상태: **SUPERSEDED** — Stage 3-D-R에서 Kakao OAuth Secret Safety Attestation으로 대체  
대체 문서: [stage-3-d-kakao-oauth-secret-safety-attestation.md](./stage-3-d-kakao-oauth-secret-safety-attestation.md)  
기준 HEAD: `dc025a0` 이후 Stage 3-D (historical)

---

## Supersession notice

**Kakao Client Secret rotation is not required unless exposure is suspected.**

Stage 3-D-R blocker is resolved by **Kakao OAuth Secret Safety Attestation**, not by mandatory Client Secret reissue.

- exposure suspected = false → `rotationRequired=false`, `rotationPerformed=false`가 정상
- exposure suspected = true → 이 문서를 다시 활성화하지 말고 별도 Emergency Rotation Stage로 분리
- secret 원문 / 일부값 / prefix / suffix / hash / digest 미기록 유지

---

## (Historical) 왜 필요했는가

과거 작업 중 Kakao Client Secret 또는 관련 민감값이 **화면 이미지에 노출된 이력**이 있어, Stage 3-D 초안은 Client Secret **재발급·재반영·재검증**을 첫 gate로 두었다.

이후 재진단 결과:

- 단순 로그인 설정 문제와 현재 prod OAuth E2E 성공이 확인되면 재발급은 필수 조건이 아님
- Secret 노출 의심이 없으면 safety attestation으로 보류 해소

---

## 절대 금지 (계속 유효)

다음을 코드·로그·화면·문서·완료보고에 **절대** 남기지 않는다.

- Client Secret 원문
- Client Secret 일부값 (prefix/suffix 포함)
- Client Secret hash / digest
- authorization code
- access token / refresh token
- OAuth callback `code` 원문

확인 결과는 **boolean / 날짜(YYYY-MM-DD)** 만 기록한다.

---

## (Historical) Attestation 환경변수

| 변수 | 의미 | Stage 3-D 초안 기본 |
|---|---|---|
| `ADME_KAKAO_SECRET_ROTATION_REQUIRED` | rotation 필요 | `true` (→ Stage 3-D-R에서 **false**) |
| `ADME_KAKAO_SECRET_ROTATED_AT` | 재발급일 | (비움; safety attestation은 `ATTESTED_AT` 사용) |
| `ADME_KAKAO_SECRET_ROTATION_CONFIRMED` | 운영자 확인 | superseded → `SAFETY_ATTESTATION_CONFIRMED` |
| `ADME_KAKAO_SECRET_DEV_REAPPLIED` | dev 반영 | superseded → `DEV_PROVIDER_CONFIGURED` |
| `ADME_KAKAO_SECRET_PROD_REAPPLIED` | prod 반영 | superseded → `PROD_PROVIDER_CONFIGURED` |
| `ADME_KAKAO_OAUTH_PROD_E2E_REVERIFIED` | prod E2E 재확인 | 유지 |

현재 구현: `apps/web/src/lib/rewards/kakao-secret-attestation.ts` (safety attestation)

---

## (Historical) Diagnostics markers

- `stage3DKakaoSecretRotationRequired` — Stage 3-D-R에서 **false** 의미로 유지
- `stage3DKakaoSecretRotationPerformed` — **false** (재발급 미수행)
- `stage3DKakaoSecretSafetyAttestationConfirmed` — **true** (보류 해소)

상세는 safety attestation 문서를 따른다.
