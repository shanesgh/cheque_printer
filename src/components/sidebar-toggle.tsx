import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SidebarToggle() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
    // This would trigger the sidebar state in a real implementation
    // For now, we'll use a simple approach
    const sidebar = document.querySelector('[data-sidebar]');
    if (sidebar) {
      sidebar.classList.toggle('translate-x-0');
      sidebar.classList.toggle('-translate-x-full');
    }
  };

  return (
    <Button
      variant="outline"
      size="icon"
      className="md:hidden bg-white shadow-md"
      onClick={toggleSidebar}
    >
      <Menu className="h-4 w-4" />
    </Button>
  );
}