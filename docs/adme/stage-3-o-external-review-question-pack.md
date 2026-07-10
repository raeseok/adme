# AdMe External Legal / Tax / Privacy / Security Review Question Pack

Status: READY FOR REVIEW REQUEST PREPARATION ONLY

This package converts the KYC, tax, terms, identity, bank, audit, and cash-out blockers identified in the prior approval gate into structured questions for external reviewers and future provider candidates. It is not legal advice, tax advice, provider selection, database implementation, personal data collection, or cash-out execution.

## Service Context

AdMe is designed as an advertising reward service. A consumer may view an advertisement, pass a quiz, and earn points. The current business design treats `1P = 1 KRW` and sets a minimum cash conversion threshold of `10,000P`. Reward funding is expected to come from advertiser prepayment, but actual cash-out is not open.

Future cash conversion may require identity verification and confirmation that the payout account belongs to the same user. AdMe intends to separate advertising preference and ad consumption data from cash-out identity, bank, and tax data. The preferred direction is to keep raw identity and bank data with qualified providers where possible and store only minimal references or status metadata in AdMe.

Current implementation limits:

- No actual cash-out processing is implemented.
- No actual personal data collection for cash-out is implemented.
- No identity provider or bank provider is selected.
- No tax classification, withholding rule, tax rate, or reporting threshold is declared.
- Production mutation remains disabled.
- No DB migration is created or approved by this package.

## Why These Questions Matter

External answers may change future database schema, RLS, audit logs, admin UI, consumer notices, retention policies, provider contracts, and operational runbooks. Until those answers and owner decisions are recorded, implementation remains blocked.

## Machine-Readable State

- `stage3OQuestionPackComplete=true`
- `readOnlyQuestionPack=true`
- `externalQuestionsPrepared=true`
- `externalQuestionsSent=false`
- `externalResponsesReceived=false`
- `legalReviewCompleted=false`
- `taxReviewCompleted=false`
- `privacyReviewCompleted=false`
- `securityReviewCompleted=false`
- `identityProviderSelected=false`
- `bankProviderSelected=false`
- `businessOwnerDecisionsCompleted=false`
- `engineeringDecisionsCompleted=false`
- `devMigrationApprovalGranted=false`
- `productionMigrationApprovalGranted=false`
- `migrationImplemented=false`
- `migrationFileCreated=false`
- `supabaseDbPushExecuted=false`
- `actualPersonalDataCollectionImplemented=false`
- `actualCashOutProcessingAllowed=false`
- `productionMutation=false`
- `legalConclusionDeclared=false`
- `overallApprovalStatus=blocked`

## Count Taxonomy

The older `blockerCount=18` remains a compatibility marker meaning Stage 3-N items whose `blocker=true`. Stage 3-O uses clearer labels:

- `totalGateItemCount`: all Stage 3-N gate items.
- `explicitBlockerCount`: Stage 3-N items with `itemDecision=blocker`.
- `approvalBlockingItemCount`: all Stage 3-N items currently blocking overall approval.
- `approvedDesignPrincipleCount`: Stage 3-N items approved only as design principles.
- `unresolvedEvidenceCount`: Stage 3-N items with `evidenceStatus=unresolved`.
- `externalReviewQuestionCount`: legal, tax, privacy, and security questions.
- `providerQuestionCount`: identity provider and bank provider questions.
- `operatorDecisionCount`: business owner decision questions.
- `engineeringDecisionCount`: engineering decision questions.

Expected Stage 3-O counts from the registry:

- totalQuestionCount: 117
- legalQuestionCount: 16
- taxQuestionCount: 14
- privacyQuestionCount: 17
- securityQuestionCount: 15
- identityProviderQuestionCount: 19
- bankProviderQuestionCount: 16
- businessOwnerDecisionCount: 10
- engineeringDecisionCount: 10
- explicitBlockerCount: 9
- approvalBlockingItemCount: 18
- unresolvedEvidenceCount: 3

## Question Documents

- Legal: `docs/adme/reviews/stage-3-o-legal-review-questions.md`
- Tax: `docs/adme/reviews/stage-3-o-tax-review-questions.md`
- Privacy: `docs/adme/reviews/stage-3-o-privacy-review-questions.md`
- Security: `docs/adme/reviews/stage-3-o-security-review-questions.md`
- Identity provider: `docs/adme/reviews/stage-3-o-identity-provider-questions.md`
- Bank provider: `docs/adme/reviews/stage-3-o-bank-provider-questions.md`
- Business owner decisions: `docs/adme/reviews/stage-3-o-business-owner-decisions.md`
- Engineering decisions: `docs/adme/reviews/stage-3-o-engineering-decisions.md`
- Response template: `docs/adme/reviews/stage-3-o-review-response-template.md`

## Internal Traceability

Each question in `apps/web/src/lib/compliance/stage3o-external-review-question-pack.ts` links to one or more Stage 3-N item ids. The link is for internal traceability only; reviewers should answer the plain-language business, legal, tax, privacy, security, or provider question rather than relying on internal implementation jargon.

## Non-Goals

This package does not send questions externally, record external answers, approve migrations, approve personal data collection, approve provider integration, approve tax implementation, approve cash-out execution, create SQL, run Supabase commands, or mutate Production.
