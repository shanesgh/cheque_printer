import { Sidebar } from "@/components/sidebar";
import "../App.css";

import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";

export const Route = createRootRoute({
  component: () => (
    <>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 min-w-0 transition-all duration-300 ml-64 md:ml-16">
          <Outlet />
        </main>
      </div>
      <TanStackRouterDevtools />
    </>
  ),
});
