"use client";

import { useEffect, useRef, useState } from "react";

type MinViewTimerProps = {
  requiredSeconds: number;
  onComplete: (elapsedMs: number) => void;
};

export function MinViewTimer({ requiredSeconds, onComplete }: MinViewTimerProps) {
  const [remainingSeconds, setRemainingSeconds] = useState(requiredSeconds);
  const [completed, setCompleted] = useState(false);
  const startRef = useRef(0);
  const completedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    startRef.current = Date.now();
    completedRef.current = false;

    const interval = window.setInterval(() => {
      const elapsedMs = Date.now() - startRef.current;
      const remaining = Math.max(0, requiredSeconds - Math.floor(elapsedMs / 1000));

      setRemainingSeconds(remaining);

      if (remaining === 0 && !completedRef.current) {
        completedRef.current = true;
        setCompleted(true);
        onCompleteRef.current(elapsedMs);
        window.clearInterval(interval);
      }
    }, 250);

    return () => window.clearInterval(interval);
  }, [requiredSeconds]);

  return (
    <section
      data-testid="min-view-timer"
      aria-label="최소 열람 타이머"
      className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
    >
      {!completed ? (
        <>
          <p>
            광고 내용을 {requiredSeconds}초 이상 확인한 뒤 퀴즈를 제출할 수 있습니다.
          </p>
          <p className="mt-1 font-medium">남은 시간: {remainingSeconds}초</p>
        </>
      ) : (
        <p>최소 열람 시간이 완료되었습니다. 퀴즈를 제출할 수 있습니다.</p>
      )}
    </section>
  );
}
