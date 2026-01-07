import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@mui/material";
import {
  useStravaActivityHistory,
  useStravaAuthToken,
} from "../hooks/useStravaActivityData.ts";
import { DataLoadingSpinner } from "../components/LoadingSpinner.tsx";
import { useLoadHillsDatabase } from "../hooks/useHillData.tsx";
import { useBaggedStatus } from "../hooks/baggedStatus.ts";
import { useVisitedHills } from "../hooks/useVisitedHills.ts";
import { JourneyMap } from "../components/Map.tsx";
import type { SummaryActivity } from "../strava/Api.ts";
import "./strava-data.css";
import "./Map.css";

export function StravaMap({
  data,
  clearAll,
}: {
  data: Array<SummaryActivity>;
  clearAll: () => void;
}) {
  const { data: hillsDatabase } = useLoadHillsDatabase();
  const { bulkMarkAsBagged } = useBaggedStatus();
  const { visitedHills, calculateVisitedHills, isCalculating } =
    useVisitedHills({
      data,
      hills: hillsDatabase,
    });
  const [shouldSync, setShouldSync] = useState(false);

  useEffect(() => {
    if (shouldSync && visitedHills !== null) {
      setShouldSync(false);
      bulkMarkAsBagged(
        Array.from(visitedHills).map((n) => {
          return { id: n };
        }),
      );
    }
  }, [shouldSync, setShouldSync, visitedHills, bulkMarkAsBagged]);

  const dataWithTraces = useMemo(() => {
    return data.filter((d) => d.map?.summary_polyline);
  }, [data]);

  const onClickSync = () => {
    calculateVisitedHills();
    setShouldSync(true);
  };

  return (
    <div className="strava-layout">
      <div className="map-wrapper">
        <JourneyMap stravaData={dataWithTraces} />
      </div>
      <div className="controls">
        <SyncButton isCalculating={isCalculating} onClick={onClickSync} />
        <ClearDataButton clearAll={clearAll} disabled={isCalculating} />
      </div>
    </div>
  );
}

function SyncButton({
  isCalculating,
  onClick,
  disabled = false,
}: {
  isCalculating: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <>
      {!isCalculating && (
        <Button
          variant="contained"
          onClick={onClick}
          fullWidth
          disabled={disabled}
        >
          Sync Strava data
        </Button>
      )}

      {isCalculating && (
        <DataLoadingSpinner text="Calculating bagged summits..." />
      )}
    </>
  );
}

function ClearDataButton({
  clearAll,
  disabled = false,
}: {
  clearAll: () => void;
  disabled?: boolean;
}) {
  return (
    <Button
      variant="contained"
      onClick={clearAll}
      fullWidth
      disabled={disabled}
    >
      Clear Strava Data
    </Button>
  );
}

export function StravaDataAuth() {
  const {
    token,
    clearToken,
    isLoading: isLoadingAuthToken,
  } = useStravaAuthToken();
  const {
    data,
    isLoading,
    clearAll: clearActivityCache,
  } = useStravaActivityHistory();
  console.log(token, data, isLoading);
  const clearAll = () => {
    clearActivityCache();
    clearToken();
  };
  if (isLoading || isLoadingAuthToken) {
    return <DataLoadingSpinner text="please wait..." />;
  }
  if (!data) {
    return <Authorize />;
  }

  // We should now be authorized, so load the map
  return <StravaMap data={data} clearAll={clearAll} />;
}

export function Authorize() {
  const { data } = useQuery({
    queryKey: ["authUrl"],
    queryFn: () =>
      fetch(`${import.meta.env.VITE_BACKEND_URL}/auth-url`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          redirectUrl: globalThis.location.href,
        }),
      })
        .then(async (r) => await r.text())
        .then((s) => JSON.parse(s) as { url: string }),
  });

  return (
    data && (
      <Button component="a" href={data.url} variant="contained">
        Authorize Strava
      </Button>
    )
  );
}
