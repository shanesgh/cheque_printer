import { Sidebar } from "@/components/sidebar";
import "../App.css";
import { ThemeProvider } from "@/hooks/use-theme";
import { Toaster } from "react-hot-toast";

import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";

export const Route = createRootRoute({
  component: () => (
    <ThemeProvider>
      <Toaster
        position="top-right"
        reverseOrder={false}
        toastOptions={{
          duration: 4000,
          style: {
            maxWidth: '500px',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      <div className="flex min-h-screen bg-background text-foreground">
        <Sidebar />
        <main className="flex-1 min-w-0 transition-all duration-200 w-full md:ml-64">
          <Outlet />
        </main>
      </div>
      <TanStackRouterDevtools />
    </ThemeProvider>
  ),
});
