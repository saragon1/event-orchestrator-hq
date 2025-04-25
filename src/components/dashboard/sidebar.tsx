import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { UserPlus, Hotel, Plane, Bus, LayoutDashboard, Users, List, BedDouble, Car } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Separator } from "@/components/ui/separator";

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

  const mainNavItems = [
    {
      icon: LayoutDashboard,
      label: "Dashboard",
      href: "/dashboard",
    },
    {
      icon: List,
      label: "Events",
      href: "/events",
    },
    
  ];

  const eventResourcesNavItems = [
    {
      icon: Bus,
      label: "Buses",
      href: "/buses",
    },
    {
      icon: Plane,
      label: "Flights",
      href: "/flights",
    },
    {
      icon: BedDouble,
      label: "Hotel Reservations",
      href: "/hotel-reservations",
    },
    {
      icon: Car,
      label: "Cars",
      href: "/cars",
    },
  ];

  const staticResourcesNavItems = [
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
        <div className="space-y-4">
          <div className="space-y-1">
            {mainNavItems.map((item) => (
              <SidebarItem
                key={item.href}
                icon={item.icon}
                label={item.label}
                href={item.href}
                isActive={location.pathname === item.href}
              />
            ))}
          </div>

          <Separator className="mx-3" />
          <div className="space-y-1">
            <h3 className="px-4 text-sm font-medium text-muted-foreground">Event Resources</h3>
            {eventResourcesNavItems.map((item) => (
              <SidebarItem
                key={item.href}
                icon={item.icon}
                label={item.label}
                href={item.href}
                isActive={location.pathname === item.href}
              />
            ))}
          </div>

          <Separator className="mx-3" />
          <div className="space-y-1">
            <h3 className="px-4 text-sm font-medium text-muted-foreground">Static Resources</h3>
            {staticResourcesNavItems.map((item) => (
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
      </div>
    </aside>
  );
};
