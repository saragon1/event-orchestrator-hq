
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { EventSelector } from "./event-selector";

interface DashboardHeaderProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  title: string;
}

export const DashboardHeader = ({
  isOpen,
  setIsOpen,
  title,
}: DashboardHeaderProps) => {
  return (
    <header className="border-b bg-background sticky top-0 z-30">
      <div className="flex h-16 items-center px-4 gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </Button>
        <EventSelector />
        <h1 className="text-xl font-semibold">{title}</h1>
        <div className="ml-auto flex items-center space-x-4">
          {/* We can add user profile, notifications, etc. here later */}
        </div>
      </div>
    </header>
  );
};
