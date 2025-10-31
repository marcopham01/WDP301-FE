import {} from "react";
import { AdminSidebar } from "@/components/dashboard/sidebars/AdminSidebar";
import { SidebarProvider, SidebarInset, SidebarRail } from "@/components/ui/sidebar";
import {} from "@/components/ui/tabs";
import { DashboardHeader } from "@/components/dashboard/mainlayout/DashboardHeader";
import { Outlet } from "react-router-dom";

interface User {
  name: string;
  role: string;
}

interface AdminDashboardProps {
  user: User;
  onLogout: () => void;
}

export const AdminDashboard = ({ user, onLogout }: AdminDashboardProps) => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-[radial-gradient(1200px_600px_at_80%_-10%,theme(colors.emerald.100/_0.4),transparent)] dark:bg-[radial-gradient(1200px_600px_at_80%_-10%,theme(colors.emerald.900/_0.2),transparent)]">
        <AdminSidebar />
        <SidebarRail />
        <SidebarInset className="bg-background/80 backdrop-blur-sm">
          <DashboardHeader
            user={user}
            onLogout={onLogout}
            subtitle="Quản lý trung tâm dịch vụ EV"
          />
          <main className="flex-1 p-6">
            <Outlet />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};
