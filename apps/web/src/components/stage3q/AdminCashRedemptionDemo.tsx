"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  STAGE3Q_DEMO_SCENARIOS,
  STAGE3Q_STATUS_LABELS,
  formatStage3QPoints,
  getStage3QScenario,
  type Stage3QRequestStatus,
} from "@/lib/rewards/stage3q-cash-redemption-demo-content";

const ADMIN_ACTIONS: Array<{
  label: string;
  nextStatus: Stage3QRequestStatus;
  note: string;
}> = [
  { label: "검토 시작", nextStatus: "under_review", note: "review_started" },
  { label: "보류", nextStatus: "on_hold", note: "placed_on_hold" },
  { label: "승인", nextStatus: "approved", note: "approved" },
  { label: "반려", nextStatus: "rejected", note: "rejected" },
  { label: "처리 시작", nextStatus: "processing", note: "processing_started" },
  { label: "데모 완료", nextStatus: "demo_completed", note: "demo_completed" },
];

export function AdminCashRedemptionDemo({
  initialScenarioId,
}: {
  initialScenarioId?: string;
}) {
  const [scenarioId, setScenarioId] = useState(
    initialScenarioId ?? STAGE3Q_DEMO_SCENARIOS[0].id,
  );
  const scenario = getStage3QScenario(scenarioId);
  const [events, setEvents] = useState<Stage3QRequestStatus[]>([
    scenario.initialStatus,
  ]);
  const currentStatus = events[events.length - 1];
  const eventRows = useMemo(
    () =>
      events.map((status, index) => ({
        id: `${scenario.requestReference}-${index}`,
        status,
        eventType: index === 0 ? "request_loaded" : status,
      })),
    [events, scenario.requestReference],
  );

  function chooseScenario(nextScenarioId: string) {
    const next = getStage3QScenario(nextScenarioId);
    setScenarioId(next.id);
    setEvents([next.initialStatus]);
  }

  function applyAction(nextStatus: Stage3QRequestStatus) {
    setEvents((value) => [...value, nextStatus]);
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-4 text-sm text-sky-950">
        <p className="font-semibold">ADME_STAGE_3_Q_ADMIN_CASH_REDEMPTION_DEMO</p>
        <p className="mt-1 text-base font-semibold">
          Cash Redemption Demo Operations
        </p>
        <p className="mt-2">
          Sandbox requests only · Production DB mutation: DISABLED · Actual
          payout: DISABLED · Demo reset: AVAILABLE
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
                ? "border-sky-300 bg-sky-50 text-sky-950"
                : "border-zinc-200 bg-white text-zinc-700 hover:border-sky-200"
            }`}
          >
            <span className="block font-semibold">{item.title}</span>
            <span className="mt-1 block text-xs">{item.adminSummary}</span>
          </button>
        ))}
      </section>

      <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
        <div className="grid gap-2 border-b border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-semibold text-zinc-700 sm:grid-cols-5">
          <span>신청 reference</span>
          <span>소비자</span>
          <span>요청 금액</span>
          <span>현재 상태</span>
          <span>Sandbox</span>
        </div>
        <div className="grid gap-2 px-4 py-3 text-sm text-zinc-800 sm:grid-cols-5">
          <span>{scenario.requestReference}</span>
          <span>{scenario.maskedConsumer}</span>
          <span>{formatStage3QPoints(scenario.requestedAmount)}</span>
          <span>{STAGE3Q_STATUS_LABELS[currentStatus]}</span>
          <span className="font-semibold text-emerald-700">YES</span>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white px-4 py-4">
        <p className="font-semibold text-zinc-900">관리자 가능한 다음 동작</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {ADMIN_ACTIONS.map((action) => (
            <button
              key={action.note}
              type="button"
              onClick={() => applyAction(action.nextStatus)}
              className="rounded-lg bg-sky-700 px-4 py-2 text-sm font-semibold text-white"
            >
              {action.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setEvents([scenario.initialStatus])}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-800"
          >
            Reset Demo
          </button>
        </div>
        <p className="mt-3 text-xs text-zinc-500">
          자유 입력 메모 대신 안전한 note_code만 사용합니다. 실제 계좌번호,
          예금주명, 세금 계산값은 표시하지 않습니다.
        </p>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white px-4 py-4">
        <p className="font-semibold text-zinc-900">상태 이력</p>
        <ol className="mt-3 space-y-2 text-sm">
          {eventRows.map((event, index) => (
            <li
              key={event.id}
              className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2"
            >
              {index + 1}. {STAGE3Q_STATUS_LABELS[event.status]} · note_code:{" "}
              {event.eventType}
            </li>
          ))}
        </ol>
      </section>

      <section className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-950">
        <p className="font-semibold">Sandbox safety</p>
        <p>point ledger 미변경 · users balance 미변경 · 실제 송금 미실행</p>
      </section>

      <Link
        href={`/admin/cash-redemption-demo/${scenario.id}`}
        className="inline-block rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-800"
      >
        관리자 상세 보기
      </Link>
    </div>
  );
}
