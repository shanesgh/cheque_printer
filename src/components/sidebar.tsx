import { useState, useCallback } from "react";
import { useRouter } from "@tanstack/react-router";
import { Power, ChevronLeft, ChevronRight, Menu, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { NAV_SECTIONS } from "@/lib/constants";
import { NavItemComponent } from "./nav-items";
import { cn } from "@/lib/utils";
import { useUserStore } from "@/store/userStore";
import { useTheme } from "@/hooks/use-theme";
import { Switch } from "@/components/ui/switch";
import { Moon, Sun } from "lucide-react";

export function Sidebar() {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const router = useRouter();
  const { firstName, lastName } = useUserStore();
  const { theme, toggleTheme } = useTheme();

  const toggleSidebar = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  const toggleMobile = useCallback(() => {
    setIsMobileOpen((prev) => !prev);
  }, []);

  const currentRoute = router.state.location.pathname;
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden"
        onClick={toggleMobile}
      >
        {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity duration-200"
          onClick={toggleMobile}
        />
      )}

      <div
        className={cn(
          "h-screen fixed bg-background border-r flex flex-col transition-all duration-200 ease-in-out z-50",
          isExpanded ? "w-64" : "w-16",
          "md:relative md:translate-x-0",
          isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="p-3 space-x-1 flex items-center justify-between">
          <Avatar className={cn("h-10 w-10 shrink-0", !isExpanded && "mx-auto")}>
            <AvatarImage src="/avatar.png" alt="User" />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>

          <Button
            variant="ghost"
            size="icon"
            className={cn("shrink-0 hidden md:flex", !isExpanded && "mx-auto")}
            onClick={toggleSidebar}
          >
            {isExpanded ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </div>

        {/* Theme Toggle */}
        {isExpanded && (
          <div className="px-3 py-2 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sun className="h-4 w-4" />
                <span className="text-sm">Dark Mode</span>
                <Moon className="h-4 w-4" />
              </div>
              <Switch
                checked={theme === 'dark'}
                onCheckedChange={toggleTheme}
              />
            </div>
          </div>
        )}

        <nav className="flex-1">
          {NAV_SECTIONS.map((section) => (
            <div key={section.title} className="px-3 py-2">
              <h2 className={cn("mb-2 px-2 text-sm font-semibold text-muted-foreground", !isExpanded && "hidden")}>
                {section.title}
              </h2>

              <div>
                {section.items.map((item) => (
                  <NavItemComponent
                    key={item.route}
                    {...item}
                    isExpanded={isExpanded}
                    isActive={currentRoute === item.route}
                    onClick={() => setIsMobileOpen(false)}
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>
      </div>
    </>
  );
}

export const useSidebar = () => {
  const [isExpanded, setIsExpanded] = useState(true);
  const toggleSidebar = useCallback(() => setIsExpanded(prev => !prev), []);
  return { isExpanded, toggleSidebar };
};
export default Sidebar;
