import { createFileRoute } from "@tanstack/react-router";
import { loadHillsDatabase } from "../pages/tumps.tsx";
import { HillsPage } from "@/pages/tumps";

export const Route = createFileRoute("/")({
  component: HillsPage,
  loader: ({ context }) =>
    context.queryClient.ensureQueryData({
      queryKey: ["database"],
      queryFn: loadHillsDatabase,
    }),
});
