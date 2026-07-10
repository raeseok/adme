import { ShellCard } from "@/components/ShellCard";
import {
  STAGE3O_EXTERNAL_REVIEW_QUESTIONS,
  STAGE3O_QUESTION_DOMAINS,
  getStage3OExternalReviewQuestionPackState,
  getStage3OQuestionsByDomain,
} from "@/lib/compliance/stage3o-external-review-question-pack";
import {
  STAGE3P_VISIBLE_MARKERS,
  getStage3PDevOnlyKycTaxTermsSchemaFoundationState,
} from "@/lib/compliance/stage3p-dev-only-kyc-tax-terms-schema-foundation";
import Link from "next/link";

export const dynamic = "force-dynamic";

const domainLabels = {
  legal: "Legal",
  tax: "Tax",
  privacy: "Privacy",
  security: "Security",
  identity_provider: "Identity Provider",
  bank_provider: "Bank / Account Provider",
  business_owner: "Business Owner",
  engineering: "Engineering",
} as const;

function decisionTiming(question: (typeof STAGE3O_EXTERNAL_REVIEW_QUESTIONS)[number]) {
  return [
    question.requiredBeforeDevMigration && "dev migration",
    question.requiredBeforeProductionMigration && "production migration",
    question.requiredBeforePersonalDataCollection && "personal data collection",
    question.requiredBeforeProviderIntegration && "provider integration",
    question.requiredBeforeCashOutExecution && "cash-out execution",
  ]
    .filter(Boolean)
    .join(", ");
}

