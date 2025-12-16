import { createFileRoute } from "@tanstack/react-router";
import { HillsPage } from "@/pages/tumps";

export const Route = createFileRoute(import.meta.env.BASE_URL)({
  component: App,
});

function App() {
  return <HillsPage />;
}
