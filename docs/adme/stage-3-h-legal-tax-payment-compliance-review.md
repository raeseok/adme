# AdMe Stage 3-H Legal / Tax / Payment Compliance Review

작성일: 2026-07-09  
상태: **documentation/preflight only** — external legal and tax review required, actual mutation=false, no DB migration

관련: [stage-3-f-cash-out-manual-approval-design.md](./stage-3-f-cash-out-manual-approval-design.md) · [stage-3-g-partner-settlement-manual-approval-design.md](./stage-3-g-partner-settlement-manual-approval-design.md) · [product-policy-current.md](./product-policy-current.md)

---

## 1. Stage 3-H 목적

Stage 3-H는 Production reward open, cash-out actual implementation, partner settlement DB migration/batch implementation 전에 법무·세무·결제 규제 쟁점을 별도 gate로 분리하는 preflight 단계다.

이 문서는 법률 자문을 대체하지 않는다. 모든 법무·세무 판단은 pending_external_legal_tax_review 또는 undetermined 상태이며, 외부 법무법인·세무사 검토 전 actual reward open is blocked.

목표:
- AdMe 포인트·현금전환·파트너정산 구조의 법무/세무/결제 쟁점 문서화
- 외부 법무법인/세무사 질문지 작성
- actual open 전 blocker를 machine-readable marker와 문서로 고정
- `/admin/compliance-preflight`, `/admin/reward-preflight`, `/admin/diagnostics`에서 Stage 3-H marker 확인
- public/consumer/auth route에 Stage 3-H marker 비노출

---

## 2. 현재 actual mutation block 상태

| 항목 | 현재 상태 |
|---|---|
| Stage 3-E actual open executed | false |
| Production reward open flag | false |
| reward kill switch | true |
| controlled allowlist active | false |
| allowlist 실제 ID 반영 | 없음 |
| Production reward mutation | false |
| Production point_ledger mutation | false |
| Production campaign budget mutation | false |
| Production users balance mutation | false |
| Production ad_views mutation | false |
| Production cash_redemption_requests mutation | false |
| Production partner_settlements mutation | false |
| cash-out actual processing | false |
| partner settlement actual processing | false |
| monthly close batch | false |
| partner payout action | false |
| DB migration | 없음 |
| Supabase db push | 실행 없음 |

---

## 3. AdMe 포인트 구조 요약

- 1P=1원으로 사용자에게 표시한다.
- 포인트는 광고주 선납 기반 예산에서 발생하는 구조로 설계되어 있다.
- 소비자는 광고를 보고 퀴즈를 통과하면 포인트를 적립한다.
- 소비자는 10,000P 이상부터 현금 전환 신청 후보가 된다.
- MVP cash-out은 관리자 수동 승인·수동 계좌 이체를 전제로 설계되어 있다.
- 포인트 유효기간은 12개월이며, 미사용 포인트 소멸과 브레이키지는 외부 자문이 필요한 회계·세무 쟁점이다.
- 파트너는 포인트를 받지 않고, 확정 거래의 monthly close 이후 현금으로 직접 정산받는 구조다.
- 파트너 정산 귀속은 `advertisers.partner_id`에 고정하며, `partner_settlements` actual mutation은 아직 false다.

---

## 4. 법무/세무/결제 리스크 매트릭스

