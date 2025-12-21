import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "../pages/coming-soon.tsx";

export const Route = createFileRoute("/about")({
  component: ComingSoon,
});
