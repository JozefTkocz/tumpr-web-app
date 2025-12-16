import { createFileRoute } from "@tanstack/react-router";
import { HillsPage } from "@/pages/tumps";

export const Route = createFileRoute("/")({
  component: App,
});

function App() {
  return <HillsPage />;
}
