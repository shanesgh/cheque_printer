import { Sidebar } from "@/components/sidebar";
import "../App.css";
import { ThemeProvider } from "@/hooks/use-theme";
import { Toaster } from "react-hot-toast";
import noDataImage from '@/assets/cq6QnU2UR9GdEBaT-35qUw.webp';

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
  notFoundComponent: () => (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <img
        src={noDataImage}
        alt="Welcome"
        className="w-96 h-auto mb-6 opacity-90"
      />
      <h1 className="text-3xl font-semibold text-foreground mb-2">Welcome to Cheque Management System</h1>
      <p className="text-muted-foreground text-lg">Select an option from the sidebar to get started</p>
    </div>
  ),
});
