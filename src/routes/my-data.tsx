import { createFileRoute } from "@tanstack/react-router";
import { MyData } from "../pages/my-data.tsx";

export const Route = createFileRoute("/my-data")({
  component: MyData,
});
