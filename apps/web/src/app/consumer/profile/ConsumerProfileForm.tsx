"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { logoutAction } from "@/app/auth/logout/actions";
import {
  buildBirthYearOptions,
  GENDER_OPTIONS,
  INTEREST_SCOPE_ALL,
  INTEREST_SCOPE_SELECTED,
} from "@/lib/consumer-profile/constants";
import { computeProfileCompletion } from "@/lib/consumer-profile/completion";
import type { ConsumerProfileDraft } from "@/lib/consumer-profile/page-data";
import type {
  ConsumerProfilePageData,
  ConsumerProfileStage1CContext,
  SaveConsumerProfileResult,
} from "@/lib/consumer-profile/types";
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
  const validRegionIds = useMemo(
    () => new Set(pageData.regions.map((r) => r.id)),
    [pageData.regions],
  );

  const completion = useMemo(
    () =>
      computeProfileCompletion({
        birthYear,
        gender,
        residenceRegionId,
        validRegionIds,
        interestScope,
        categoryIds,
      }),
    [birthYear, gender, residenceRegionId, validRegionIds, interestScope, categoryIds],
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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await saveConsumerProfileAction({
        birthYear,
        gender,
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
        <p className="text-blue-800">
          이 정보는 개인 신원이 아닌 <strong>소비 의향</strong>입니다. 출생년도·성별·
          지역·관심정보는 광고 매칭에만 사용되며 광고주에게 개인 식별 정보로 제공되지
          않습니다.
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
          프로필을 완성하면 더 적합한 지역 소비 정보를 받을 수 있습니다.
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
          연령대 매칭에만 사용되며 광고주에게 개인 정보로 제공되지 않습니다.
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
          광고 매칭 정교도 향상에 사용되며 광고주에게 개인 식별 정보로 제공되지
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
          주거지역 (시·군·구, 최대 1개) <span className="text-red-600">*</span>
        </legend>
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
          주활동지역 1 (시·군·구, 선택)
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
          주활동지역 2 (시·군·구, 선택)
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
