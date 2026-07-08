"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { logoutAction } from "@/app/auth/logout/actions";
import {
  buildBirthYearOptions,
  buildChildBirthYearOptions,
  GENDER_OPTIONS,
  INTEREST_SCOPE_ALL,
  INTEREST_SCOPE_SELECTED,
  PET_TYPE_OPTIONS,
  type PetTypeValue,
} from "@/lib/consumer-profile/constants";
import { computeProfileCompletion } from "@/lib/consumer-profile/completion";
import type { ConsumerProfileDraft } from "@/lib/consumer-profile/page-data";
import type {
  ConsumerProfilePageData,
  ConsumerProfileStage1CContext,
  SaveConsumerProfileResult,
} from "@/lib/consumer-profile/types";
import { RegionHierarchySelector } from "@/components/RegionHierarchySelector";
import { saveConsumerProfileAction } from "./actions";

type SaveStatus = "idle" | "auth_required" | "saved" | "error";

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
  socialLogoutStatus = "not_tested",
}: {
  pageData: ConsumerProfilePageData;
  stage1C: ConsumerProfileStage1CContext;
  initialDraft: ConsumerProfileDraft | null;
  socialLogoutStatus?: "signed_out" | "not_tested" | "error";
}) {
  const [birthYear, setBirthYear] = useState<number | null>(
    initialDraft?.birthYear ?? null,
  );
  const [gender, setGender] = useState<string | null>(
    initialDraft?.gender ?? null,
  );
  const [oldestChildBirthYear, setOldestChildBirthYear] = useState<number | null>(
    initialDraft?.oldestChildBirthYear ?? null,
  );
  const [youngestChildBirthYear, setYoungestChildBirthYear] = useState<
    number | null
  >(initialDraft?.youngestChildBirthYear ?? null);
  const [petTypes, setPetTypes] = useState<PetTypeValue[] | null>(
    initialDraft?.petTypes ?? null,
  );
  const [residenceRegionId, setResidenceRegionId] = useState(
    initialDraft?.residenceRegionId ?? "",
  );
  const [activitySlot1RegionId, setActivitySlot1RegionId] = useState(
    initialDraft?.activitySlot1RegionId ?? "",
  );
  const [activitySlot2RegionId, setActivitySlot2RegionId] = useState(
    initialDraft?.activitySlot2RegionId ?? "",
  );
  const [interestScope, setInterestScope] = useState(
    initialDraft?.interestScope ?? INTEREST_SCOPE_SELECTED,
  );
  const [categoryIds, setCategoryIds] = useState<string[]>(
    initialDraft?.categoryIds ?? [],
  );
  const [saveResult, setSaveResult] = useState<SaveConsumerProfileResult | null>(
    null,
  );
  const [isPending, startTransition] = useTransition();
  const [logoutPending, startLogout] = useTransition();

  const saveStatus = mapSaveStatus(saveResult);
  const isAuthenticated = stage1C.session.sessionStatus === "authenticated";
  const birthYearOptions = useMemo(() => buildBirthYearOptions(), []);
  const childBirthYearOptions = useMemo(() => buildChildBirthYearOptions(), []);
  const savableRegionIds = useMemo(
    () => new Set(pageData.savableRegionIds),
    [pageData.savableRegionIds],
  );

  const completion = useMemo(
    () =>
      computeProfileCompletion({
        birthYear,
        gender,
        residenceRegionId,
        savableRegionIds,
        interestScope,
        categoryIds,
      }),
    [birthYear, gender, residenceRegionId, savableRegionIds, interestScope, categoryIds],
  );

  const duplicateActivityWarning = useMemo(() => {
    const slots = [activitySlot1RegionId, activitySlot2RegionId].filter(Boolean);
    if (slots.length === 2 && slots[0] === slots[1]) {
      return "주활동지역 1과 2가 동일합니다. 다른 지역 선택을 권장합니다.";
    }
    return null;
  }, [activitySlot1RegionId, activitySlot2RegionId]);

  const legacyRegionWarning =
    initialDraft?.legacyResidenceRegionId && !residenceRegionId
      ? "기존 지역 정보가 새 지역 선택 기준(시·군·구)과 달라 다시 선택이 필요합니다."
      : null;

  function toggleCategory(id: string) {
    setInterestScope(INTEREST_SCOPE_SELECTED);
    setCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  }

  function selectAllInterests() {
    setInterestScope(INTEREST_SCOPE_ALL);
    setCategoryIds([]);
  }

  function togglePetType(value: PetTypeValue) {
    setPetTypes((prev) => {
      const current = prev ?? [];
      if (current.includes(value)) {
        const next = current.filter((item) => item !== value);
        return next.length === 0 ? null : next;
      }
      return [...current, value];
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (
      oldestChildBirthYear != null &&
      youngestChildBirthYear != null &&
      oldestChildBirthYear > youngestChildBirthYear
    ) {
      setSaveResult({
        ok: false,
        code: "VALIDATION_ERROR",
        mutationExecuted: false,
        pointLedgerMutation: false,
        quizAnswerAccess: false,
        serviceRoleUsed: false,
        message: "가장 큰 자녀 생년은 막내 자녀 생년보다 늦을 수 없습니다.",
        stage1CProfileSaveStatus: "error",
        stage1CMutationExecuted: false,
      });
      return;
    }
    startTransition(async () => {
      const result = await saveConsumerProfileAction({
        birthYear,
        gender,
        oldestChildBirthYear,
        youngestChildBirthYear,
        petTypes,
        residenceRegionId,
        activitySlot1RegionId,
        activitySlot2RegionId,
        interestScope,
        categoryIds,
      });
      setSaveResult(result);
    });
  }

  function handleLogout() {
    startLogout(async () => {
      await logoutAction();
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="space-y-6 overflow-x-hidden"
    >
      <section className="space-y-2 rounded-lg bg-blue-50 px-3 py-3 text-sm text-blue-900">
        <p className="font-semibold">AdMe 소비 의향 프로필</p>
        <p className="font-medium text-blue-950">
          소비성향 프로필은 광고를 보내달라는 나의 요구입니다.
        </p>
        <p className="text-blue-800">
          더 많은 조건을 등록할수록 더 많은 맞춤 소비정보를 받을 수 있습니다.
        </p>
        <p className="text-blue-800">
          아래 항목은 개인 신원이 아닌 <strong>소비정보 조건</strong>입니다. 내가
          원하는 광고와 혜택을 받기 위한 조건을 능동적으로 제시해 주세요.
        </p>
      </section>

      <section className="space-y-2 rounded-lg border border-zinc-200 bg-white px-3 py-3 text-sm">
        <p className="font-semibold text-zinc-900">
          소비 의향 프로필 완성도 {completion.percent}%
        </p>
        {completion.remainingLabels.length > 0 ? (
          <p className="text-zinc-600">
            남은 항목: {completion.remainingLabels.join(", ")}
          </p>
        ) : (
          <p className="text-emerald-700">프로필 기본 항목이 모두 입력되었습니다.</p>
        )}
        <p className="text-xs text-zinc-500">
          조건을 더 많이 등록할수록 나에게 맞는 광고와 혜택을 더 정교하게 받을 수
          있습니다.
        </p>
      </section>

      <section className="space-y-2 rounded-lg bg-violet-50 px-3 py-3 text-sm text-violet-900">
        {isAuthenticated ? (
          <>
            <p>
              로그인됨
              {stage1C.session.maskedEmail
                ? ` (${stage1C.session.maskedEmail})`
                : ""}
            </p>
            {socialLogoutStatus === "signed_out" ? (
              <p className="text-violet-800">로그아웃되었습니다.</p>
            ) : null}
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
              로그인하기
            </Link>
          </p>
        )}
      </section>

      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold text-zinc-900">출생년도</legend>
        <p className="text-xs text-zinc-500">
          연령대 소비정보 조건으로만 사용됩니다. 광고주에게 개인 식별 정보로 제공되지
          않습니다.
        </p>
        <select
          value={birthYear ?? ""}
          onChange={(e) =>
            setBirthYear(e.target.value ? Number(e.target.value) : null)
          }
          className="w-full max-w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
        >
          <option value="">예: 1985</option>
          {birthYearOptions.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold text-zinc-900">성별</legend>
        <p className="text-xs text-zinc-500">
          소비정보 조건으로만 사용됩니다. 광고주에게 개인 식별 정보로 제공되지
          않습니다.
        </p>
        <div className="space-y-2">
          {GENDER_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className="flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm hover:bg-zinc-50"
            >
              <input
                type="radio"
                name="gender"
                value={opt.value}
                checked={gender === opt.value}
                onChange={() => setGender(opt.value)}
              />
              {opt.label}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold text-zinc-900">
          가장 큰 자녀 생년
        </legend>
        <p className="text-xs text-zinc-500">
          자녀가 없거나 입력을 원하지 않으면 비워두셔도 됩니다.
        </p>
        <p className="text-xs text-zinc-500">
          자녀 생년은 자녀 관련 소비정보 조건으로만 사용됩니다.
        </p>
        <select
          value={oldestChildBirthYear ?? ""}
          onChange={(e) =>
            setOldestChildBirthYear(
              e.target.value ? Number(e.target.value) : null,
            )
          }
          className="w-full max-w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
        >
          <option value="">선택 안 함</option>
          {childBirthYearOptions.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold text-zinc-900">
          막내 자녀 생년
        </legend>
        <p className="text-xs text-zinc-500">
          자녀가 없거나 입력을 원하지 않으면 비워두셔도 됩니다.
        </p>
        <p className="text-xs text-zinc-500">
          자녀 생년은 자녀 관련 소비정보 조건으로만 사용됩니다.
        </p>
        <select
          value={youngestChildBirthYear ?? ""}
          onChange={(e) =>
            setYoungestChildBirthYear(
              e.target.value ? Number(e.target.value) : null,
            )
          }
          className="w-full max-w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
        >
          <option value="">선택 안 함</option>
          {childBirthYearOptions.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold text-zinc-900">반려동물 조건</legend>
        <p className="text-xs text-zinc-500">
          반려동물이 없거나 입력을 원하지 않으면 비워두셔도 됩니다.
        </p>
        <p className="text-xs text-zinc-500">
          반려동물 정보는 반려동물 관련 소비정보 조건으로만 사용됩니다.
        </p>
        <div className="space-y-2">
          {PET_TYPE_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className="flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm hover:bg-zinc-50"
            >
              <input
                type="checkbox"
                checked={petTypes?.includes(opt.value) ?? false}
                onChange={() => togglePetType(opt.value)}
              />
              {opt.label}
            </label>
          ))}
        </div>
      </fieldset>

      <RegionHierarchySelector
        key={`residence-${residenceRegionId}-${pageData.regionRows.length}`}
        legend="주거지역 (최대 1개)"
        required
        testId="region-selector-residence"
        regionRows={pageData.regionRows}
        selectorRows={pageData.selectorRegionRows}
        value={residenceRegionId}
        onChange={setResidenceRegionId}
        disabled={pageData.regionsEmpty}
        emptyPlaceholder="주거지역 선택"
      />
      {legacyRegionWarning ? (
        <p className="text-sm text-amber-700">{legacyRegionWarning}</p>
      ) : null}
      {pageData.regionsEmpty ? (
        <p className="text-sm text-amber-700">
          지역 목록이 비어 있습니다.
          {!isAuthenticated
            ? " 로그인 후 다시 시도해 주세요."
            : " seed 데이터 또는 RLS를 확인해 주세요."}
        </p>
      ) : null}

      <RegionHierarchySelector
        key={`activity1-${activitySlot1RegionId}-${pageData.regionRows.length}`}
        legend="주활동지역 1 (선택)"
        testId="region-selector-activity-1"
        regionRows={pageData.regionRows}
        selectorRows={pageData.selectorRegionRows}
        value={activitySlot1RegionId}
        onChange={setActivitySlot1RegionId}
        disabled={pageData.regionsEmpty}
      />

      <div className="space-y-2">
        <RegionHierarchySelector
          key={`activity2-${activitySlot2RegionId}-${pageData.regionRows.length}`}
          legend="주활동지역 2 (선택)"
          testId="region-selector-activity-2"
          regionRows={pageData.regionRows}
          selectorRows={pageData.selectorRegionRows}
          value={activitySlot2RegionId}
          onChange={setActivitySlot2RegionId}
          disabled={pageData.regionsEmpty}
        />
        {duplicateActivityWarning ? (
          <p className="text-sm text-amber-700">{duplicateActivityWarning}</p>
        ) : null}
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold text-zinc-900">
          관심정보 <span className="text-red-600">*</span>
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
          <button
            type="button"
            onClick={selectAllInterests}
            className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
              interestScope === INTEREST_SCOPE_ALL
                ? "border-blue-600 bg-blue-600 text-white"
                : "border-zinc-300 bg-white text-zinc-800 hover:border-blue-400"
            }`}
          >
            전체
          </button>
          {pageData.categories.map((c) => {
            const selected =
              interestScope === INTEREST_SCOPE_SELECTED &&
              categoryIds.includes(c.id);
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

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
      >
        {isPending ? "저장 중…" : "소비 의향 프로필 저장"}
      </button>

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
        </p>
      ) : null}

      <Link
        href="/consumer"
        className="inline-block text-sm font-medium text-blue-600 hover:text-blue-800"
      >
        ← 소비자 홈으로
      </Link>
    </form>
  );
}
