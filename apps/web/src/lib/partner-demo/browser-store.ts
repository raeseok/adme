"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { STAGE4B_LOCAL_STORAGE_KEY, STAGE4B_SCHEMA_VERSION } from "./constants";
import { createStage4BInitialStore } from "./fixtures";
import type { Stage4BPartnerDemoStore } from "./types";

function isStage4BPartnerDemoStore(value: unknown): value is Stage4BPartnerDemoStore {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<Stage4BPartnerDemoStore>;
  return (
    candidate.schemaVersion === STAGE4B_SCHEMA_VERSION &&
    typeof candidate.settlementStatusById === "object" &&
    typeof candidate.resetVersion === "number"
  );
}

function readStage4BStoreFromBrowser(): Stage4BPartnerDemoStore {
  if (typeof window === "undefined") return createStage4BInitialStore();
  const raw = window.localStorage.getItem(STAGE4B_LOCAL_STORAGE_KEY);
  if (!raw) return createStage4BInitialStore();
  try {
    const parsed = JSON.parse(raw) as unknown;
    return isStage4BPartnerDemoStore(parsed) ? parsed : createStage4BInitialStore();
  } catch {
    return createStage4BInitialStore();
  }
}

function writeStage4BStoreToBrowser(store: Stage4BPartnerDemoStore) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STAGE4B_LOCAL_STORAGE_KEY, JSON.stringify(store));
}

export function useStage4BPartnerDemoStore() {
  const fallback = useMemo(() => createStage4BInitialStore(), []);
  const [store, setStoreState] = useState<Stage4BPartnerDemoStore>(fallback);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setStoreState(readStage4BStoreFromBrowser());
      setMounted(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const setStore = useCallback((next: Stage4BPartnerDemoStore) => {
    setStoreState(next);
    writeStage4BStoreToBrowser(next);
  }, []);

  const resetStore = useCallback(() => {
    const previous = readStage4BStoreFromBrowser();
    const next = {
      ...createStage4BInitialStore(),
      resetVersion: previous.resetVersion + 1,
    };
    setStore(next);
  }, [setStore]);

  return { store, setStore, resetStore, mounted };
}
