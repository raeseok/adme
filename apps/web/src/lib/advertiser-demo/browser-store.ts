"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { STAGE4A_LOCAL_STORAGE_KEY, STAGE4A_SCHEMA_VERSION } from "./constants";
import { createStage4AInitialStore } from "./fixtures";
import type { Stage4ADemoStore } from "./types";

export function sanitizeStage4AStoreForBrowser(store: Stage4ADemoStore): Stage4ADemoStore {
  return {
    schemaVersion: store.schemaVersion,
    statusByCampaignId: { ...store.statusByCampaignId },
    eventsByCampaignId: Object.fromEntries(
      Object.entries(store.eventsByCampaignId).map(([campaignId, events]) => [
        campaignId,
        events.map((event) => ({ ...event })),
      ]),
    ),
    resetVersion: store.resetVersion,
    submittedCampaignId: store.submittedCampaignId,
  };
}

function isStage4ADemoStore(value: unknown): value is Stage4ADemoStore {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<Stage4ADemoStore>;
  return (
    candidate.schemaVersion === STAGE4A_SCHEMA_VERSION &&
    typeof candidate.statusByCampaignId === "object" &&
    typeof candidate.eventsByCampaignId === "object" &&
    typeof candidate.resetVersion === "number"
  );
}

function readStage4AStoreFromBrowser(): Stage4ADemoStore {
  if (typeof window === "undefined") return createStage4AInitialStore();

  const raw = window.localStorage.getItem(STAGE4A_LOCAL_STORAGE_KEY);
  if (!raw) return createStage4AInitialStore();

  try {
    const parsed = JSON.parse(raw) as unknown;
    return isStage4ADemoStore(parsed) ? parsed : createStage4AInitialStore();
  } catch {
    return createStage4AInitialStore();
  }
}

function writeStage4AStoreToBrowser(store: Stage4ADemoStore) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    STAGE4A_LOCAL_STORAGE_KEY,
    JSON.stringify(sanitizeStage4AStoreForBrowser(store)),
  );
}

export function useStage4ADemoStore() {
  const fallback = useMemo(() => createStage4AInitialStore(), []);
  const [store, setStoreState] = useState<Stage4ADemoStore>(fallback);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const browserStore = readStage4AStoreFromBrowser();
      setStoreState(browserStore);
      setMounted(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const setStore = useCallback((next: Stage4ADemoStore) => {
    const sanitized = sanitizeStage4AStoreForBrowser(next);
    setStoreState(sanitized);
    writeStage4AStoreToBrowser(sanitized);
  }, []);

  const resetStore = useCallback(() => {
    const previous = readStage4AStoreFromBrowser();
    const next = {
      ...createStage4AInitialStore(),
      resetVersion: previous.resetVersion + 1,
    };
    setStore(next);
  }, [setStore]);

  return { store, setStore, resetStore, mounted };
}
