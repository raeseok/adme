import "server-only";

import { cookies } from "next/headers";

const COOKIE_PREFIX = "adme_s2c_view_";
const MAX_AGE_SEC = 60 * 60 * 24;

export type FixtureViewState = {
  viewStartedAtMs: number;
  attemptNo: number;
  lastResult: "correct" | "incorrect" | null;
  completed: boolean;
  attemptLimitReached: boolean;
};

function cookieName(campaignId: string): string {
  return `${COOKIE_PREFIX}${encodeURIComponent(campaignId)}`;
}

function parseState(raw: string | undefined): FixtureViewState | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<FixtureViewState>;
    if (
      typeof parsed.viewStartedAtMs !== "number" ||
      typeof parsed.attemptNo !== "number" ||
      typeof parsed.completed !== "boolean" ||
      typeof parsed.attemptLimitReached !== "boolean"
    ) {
      return null;
    }
    return {
      viewStartedAtMs: parsed.viewStartedAtMs,
      attemptNo: parsed.attemptNo,
      lastResult:
        parsed.lastResult === "correct" || parsed.lastResult === "incorrect"
          ? parsed.lastResult
          : null,
      completed: parsed.completed,
      attemptLimitReached: parsed.attemptLimitReached,
    };
  } catch {
    return null;
  }
}

async function writeState(campaignId: string, state: FixtureViewState): Promise<void> {
  const jar = await cookies();
  jar.set(cookieName(campaignId), JSON.stringify(state), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: MAX_AGE_SEC,
    path: "/",
  });
}

export async function readFixtureViewState(
  campaignId: string,
): Promise<FixtureViewState | null> {
  const jar = await cookies();
  return parseState(jar.get(cookieName(campaignId))?.value);
}

export async function beginFixtureAdView(campaignId: string): Promise<FixtureViewState> {
  const existing = await readFixtureViewState(campaignId);
  if (existing) return existing;

  const state: FixtureViewState = {
    viewStartedAtMs: Date.now(),
    attemptNo: 0,
    lastResult: null,
    completed: false,
    attemptLimitReached: false,
  };
  await writeState(campaignId, state);
  return state;
}

export async function updateFixtureViewState(
  campaignId: string,
  state: FixtureViewState,
): Promise<void> {
  await writeState(campaignId, state);
}
