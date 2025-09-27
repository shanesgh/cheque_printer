import { Sidebar } from "@/components/sidebar";
import "../App.css";
import { ThemeProvider } from "@/hooks/use-theme";

import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";

export const Route = createRootRoute({
  component: () => (
    <ThemeProvider>
      <div className="flex min-h-screen bg-background text-foreground">
        <Sidebar />
        <main className="flex-1 min-w-0 transition-all duration-200 ml-0 md:ml-64 lg:ml-16">
          <Outlet />
        </main>
      </div>
      <TanStackRouterDevtools />
    </ThemeProvider>
  ),
});
