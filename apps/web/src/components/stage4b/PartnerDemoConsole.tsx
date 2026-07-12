"use client";

import Link from "next/link";
import { useState } from "react";
import {
  STAGE4B_ADVERTISER_STATUS_LABELS,
  STAGE4B_BUILD_NAME,
  STAGE4B_CAMPAIGN_STATUS_LABELS,
  STAGE4B_CONTRACT_STATUS_LABELS,
  STAGE4B_SETTLEMENT_STATUS_LABELS,
} from "@/lib/partner-demo/constants";
import {
  calculateStage4BPartnerShare,
  calculateStage4BSettlement,
  formatStage4BNumber,
  formatStage4BWon,
} from "@/lib/partner-demo/calculations";
import { useStage4BPartnerDemoStore } from "@/lib/partner-demo/browser-store";
import {
  STAGE4B_DEMO_ADVERTISERS,
  STAGE4B_DEMO_PARTNER,
  STAGE4B_INSIGHTS,
} from "@/lib/partner-demo/fixtures";
import {
  getStage4BAdvertiserTotals,
  selectStage4BAdvertisers,
  selectStage4BDashboardTotals,
  selectStage4BSettlements,
} from "@/lib/partner-demo/selectors";
import type {
  Stage4BAdvertiserStatus,
  Stage4BSettlement,
  Stage4BSettlementStatus,
} from "@/lib/partner-demo/types";

type PartnerDemoConsoleProps = {
  view:
    | "home"
    | "dashboard"
    | "advertisers"
    | "advertiser-detail"
    | "settlements"
    | "settlement-detail"
    | "insights"
    | "admin-settlements"
    | "admin-settlement-detail";
  advertiserId?: string;
  settlementId?: string;
};

