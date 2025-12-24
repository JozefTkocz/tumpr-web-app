import { DataLoadingSpinner } from "../components/LoadingSpinner.tsx";
import { useStravaActivityHistory } from "../hooks/useStravaActivityData.ts";

export function About() {
  const { data, isLoading } = useStravaActivityHistory();

  if (isLoading) {
    return <DataLoadingSpinner text="Loading Strava history..." />;
  }
  console.log(data);
  return <span>check the console</span>;
}
