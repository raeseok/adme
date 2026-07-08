# AdMe Current Business Plan (Living Document)

작성일: 2026-07-08  
상태: **current** — repo 내 최신 사업 기준 문서

---

## 문서 목적

이 문서는 AdMe 서비스의 **현재 사업 기준**을 정의한다.  
업로드된 `AdMe_사업계획서_v3.0 (1).docx`는 **최초 출발 기준**으로 보존하되, 정책·UX·Stage 진행에 따라 변경된 내용은 **이 living document**가 우선한다.

관련 current 문서:
- [current-development-plan.md](./current-development-plan.md)
- [product-policy-current.md](./product-policy-current.md)
- [adme-decision-log.md](./adme-decision-log.md)
- [stage-roadmap-current.md](./stage-roadmap-current.md)

---

## 원본 기준 문서와의 관계

| 문서 | 역할 |
|---|---|
| AdMe_사업계획서_v3.0 (1).docx | 최초 사업 비전·시장·수익 모델 출발점 |
| **current-business-plan.md** (본 문서) | 진행 중 확정·변경된 사업 정의의 단일 기준 |
| adme-decision-log.md | 개별 정책 변경의 이력·근거 |

새 작업지시서·완료보고는 본 문서와 decision log를 기준으로 작성한다.

---

## AdMe 최신 서비스 정의

AdMe는 **소비자가 자신의 소비정보 조건을 먼저 제시**하고, **광고주가 그 조건에 맞는 광고와 보상을 제공**하며, **소비자가 광고 인식을 확인함으로써 보상을 획득**하는 플랫폼이다.

지역·성별만으로 타깃하는 전통적 광고와 달리, **소비 의향(관심·지역·연령·가족 소비 조건 등)이 선행**되고 광고는 그에 **응답**하는 구조이다.

---

## AdMe 핵심 철학

1. **소비자가 소비정보 조건을 먼저 제시**한다.  
   소비자는 “어떤 광고를 받고 싶은지”를 능동적으로 정의한다.

2. **광고주는 조건에 맞는 광고와 보상을 제공**한다.  
   매칭된 소비자에게만 광고가 전달되고, 퀴즈·열람 검증 후 보상이 연결된다.

3. **소비자는 광고 인식을 확인하고 보상을 획득**한다.  
   최소 열람·퀴즈 등으로 “광고를 실제로 인지했음”을 검증한 뒤 포인트(보상)가 정산된다.

---

## 지역 밀착형의 위치

지역 밀착형 타깃팅은 AdMe의 **본질이 아니다**.  
다만 **강력한 적용 가능성·운영 전략**으로 활용한다.

- 소비 의향 프로필의 주거지·주활동지역은 **소비정보 조건**의 일부
- 행정동·MOIS 기반 region seed는 **정밀 매칭 인프라**
- “지역 광고 플랫폼”이 아니라 “소비정보 기반 광고 매칭”이 정체성

---

## 이해관계자별 가치

### 소비자
- 원하는 조건의 광고만 수신
- 광고 인식 확인 후 보상(포인트) 획득
- 개인 식별 정보를 광고주에게 직접 노출하지 않음

### 광고주
- 소비 의향에 맞는 오디언스에 도달
- 열람·퀴즈 검증으로 인지 품질 확보
- 캠페인 예산·보상 단가 통제 (Stage 3-A 이후 actual 정산)

### 파트너
- 지역·채널 단위 확장·운영 (향후)
- 정산·리포트는 플랫폼 정책·ledger 기준

### 플랫폼 (AdMe)
- point_ledger 단일 진실 원천
- dev/prod 분리·보안 Stage 게이트
- 정책 변경은 decision log + current 문서로 추적

---

## 소비 의향 프로필 최신 설계

| 축 | 설명 | 비고 |
|---|---|---|
| 관심 분야 | interest scope / 카테고리 | 전체·개별 선택 |
| 주거지역 | hierarchical region (시도→시군구→동) | 최대 1 |
| 주활동지역 | hierarchical region | 최대 2 |
| 성별 | 선택 입력 | 미입력 허용 |
| 출생년도 / 연령 | birth_year 기반 | 미입력 허용 |
| **가장 큰 자녀 생년** | 선택 항목 (planned Stage 1-G) | 미입력 허용 |
| **막내 자녀 생년** | 선택 항목 (planned Stage 1-G) | 미입력 허용 |

원칙:
- 모든 항목은 **선택 입력** — 미입력 허용
- 가족·자녀 생년은 **가족 개인정보 수집이 아니라 자녀 관련 소비정보 조건**
- 광고주에게 **소비자 개인 식별 row 직접 노출 금지**

UX 문구 원칙은 [product-policy-current.md](./product-policy-current.md) 참조.

---

## 포인트 경제 원칙

| 원칙 | 현재 상태 |
|---|---|
| point_ledger = 단일 진실 원천 (append-only) | 설계 확정, actual mutation **금지** |
| quiz_reward actual 적립 | Stage 3-A 이후, dev-only dry-run 선행 |
| dev/prod Supabase 분리 | **완료** (Stage 3-1) |
| actual mutation enable | 별도 승인·gate 전까지 **false** |

상세: [stage-3-0-point-ledger-safety-preflight.md](./stage-3-0-point-ledger-safety-preflight.md)

---

## 지역 밀착 전략 (확장·운영)

- MOIS 행정동 기반 region tree (Stage 1-F-R)
- 광고주 정밀 타깃은 향후 캠페인 생성 UX에서 활용
- “지역 밀착”은 마케팅·운영 메시지이지 제품 본질 정의가 아님

---

## 현재 Stage 상태 요약

| 구간 | 상태 |
|---|---|
| Stage 0 ~ 2-C | 완료 |
| Stage 3-0 | 완료 (readiness·safety preflight) |
| Stage 3-1 / 3-1-R | 완료 (dev/prod 분리, DB UUID E2E 회복) |
| Stage 1-G | planned (프로필 확장·UX 문구) |
| Stage 3-A | planned (ledger actual mutation dev dry-run) |
| DOC-0 | 완료 (living document + decision log) |

상세 roadmap: [stage-roadmap-current.md](./stage-roadmap-current.md)
