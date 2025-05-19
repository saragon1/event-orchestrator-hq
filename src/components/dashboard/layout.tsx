import { ReactNode, useState } from "react";
import { DashboardSidebar } from "./sidebar";
import { DashboardHeader } from "./header";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
}

export const DashboardLayout = ({ children, title }: DashboardLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false); // Default to closed on mobile, true for wider screens managed by sidebar

  return (
    <div className="flex h-screen bg-background">
      <DashboardSidebar 
        isOpen={sidebarOpen} 
        setIsOpen={setSidebarOpen} 
        // className prop removed as sidebar handles its own classes
      />
      {/* Overlay for mobile when sidebar is open */} 
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)} 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
        />
      )}
      <div 
        className={cn(
          "flex flex-col flex-1 overflow-hidden transition-all duration-300 ease-in-out"
        )}
      >
        <DashboardHeader
          isOpen={sidebarOpen}
          setIsOpen={setSidebarOpen}
          title={title}
        />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
};
