import { useState, useCallback } from "react";
import { useRouter } from "@tanstack/react-router";
import { Power } from "lucide-react";
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
    <div
      className={cn(
        "h-screen fixed bg-white border-r flex flex-col transition-all duration-300 ease-in-out z-30",
        isExpanded ? "w-64" : "w-[100px]"
      )}
    >
      <div className="p-3 space-x-1 flex items-center justify-between">
        <Avatar className="h-10 w-10 shrink-0">
          <AvatarImage src="/avatar.png" alt="User" />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>

        <Button
          variant="ghost"
          size="icon"
          className="shrink-0"
          onClick={toggleSidebar}
        >
          <Power className="h-4 w-4" />
        </Button>
      </div>

      <nav className="flex-1 ">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title} className="px-3 py-2">
            <h2 className="mb-2 px-2 text-sm font-semibold text-muted-foreground">
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
  );
}

export default Sidebar;