export default function ExternalReviewQuestionPackPage() {
  const state = getStage3OExternalReviewQuestionPackState();
  const stage3P = getStage3PDevOnlyKycTaxTermsSchemaFoundationState();

  return (
    <ShellCard title="External Review Question Pack">
      <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-900">
        External questions are prepared, but not sent. Responses are not
        received. Migration implementation remains blocked.
      </p>
      <p className="mt-2 text-sm text-zinc-600">
        This admin-only page renders a read-only Stage 3-O question registry for
        external legal, tax, privacy, security, provider, business owner, and
        engineering review. It does not send email, approve responses, approve
        migrations, collect personal data, store bank data, or process cash-out.
      </p>
      <p className="mt-2 text-sm text-zinc-600">
        <Link
          href="/admin/kyc-tax-terms-implementation-approval"
          className="font-medium text-blue-600 hover:text-blue-800"
        >
          Stage 3-N implementation approval gate 상세 →
        </Link>
      </p>
      <p className="mt-2 text-sm text-zinc-600">
        <Link
          href="/admin/dev-kyc-tax-terms-schema-foundation"
          className="font-medium text-blue-600 hover:text-blue-800"
        >
          Stage 3-P dev schema foundation 상세 →
        </Link>
      </p>

      <section className="mt-4 grid gap-3 text-sm md:grid-cols-4">
        <div className="rounded-lg border border-zinc-200 bg-white px-3 py-3">
          <p className="font-medium text-zinc-900">Overall approval status</p>
          <p className="mt-1 font-mono text-red-700">
            {state.overallApprovalStatus}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white px-3 py-3">
          <p className="font-medium text-zinc-900">Total questions</p>
          <p className="mt-1 font-mono text-zinc-700">
            {state.totalQuestionCount}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white px-3 py-3">
          <p className="font-medium text-zinc-900">Explicit blockers</p>
          <p className="mt-1 font-mono text-zinc-700">
            {state.explicitBlockerCount}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white px-3 py-3">
          <p className="font-medium text-zinc-900">Approval blocking items</p>
          <p className="mt-1 font-mono text-zinc-700">
            {state.approvalBlockingItemCount}
          </p>
        </div>
      </section>

      <section
        aria-label="Stage 3-O external review question pack markers"
        className="mt-4 space-y-1 rounded-lg border border-dashed border-red-500 bg-red-50 px-3 py-3 font-mono text-xs text-red-950"
      >
        <p className="font-sans text-sm font-semibold">
          ADME_STAGE_3_O_EXTERNAL_REVIEW_QUESTION_PACK
        </p>
        <p className="font-sans text-sm">External Review Question Pack</p>
        <p className="font-sans text-sm">Questions prepared: YES</p>
        <p className="font-sans text-sm">Questions sent: NO</p>
        <p className="font-sans text-sm">Responses received: NO</p>
        <p className="font-sans text-sm">Migration implementation: BLOCKED</p>
        <p className="font-sans text-sm">Production mutation: DISABLED</p>
        <p className="font-sans text-sm">No personal data collection</p>
        <p className="font-sans text-sm">No actual cash-out processing</p>
        {Object.entries(state).map(([key, value]) => (
          <p key={key}>
            {key}={String(value)}
          </p>
        ))}
      </section>

      <section
        aria-label="Stage 3-P dev KYC tax terms schema foundation summary markers"
        className="mt-4 space-y-1 rounded-lg border border-dashed border-emerald-500 bg-emerald-50 px-3 py-3 font-mono text-xs text-emerald-950"
      >
        {STAGE3P_VISIBLE_MARKERS.map((marker) => (
          <p key={marker} className="font-sans text-sm">
            {marker}
          </p>
        ))}
        {Object.entries(stage3P).map(([key, value]) => (
          <p key={key}>
            {key}={String(value)}
          </p>
        ))}
      </section>

      <section className="mt-4 grid gap-3 text-sm md:grid-cols-3">
        <div className="rounded-lg border border-zinc-200 bg-white px-3 py-3">
          <p className="font-medium text-zinc-900">Unresolved evidence</p>
          <p className="mt-1 font-mono text-zinc-700">
            {state.unresolvedEvidenceCount}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white px-3 py-3">
          <p className="font-medium text-zinc-900">Provider questions</p>
          <p className="mt-1 font-mono text-zinc-700">
            {state.providerQuestionCount}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white px-3 py-3">
          <p className="font-medium text-zinc-900">Operator decisions</p>
          <p className="mt-1 font-mono text-zinc-700">
            {state.operatorDecisionCount}
          </p>
        </div>
      </section>

      {STAGE3O_QUESTION_DOMAINS.map((domain) => {
        const questions = getStage3OQuestionsByDomain(domain);

        return (
          <section
            key={domain}
            className="mt-4 rounded-lg border border-zinc-200 bg-white px-3 py-3 text-sm"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-base font-semibold text-zinc-900">
                {domainLabels[domain]}
              </h2>
              <p className="font-mono text-xs text-zinc-500">
                questionCount={questions.length}
              </p>
            </div>
            <div className="mt-3 space-y-3">
              {questions.map((question) => (
                <article
                  key={question.id}
                  className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-3"
                >
                  <p className="font-mono text-xs text-zinc-500">
                    {question.id}
                  </p>
                  <h3 className="mt-1 text-sm font-semibold text-zinc-900">
                    {question.title}
                  </h3>
                  <div className="mt-2 grid gap-2 font-mono text-xs text-zinc-700 md:grid-cols-2">
                    <p>requiredReviewer={question.requiredReviewer}</p>
                    <p>status={question.status}</p>
                    <p>evidenceStatus={question.evidenceStatus}</p>
                    <p>
                      sourceStage3NItemIds=
                      {question.sourceStage3NItemIds.join(",")}
                    </p>
                    <p>decisionTiming={decisionTiming(question)}</p>
                    <p>externalReviewReady=true</p>
                    <p>externalQuestionsSent=false</p>
                    <p>externalResponsesReceived=false</p>
                  </div>
                  <p className="mt-2 text-zinc-700">
                    Decision needed: {question.decisionNeeded}
                  </p>
                  <div className="mt-2 grid gap-2 text-xs text-zinc-700 md:grid-cols-3">
                    <p>Schema impact: {question.schemaImpact}</p>
                    <p>UI impact: {question.uiImpact}</p>
                    <p>Operation impact: {question.operationImpact}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        );
      })}
    </ShellCard>
  );
}
