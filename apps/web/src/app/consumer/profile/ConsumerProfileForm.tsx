"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { logoutAction } from "@/app/auth/logout/actions";
import { SPEND_RANGE_OPTIONS } from "@/lib/consumer-profile/constants";
import type { ConsumerProfileDraft } from "@/lib/consumer-profile/page-data";
import type {
  ConsumerProfilePageData,
  ConsumerProfileStage1CContext,
  RegionOption,
  SaveConsumerProfileResult,
} from "@/lib/consumer-profile/types";
import { getDeployCommit } from "@/lib/deploy-info";
import { saveConsumerProfileAction } from "./actions";

type SaveStatus = "idle" | "auth_required" | "saved" | "error";

function regionLabel(regions: RegionOption[], id: string): string {
  if (!id) return "(미선택)";
  return regions.find((r) => r.id === id)?.label ?? id;
}

function mapSaveStatus(result: SaveConsumerProfileResult | null): SaveStatus {
  if (!result) return "idle";
  if (result.code === "AUTH_REQUIRED") return "auth_required";
  if (result.ok && result.code === "SAVED") return "saved";
  if (
    result.code === "VALIDATION_ERROR" ||
    result.code === "ERROR" ||
    result.code === "CONFIG_ERROR"
  ) {
    return "error";
  }
  return "idle";
}

