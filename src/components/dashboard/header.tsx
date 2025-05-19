import { Button } from "@/components/ui/button";
import { Menu, X, UserCircle, LogOut, Settings } from "lucide-react";
import { EventSelector } from "./event-selector";
import { Link } from "react-router-dom";
import { LanguageSelector } from "./language-selector";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuth } from "@/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

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
  const { t } = useTranslation();
  const { user } = useAuth();
  
  // Create initials from user's name or use first letter of email
  const getUserInitials = () => {
    if (user?.name) {
      const nameParts = user.name.split(' ');
      if (nameParts.length >= 2) {
        return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
      }
      return user.name[0].toUpperCase();
    }
    return user?.email ? user.email[0].toUpperCase() : 'U';
  };
  
  return (
    <header className="border-b bg-background sticky top-0 z-30">
      <div className="flex h-16 items-center px-4 gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(!isOpen)}
          className="lg:hidden"
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </Button>
        <EventSelector />
        <h1 className="text-xl font-semibold">{title}</h1>
        <div className="ml-auto flex items-center space-x-4">
          <LanguageSelector />
          <Button variant="ghost" asChild>
            <Link to="/events">{t("common.allEvents")}</Link>
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{getUserInitials()}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                {user?.name || user?.email}
                {user?.role && (
                  <p className="text-xs text-muted-foreground">{user.role}</p>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="cursor-pointer w-full">
                    <UserCircle className="mr-2 h-4 w-4" />
                    <span>{t("common.profile")}</span>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/logout" className="cursor-pointer w-full">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>{t("common.logout")}</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};
