import { createRootRoute, Outlet } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Modal from "react-modal";
import Header from "../components/Header";

// This tells react-modal which part of your app to hide when the modal is open
Modal.setAppElement("#app"); // Or whatever your root element’s ID is

// Create a client
const queryClient = new QueryClient();

export const Route = createRootRoute({
  component: () => (
    <QueryClientProvider client={queryClient}>
      <Header />
      <Outlet />
    </QueryClientProvider>
  ),
});
