import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import {
  createHashHistory,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";

// Import the generated route tree
import { routeTree } from "./routeTree.gen.ts";

import "./styles.css";
import reportWebVitals from "./reportWebVitals.ts";
import { queryClient } from "./routes/__root.tsx";

import type { QueryClient } from "@tanstack/react-query";

export interface RouterContext {
  queryClient: QueryClient;
}

// Create a new router instance
const router = createRouter({
  routeTree,
  context: { queryClient } satisfies RouterContext,
  defaultPreload: "intent",
  scrollRestoration: true,
  defaultStructuralSharing: true,
  defaultPreloadStaleTime: 0,
  basepath: import.meta.env.BASE_URL,
  history: createHashHistory(),
});

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

// Render the app
const rootElement = document.getElementById("app");
if (rootElement && !rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>,
  );
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