export function PartnerDemoConsole({
  view,
  advertiserId,
  settlementId,
}: PartnerDemoConsoleProps) {
  const { store, setStore, resetStore, mounted } = useStage4BPartnerDemoStore();
  const [resetOpen, setResetOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const advertisers = selectStage4BAdvertisers(store);
  const settlements = selectStage4BSettlements(store);
  const dashboardTotals = selectStage4BDashboardTotals(store);
  const advertiser =
    STAGE4B_DEMO_ADVERTISERS.find((item) => item.id === advertiserId) ??
    STAGE4B_DEMO_ADVERTISERS[0];
  const settlement =
    settlements.find((item) => item.id === settlementId) ?? settlements[0];

  function confirmReset() {
    resetStore();
    setResetOpen(false);
    setNotice("파트너 데모가 초기 상태로 재설정되었습니다.");
  }

  function updateSettlementStatus(id: string, status: Stage4BSettlementStatus) {
    setStore({
      ...store,
      settlementStatusById: {
        ...store.settlementStatusById,
        [id]: status,
      },
    });
    setNotice(`${STAGE4B_SETTLEMENT_STATUS_LABELS[status]} 상태로 변경되었습니다.`);
  }

  return (
    <div className="space-y-6">
      <PartnerDemoHeader mounted={mounted} onReset={() => setResetOpen(true)} />
      {notice && (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
          {notice}
        </p>
      )}
      {view === "home" && <PartnerHome totals={dashboardTotals} />}
      {view === "dashboard" && (
        <PartnerDashboard totals={dashboardTotals} settlements={settlements} />
      )}
      {view === "advertisers" && (
        <AdvertiserList
          advertisers={advertisers}
          store={store}
          setStore={setStore}
        />
      )}
      {view === "advertiser-detail" && <AdvertiserDetail advertiser={advertiser} />}
      {view === "settlements" && <SettlementList settlements={settlements} />}
      {view === "settlement-detail" && <SettlementDetail settlement={settlement} />}
      {view === "insights" && <RegionalInsights />}
      {view === "admin-settlements" && (
        <AdminSettlementList
          settlements={settlements}
          onReset={() => setResetOpen(true)}
        />
      )}
      {view === "admin-settlement-detail" && (
        <AdminSettlementDetail
          settlement={settlement}
          updateStatus={(status) => updateSettlementStatus(settlement.id, status)}
        />
      )}
      {resetOpen && (
        <ResetModal onCancel={() => setResetOpen(false)} onConfirm={confirmReset} />
      )}
    </div>
  );
}

function PartnerDemoHeader({
  mounted,
  onReset,
}: {
  mounted: boolean;
  onReset: () => void;
}) {
  return (
    <section className="rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-4 text-sm text-cyan-950">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-semibold">{STAGE4B_BUILD_NAME}</p>
          <h1 className="mt-1 text-xl font-bold">Partner Dashboard</h1>
          <p className="mt-2 font-semibold">
            Demo / Sandbox — 실제 파트너 정산·송금 없음
          </p>
          <p className="mt-1">
            Production DB mutation 없음 · 실제 계좌정보/세금 처리/개인정보 없음 ·
            정산은 월 단위 집계 demo입니다.
          </p>
        </div>
        <button type="button" onClick={onReset} className="secondary-button">
          Demo Reset
        </button>
      </div>
      <p className="mt-2 text-xs text-cyan-700">
        Demo store 상태: {mounted ? "browser store loaded" : "loading stable fixture"}
      </p>
    </section>
  );
}

function PartnerHome({
  totals,
}: {
  totals: ReturnType<typeof selectStage4BDashboardTotals>;
}) {
  return (
    <>
      <section className="rounded-2xl border border-zinc-200 bg-white px-4 py-4">
        <h2 className="text-lg font-semibold text-zinc-900">Partner Console 소개</h2>
        <p className="mt-2 text-sm text-zinc-600">
          담당 지역, 광고주 포트폴리오, 월 정산, 지역 소비 수요를 비식별 집계로 확인하는
          투자자 데모입니다.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Info label="현재 demo partner 이름" value={STAGE4B_DEMO_PARTNER.name} />
          <Info label="담당 지역" value={STAGE4B_DEMO_PARTNER.region} />
          <Info
            label="파트너 계약 상태"
            value={STAGE4B_CONTRACT_STATUS_LABELS[STAGE4B_DEMO_PARTNER.contractStatus]}
          />
          <Info label="예상 파트너 수익" value={formatStage4BWon(totals.monthPartnerShareWon)} />
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <Link href="/partner/dashboard" className="primary-link">
            Partner Dashboard 열기
          </Link>
          <Link href="/partner/advertisers" className="secondary-link">
            광고주 관리
          </Link>
          <Link href="/partner/settlements" className="secondary-link">
            정산 관리
          </Link>
          <Link href="/partner/insights" className="secondary-link">
            지역 인사이트
          </Link>
        </div>
      </section>
      <SandboxNotice />
    </>
  );
}

function PartnerDashboard({
  totals,
  settlements,
}: {
  totals: ReturnType<typeof selectStage4BDashboardTotals>;
  settlements: Stage4BSettlement[];
}) {
  return (
    <>
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="담당 광고주 수" value={formatStage4BNumber(totals.advertiserCount)} />
        <Metric label="활성 광고주 수" value={formatStage4BNumber(totals.activeAdvertiserCount)} />
        <Metric label="활성 캠페인 수" value={formatStage4BNumber(totals.activeCampaignCount)} />
        <Metric label="이번 달 광고비 소진액" value={formatStage4BWon(totals.monthSpentWon)} />
        <Metric label="이번 달 예상 파트너 수익" value={formatStage4BWon(totals.monthPartnerShareWon)} />
        <Metric label="정산 대기 금액" value={formatStage4BWon(totals.pendingSettlementWon)} />
        <Metric label="누적 지급 완료 금액" value={formatStage4BWon(totals.paidSettlementWon)} />
        <Metric label="담당 지역 상태" value={STAGE4B_DEMO_PARTNER.exclusiveRegionStatus} />
      </section>
      <section className="grid gap-4 lg:grid-cols-2">
        <BarPanel
          title="최근 6개월 광고비 소진 추이"
          rows={totals.trends.map((row) => [row.month, row.spentWon])}
        />
        <BarPanel
          title="최근 6개월 파트너 수익 추이"
          rows={totals.trends.map((row) => [row.month, row.partnerShareWon])}
        />
        <BarPanel
          title="광고주 상태 분포"
          rows={["active", "onboarding", "dormant"].map((status) => [
            STAGE4B_ADVERTISER_STATUS_LABELS[status as Stage4BAdvertiserStatus],
            STAGE4B_DEMO_ADVERTISERS.filter((advertiser) => advertiser.status === status).length,
          ])}
        />
        <BarPanel
          title="정산 상태 요약"
          rows={["pending", "approved", "paid", "cancelled"].map((status) => [
            STAGE4B_SETTLEMENT_STATUS_LABELS[status as Stage4BSettlementStatus],
            settlements.filter((settlement) => settlement.status === status).length,
          ])}
        />
      </section>
      <section className="rounded-2xl border border-zinc-200 bg-white px-4 py-4">
        <h2 className="font-semibold text-zinc-900">최근 활동 및 정산 Timeline</h2>
        <ol className="mt-3 space-y-2 text-sm">
          {settlements.flatMap((settlement) =>
            settlement.events.map((event) => (
              <li key={event.id} className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2">
                {settlement.periodLabel} · {event.label} ·{" "}
                {STAGE4B_SETTLEMENT_STATUS_LABELS[event.status]}
              </li>
            )),
          )}
        </ol>
      </section>
    </>
  );
}

function AdvertiserList({
  advertisers,
  store,
  setStore,
}: {
  advertisers: typeof STAGE4B_DEMO_ADVERTISERS;
  store: ReturnType<typeof useStage4BPartnerDemoStore>["store"];
  setStore: (store: ReturnType<typeof useStage4BPartnerDemoStore>["store"]) => void;
}) {
  const categories = ["all", ...new Set(STAGE4B_DEMO_ADVERTISERS.map((item) => item.category))];
  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-4">
        <h2 className="text-lg font-semibold text-zinc-900">담당 광고주 목록</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <label className="text-sm font-medium text-zinc-700">
            텍스트 검색
            <input
              value={store.searchQuery}
              onChange={(event) => setStore({ ...store, searchQuery: event.target.value })}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2"
              placeholder="광고주명, 업종, 지역"
            />
          </label>
          <label className="text-sm font-medium text-zinc-700">
            상태 필터
            <select
              value={store.selectedAdvertiserStatus}
              onChange={(event) =>
                setStore({
                  ...store,
                  selectedAdvertiserStatus: event.target.value as typeof store.selectedAdvertiserStatus,
                })
              }
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2"
            >
              <option value="all">전체</option>
              {Object.entries(STAGE4B_ADVERTISER_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium text-zinc-700">
            업종 필터
            <select
              value={store.selectedCategory}
              onChange={(event) => setStore({ ...store, selectedCategory: event.target.value })}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category === "all" ? "전체" : category}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        {advertisers.map((advertiser) => (
          <AdvertiserCard key={advertiser.id} advertiser={advertiser} />
        ))}
      </div>
      {advertisers.length === 0 && (
        <p className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-600">
          조건에 맞는 demo 광고주가 없습니다. Demo Reset으로 필터를 초기화할 수 있습니다.
        </p>
      )}
    </section>
  );
}

function AdvertiserCard({ advertiser }: { advertiser: (typeof STAGE4B_DEMO_ADVERTISERS)[number] }) {
  const totals = getStage4BAdvertiserTotals(advertiser.id);
  return (
    <article className="rounded-2xl border border-zinc-200 bg-white px-4 py-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold text-cyan-700">{advertiser.category}</p>
          <h3 className="mt-1 font-semibold text-zinc-900">{advertiser.name}</h3>
          <p className="mt-1 text-sm text-zinc-600">{advertiser.region}</p>
        </div>
        <Badge label={STAGE4B_ADVERTISER_STATUS_LABELS[advertiser.status]} />
      </div>
      <dl className="mt-4 grid gap-2 sm:grid-cols-2">
        <Info label="활성 캠페인 수" value={formatStage4BNumber(totals.activeCampaignCount)} />
        <Info label="이번 달 광고비 소진액" value={formatStage4BWon(totals.spentWon)} />
        <Info label="예상 파트너 수익" value={formatStage4BWon(totals.partnerShareWon)} />
        <Info label="최근 활동일" value={advertiser.recentActivityDate} />
        <Info label="마스킹 demo 번호" value={advertiser.maskedDemoBusinessCode} />
      </dl>
      <Link href={`/partner/advertisers/${advertiser.id}`} className="mt-4 secondary-link">
        상세 보기
      </Link>
    </article>
  );
}

function AdvertiserDetail({ advertiser }: { advertiser: (typeof STAGE4B_DEMO_ADVERTISERS)[number] }) {
  const totals = getStage4BAdvertiserTotals(advertiser.id);
  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-4">
        <h2 className="text-lg font-semibold text-zinc-900">{advertiser.name}</h2>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <Info label="파트너 귀속 정보" value={STAGE4B_DEMO_PARTNER.name} />
          <Info label="광고주 상태" value={STAGE4B_ADVERTISER_STATUS_LABELS[advertiser.status]} />
          <Info label="업종" value={advertiser.category} />
          <Info label="담당 지역" value={advertiser.region} />
          <Info label="광고비 소진액" value={formatStage4BWon(totals.spentWon)} />
          <Info label="예상 파트너 수익" value={formatStage4BWon(totals.partnerShareWon)} />
        </div>
        <p className="mt-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
          실제 소비자 개인 정보, 사용자 UUID, 개별 광고 열람 원본, 퀴즈 정답 원문은
          파트너 화면에 제공되지 않습니다.
        </p>
      </div>
      <section className="rounded-2xl border border-zinc-200 bg-white px-4 py-4">
        <h3 className="font-semibold text-zinc-900">캠페인 집계</h3>
        <div className="mt-3 space-y-3">
          {advertiser.campaigns.map((campaign) => (
            <div key={campaign.id} className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="font-semibold text-zinc-900">{campaign.name}</p>
                <Badge label={STAGE4B_CAMPAIGN_STATUS_LABELS[campaign.status]} />
              </div>
              <dl className="mt-3 grid gap-2 sm:grid-cols-4">
                <Info label="소진액" value={formatStage4BWon(campaign.spentWon)} />
                <Info label="검증 열람" value={formatStage4BNumber(campaign.verifiedViews)} />
                <Info label="Quiz Pass" value={formatStage4BNumber(campaign.quizPasses)} />
                <Info
                  label="파트너 수익"
                  value={formatStage4BWon(calculateStage4BPartnerShare(campaign.spentWon))}
                />
              </dl>
            </div>
          ))}
        </div>
      </section>
      <BarPanel
        title="광고주 월별 추이"
        rows={[
          ["2026-05", Math.max(0, totals.spentWon - 46000)],
          ["2026-06", Math.max(0, totals.spentWon - 22000)],
          ["2026-07", totals.spentWon],
        ]}
      />
    </section>
  );
}

