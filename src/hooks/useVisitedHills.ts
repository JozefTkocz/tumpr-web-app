import { useState } from "react";
import type { SummaryActivity } from "../strava/Api.ts";
import type { Hill } from "./useHillData.tsx";

export function useVisitedHills({
  data,
  hills,
}: {
  data: Array<SummaryActivity> | undefined | null;
  hills: Array<Hill>;
}) {
  const [visitedHills, setVisitedHills] = useState<Set<number> | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const worker = new Worker(
    new URL("../workers/visitedHills.ts", import.meta.url),
    { type: "module" },
  );

  const calculateVisitedHills = () => {
    if (data) {
      worker.postMessage({ data, hills });
      setIsCalculating(true);
    }
  };

  const resetVisitedHills = () => setVisitedHills(null);

  worker.onmessage = (event: MessageEvent<Set<number>>) => {
    setVisitedHills(event.data);
    setIsCalculating(false);
  };

  return {
    visitedHills,
    calculateVisitedHills,
    resetVisitedHills,
    isCalculating,
  };
}