| issue_id | 영역 | 쟁점 | 현재 AdMe 설계와의 관련성 | 시스템 영향 가능성 | 현재 상태 | 외부 자문 질문 | actual open 전 blocker 여부 |
|---|---|---|---|---|---|---|---|
| EFTA-001 | 전자금융거래법 | 선불전자지급수단 해당 여부 | 1P=1원, 광고주 선납, 소비자 현금 전환 구조 | reward open, cash-out, 잔액 관리, 이용약관 | requires_counsel | AdMe 포인트가 electronic financial transaction 규율상 prepaid instrument로 평가될 수 있는가? | yes |
| EFTA-002 | 전자금융거래법 | 선불업 등록 필요 여부 및 면제 기준 | 발행잔액·연간 총발행액·사용처 제한 판단 필요 | open 규모 제한, 등록/면제 증빙, 운영 한도 | undetermined | 발행잔액/연간 총발행액 기준, 등록 면제 가능성, 사용처 제한의 판단 기준은 무엇인가? | yes |
| EFTA-003 | 전자금융거래법 | 광고주 선납 후 소비자 현금 전환 구조의 법적 성격 | 광고주 예산이 소비자 포인트와 현금 전환 재원으로 연결 | 약관, 회계 분리, 지급 보증 | pending_external_legal_tax_review | 광고주 선납금과 소비자 포인트·현금 전환 청구권의 관계를 어떻게 설명해야 하는가? | yes |
| EFTA-004 | 결제/자금보호 | 선불충전금 별도관리 또는 지급보증보험 필요성 | 포인트 미사용 잔액 및 현금 전환 대기금이 존재할 수 있음 | 별도 계좌, 보증보험, 운영 정산 | requires_counsel | 별도관리, 신탁, 지급보증보험 또는 동등 조치가 필요한가? | yes |
| EFTA-005 | 결제/한도 | 1인 보유/전환 한도 또는 발행권면 한도 영향 | controlled open과 cash-out 한도 정책에 영향 | release flag, allowlist, cash-out limit | undetermined | 1인 보유액, 1회/월 전환액, 발행 단위 한도 설정이 필요한가? | yes |
| TAX-001 | 소득세 | 소비자 리워드 현금 전환액의 소득 구분 | quiz pass 보상과 현금 전환 지급 | 원천징수, 지급명세서, 사용자 고지 | undetermined | 소비자 현금 전환액은 기타소득, 경품, 마케팅 보상, 사은품 중 어디에 가까운가? | yes |
| TAX-002 | 소득세 | 기타소득/경품/마케팅 보상/사은품 구분 | 광고 인식 확인 대가인지 사은성 지급인지 판단 필요 | 약관 문구, 지급 기준, 세무 처리 | pending_external_legal_tax_review | 보상 산정 방식과 퀴즈 통과 조건이 소득 성격 판단에 어떤 영향을 주는가? | yes |
| TAX-003 | 소득세 | 원천징수 및 지급명세서 필요 여부 | cash-out actual processing 전 필수 판단 | 본인확인, 주민번호 수집 여부, 지급 프로세스 | undetermined | 원천징수, 지급명세서 제출, 본인확인 정보 수집이 필요한 기준은 무엇인가? | yes |
| TAX-004 | 소득세 | 소액 지급·월 합산·건별 지급 기준 | 10,000P cash-out 및 월별 지급 누적과 관련 | 지급 한도, 월 합산, 보류 로직 | undetermined | 건별/월별 누적 기준으로 세무 의무가 달라지는가? | yes |
| TAX-005 | 파트너 세무 | 파트너 정산금 증빙 방식 | 파트너는 포인트가 아니라 현금 직접 정산 | 세금계산서, 원천징수, 사업자 구분 | requires_counsel | 파트너별 세금계산서, 원천징수, 계약 증빙 방식은 어떻게 설계해야 하는가? | yes |
| VAT-001 | 부가가치세/법인세/회계 | 광고주 선납금 회계 처리 | 광고주 예산 충전 및 미사용분 존재 | 선수금/매출 인식, 환불, 정산 | pending_external_legal_tax_review | 광고주 선납금은 언제 매출로 인식하고 미사용분은 어떻게 처리하는가? | yes |
| VAT-002 | 부가가치세/법인세/회계 | 포인트 소멸과 브레이키지 | 12개월 유효기간 및 소멸 정책 | 약관, 회계 인식, 사용자 고지 | undetermined | 포인트 소멸분의 회계·세무 인식 시점은 무엇인가? | yes |
| PRIVACY-001 | 개인정보 | 소비 의향 정보와 개인정보의 구분 | 프로필 조건과 맞춤 광고 매칭 | privacy policy, 수집 목적, 보유기간 | requires_counsel | 소비 의향 정보 항목별 개인정보 해당성과 고지 문구는 어떻게 정리해야 하는가? | yes |
| PRIVACY-002 | 개인정보 | 계좌 실명 정보 분리 보관 및 접근 통제 | cash-out actual 시 계좌·실명 정보 필요 가능성 | 별도 저장소, 마스킹, 접근 로그 | requires_counsel | bank account data separation, 암호화, 접근권한, 보유기간 기준은 무엇인가? | yes |
| PRIVACY-003 | 개인정보 | 개인정보처리방침 필수 항목 | reward/cash-out/partner settlement로 처리 목적 확대 | privacy policy 개정 | pending_external_legal_tax_review | 처리 목적, 수집 항목, 위탁, 보유기간, 파기, 제3자 제공 없음 고지를 어떻게 구성해야 하는가? | yes |
| PRIVACY-004 | 개인정보 | 보유기간·파기·위탁·제3자 제공 없음 고지 | 결제/이체/세무 증빙 보관과 충돌 가능 | retention policy, deletion workflow | undetermined | 세법상 보관 의무와 개인정보 파기 의무를 어떻게 조화해야 하는가? | yes |
| AD-001 | 정보통신망법 광고성 정보 | 광고 수신 동의 | 소비자가 소비정보 조건을 제시해도 광고성 정보 규율 가능 | opt-in UI, consent ledger | requires_counsel | 맞춤 소비정보 전달이 광고성 정보에 해당하는지, 별도 동의가 필요한가? | yes |
| AD-002 | 정보통신망법 광고성 정보 | 수신거부/철회 처리 | 광고 수신 동의 철회 및 채널별 opt-out | profile UI, notification guard | pending_external_legal_tax_review | 수신거부 처리 기한, 기록 보관, 채널별 철회 UI 요구사항은 무엇인가? | yes |
| AD-003 | 정보통신망법 광고성 정보 | 야간 전송 제한 | 향후 Kakao/알림 발송과 관련 | send scheduler, quiet hours | undetermined | 야간 전송 제한과 예외 동의 요건은 어떻게 설계해야 하는가? | yes |
| TERMS-001 | 약관/소비자 보호 | 포인트 약관 | 적립, 사용, 현금 전환, 소멸 기준 | point terms, UI copy, CS policy | requires_counsel | 포인트 약관에 반드시 포함할 적립/사용/전환/제재 조건은 무엇인가? | yes |
| TERMS-002 | 약관/소비자 보호 | 포인트 유효기간 및 소멸 고지 | 12개월 유효기간 및 브레이키지 | 만료 알림, 약관, 회계 | pending_external_legal_tax_review | 유효기간, 소멸 예정 안내, 소멸 후 처리 고지 기준은 무엇인가? | yes |
| TERMS-003 | 약관/소비자 보호 | 부정행위 제재 및 전환 보류 | fraud engine과 cash-out 보류 정책 | hold status, appeal workflow | requires_counsel | 부정행위 판단, 지급 보류, 계정 제재, 이의제기 절차는 어떻게 약관화해야 하는가? | yes |
| TERMS-004 | 약관/소비자 보호 | 광고주 환불 및 미사용 포인트 수수료 | 광고주 선납 예산과 미사용 잔액 | advertiser terms, refund ledger | undetermined | 광고주 환불, 미사용 예산 수수료, 캠페인 중단 시 정산 기준은 무엇인가? | yes |
| PARTNER-001 | 파트너 계약 | 파트너 정산 계약 | 월말 정산과 익월 15일 수동 지급 | agreement, invoice evidence | requires_counsel | 파트너 계약서에 정산 기준, 지급일, 증빙, 세금계산서 조건을 어떻게 반영해야 하는가? | yes |
| PARTNER-002 | 파트너 계약 | 계약 해지 후 광고주 귀속 유지 | `advertisers.partner_id`를 null로 바꾸지 않음 | termination status, final settlement | pending_external_legal_tax_review | 계약 해지 후 기존 광고주 귀속 유지와 final settlement/hold 정책은 적정한가? | yes |
| PARTNER-003 | 파트너 계약 | chargeback 및 부정행위 발견 시 차감 | paid row 직접 수정 대신 next-month 차감 | settlement terms, dispute process | requires_counsel | 부정행위 사후 발견 시 차감, 증빙, 분쟁 절차를 계약에 어떻게 둬야 하는가? | yes |
| ADREVIEW-001 | 전자상거래/표시광고 | 허위·과장 광고 심사 | 광고주 소재와 퀴즈 문항의 표시 책임 | review workflow, takedown | requires_counsel | 광고주 책임과 플랫폼 사전/사후 심사권, 중단권 문구는 어떻게 설계해야 하는가? | yes |