function SettlementList({ settlements }: { settlements: Stage4BSettlement[] }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-zinc-900">정산 내역</h2>
      {settlements.map((settlement) => (
        <SettlementCard key={settlement.id} settlement={settlement} />
      ))}
    </section>
  );
}

function SettlementCard({ settlement }: { settlement: Stage4BSettlement }) {
  const result = calculateStage4BSettlement(settlement);
  return (
    <article className="rounded-2xl border border-zinc-200 bg-white px-4 py-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="font-semibold text-zinc-900">{settlement.periodLabel}</h3>
          <p className="text-sm text-zinc-600">
            {settlement.periodStart} ~ {settlement.periodEnd}
          </p>
        </div>
        <Badge label={STAGE4B_SETTLEMENT_STATUS_LABELS[settlement.status]} />
      </div>
      <dl className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <Info label="광고비 소진 총액" value={formatStage4BWon(result.grossSpentWon)} />
        <Info label="적용 수익 공유율" value={`${result.shareRatePercent}%`} />
        <Info label="조정 금액" value={formatStage4BWon(result.adjustmentWon)} />
        <Info label="최종 지급 예정액" value={formatStage4BWon(result.finalPayoutWon)} />
      </dl>
      <Link href={`/partner/settlements/${settlement.id}`} className="mt-4 secondary-link">
        상세 보기
      </Link>
    </article>
  );
}

