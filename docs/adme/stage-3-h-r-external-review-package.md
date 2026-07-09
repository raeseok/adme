# AdMe Stage 3-H-R External Legal / Tax Review Package

작성일: 2026-07-09  
상태: **external review package and attestation prep only** - no mutation, no migration, actual open blocked

관련: [stage-3-h-legal-tax-payment-compliance-review.md](./stage-3-h-legal-tax-payment-compliance-review.md) · [product-policy-current.md](./product-policy-current.md) · [external-review/legal-counsel-questionnaire.md](./external-review/legal-counsel-questionnaire.md) · [external-review/tax-accountant-questionnaire.md](./external-review/tax-accountant-questionnaire.md) · [external-review/external-counsel-attestation-template.md](./external-review/external-counsel-attestation-template.md)

---

## 1. 문서 목적

Stage 3-H-R은 Stage 3-H Legal / Tax / Payment Compliance Review Gate 완료 이후, 외부 법무법인과 세무사에게 전달할 검토 패키지를 정리하고 향후 회신을 repo에 기록할 attestation template을 준비하는 단계다.

이 문서는 법률·세무 판단을 확정하지 않는다. Production reward open, cash-out actual implementation, partner settlement actual implementation, DB migration, Supabase db push는 모두 범위 밖이다.

---

## 2. 외부 검토 대상 요약

- AdMe 포인트의 전자금융거래법상 선불전자지급수단 해당 여부
- 광고주 선납금과 소비자 포인트·현금 전환 구조의 법적 성격
- 소비자 현금 전환액의 소득 구분, 원천징수, 지급명세서 필요 여부
- 소비 의향 정보, 계좌 실명 정보, 광고 수신 동의, 보유기간·파기 정책
- 포인트 약관, 현금 전환 약관, 광고주 약관, 파트너 계약
- 파트너 월 정산, 세금계산서·증빙, chargeback 및 계약 해지 후 귀속 유지

---

## 3. AdMe 사업구조 요약

- 소비자는 소비 의향 프로필을 등록한다.
- 광고주는 선납 기반으로 캠페인을 운영한다.
- 소비자는 광고를 열람하고 퀴즈를 통과하면 포인트를 적립한다.
- 포인트 표시는 `1P=1원` 기준이다.
- 소비자는 `10,000P` 이상부터 현금 전환 신청 후보가 된다.
- MVP 현금 전환은 관리자 수동 승인 및 수동 계좌이체를 전제로 한다.
- 포인트 유효기간은 12개월이다.
- 파트너는 포인트가 아니라 현금으로 월 1회 정산받는다.

---

## 4. 현재 시스템 block 상태 요약

| 항목 | 현재 상태 |
|---|---|
| actual reward open | false |
| reward kill switch | true |
| controlled allowlist active | false |
| Production reward mutation | false |
| Production point_ledger mutation | false |
| Production cash_redemption_requests mutation | false |
| Production partner_settlements mutation | false |
| DB migration | 없음 |

---

## 5. 법무법인 검토 요청서

법무법인에는 별도 질문지 [legal-counsel-questionnaire.md](./external-review/legal-counsel-questionnaire.md)를 전달한다. 핵심 검토 요청은 다음과 같다.

- AdMe 포인트의 선불전자지급수단 해당 여부와 선불업 등록·면제 판단 기준
- 광고주 선납 후 소비자가 현금 전환하는 구조의 법적 성격
- 선불충전금 별도관리, 지급보증보험, 1인 보유한도·전환한도 필요성
- 소비 의향 정보, 계좌 실명 정보, 광고성 정보 수신 동의, 개인정보 처리방침 문구
- 포인트·현금 전환·광고주·파트너 약관 및 계약 조항

---

## 6. 세무사 검토 요청서

세무사에는 별도 질문지 [tax-accountant-questionnaire.md](./external-review/tax-accountant-questionnaire.md)를 전달한다. 핵심 검토 요청은 다음과 같다.

- 소비자 현금 전환액의 소득 성격과 과세·비과세 검토 범주
- 원천징수, 지급명세서, 실명 정보 수집 필요성
- 파트너 정산금의 세무 증빙, 세금계산서, 원천징수 필요 여부
- 광고주 선납금의 매출 인식, 선수금·예수금 처리, 미사용 포인트 환불
- 포인트 소멸과 브레이키지의 법인세·부가세·회계 영향

---

## 7. 약관/개인정보 문서 검토 요청서

외부 검토자는 다음 문서 또는 초안을 기준으로 필수 문구와 운영 조건을 제안해야 한다.

- 포인트 적립, 유효기간, 소멸, 부정행위 제재, 지급 보류
- 현금 전환 신청, 관리자 승인, 수동 이체, 실패 복구, 세무 처리
- 소비 의향 정보 수집 목적, 보유기간, 파기, 위탁, 제3자 제공 여부
- 계좌 실명 정보의 분리 보관, 마스킹, 접근권한, 감사 로그
- 광고성 정보 수신 동의, 수신거부, 야간 전송 제한, 채널별 표시 의무

---

## 8. 파트너 계약 검토 요청서

파트너 계약은 다음 항목을 중심으로 검토한다.

- 수익공유 구조와 정산 산식
- 월 마감 후 익월 15일 현금 지급
- 계약 해지 후 기존 `advertisers.partner_id` 귀속 유지
- chargeback next month 방식
- 허위 광고주 등록 책임과 광고주 소재 검증 책임
- 독점구역 조항의 범위와 제한

---

## 9. 외부 검토 결과 수령 후 반영 방식

외부 검토 결과는 [external-counsel-attestation-template.md](./external-review/external-counsel-attestation-template.md)에 기록한다.

- 실제 회신 수령 전 모든 값은 pending, undetermined, not reviewed로 유지한다.
- 외부 검토 결과 문구는 원문 근거와 함께 기록한다.
- owner 승인 전 actual open allowed 값은 false로 유지한다.
- 시스템 변경, 약관 변경, 개인정보 처리방침 변경, 세무 프로세스 변경은 후속 Stage에서 별도 구현한다.

---

## 10. Stage 3-H-R에서 하지 않는 것

- Stage 3-E-Controlled-Open-Execution 수행
- reward open flag true 전환
- kill switch false 전환
- controlled allowlist active true 전환
- allowlist 실제 user_id/campaign_id 반영
- Production reward actual mutation
- Production point_ledger INSERT/UPDATE/DELETE
- Production campaign budget 차감
- Production users balance 변경
- Production ad_views mutation
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
- quiz_answer 노출
- RLS 완화 또는 service role key client 노출
- OAuth secret/code/token 기록
- bank account raw data, full email, provider raw id 노출
- 외부 검토 없이 법률·세무 확정값 기록
