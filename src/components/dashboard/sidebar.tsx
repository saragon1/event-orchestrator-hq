
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { UserPlus, Hotel, Plane, Bus, Users } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface SidebarItemProps {
  icon: React.ElementType;
  label: string;
  href: string;
  isActive?: boolean;
}

const SidebarItem = ({ icon: Icon, label, href, isActive }: SidebarItemProps) => {
  return (
    <Link to={href}>
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "w-full justify-start gap-2 px-2",
          isActive
            ? "bg-accent text-accent-foreground font-medium"
            : "hover:bg-accent hover:text-accent-foreground"
        )}
      >
        <Icon className="h-4 w-4" />
        <span>{label}</span>
      </Button>
    </Link>
  );
};

interface DashboardSidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export const DashboardSidebar = ({ isOpen, setIsOpen }: DashboardSidebarProps) => {
  const location = useLocation();
  const isMobile = useIsMobile();

  const navItems = [
    {
      icon: Users,
      label: "Persons",
      href: "/persons",
    },
    {
      icon: Hotel,
      label: "Hotels",
      href: "/hotels",
    },
    {
      icon: Plane,
      label: "Flights",
      href: "/flights",
    },
    {
      icon: Bus,
      label: "Buses",
      href: "/buses",
    },
  ];

  if (isMobile && !isOpen) return null;

  return (
    <aside
      className={cn(
        "bg-sidebar border-r border-border flex-shrink-0 h-screen overflow-y-auto py-4 transition-all duration-300 ease-in-out",
        isOpen ? "w-64" : "w-0",
        isMobile && isOpen ? "fixed z-50 left-0 top-0 w-64" : ""
      )}
    >
      <div className="px-3 py-2">
        <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
          Event Orchestrator
        </h2>
        <div className="space-y-1 py-2">
          {navItems.map((item) => (
            <SidebarItem
              key={item.href}
              icon={item.icon}
              label={item.label}
              href={item.href}
              isActive={location.pathname === item.href}
            />
          ))}
        </div>
      </div>
    </aside>
  );
};