function SettlementDetail({ settlement }: { settlement: Stage4BSettlement }) {
  const result = calculateStage4BSettlement(settlement);
  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-4">
        <h2 className="text-lg font-semibold text-zinc-900">{settlement.periodLabel} 정산 상세</h2>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <Info label="대상 광고주 수" value={formatStage4BNumber(settlement.breakdown.length)} />
          <Info
            label="대상 캠페인 수"
            value={formatStage4BNumber(
              settlement.breakdown.reduce((sum, item) => sum + item.campaignCount, 0),
            )}
          />
          <Info label="총 광고비 소진액" value={formatStage4BWon(result.grossSpentWon)} />
          <Info label="파트너 수익 공유율" value={`${result.shareRatePercent}%`} />
          <Info label="기본 정산액" value={formatStage4BWon(result.basePartnerShareWon)} />
          <Info label="조정 금액" value={formatStage4BWon(result.adjustmentWon)} />
          <Info label="최종 지급 예정액" value={formatStage4BWon(result.finalPayoutWon)} />
          <Info label="지급 상태" value={STAGE4B_SETTLEMENT_STATUS_LABELS[settlement.status]} />
        </div>
        <SandboxNotice />
      </div>
      <section className="rounded-2xl border border-zinc-200 bg-white px-4 py-4">
        <h3 className="font-semibold text-zinc-900">광고주별 breakdown</h3>
        <div className="mt-3 space-y-2">
          {settlement.breakdown.map((item) => {
            const advertiser = STAGE4B_DEMO_ADVERTISERS.find((entry) => entry.id === item.advertiserId);
            return (
              <div key={item.advertiserId} className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-3">
                <dl className="grid gap-2 sm:grid-cols-4">
                  <Info label="광고주명" value={advertiser?.name ?? item.advertiserId} />
                  <Info label="캠페인 수" value={formatStage4BNumber(item.campaignCount)} />
                  <Info label="광고비 소진액" value={formatStage4BWon(item.spentWon)} />
                  <Info label="파트너 귀속액" value={formatStage4BWon(calculateStage4BPartnerShare(item.spentWon))} />
                </dl>
              </div>
            );
          })}
        </div>
      </section>
      <section className="rounded-2xl border border-zinc-200 bg-white px-4 py-4">
        <h3 className="font-semibold text-zinc-900">상태 Timeline</h3>
        <ol className="mt-3 space-y-2 text-sm">
          {settlement.events.map((event) => (
            <li key={event.id} className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2">
              {event.label} · {STAGE4B_SETTLEMENT_STATUS_LABELS[event.status]}
            </li>
          ))}
        </ol>
        <h3 className="mt-4 font-semibold text-zinc-900">조정 항목</h3>
        {settlement.adjustments.map((adjustment) => (
          <p key={adjustment.label} className="mt-2 rounded-lg bg-zinc-50 px-3 py-2 text-sm">
            {adjustment.label}: {formatStage4BWon(adjustment.amountWon)} · {adjustment.reason}
          </p>
        ))}
      </section>
    </section>
  );
}

