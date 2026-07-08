# AdMe Product Policy (Current)

작성일: 2026-07-08  
상태: **current** — 제품·UX·프라이버시 원칙

관련: [current-business-plan.md](./current-business-plan.md) · [adme-decision-log.md](./adme-decision-log.md)

---

## AdMe 핵심 철학

1. **소비자가 소비정보 조건을 먼저 제시**한다.
2. **광고주는 조건에 맞는 광고와 보상을 제공**한다.
3. **소비자는 광고 인식을 확인하고 보상을 획득**한다.

광고는 “뿌려지는 것”이 아니라, 소비자가 정의한 **소비정보 조건에 대한 응답**이다.

---

## 광고를 소비정보로 보는 원칙

- 매칭 단위는 인구통계 스냅샷이 아니라 **소비 의향 프로필(관심·지역·연령·가족 소비 조건 등)**
- 캠페인은 “조건에 맞는 소비자”에게만 노출
- 열람·퀴즈로 **인지 검증** 후 보상 연결

---

## 소비자·광고주 역할

| 주체 | 역할 |
|---|---|
| 소비자 | 소비정보 조건 제시 → 광고 수신 → 인식 확인 → 보상 |
| 광고주 | 조건 매칭 → 광고·보상 제공 → 예산·성과 관리 |

---

## 소비 의향 프로필 UX 문구 원칙

- **소비성향 프로필은 광고를 보내달라는 나의 요구**로 프레이밍한다.
- **더 많은 조건을 등록할수록** 나에게 맞는 광고를 받을 수 있다는 **능동적 이점**을 전달한다.
- 문구는 **개인정보 제공이 아니라 소비정보 요청 조건**임을 분명히 한다.
- “개인정보를 입력해 주세요” 같은 **방어심리를 유발하는 톤**을 피한다.

예시 방향 (Stage 1-G에서 구체화):
- “내가 원하는 광고 조건을 알려주세요”
- “이 조건에 맞는 광고와 혜택을 받을 수 있어요”

---

## 개인정보·프라이버시

| 원칙 | 설명 |
|---|---|
| **광고주에게 개인 식별 row 직접 노출 금지** | consumer_user_id 등 raw 식별자 미노출 |
| quiz_answer 비노출 | correctAnswer, solution 등 정답 추론 필드 API/클라이언트 금지 |
| 자녀 생년 | 가족 개인정보 수집이 아니라 **자녀 관련 소비정보 조건** — 미입력 허용 |
| 이메일·user id | diagnostics·public UI에서 마스킹·비노출 |

---

## UI 변경 시 사용자 직접 점검 요청

UI·visible copy·layout 변경이 포함된 작업 완료 시:

1. **Vercel Production** URL에서 기술사님 직접 확인 요청
2. 필요 시 **Preview** URL 확인 (Deployment Protection 시 로그인)
3. 완료보고에 확인 경로·기대 문구·모바일/데스크톱 여부 명시

verify script는 **보조**이며, 화면 직접 점검을 대체하지 않는다.

---

## 지역 밀착형의 위치

- 제품 **본질 아님** — **적용 가능성·운영 전략**
- region selector는 소비정보 조건 입력 UX의 일부
- “지역 광고 앱”이 아닌 “소비정보 기반 매칭” 메시지 유지

---

## 자녀 생년 선택 항목의 의미 (planned Stage 1-G)

| 항목 | 의미 |
|---|---|
| 가장 큰 자녀 생년 | 자녀 연령대 관련 **소비정보 조건** (교육·육아 소비 등 매칭) |
| 막내 자녀 생년 | 동일 — 선택 입력 |
| 미입력 | 허용 — 조건 미설정으로 처리 |
| 광고주 노출 | **직접 row 노출 금지** — 집계·매칭 조건으로만 사용 |

---

## 금전·ledger 정책 (current)

- point_ledger actual mutation: **금지** (Stage 3-A 전)
- campaign budget / users balance actual 변경: **금지**
- dev/prod 분리 완료 — actual enable은 **별도 승인**

상세: [stage-3-0-point-ledger-safety-preflight.md](./stage-3-0-point-ledger-safety-preflight.md)

---

## machine marker 정책

- stage30 등 진단 marker: **`/admin/diagnostics` only**
- public route 노출 금지 — verify public-marker-guard로 검증
