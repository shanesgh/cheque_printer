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
};

export const NavItemComponent: FC<NavItemProps> = ({
  icon: Icon,
  label,
  route,
  isExpanded,
  isActive,
  badge,
}) => {
  const navigate = useNavigate();
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div
      onClick={() => navigate({ to: route })}
      className={cn(
        "relative flex items-center h-9 my-1 px-4 cursor-pointer rounded-lg mx-2",
        isActive ? "bg-black text-white " : "hover:bg-gray-100 ",
        isExpanded ? "justify-start" : "justify-center"
      )}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <Icon className="size-4" />
      {isExpanded && <span className="ml-4 text-sm">{label}</span>}
      {/* {badge && <Badge className="ml-auto bg-red-500">{badge}</Badge>} */}
      {!isExpanded && showTooltip && (
        <div className="absolute left-full ml-1 whitespace-no-wrap bg-black text-white text-sm rounded  py-1 w-20 z-20 text-center">
          {label}
        </div>
      )}
    </div>
  );
};
