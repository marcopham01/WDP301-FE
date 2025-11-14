import StaffSidebar from "@/components/dashboard/sidebars/StaffSidebar";
import { SidebarProvider, SidebarInset, SidebarRail } from "@/components/ui/sidebar";
import { DashboardHeader } from "@/components/dashboard/mainlayout/DashboardHeader";
import { Outlet } from "react-router-dom";

// lightweight dashboard aggregates

interface StaffDashboardProps {
  user: {
    name: string;
    role: string;
  };
  onLogout: () => void;
}

export default function StaffDashboard({
  user,
  onLogout,
}: StaffDashboardProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-[radial-gradient(1200px_600px_at_80%_-10%,theme(colors.emerald.100/_0.4),transparent)] dark:bg-[radial-gradient(1200px_600px_at_80%_-10%,theme(colors.emerald.900/_0.2),transparent)]">
  <StaffSidebar />
  <SidebarRail />
        <SidebarInset className="bg-background/80 backdrop-blur-sm">
          <DashboardHeader 
            user={user} 
            onLogout={onLogout}
            subtitle="Staff Panel"
          />
          <main className="flex-1">
            <Outlet />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