---

## 5. 필수 검토 쟁점

### EFTA

- EFTA-001: 선불전자지급수단 해당 여부
- EFTA-002: 선불업 등록 필요 여부 및 면제 기준
- EFTA-003: 광고주가 선납하고 소비자가 현금 전환하는 구조의 법적 성격
- EFTA-004: 선불충전금 별도관리 또는 지급보증보험 필요성
- EFTA-005: 1인 보유/전환 한도 또는 발행권면 한도 영향

### TAX

- TAX-001: 소비자 리워드 현금 전환액의 소득 구분
- TAX-002: 기타소득/경품/마케팅 보상/사은품 구분
- TAX-003: 원천징수 및 지급명세서 필요 여부
- TAX-004: 소액 지급·월 합산·건별 지급 기준
- TAX-005: 파트너 정산금의 세금계산서/원천징수/증빙 방식

### PRIVACY

- PRIVACY-001: 소비 의향 정보와 개인정보의 구분
- PRIVACY-002: 계좌 실명 정보 분리 보관 및 접근 통제
- PRIVACY-003: 개인정보처리방침 필수 항목
- PRIVACY-004: 보유기간·파기·위탁·제3자 제공 없음 고지

### AD

- AD-001: 광고성 정보 수신 동의
- AD-002: 수신거부/철회 처리
- AD-003: 야간 전송 제한

