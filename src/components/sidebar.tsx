import { useState, useCallback } from "react";
import { useRouter } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { NAV_SECTIONS } from "@/lib/constants";
import { NavItemComponent } from "./nav-items";
import { cn } from "@/lib/utils";
import { useUserStore } from "@/store/userStore";

export function Sidebar() {
  const [isExpanded, setIsExpanded] = useState(true);
  const router = useRouter();
  const { firstName, lastName } = useUserStore();

  const toggleSidebar = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  const currentRoute = router.state.location.pathname;
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

  return (
    <>
      {/* Mobile overlay */}
      {isExpanded && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={toggleSidebar}
        />
      )}
      
      <div
        className={cn(
          "h-screen fixed bg-white border-r flex flex-col transition-all duration-300 ease-in-out z-30",
          "md:relative md:translate-x-0",
          isExpanded ? "w-64 translate-x-0" : "w-16 -translate-x-48 md:translate-x-0"
        )}
      >
        <div className="p-3 flex items-center justify-between">
          <Avatar className={cn("h-10 w-10 shrink-0", !isExpanded && "md:mx-auto")}>
            <AvatarImage src="/avatar.png" alt="User" />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>

          <Button
            variant="ghost"
            size="icon"
            className={cn("shrink-0", !isExpanded && "hidden md:flex")}
            onClick={toggleSidebar}
          >
            {isExpanded ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </div>

        <nav className="flex-1">
          {NAV_SECTIONS.map((section) => (
            <div key={section.title} className="px-3 py-2">
              {isExpanded && (
                <h2 className="mb-2 px-2 text-sm font-semibold text-muted-foreground">
                  {section.title}
                </h2>
              )}

              <div className="space-y-1">
                {section.items.map((item) => (
                  <NavItemComponent
                    key={item.route}
                    {...item}
                    isExpanded={isExpanded}
                    isActive={currentRoute === item.route}
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>
        
        {/* Mobile toggle button */}
        <div className="p-3 md:hidden">
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={toggleSidebar}
          >
            Close
          </Button>
        </div>
      </div>
    </>
  );
}

export default Sidebar;