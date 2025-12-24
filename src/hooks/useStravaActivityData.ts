import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useSessionObjectStorage } from "./useSessionStorage.ts";
import { useIndexDbStore } from "./indexedDbStore.tsx";
import type { SummaryActivity } from "../strava/Api.ts";

export function useStravaActivityHistory() {
  const { data, addObject } = useIndexDbStore<{
    id: number;
    data: Array<SummaryActivity>;
  }>({
    queryKey: "strava-data",
    storeName: "strava-data",
    indices: [],
  });

  const { token } = useStravaAuthToken();
  const { data: requestData, isLoading } = useQuery({
    queryKey: ["map-data", token],
    queryFn: async () => {
      if (token) {
        return await fetch(`${import.meta.env.VITE_BACKEND_URL}/map-data`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token,
          }),
        })
          .then(async (r) => await r.text())
          .then((s) => JSON.parse(s) as Array<SummaryActivity>);
      } else {
        return undefined;
      }
    },
  });

  useEffect(() => {
    if (!data && requestData) {
      addObject({ id: 0, data: requestData });
    }
  }, [data, requestData]);

  return {
    data,
    isLoading,
  };
}

export function useStravaAuthToken() {
  const searchParams = new URLSearchParams(globalThis.location.search);
  const code = searchParams.get("code");

  const { value: token, setValue: setToken } = useSessionObjectStorage<string>({
    key: "strava_auth_token",
  });

  const { data } = useQuery({
    queryKey: ["authToken", code, token],
    queryFn: async () => {
      if (!code && !token) {
        return null;
      } else if (!token && code) {
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
      } else if (token) {
        return token;
      } else {
        return null;
      }
    },
  });

  return {
    token: data,
  };
}
