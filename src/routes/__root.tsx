import { Sidebar } from "@/components/sidebar";
import "../App.css";

import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";

export const Route = createRootRoute({
  component: () => (
    <>
      <div className="flex">
        <Sidebar />
        <div className="">
          <Outlet />
        </div>
      </div>
      <TanStackRouterDevtools />
    </>
  ),
});
