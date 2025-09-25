import { Sidebar } from "@/components/sidebar";
import "../App.css";

import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";

export const Route = createRootRoute({
  component: () => (
    <div className="flex min-h-screen">
      <div className="md:hidden fixed top-4 left-4 z-40">
        <SidebarToggle />
      </div>
      <div className="flex w-full">
        <Sidebar />
        <div className="flex-1 min-w-0">
          <Outlet />
        </div>
      </div>
      <TanStackRouterDevtools />
    </div>
  ),
}
)