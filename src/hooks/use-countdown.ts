import { useEffect, useRef, useState } from "react";

/**
 * Simple countdown hook.
 * Pass an absolute end time (Date | string | number). Returns remaining seconds and expired flag.
 */
export function useCountdown(endTime: Date | string | number | null | undefined, enabled: boolean = true) {
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [isExpired, setIsExpired] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    // Clear previous interval
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (!enabled || !endTime) {
      setRemainingSeconds(0);
      setIsExpired(false);
      return;
    }

    const endTs = new Date(endTime).getTime();

    const tick = () => {
      const diff = Math.floor((endTs - Date.now()) / 1000);
      if (diff <= 0) {
        setRemainingSeconds(0);
        setIsExpired(true);
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      } else {
        setRemainingSeconds(diff);
        setIsExpired(false);
      }
    };

    // Initial
    tick();
    timerRef.current = window.setInterval(tick, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [endTime, enabled]);

  return { remainingSeconds, isExpired };
}
