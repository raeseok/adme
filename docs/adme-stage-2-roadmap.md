# AdMe Stage 2 로드맵

작성일: 2026-07-08  
목적: 광고 카드·퀴즈·알림·포인트 적립 Stage 분해 계획

> **카카오톡 알림 기능은 광고 도착 알림이며, 퀴즈·정답·포인트 적립은 AdMe 앱 내부 서버 권위 흐름으로만 처리한다.**

---

## Stage 2-A — Read-Only 광고 카드·퀴즈 UI + 카카오 알림 Feasibility

| 항목 | 내용 |
|---|---|
| 소비자 UI | `/consumer/ads` read-only 광고 카드·퀴즈 미리보기 |
| quiz_answer | client/network **노출 금지** |
| point_ledger | **mutation 없음** |
| ad_views | **기록 없음** |
| 카카오톡 | feasibility 문서화만, **실제 발송 없음** |
| 검증 | Stage 2-A smoke/verify 스크립트 |

---

## Stage 2-B — 최소 열람 타이머 + 서버 채점

| 항목 | 내용 |
|---|---|
| 최소 열람 타이머 | 광고 본문 최소 시청 시간 강제 |
| 서버 채점 | `grade_quiz_answer()` RPC 연동 (BOOLEAN만 반환) |
| point_ledger | **mutation 없음** |
| 카카오톡 | 발송 없음 |

---

## Stage 2-C — ad_views 기록 + 재도전 흐름

| 항목 | 내용 |
|---|---|
| ad_views | attempt 기록 (viewed / passed / failed) |
| 재도전 | 오답 1회 재도전, 2회 종료 |
| point_ledger | **mutation 없음** |
| 카카오톡 | 발송 없음 |

---

## Stage 2-D — 알림 선호 설정 + 인앱 알림 큐

| 항목 | 내용 |
|---|---|
| UI | 알림 선호 설정, 인앱 알림 큐 |
| 카카오톡 | 수신 동의 상태 저장 (DB 테이블 후보) |
| 실제 발송 | **없음** |
| 수신 동의 | 명시적 opt-in, 수신거부 지원 |

---

## Stage 3 — point_ledger quiz_reward 실제 적립

| 항목 | 내용 |
|---|---|
| point_ledger | `ad_reward` / quiz_reward 적립 |
| 전제 | Stage 2-B/C 채점·ad_views 흐름 안정화 |

---

## Stage 5-K — 카카오톡 실제 발송 연동

| 항목 | 내용 |
|---|---|
| 발송 | 카카오 채널/비즈메시지/브랜드 메시지 또는 적법한 대행 체계 확정 후 연동 |
| 전제 | dev/prod Supabase 분리, 수신 동의·연락수단 분리, 정책 심사 |
| 파일럿 | 제한적 발송 검증 |

---

## 보안·불가침 공통 원칙

- `quiz_answer` client props / HTML / JS bundle / API response **노출 금지**
- `point_ledger` mutation은 Stage 3 전까지 **금지** (2-A~2-C)
- service role key **사용 금지**
- RLS 유지, anon write policy **추가 금지**
- 소비 의향 프로필과 연락수단 **분리 저장**

---

## 관련 문서

- [Stage 2-A Schema Audit](./adme-stage-2a-readonly-ad-quiz-audit.md)
- [카카오톡 알림 Feasibility](./adme-kakao-notification-feasibility.md)
