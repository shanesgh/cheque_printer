import { useState, useCallback } from "react";
import { useRouter } from "@tanstack/react-router";
import { Power, ChevronLeft, ChevronRight } from "lucide-react";
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
      <div
        className={cn(
          "h-screen fixed bg-white border-r flex flex-col transition-all duration-300 ease-in-out z-30",
          isExpanded ? "w-64" : "w-16",
          "md:relative"
        )}
      >
      <div className="p-3 space-x-1 flex items-center justify-between">
        <Avatar className={cn("h-10 w-10 shrink-0", !isExpanded && "hidden md:block")}>
          <AvatarImage src="/avatar.png" alt="User" />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>

        <Button
          variant="ghost"
          size="icon"
          className="shrink-0"
          onClick={toggleSidebar}
        >
          {isExpanded ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>
      </div>

      <nav className="flex-1 ">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title} className="px-3 py-2">
            <h2 className={cn("mb-2 px-2 text-sm font-semibold text-muted-foreground", !isExpanded && "hidden")}>
              {section.title}
            </h2>

            <div className="z-20">
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
      </div>
      {!isExpanded && <div className="md:hidden fixed inset-0 bg-black/50 z-20" onClick={toggleSidebar} />}
    </>
    </div>
  );
}

export const useSidebar = () => {
  const [isExpanded, setIsExpanded] = useState(true);
  const toggleSidebar = useCallback(() => setIsExpanded(prev => !prev), []);
  return { isExpanded, toggleSidebar };
};
export default Sidebar;
