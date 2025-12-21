import { createFileRoute } from "@tanstack/react-router";
import { HillsPage, loadHillsDatabase } from "../pages/tumps.tsx";

export const Route = createFileRoute("/")({
  component: HillsPage,
  // deno-lint-ignore no-explicit-any
  loader: ({ context }: { context: any }) =>
    context.queryClient.ensureQueryData({
      queryKey: ["database"],
      queryFn: loadHillsDatabase,
    }),
});
