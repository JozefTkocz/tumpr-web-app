import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { useSessionObjectStorage } from "./useSessionStorage.ts";
import { useIndexDbStore } from "./indexedDbStore.tsx";
import type { SummaryActivity } from "../strava/Api.ts";
import type { Result } from "../common/result.ts";

const STRAVA_DATA_KEYS = {
  SUMMARY_ACTIVITIES: 0,
};

async function queryStravaHistory(
  token: string | null | undefined,
): Promise<Result<Array<SummaryActivity>>> {
  if (token) {
    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/map-data`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
        }),
      },
    );
    if (response.ok) {
      const data = (await response.json()) as Array<SummaryActivity>;
      return { ok: data, error: null };
    } else if (response.status === 429) {
      return { ok: null, error: new Error("Strava rate limit exceeded") };
    } else {
      return { ok: null, error: new Error(response.statusText) };
    }
  } else {
    return { ok: null, error: new Error("Invalid token") };
  }
}

export function useStravaActivityHistory() {
  const {
    data: localData,
    isReady,
    isConnecting,
    addObject,
    deleteObject,
  } = useIndexDbStore<{
    id: number;
    data: Array<SummaryActivity>;
  }>({
    queryKey: "strava-data",
    storeName: "strava-data",
    indices: [],
  });

  const hasLocalData = localData !== undefined && localData.length > 0;

  const { token } = useStravaAuthToken();
  const { data: requestData, isLoading } = useQuery({
    queryKey: ["map-data", token],
    queryFn: () => queryStravaHistory(token),
    enabled: isReady === true &&
      isConnecting === false &&
      token !== null &&
      !hasLocalData,
  });

  useEffect(() => {
    if (requestData?.error) {
      throw requestData.error;
    }
    if (requestData) {
      addObject({
        id: STRAVA_DATA_KEYS.SUMMARY_ACTIVITIES,
        data: requestData.ok,
      });
    }
  }, [requestData, addObject]);

  const resolvedData = useMemo(
    () => (localData && localData.length ? localData[0].data : requestData?.ok),
    [localData, requestData],
  );
  const clearAll = () =>
    deleteObject({ id: STRAVA_DATA_KEYS.SUMMARY_ACTIVITIES });

  return {
    data: resolvedData,
    isLoading: isLoading || !isReady,
    clearAll,
  };
}

export function useStravaAuthToken() {
  const searchParams = new URLSearchParams(globalThis.location.search);
  const code = searchParams.get("code");

  const {
    value: token,
    setValue: setToken,
    clearValue: clearToken,
  } = useSessionObjectStorage<string>({
    key: "strava_auth_token",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["authToken", code],
    enabled: !token && code !== null,
    queryFn: async () => {
      const newToken = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/token`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            code,
          }),
        },
      )
        .then(async (r) => await r.text())
        .then((s) => JSON.parse(s) as { token: { access_token: string } });
      setToken(newToken.token.access_token);
      return newToken.token.access_token;
    },
  });

  useEffect(() => {
    if (data) {
      setToken(data);
    }
  });

  return {
    token,
    isLoading,
    clearToken,
  };
}
