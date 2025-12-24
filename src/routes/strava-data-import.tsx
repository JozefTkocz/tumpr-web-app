import { createFileRoute } from "@tanstack/react-router";
import z from "zod";
import { zodValidator } from "@tanstack/zod-adapter";
import { StravaDataAuth } from "../pages/strava-data.tsx";

const searchSchema = z.object({
  code: z.string().optional(),
});

export const Route = createFileRoute("/strava-data-import")({
  component: StravaDataAuth,
  validateSearch: zodValidator(searchSchema),
});