function RegionalInsights() {
  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-4 text-sm text-blue-950">
        <h2 className="text-lg font-semibold">지역 소비 수요 인사이트</h2>
        <p className="mt-1">
          개인 사용자를 식별할 수 없는 집계 데이터입니다. 실제 소비자 개인정보, 개별
          프로필, 원시 응답은 포함하지 않습니다.
        </p>
        <p className="mt-1">담당 지역: {STAGE4B_DEMO_PARTNER.region}</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <BarPanel
          title="관심 카테고리 분포"
          rows={STAGE4B_INSIGHTS.map((row) => [row.label, row.demandScore])}
        />
        <BarPanel
          title="광고주 공급 점수"
          rows={STAGE4B_INSIGHTS.map((row) => [row.label, row.advertiserSupplyScore])}
        />
      </div>
      <section className="rounded-2xl border border-zinc-200 bg-white px-4 py-4">
        <h3 className="font-semibold text-zinc-900">광고주 모집 추천 카테고리</h3>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {STAGE4B_INSIGHTS.map((row) => (
            <div key={row.label} className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3">
              <p className="font-semibold text-zinc-900">{row.label}</p>
              <p className="mt-1 text-sm text-zinc-600">{row.recommendation}</p>
              <p className="mt-2 text-xs text-zinc-500">
                주거지역 기반 수요 {row.demandScore}% · 주활동지역 기반 선호{" "}
                {Math.max(0, row.demandScore - 8)}%
              </p>
            </div>
          ))}
        </div>
      </section>
    </section>
  );
}

