import { createFileRoute } from "@tanstack/react-router";
import { About } from "../pages/about.tsx";

export const Route = createFileRoute("/about")({
  component: About,
});
