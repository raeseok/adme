import { ShellCard } from "@/components/ShellCard";
import { getStage3JPrepaidThresholdMonitoringArchitectureState } from "@/lib/compliance/stage3j-prepaid-threshold-monitoring-architecture";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function PrepaidThresholdPreflightPage() {
  const thresholdArchitecture =
    getStage3JPrepaidThresholdMonitoringArchitectureState();

  return (
    <ShellCard title="Prepaid Threshold Monitoring Architecture">
      <p className="rounded-lg bg-blue-50 px-3 py-2 text-sm font-medium text-blue-900">
        Threshold monitoring architecture is designed
      </p>
      <p className="mt-2 text-sm text-zinc-600">
        This admin-only page is a read-only placeholder. It does not read actual
        DB threshold values, calculate production issuance, execute reward open,
        or create database migrations.
      </p>
      <p className="mt-2 text-sm text-zinc-600">
        <Link
          href="/admin/compliance-preflight"
          className="font-medium text-blue-600 hover:text-blue-800"
        >
          Compliance preflight 상세 →
        </Link>
      </p>

      <section className="mt-4 grid gap-3 text-sm md:grid-cols-2">
        <div className="rounded-lg border border-zinc-200 bg-white px-3 py-3">
          <p className="font-medium text-zinc-900">
            Quarter-end outstanding balance limit
          </p>
          <p className="mt-1 font-mono text-zinc-700">
            {thresholdArchitecture.stage3JQuarterEndOutstandingBalanceLimitKrw.toLocaleString(
              "en-US",
            )}{" "}
            KRW
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white px-3 py-3">
          <p className="font-medium text-zinc-900">Annual total issued limit</p>
          <p className="mt-1 font-mono text-zinc-700">
            {thresholdArchitecture.stage3JAnnualTotalIssuedLimitKrw.toLocaleString(
              "en-US",
            )}{" "}
            KRW
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white px-3 py-3">
          <p className="font-medium text-zinc-900">Warning ratio</p>
          <p className="mt-1 font-mono text-zinc-700">
            {thresholdArchitecture.stage3JWarningRatio}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white px-3 py-3">
          <p className="font-medium text-zinc-900">Hard stop ratio</p>
          <p className="mt-1 font-mono text-zinc-700">
            {thresholdArchitecture.stage3JHardStopRatio}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white px-3 py-3">
          <p className="font-medium text-zinc-900">Runtime monitoring</p>
          <p className="mt-1 font-mono text-zinc-700">
            {String(
              thresholdArchitecture.stage3JThresholdRuntimeMonitoringImplemented,
            )}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white px-3 py-3">
          <p className="font-medium text-zinc-900">DB migration</p>
          <p className="mt-1 font-mono text-zinc-700">
            {String(thresholdArchitecture.stage3JThresholdDbMigrationImplemented)}
          </p>
        </div>
      </section>

      <section
        aria-label="Stage 3-J prepaid threshold monitoring architecture markers"
        className="mt-4 space-y-1 rounded-lg border border-dashed border-blue-500 bg-blue-50 px-3 py-3 font-mono text-xs text-blue-950"
      >
        <p className="font-sans text-sm font-semibold">
          Prepaid Threshold Monitoring Architecture
        </p>
        <p className="font-sans text-sm">
          Threshold monitoring architecture is designed
        </p>
        <p className="font-sans text-sm">
          Runtime threshold monitoring is not implemented
        </p>
        <p className="font-sans text-sm">
          Actual production threshold values are not available
        </p>
        <p className="font-sans text-sm">Calculation source is not finalized</p>
        <p className="font-sans text-sm">Threshold unknown blocks issuance</p>
        <p className="font-sans text-sm">Hard stop blocks issuance</p>
        <p className="font-sans text-sm">
          Threshold exceeded switches to registration track
        </p>
        <p className="font-sans text-sm">
          Actual reward open remains blocked
        </p>
        <p className="font-sans text-sm">No production reward mutation</p>
        <p className="font-sans text-sm">No DB migration in Stage 3-J</p>
        {Object.entries(thresholdArchitecture).map(([key, value]) => (
          <p key={key}>
            {key}={String(value)}
          </p>
        ))}
      </section>
    </ShellCard>
  );
}