### TERMS

- TERMS-001: 포인트 약관
- TERMS-002: 포인트 유효기간 및 소멸 고지
- TERMS-003: 부정행위 제재 및 전환 보류
- TERMS-004: 광고주 환불 및 미사용 포인트 수수료

### PARTNER

- PARTNER-001: 파트너 정산 계약
- PARTNER-002: 계약 해지 후 광고주 귀속 유지
- PARTNER-003: chargeback 및 부정행위 발견 시 차감

---

## 6. 외부 법무법인 질문지

1. AdMe 포인트가 전자금융거래법상 선불전자지급수단 또는 유사 규율 대상에 해당할 가능성이 있는가?
2. 광고주 선납 기반 포인트가 소비자 현금 전환 청구로 이어지는 구조에서 선불업 등록 또는 등록 면제 검토 기준은 무엇인가?
3. 발행잔액, 연간 총발행액, 1인 보유액, 사용처 제한, 환불 가능성이 판단에 어떤 영향을 주는가?
4. 선불충전금 별도관리, 지급보증보험, 신탁, 별도 계좌 관리가 필요한지 검토해 달라.
5. 포인트 약관에는 적립, 전환, 유효기간, 소멸, 부정행위, 지급 보류, 이의제기, 환불을 어떻게 적어야 하는가?
6. 광고주 선납금과 소비자 포인트/현금 전환 청구권을 약관과 회계 설명에서 어떻게 분리해야 하는가?
7. 개인정보처리방침에서 소비 의향 정보, 계좌 실명 정보, 광고 수신 동의, 위탁, 보유기간, 파기, 제3자 제공 없음 고지를 어떻게 구성해야 하는가?
8. 계좌번호·실명 정보는 cash-out request와 분리 보관해야 하는지, 암호화·마스킹·접근 로그·권한 분리 기준은 무엇인가?
9. 맞춤 소비정보 또는 광고 알림이 광고성 정보에 해당하는지, 수신 동의·철회·야간 전송 제한을 어떻게 설계해야 하는가?
10. 광고주 소재에 대한 허위·과장 광고 심사권, 게시 중단권, 광고주 책임 조항을 어떻게 둘 것인가?
11. 파트너 계약에서 정산 기준, 해지 후 귀속 유지, chargeback next month, 분쟁 절차, 세금계산서/증빙 제출 의무를 어떻게 정리해야 하는가?
12. actual reward open 전에 법무 관점에서 반드시 선행되어야 할 문서, 고지, 약관, 운영 절차 목록은 무엇인가?

---

## 7. 외부 세무사 질문지

