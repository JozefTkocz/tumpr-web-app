import { createFileRoute } from "@tanstack/react-router";
import { MyData } from "../pages/my-data.tsx";
import { DefaultErrorBoundary } from "../components/ErrorBoundary.tsx";

export const Route = createFileRoute("/my-data")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <DefaultErrorBoundary>
      <MyData />
    </DefaultErrorBoundary>
  );
}
