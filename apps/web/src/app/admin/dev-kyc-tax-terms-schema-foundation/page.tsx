import { ShellCard } from "@/components/ShellCard";
import {
  STAGE3P_DB_OBJECTS,
  STAGE3P_MIGRATION_FILENAME,
  STAGE3P_PROJECT_REFS,
  STAGE3P_RLS_SUMMARY,
  STAGE3P_VISIBLE_MARKERS,
  getStage3PDevOnlyKycTaxTermsSchemaFoundationState,
} from "@/lib/compliance/stage3p-dev-only-kyc-tax-terms-schema-foundation";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function DevKycTaxTermsSchemaFoundationPage() {
  const state = getStage3PDevOnlyKycTaxTermsSchemaFoundationState();

  return (
    <ShellCard title="Stage 3-P Dev KYC / Tax / Terms Schema Foundation">
      <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-900">
        Dev-only provider-neutral schema foundation is business-owner approved,
        applied to the dev Supabase project, and verified. Production migration,
        personal data collection, tax calculation, and actual cash-out remain
        blocked.
      </p>
      <p className="mt-2 text-sm text-zinc-600">
        This admin-only page is read-only. It has no approval button, provider
        input, personal-data input, bank-account input, or mutation action.
      </p>
      <p className="mt-2 text-sm text-zinc-600">
        <Link
          href="/admin/external-review-question-pack"
          className="font-medium text-blue-600 hover:text-blue-800"
        >
          Stage 3-O external review question pack 상세 →
        </Link>
      </p>

      <section className="mt-4 grid gap-3 text-sm md:grid-cols-4">
        <div className="rounded-lg border border-zinc-200 bg-white px-3 py-3">
          <p className="font-medium text-zinc-900">Business owner dev approval</p>
          <p className="mt-1 font-mono text-emerald-700">GRANTED</p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white px-3 py-3">
          <p className="font-medium text-zinc-900">External review</p>
          <p className="mt-1 font-mono text-amber-700">
            DEFERRED UNTIL PRE-LAUNCH
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white px-3 py-3">
          <p className="font-medium text-zinc-900">Dev migration</p>
          <p className="mt-1 font-mono text-emerald-700">APPLIED</p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white px-3 py-3">
          <p className="font-medium text-zinc-900">Production migration</p>
          <p className="mt-1 font-mono text-red-700">BLOCKED</p>
        </div>
      </section>

      <section
        aria-label="Stage 3-P dev KYC tax terms schema foundation markers"
        className="mt-4 space-y-1 rounded-lg border border-dashed border-emerald-500 bg-emerald-50 px-3 py-3 font-mono text-xs text-emerald-950"
      >
        {STAGE3P_VISIBLE_MARKERS.map((marker) => (
          <p key={marker} className="font-sans text-sm">
            {marker}
          </p>
        ))}
        {Object.entries(state).map(([key, value]) => (
          <p key={key}>
            {key}={String(value)}
          </p>
        ))}
      </section>

      <section className="mt-4 rounded-lg border border-zinc-200 bg-white px-3 py-3 text-sm">
        <p className="font-semibold text-zinc-900">DB object inventory</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-zinc-700">
          {STAGE3P_DB_OBJECTS.map((objectName) => (
            <li key={objectName} className="font-mono">
              {objectName}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-4 rounded-lg border border-zinc-200 bg-white px-3 py-3 text-sm">
        <p className="font-semibold text-zinc-900">Dev / Production separation</p>
        <div className="mt-2 space-y-1 font-mono text-xs text-zinc-700">
          <p>devSupabaseProjectRef={STAGE3P_PROJECT_REFS.devSupabaseProjectRef}</p>
          <p>prodSupabaseProjectRef={STAGE3P_PROJECT_REFS.prodSupabaseProjectRef}</p>
          <p>migrationFilename={STAGE3P_MIGRATION_FILENAME}</p>
          <p>devMigrationApplied=true</p>
          <p>devDbVerificationPassed=true</p>
          <p>productionDbMutationExecuted=false</p>
          <p>productionMigrationBlocked=true</p>
        </div>
      </section>

      <section className="mt-4 rounded-lg border border-zinc-200 bg-white px-3 py-3 text-sm">
        <p className="font-semibold text-zinc-900">RLS summary</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-zinc-700">
          {STAGE3P_RLS_SUMMARY.map((row) => (
            <li key={row.principal}>
              <span className="font-mono">{row.principal}</span>: {row.access};
              write={row.writeAccess}
            </li>
          ))}
        </ul>
      </section>
    </ShellCard>
  );
}
