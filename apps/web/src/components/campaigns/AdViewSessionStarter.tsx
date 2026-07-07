"use client";

import { useEffect, useState } from "react";
import { beginAdViewAction } from "@/app/consumer/ads/[campaignId]/actions";

type AdViewSessionStarterProps = {
  campaignId: string;
  quizId: string;
  onReady: (payload: {
    started: boolean;
    attemptsRemaining: number;
  }) => void;
};

export function AdViewSessionStarter({
  campaignId,
  quizId,
  onReady,
}: AdViewSessionStarterProps) {
  const [statusText, setStatusText] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    beginAdViewAction(campaignId, quizId).then((result) => {
      if (cancelled) return;
      onReady({
        started: result.started,
        attemptsRemaining: result.attemptsRemaining,
      });
      if (result.started) {
        setStatusText("서버에 광고 열람 시작 시점이 기록되었습니다.");
      } else {
        setStatusText("광고 열람 시작 기록을 준비 중입니다.");
      }
    });

    return () => {
      cancelled = true;
    };
  }, [campaignId, quizId, onReady]);

  return (
    <section
      data-testid="ad-view-started"
      aria-label="서버 열람 시작"
      className="rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-950"
    >
      <p data-testid="server-min-view-status">
        {statusText ?? "서버 열람 시작 기록을 준비 중입니다."}
      </p>
    </section>
  );
}