1. 소비자 리워드 현금 전환액은 기타소득, 경품, 마케팅 보상, 사은품, 그 밖의 소득 중 어떤 검토 범주에 놓아야 하는가?
2. 원천징수 및 지급명세서 제출 필요 여부는 건별 지급액, 월 합산액, 연간 합산액, 지급 성격에 따라 어떻게 달라지는가?
3. 10,000P 이상 cash-out 신청 구조에서 소액 지급 기준과 월 합산 기준을 어떻게 적용해야 하는가?
4. 세무 처리를 위해 주민등록번호 등 고유식별정보 수집이 필요한 상황이 있는지, 필요한 경우 개인정보 보호 요건은 무엇인가?
5. 광고주 선납금은 선수금, 매출, 보증금 등 어떤 회계 처리 후보가 있으며 매출 인식 시점은 무엇인가?
6. 미사용 포인트, 포인트 소멸, 브레이키지, 광고주 환불은 부가가치세/법인세/회계상 어떻게 검토해야 하는가?
7. 파트너 정산금은 사업자/개인 파트너 유형별로 세금계산서, 원천징수, 기타 증빙을 어떻게 받아야 하는가?
8. chargeback next month 또는 부정행위 차감은 세금계산서 수정, 정산서 조정, 회계 처리에 어떤 영향을 주는가?
9. cash-out 및 partner settlement audit trail에 필요한 최소 증빙 항목은 무엇인가?
10. actual open 전 세무 관점에서 반드시 구현되어야 하는 지급 보류, 합산, 증빙, 보관, 신고 절차는 무엇인가?

---

## 8. actual open 전 필수 승인 조건

- 외부 법무법인 검토 결과 수령 및 owner 승인
- 외부 세무사 검토 결과 수령 및 owner 승인
- electronic financial transaction / prepaid 관련 risk disposition 기록
- prepaid registration decision status 확정 또는 별도 owner risk acceptance 기록
- prepaid float safeguarding 필요 여부 및 실행 계획 확정
- consumer reward tax treatment 및 withholding decision 확정
- partner settlement tax evidence policy 확정
- privacy policy, point terms, advertiser terms, partner agreement 개정안 확정
- bank account data separation 설계 승인
- commercial ad consent, opt-out, night-send policy 승인
- actual reward open, cash-out actual implementation, partner settlement actual implementation에 대한 별도 명시 승인

---

## 9. 이번 Stage에서 하지 않는 것

- Stage 3-E-Controlled-Open-Execution 수행
- reward open flag true 전환
- kill switch false 전환
- controlled allowlist active true 전환
- allowlist 실제 user_id/campaign_id 반영
- Production reward actual mutation
- Production point_ledger INSERT/UPDATE/DELETE
- Production campaign budget 차감
- Production users balance 변경
- Production ad_views reward mutation
- Production cash_redemption_requests mutation
- Production partner_settlements mutation
- cash-out actual processing
- partner settlement actual processing
- monthly settlement batch 구현
- partner payout action 구현
- DB migration 추가
- Supabase db push/reset/repair
- paid update trigger migration
- chargeback actual mutation
- quiz_answer 또는 정답 암시 값 노출
- RLS 완화 또는 service role key client 노출
- OAuth secret/code/token 기록
- bank account raw data, full email, provider raw id 노출
- 법률·세무 결론 확정 표시

---

## 10. 완료 기준

- Stage 3-H SSOT 추가: `apps/web/src/lib/compliance/stage3h-legal-tax-payment-compliance.ts`
- Stage 3-H 문서 추가: `docs/adme/stage-3-h-legal-tax-payment-compliance-review.md`
- `product-policy-current.md`, `stage-roadmap-current.md`, `adme-decision-log.md` 갱신
- `/admin/compliance-preflight` 구현
- `/admin/reward-preflight`, `/admin/diagnostics` Stage 3-H marker 연결
- `verify:stage3h-compliance-review` 추가 및 PASS
- public route에 `stage3H`, `Legal / Tax / Payment Compliance Review`, `PrepaidPaymentInstrumentRiskStatus`, `ConsumerWithholdingDecisionStatus` 비노출
- dangerous final approval marker 또는 확정 면제 marker 없음
- actual reward open is blocked 상태 유지
- no DB migration 상태 유지
- Production reward/cash-out/partner settlement mutation=false 유지
