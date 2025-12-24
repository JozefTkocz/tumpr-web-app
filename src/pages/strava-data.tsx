import { useQuery } from "@tanstack/react-query";
import { useStravaAuthToken } from "../hooks/useStravaActivityData.ts";

export function StravaDataAuth() {
  const { token } = useStravaAuthToken();
  if (!token) {
    return <Authorize />;
  }
  return <ConfirmAuthorization />;
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
          redirectUrl: globalThis.location.origin + "/strava-data-import",
        }),
      })
        .then(async (r) => await r.text())
        .then((s) => JSON.parse(s) as { url: string }),
  });

  return data && <a href={data?.url}>Authorize Strava</a>;
}

function ConfirmAuthorization() {
  return <span>You are ready now</span>;
}
