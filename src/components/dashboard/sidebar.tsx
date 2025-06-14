import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { UserPlus, Hotel, Plane, Bus, LayoutDashboard, Users, List, BedDouble, Car, Train, Calendar, Map, BarChart, DollarSign } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Separator } from "@/components/ui/separator";
import { useTranslation } from "@/hooks/useTranslation";
import { useEventStore } from "@/stores/event-store";

interface SidebarItemProps {
  icon: React.ElementType;
  label: string;
  href: string;
  isActive?: boolean;
  disabled?: boolean;
}

const SidebarItem = ({ icon: Icon, label, href, isActive, disabled }: SidebarItemProps) => {
  return (
    <Link to={href}>
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "w-full justify-start gap-2 px-2",
          isActive
            ? "bg-accent text-accent-foreground font-medium"
            : "hover:bg-accent hover:text-accent-foreground",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        disabled={disabled}
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
  const { t } = useTranslation();
  const { selectedEventId } = useEventStore();

  const mainNavItems = [
    {
      icon: LayoutDashboard,
      label: t("common.dashboard"),
      href: "/dashboard",
    },
    {
      icon: List,
      label: t("common.events"),
      href: "/events",
    },
    {
      icon: BarChart,
      label: t("common.statistics"),
      href: "/statistics",
    },
  ];

  const eventResourcesNavItems = [
    {
      icon: Calendar,
      label: t("common.eventSchedule"),
      href: "/event-schedule",
    },
    {
      icon: Map,
      label: t("common.eventMap"),
      href: "/event-map",
    },
    {
      icon: Bus,
      label: t("common.buses"),
      href: "/buses",
    },
    {
      icon: Plane,
      label: t("common.flights"),
      href: "/flights",
    },
    {
      icon: BedDouble,
      label: t("common.hotelReservations"),
      href: "/hotel-reservations",
    },
    {
      icon: Car,
      label: t("common.cars"),
      href: "/cars",
    },
    {
      icon: Train,
      label: t("common.trains"),
      href: "/trains",
    },
    {
      icon: UserPlus,
      label: "Registrazione Evento",
      href: selectedEventId ? `/event-registration/${selectedEventId}` : "/event-registration",
      disabled: !selectedEventId,
    },
    {
      icon: DollarSign,
      label: t("common.eventExpenses"),
      href: "/expenses",
      disabled: !selectedEventId,
    },
  ];

  const staticResourcesNavItems = [
    {
      icon: Users,
      label: t("common.persons"),
      href: "/persons",
    },
    {
      icon: Hotel,
      label: t("common.hotels"),
      href: "/hotels",
    },
  ];

  return (
    <aside
      className={cn(
        "bg-sidebar border-r border-border flex-shrink-0 h-screen overflow-y-auto py-4 transition-transform duration-300 ease-in-out z-50",
        isMobile 
          ? (isOpen ? "translate-x-0 fixed w-64" : "-translate-x-full fixed w-64")
          : "block relative w-64"
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
