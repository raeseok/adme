"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  STAGE3Q_DEMO_SCENARIOS,
  STAGE3Q_ELIGIBILITY_LABELS,
  STAGE3Q_MINIMUM_REDEMPTION_AMOUNT,
  STAGE3Q_STATUS_LABELS,
  formatStage3QPoints,
  getStage3QScenario,
  type Stage3QRequestStatus,
} from "@/lib/rewards/stage3q-cash-redemption-demo-content";

export function ConsumerCashRedemptionDemo({
  initialScenarioId,
}: {
  initialScenarioId?: string;
}) {
  const [scenarioId, setScenarioId] = useState(
    initialScenarioId ?? STAGE3Q_DEMO_SCENARIOS[0].id,
  );
  const scenario = getStage3QScenario(scenarioId);
  const [step, setStep] = useState(0);

  const timeline = useMemo<Stage3QRequestStatus[]>(() => {
    return [scenario.initialStatus, ...scenario.path.slice(0, step)];
  }, [scenario, step]);
  const currentStatus = timeline[timeline.length - 1];
  const canAdvance = step < scenario.path.length;
  const canSubmit = scenario.initialStatus !== "ineligible";

  function chooseScenario(nextScenarioId: string) {
    setScenarioId(nextScenarioId);
    setStep(0);
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-950">
        <p className="font-semibold">ADME_STAGE_3_Q_CASH_REDEMPTION_DEMO</p>
        <p className="mt-1 text-base font-semibold">현금전환 시연 · Sandbox</p>
        <p className="mt-2">
          투자자 시연용 Sandbox입니다. 실제 포인트는 차감되지 않습니다. 실제
          계좌이체는 실행되지 않습니다.
        </p>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        {STAGE3Q_DEMO_SCENARIOS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => chooseScenario(item.id)}
            className={`rounded-xl border px-4 py-3 text-left text-sm transition ${
              item.id === scenario.id
                ? "border-violet-300 bg-violet-50 text-violet-950"
                : "border-zinc-200 bg-white text-zinc-700 hover:border-violet-200"
            }`}
          >
            <span className="block font-semibold">{item.title}</span>
            <span className="mt-1 block text-xs">{item.consumerMessage}</span>
          </button>
        ))}
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <Metric label="보유 포인트" value={formatStage3QPoints(scenario.balance)} />
        <Metric
          label="최소 전환 기준"
          value={formatStage3QPoints(STAGE3Q_MINIMUM_REDEMPTION_AMOUNT)}
        />
        <Metric
          label="신청 금액"
          value={formatStage3QPoints(scenario.requestedAmount)}
        />
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white px-4 py-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-zinc-900">신청 가능 여부</p>
            <p className="mt-1 text-sm text-zinc-600">
              {STAGE3Q_ELIGIBILITY_LABELS[scenario.eligibilityResult]}
            </p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              canSubmit
                ? "bg-emerald-100 text-emerald-800"
                : "bg-amber-100 text-amber-800"
            }`}
          >
            {canSubmit ? "신청 가능" : "제출 불가"}
          </span>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        {scenario.preconditions.map((item) => (
          <div
            key={item.label}
            className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm"
          >
            <p className="font-semibold text-zinc-900">{item.label}</p>
            <p className={item.ok ? "text-emerald-700" : "text-amber-700"}>
              {item.status}
            </p>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white px-4 py-4">
        <p className="font-semibold text-zinc-900">상태 타임라인</p>
        <ol className="mt-3 space-y-2 text-sm">
          {timeline.map((status, index) => (
            <li
              key={`${status}-${index}`}
              className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2"
            >
              {index + 1}. {STAGE3Q_STATUS_LABELS[status]}
            </li>
          ))}
        </ol>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setStep((value) => Math.min(value + 1, scenario.path.length))}
            disabled={!canAdvance}
            className="rounded-lg bg-violet-700 px-4 py-2 text-sm font-semibold text-white disabled:bg-zinc-300"
          >
            다음 단계 보기
          </button>
          <button
            type="button"
            onClick={() => setStep(0)}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-800"
          >
            Reset Demo
          </button>
        </div>
        <p className="mt-3 text-xs text-zinc-500">
          현재 상태: {STAGE3Q_STATUS_LABELS[currentStatus]} · 요청 reference:{" "}
          {scenario.requestReference}
        </p>
      </section>

      <Link
        href={`/consumer/cash-redemption/${scenario.id}`}
        className="inline-block rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-800"
      >
        이 신청 상세 보기
      </Link>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white px-4 py-3">
      <p className="text-xs font-medium text-zinc-500">{label}</p>
      <p className="mt-1 text-lg font-bold text-zinc-900">{value}</p>
    </div>
  );
}
