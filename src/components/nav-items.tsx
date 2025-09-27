import { FC, ElementType, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type NavItemProps = {
  icon: ElementType;
  label: string;
  route: string;
  isExpanded: boolean;
  isActive: boolean;
  badge?: number;
  onClick?: () => void;
};

export const NavItemComponent: FC<NavItemProps> = ({
  icon: Icon,
  label,
  route,
  isExpanded,
  isActive,
  badge,
  onClick,
}) => {
  const navigate = useNavigate();
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div
      onClick={() => {
        navigate({ to: route });
        onClick?.();
      }}
      className={cn(
        "relative flex items-center h-9 my-1 cursor-pointer rounded-lg mx-2 transition-colors duration-150",
        isActive ? "bg-primary text-primary-foreground" : "hover:bg-accent hover:text-accent-foreground",
        isExpanded ? "justify-start px-4" : "justify-center px-2"
      )}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <Icon className="size-4" />
      {isExpanded && <span className="ml-4 text-sm whitespace-nowrap">{label}</span>}
      {!isExpanded && showTooltip && (
        <div className="absolute left-full ml-2 whitespace-nowrap bg-popover text-popover-foreground text-xs rounded px-2 py-1 z-50 border shadow-md">
          {label}
        </div>
      )}
    </div>
  );
};
