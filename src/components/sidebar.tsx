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
        className="fixed top-4 left-4 z-50 md:hidden bg-background/80 backdrop-blur-sm border"
        onClick={toggleMobile}
      >
        {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={toggleMobile}
        />
      )}

      {/* Mobile Menu Grid */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden bg-background p-4 pt-20">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{firstName} {lastName}</p>
                <p className="text-sm text-muted-foreground">Administrator</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Sun className="h-4 w-4" />
              <Switch
                checked={theme === 'dark'}
                onCheckedChange={toggleTheme}
              />
              <Moon className="h-4 w-4" />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {NAV_SECTIONS.flatMap(section => section.items).map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.route}
                  onClick={() => {
                    router.navigate({ to: item.route });
                    setIsMobileOpen(false);
                  }}
                  className={cn(
                    "flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all duration-200 cursor-pointer",
                    currentRoute === item.route 
                      ? "bg-primary text-primary-foreground border-primary" 
                      : "bg-card hover:bg-accent border-border hover:border-accent-foreground/20"
                  )}
                >
                  <Icon className="h-8 w-8 mb-3" />
                  <span className="text-sm font-medium text-center">{item.label}</span>
                  <span className="text-xs text-muted-foreground text-center mt-1">{item.description}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div
        className={cn(
          "h-screen fixed bg-sidebar border-r flex flex-col transition-all duration-200 ease-in-out z-30",
          isExpanded ? "w-64" : "w-16",
          "hidden md:flex"
        )}
      >
        <div className="p-3 flex items-center justify-between">
          <Avatar className={cn("h-10 w-10 shrink-0", !isExpanded && "mx-auto")}>
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>

          {isExpanded && (
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0"
              onClick={toggleSidebar}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
          
          {!isExpanded && (
            <Button
              variant="ghost"
              size="icon"
              className="mx-auto"
              onClick={toggleSidebar}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Theme Toggle */}
        {isExpanded && (
          <div className="px-3 py-2 border-b border-sidebar-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sun className="h-4 w-4" />
                <span className="text-sm text-sidebar-foreground">Dark Mode</span>
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
              <h2 className={cn("mb-2 px-2 text-sm font-semibold text-sidebar-foreground/70", !isExpanded && "hidden")}>
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

const router = { navigate: (options: any) => window.location.href = options.to };
export const useSidebar = () => {
  const [isExpanded, setIsExpanded] = useState(true);
  const toggleSidebar = useCallback(() => setIsExpanded(prev => !prev), []);
  return { isExpanded, toggleSidebar };
};
export default Sidebar;
