import { createFileRoute } from "@tanstack/react-router";
import { HillsPage } from "../pages/tumps.tsx";
import { loadHillsDatabase } from "../hooks/useHillData.tsx";

export const Route = createFileRoute("/")({
  component: HillsPage,
  // deno-lint-ignore no-explicit-any
  loader: ({ context }: { context: any }) =>
    context.queryClient.ensureQueryData({
      queryKey: ["database"],
      queryFn: loadHillsDatabase,
    }),
});
