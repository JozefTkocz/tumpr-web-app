import { createFileRoute } from "@tanstack/react-router";
import { About } from "../pages/about.tsx";
import { DefaultErrorBoundary } from "../components/ErrorBoundary.tsx";

export const Route = createFileRoute("/about")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <DefaultErrorBoundary>
      <About />
    </DefaultErrorBoundary>
  );
}
