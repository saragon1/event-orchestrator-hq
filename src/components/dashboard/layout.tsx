import { ReactNode, useState } from "react";
import { DashboardSidebar } from "./sidebar";
import { DashboardHeader } from "./header";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
}

export const DashboardLayout = ({ children, title }: DashboardLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen bg-background">
      <DashboardSidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <DashboardHeader
          isOpen={sidebarOpen}
          setIsOpen={setSidebarOpen}
          title={title}
        />
        <main
          className={cn(
            "flex-1 overflow-y-auto p-6 transition-all duration-300 ease-in-out",
            sidebarOpen ? "" : ""
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
};
