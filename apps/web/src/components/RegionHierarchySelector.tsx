"use client";

import { useEffect, useMemo, useState } from "react";
import type { RegionRow } from "@/lib/consumer-profile/regions";
import {
  buildDongOptions,
  buildRegionHierarchyIndex,
  buildSidoOptions,
  buildSigunguOptions,
  hasDongOptions,
  parseRegionSelectionFromId,
  resolveFinalRegionId,
  type RegionSelectionState,
} from "@/lib/regions/region-options";

type RegionHierarchySelectorProps = {
  legend: string;
  required?: boolean;
  regionRows: RegionRow[];
  value: string;
  onChange: (regionId: string) => void;
  disabled?: boolean;
  emptyPlaceholder?: string;
  /** E2E helper — not a visible debug marker */
  testId?: string;
};

export function RegionHierarchySelector({
  legend,
  required = false,
  regionRows,
  value,
  onChange,
  disabled = false,
  emptyPlaceholder = "선택 안 함",
  testId,
}: RegionHierarchySelectorProps) {
  const index = useMemo(
    () => buildRegionHierarchyIndex(regionRows),
    [regionRows],
  );

  const [selection, setSelection] = useState<RegionSelectionState>(() =>
    parseRegionSelectionFromId(regionRows, value),
  );

  useEffect(() => {
    setSelection(parseRegionSelectionFromId(regionRows, value));
  }, [regionRows, value]);

  const sidoOptions = useMemo(() => buildSidoOptions(index), [index]);
  const sigunguOptions = useMemo(
    () => buildSigunguOptions(index, selection.sidoId),
    [index, selection.sidoId],
  );
  const dongOptions = useMemo(
    () => buildDongOptions(index, selection.sigunguId),
    [index, selection.sigunguId],
  );
  const showDongSelect = hasDongOptions(index, selection.sigunguId);

  const resolveResult = useMemo(
    () => resolveFinalRegionId(index, selection),
    [index, selection],
  );

  const selectionHint =
    !selection.sidoId
      ? "먼저 시·도를 선택한 뒤 시·군·구를 선택해 주세요."
      : !selection.sigunguId
        ? "시·군·구를 선택해 주세요."
        : null;

  const dongHint = showDongSelect
    ? "상세 지역 데이터가 있는 경우 읍·면·동까지 선택할 수 있습니다."
    : selection.sigunguId
      ? "이 지역은 현재 시·군·구 단위까지 선택할 수 있습니다."
      : null;

  const errorMessage =
    resolveResult.ok === false &&
    selection.sigunguId &&
    resolveResult.reason === "dong_required"
      ? resolveResult.message
      : null;

  function applySelection(next: RegionSelectionState) {
    setSelection(next);
    const resolved = resolveFinalRegionId(index, next);
    onChange(resolved.ok ? resolved.regionId : "");
  }

  function handleSidoChange(sidoId: string) {
    applySelection({
      sidoId: sidoId || null,
      sigunguId: null,
      dongId: null,
    });
  }

  function handleSigunguChange(sigunguId: string) {
    applySelection({
      sidoId: selection.sidoId,
      sigunguId: sigunguId || null,
      dongId: null,
    });
  }

  function handleDongChange(dongId: string) {
    applySelection({
      sidoId: selection.sidoId,
      sigunguId: selection.sigunguId,
      dongId: dongId || null,
    });
  }

  const selectClass =
    "w-full max-w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:bg-zinc-100";

  return (
    <fieldset className="space-y-2" disabled={disabled} data-testid={testId}>
      <legend className="text-sm font-semibold text-zinc-900">
        {legend}
        {required ? <span className="text-red-600"> *</span> : null}
      </legend>

      <p className="text-xs text-zinc-500">
        전국 시·도, 시·군·구, 읍·면·동 단위까지 선택할 수 있습니다. 상세 지역
        데이터가 있는 경우 읍·면·동까지 선택해야 합니다.
      </p>

      {selectionHint ? (
        <p className="text-xs text-zinc-600">{selectionHint}</p>
      ) : null}

      <label className="block space-y-1">
        <span className="text-xs font-medium text-zinc-700">시·도</span>
        <select
          value={selection.sidoId ?? ""}
          onChange={(e) => handleSidoChange(e.target.value)}
          className={selectClass}
          aria-label={`${legend} 시·도`}
          data-testid={testId ? `${testId}-sido` : undefined}
        >
          <option value="">{emptyPlaceholder}</option>
          {sidoOptions.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.name}
            </option>
          ))}
        </select>
      </label>

      <label className="block space-y-1">
        <span className="text-xs font-medium text-zinc-700">시·군·구</span>
        <select
          value={selection.sigunguId ?? ""}
          onChange={(e) => handleSigunguChange(e.target.value)}
          disabled={!selection.sidoId}
          className={selectClass}
          aria-label={`${legend} 시·군·구`}
          data-testid={testId ? `${testId}-sigungu` : undefined}
        >
          <option value="">
            {selection.sidoId ? "시·군·구 선택" : "먼저 시·도를 선택해 주세요"}
          </option>
          {sigunguOptions.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.name}
            </option>
          ))}
        </select>
      </label>

      {showDongSelect ? (
        <label className="block space-y-1">
          <span className="text-xs font-medium text-zinc-700">
            읍·면·동 (선택)
          </span>
          <select
            value={selection.dongId ?? ""}
            onChange={(e) => handleDongChange(e.target.value)}
            disabled={!selection.sigunguId}
            className={selectClass}
            aria-label={`${legend} 읍·면·동`}
            data-testid={testId ? `${testId}-dong` : undefined}
          >
            <option value="">읍·면·동 선택 (선택 사항 없음 — 상세 필수)</option>
            {dongOptions.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {dongHint ? <p className="text-xs text-zinc-600">{dongHint}</p> : null}
      {errorMessage ? (
        <p className="text-sm text-amber-700">{errorMessage}</p>
      ) : null}
    </fieldset>
  );
}