export function ConsumerProfileForm({
  pageData,
  stage1C,
  initialDraft,
}: {
  pageData: ConsumerProfilePageData;
  stage1C: ConsumerProfileStage1CContext;
  initialDraft: ConsumerProfileDraft | null;
}) {
  const [residenceRegionId, setResidenceRegionId] = useState(
    initialDraft?.residenceRegionId ?? "",
  );
  const [activitySlot1RegionId, setActivitySlot1RegionId] = useState(
    initialDraft?.activitySlot1RegionId ?? "",
  );
  const [activitySlot2RegionId, setActivitySlot2RegionId] = useState(
    initialDraft?.activitySlot2RegionId ?? "",
  );
  const [categoryIds, setCategoryIds] = useState<string[]>(
    initialDraft?.categoryIds ?? [],
  );
  const [spendRange, setSpendRange] = useState(initialDraft?.spendRange ?? "");
  const [saveResult, setSaveResult] = useState<SaveConsumerProfileResult | null>(
    null,
  );
  const [isPending, startTransition] = useTransition();
  const [logoutPending, startLogout] = useTransition();

  const saveStatus = mapSaveStatus(saveResult);
  const saveBlockedByAuth = saveStatus === "auth_required";
  const mutationExecuted = saveResult?.mutationExecuted ?? false;
  const deployCommit = getDeployCommit();
  const isAuthenticated = stage1C.session.sessionStatus === "authenticated";

  const stage1CProfileSaveStatus =
    saveResult?.stage1CProfileSaveStatus ??
    (saveStatus === "auth_required"
      ? "auth_required"
      : saveStatus === "saved"
        ? "saved"
        : saveStatus === "error"
          ? "error"
          : "idle");

  const stage1CConsumerProfileWriteStatus =
    saveResult?.stage1CConsumerProfileWriteStatus ??
    (isAuthenticated && saveStatus === "idle"
      ? stage1C.consumerProfileReadStatus === "ok"
        ? "saved"
        : "idle"
      : "idle");

  const stage1CConsumerRegionsWriteStatus =
    saveResult?.stage1CConsumerRegionsWriteStatus ?? "idle";
  const stage1CInterestCategoriesWriteStatus =
    saveResult?.stage1CInterestCategoriesWriteStatus ?? "idle";
  const stage1CMutationExecuted = saveResult?.stage1CMutationExecuted ?? false;

  const duplicateActivityWarning = useMemo(() => {
    const slots = [activitySlot1RegionId, activitySlot2RegionId].filter(Boolean);
    if (slots.length === 2 && slots[0] === slots[1]) {
      return "주활동지역 1과 2가 동일합니다. 다른 지역 선택을 권장합니다.";
    }
    return null;
  }, [activitySlot1RegionId, activitySlot2RegionId]);

  function toggleCategory(id: string) {
    setCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await saveConsumerProfileAction({
        residenceRegionId,
        activitySlot1RegionId,
        activitySlot2RegionId,
        categoryIds,
        spendRange,
      });
      setSaveResult(result);
    });
  }

  function handleLogout() {
    startLogout(async () => {
      await logoutAction();
    });
  }

  const pointLedgerMutation = saveResult?.pointLedgerMutation ?? false;
  const quizAnswerAccess = saveResult?.quizAnswerAccess ?? false;
  const serviceRoleUsed = saveResult?.serviceRoleUsed ?? false;

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="space-y-6 overflow-x-hidden"
    >
      <section className="space-y-2 rounded-lg bg-blue-50 px-3 py-3 text-sm text-blue-900">
        <p className="font-semibold">AdMe 소비 의향 프로필</p>
        <p>Stage 1-B Consumer Profile UI</p>
        <p className="font-mono text-xs text-blue-800">stage-1-b-consumer-profile-ui</p>
        <p className="text-blue-800">
          이 정보는 개인 신원이 아닌 <strong>소비 의향</strong>입니다. 주거지역과
          주활동지역은 광고 매칭에 사용되며, 주활동지역은 최대 2개까지 설정할 수
          있습니다.
        </p>
      </section>

      <section className="space-y-2 rounded-lg bg-violet-50 px-3 py-3 text-sm text-violet-900">
        <p className="font-semibold">Stage 1-C Authenticated Consumer Profile</p>
        <p className="font-mono text-xs">stage-1-c-authenticated-consumer-profile</p>
        {isAuthenticated ? (
          <>
            <p>
              로그인됨
              {stage1C.session.maskedEmail
                ? ` (${stage1C.session.maskedEmail})`
                : ""}
            </p>
            <button
              type="button"
              onClick={handleLogout}
              disabled={logoutPending}
              className="rounded-lg border border-violet-300 bg-white px-3 py-1.5 text-sm font-medium text-violet-800 hover:bg-violet-100 disabled:opacity-60"
            >
              {logoutPending ? "로그아웃 중…" : "로그아웃"}
            </button>
          </>
        ) : (
          <p>
            로그인이 필요합니다.{" "}
            <Link href="/auth/login" className="font-medium underline">
              /auth/login
            </Link>
          </p>
        )}
      </section>

      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold text-zinc-900">
          주거지역 <span className="text-red-600">*</span> (최대 1개)
        </legend>
        {pageData.regionsEmpty ? (
          <p className="text-sm text-amber-700">
            지역 목록이 비어 있습니다.
            {!isAuthenticated
              ? " 로그인 후 다시 시도해 주세요."
              : " seed 데이터 또는 RLS를 확인해 주세요."}
          </p>
        ) : null}
        <select
          value={residenceRegionId}
          onChange={(e) => setResidenceRegionId(e.target.value)}
          className="w-full max-w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
        >
          <option value="">주거지역 선택</option>
          {pageData.regions.map((r) => (
            <option key={r.id} value={r.id}>
              {r.label}
            </option>
          ))}
        </select>
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold text-zinc-900">
          주활동지역 1 <span className="text-zinc-500">(선택)</span>
        </legend>
        <select
          value={activitySlot1RegionId}
          onChange={(e) => setActivitySlot1RegionId(e.target.value)}
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
        >
          <option value="">선택 안 함</option>
          {pageData.regions.map((r) => (
            <option key={`a1-${r.id}`} value={r.id}>
              {r.label}
            </option>
          ))}
        </select>
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold text-zinc-900">
          주활동지역 2 <span className="text-zinc-500">(선택)</span>
        </legend>
        <select
          value={activitySlot2RegionId}
          onChange={(e) => setActivitySlot2RegionId(e.target.value)}
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
        >
          <option value="">선택 안 함</option>
          {pageData.regions.map((r) => (
            <option key={`a2-${r.id}`} value={r.id}>
              {r.label}
            </option>
          ))}
        </select>
        {duplicateActivityWarning ? (
          <p className="text-sm text-amber-700">{duplicateActivityWarning}</p>
        ) : null}
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold text-zinc-900">
          관심 분야 <span className="text-red-600">*</span> (다중 선택)
        </legend>
        {pageData.categoriesEmpty ? (
          <p className="text-sm text-amber-700">
            관심 분야 목록이 비어 있습니다.
            {!isAuthenticated
              ? " 로그인 후 다시 시도해 주세요."
              : " seed 데이터 또는 RLS를 확인해 주세요."}
          </p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          {pageData.categories.map((c) => {
            const selected = categoryIds.includes(c.id);
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => toggleCategory(c.id)}
                className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                  selected
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-zinc-300 bg-white text-zinc-800 hover:border-blue-400"
                }`}
              >
                {c.name}
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold text-zinc-900">
          소비 규모 범위 <span className="text-red-600">*</span>
        </legend>
        <div className="space-y-2">
          {SPEND_RANGE_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className="flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm hover:bg-zinc-50"
            >
              <input
                type="radio"
                name="spendRange"
                value={opt.value}
                checked={spendRange === opt.value}
                onChange={() => setSpendRange(opt.value)}
              />
              {opt.label}
            </label>
          ))}
        </div>
      </fieldset>

      <section className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-3 text-sm text-zinc-800">
        <p className="font-semibold">선택 항목 요약</p>
        <ul className="mt-2 space-y-1 font-mono text-xs">
          <li>residenceSelected={regionLabel(pageData.regions, residenceRegionId)}</li>
          <li>
            activitySlot1Selected=
            {regionLabel(pageData.regions, activitySlot1RegionId)}
          </li>
          <li>
            activitySlot2Selected=
            {regionLabel(pageData.regions, activitySlot2RegionId)}
          </li>
          <li>selectedCategoryCount={categoryIds.length}</li>
          <li>
            spendRangeSelected=
            {spendRange
              ? (SPEND_RANGE_OPTIONS.find((o) => o.value === spendRange)?.label ??
                spendRange)
              : "(미선택)"}
          </li>
        </ul>
      </section>

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
      >
        {isPending ? "저장 중…" : "소비 의향 프로필 저장"}
      </button>

      {saveStatus === "auth_required" ? (
        <p className="rounded-lg bg-amber-100 px-3 py-2 text-sm font-bold text-amber-950">
          AUTH_REQUIRED
        </p>
      ) : null}

      {saveResult?.message ? (
        <p
          className={`rounded-lg px-3 py-2 text-sm font-medium ${
            saveStatus === "auth_required"
              ? "bg-amber-50 text-amber-900"
              : saveStatus === "saved"
                ? "bg-emerald-50 text-emerald-900"
                : saveStatus === "error"
                  ? "bg-red-50 text-red-900"
                  : "bg-zinc-50 text-zinc-800"
          }`}
        >
          {saveResult.message}
          {saveResult.code === "AUTH_REQUIRED" ? " (AUTH_REQUIRED)" : null}
        </p>
      ) : null}

      <section
        aria-label="Stage 1-B visible markers"
        className="space-y-1 break-all rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-3 py-3 font-mono text-xs text-zinc-700"
      >
        <p>stage1BRoute=/consumer/profile</p>
        <p>stage1BAuthIncluded=false</p>
        <p>stage1BAuthSeparatedTo=Stage 1-C</p>
        <p>stage1BWriteContract=auth-gated-server-action</p>
        <p>stage1BSaveStatus={saveStatus}</p>
        {saveResult?.code === "AUTH_REQUIRED" ? (
          <p>stage1BSaveCode=AUTH_REQUIRED</p>
        ) : null}
        <p>stage1BSaveBlockedByAuth={String(saveBlockedByAuth)}</p>
        <p>stage1BMutationExecuted={String(mutationExecuted)}</p>
        <p>stage1BRegionsReadStatus={pageData.regionsReadStatus}</p>
        <p>stage1BCategoriesReadStatus={pageData.categoriesReadStatus}</p>
        <p>stage1BRegionCount={pageData.regionCount}</p>
        <p>stage1BCategoryCount={pageData.categoryCount}</p>
        <p>stage1BRegionsEmpty={String(pageData.regionsEmpty)}</p>
        <p>stage1BCategoriesEmpty={String(pageData.categoriesEmpty)}</p>
        <p>stage1BResidenceMax=1</p>
        <p>stage1BActivityMax=2</p>
        <p>stage1BUsesConsumerRegions=true</p>
        <p>stage1BPointLedgerMutation={String(pointLedgerMutation)}</p>
        <p>stage1BQuizAnswerAccess={String(quizAnswerAccess)}</p>
        <p>stage1BServiceRoleUsed={String(serviceRoleUsed)}</p>
        <p>stage1BDeployCommit={deployCommit}</p>
      </section>

      <section
        aria-label="Stage 1-C visible markers"
        className="space-y-1 break-all rounded-lg border border-dashed border-violet-300 bg-violet-50 px-3 py-3 font-mono text-xs text-violet-900"
      >
        <p>stage1CProfileRoute=/consumer/profile</p>
        <p>stage1CSessionStatus={stage1C.session.sessionStatus}</p>
        <p>stage1CAuthUserPresent={String(stage1C.session.authUserPresent)}</p>
        <p>stage1CAuthUserIdVisible=false</p>
        <p>
          stage1CAuthEmailMasked=
          {stage1C.session.maskedEmail ? "true" : "false"}
        </p>
        <p>stage1CMasterReadMode={stage1C.masterReadMode}</p>
        <p>stage1CRegionsReadStatus={stage1C.regionsReadStatusAuth}</p>
        <p>stage1CRegionCountAuth={stage1C.regionCountAuth}</p>
        <p>stage1CCategoriesReadStatus={stage1C.categoriesReadStatusAuth}</p>
        <p>stage1CCategoryCountAuth={stage1C.categoryCountAuth}</p>
        <p>stage1CProfileSaveStatus={stage1CProfileSaveStatus}</p>
        <p>
          stage1CConsumerProfileReadStatus=
          {stage1C.consumerProfileReadStatus}
        </p>
        <p>
          stage1CConsumerProfileWriteStatus={stage1CConsumerProfileWriteStatus}
        </p>
        <p>
          stage1CConsumerRegionsWriteStatus={stage1CConsumerRegionsWriteStatus}
        </p>
        <p>
          stage1CInterestCategoriesWriteStatus=
          {stage1CInterestCategoriesWriteStatus}
        </p>
        <p>stage1CResidenceMax=1</p>
        <p>stage1CActivityMax=2</p>
        <p>stage1CUsesConsumerRegions=true</p>
        <p>stage1CMutationExecuted={String(stage1CMutationExecuted)}</p>
        <p>stage1CPointLedgerMutation=false</p>
        <p>stage1CQuizAnswerAccess=false</p>
        <p>stage1CServiceRoleUsed=false</p>
        <p>stage1CLogoutAvailable=true</p>
        <p>stage1CLogoutStatus={logoutPending ? "signing_out" : "idle"}</p>
        <p>stage1CDeployCommit={deployCommit}</p>
      </section>

      <Link
        href="/consumer"
        className="inline-block text-sm font-medium text-blue-600 hover:text-blue-800"
      >
        ← 소비자 화면으로
      </Link>
    </form>
  );
}