function AdminSettlementList({
  settlements,
  onReset,
}: {
  settlements: Stage4BSettlement[];
  onReset: () => void;
}) {
  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-950">
        <h2 className="text-lg font-semibold">관리자 파트너 정산 검토 Demo</h2>
        <p className="mt-1">실제 승인·송금·세금 처리는 수행하지 않는 browser-only demo입니다.</p>
      </div>
      <button type="button" onClick={onReset} className="secondary-button">
        Partner Demo Reset
      </button>
      {settlements.map((settlement) => (
        <SettlementCard key={settlement.id} settlement={settlement} />
      ))}
    </section>
  );
}

function AdminSettlementDetail({
  settlement,
  updateStatus,
}: {
  settlement: Stage4BSettlement;
  updateStatus: (status: Stage4BSettlementStatus) => void;
}) {
  return (
    <section className="space-y-4">
      <SettlementDetail settlement={settlement} />
      <section className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4">
        <h3 className="font-semibold text-amber-950">Demo status action</h3>
        <p className="mt-1 text-sm text-amber-900">
          모든 action은 브라우저 demo state만 변경합니다. partner_settlements INSERT/UPDATE는
          없습니다.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={() => updateStatus("pending")} className="secondary-button">
            검토 대기
          </button>
          <button type="button" onClick={() => updateStatus("approved")} className="primary-button">
            승인
          </button>
          <button type="button" onClick={() => updateStatus("paid")} className="primary-button">
            지급 완료 표시
          </button>
          <button type="button" onClick={() => updateStatus("cancelled")} className="secondary-button">
            취소
          </button>
        </div>
      </section>
    </section>
  );
}

function SandboxNotice() {
  return (
    <p className="rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm text-cyan-900">
      Demo / Sandbox 데이터입니다. 실제 파트너 정산, 실제 송금, 실제 세금 처리, 실제
      계약 처리는 수행하지 않습니다.
    </p>
  );
}

function ResetModal({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
      <section className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
        <h2 className="text-lg font-semibold text-zinc-900">Partner Demo Reset 확인</h2>
        <p className="mt-2 text-sm text-zinc-600">
          Stage 4-B 파트너 demo store만 초기화합니다. Stage 4-A 광고주 demo, Stage 3-Q
          demo, 인증 세션, Supabase 데이터는 삭제하지 않습니다.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="secondary-button">
            취소
          </button>
          <button type="button" onClick={onConfirm} className="primary-button">
            재설정
          </button>
        </div>
      </section>
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

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-zinc-50 px-3 py-2">
      <dt className="text-xs font-medium text-zinc-500">{label}</dt>
      <dd className="mt-1 text-sm font-semibold text-zinc-900">{value}</dd>
    </div>
  );
}

function Badge({ label }: { label: string }) {
  return (
    <span className="w-fit rounded-full bg-cyan-100 px-3 py-1 text-xs font-semibold text-cyan-800">
      {label}
    </span>
  );
}

function BarPanel({ title, rows }: { title: string; rows: Array<[string, number]> }) {
  const max = Math.max(...rows.map((row) => row[1]), 1);
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white px-4 py-4">
      <h3 className="font-semibold text-zinc-900">{title}</h3>
      <div className="mt-3 space-y-3">
        {rows.map(([label, value]) => (
          <div key={label}>
            <div className="flex justify-between gap-3 text-sm">
              <span>{label}</span>
              <span className="font-semibold">{formatStage4BWon(value).replace("원", "")}</span>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-zinc-100">
              <div
                className="h-full bg-cyan-600"
                style={{ width: `${Math.floor((value / max) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
