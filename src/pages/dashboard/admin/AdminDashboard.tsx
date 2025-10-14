import {} from "react";
import { AdminSidebar } from "@/components/dashboard/sidebars/AdminSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import {} from "@/components/ui/tabs";
import { DashboardLayout } from "@/components/dashboard/mainlayout/DashboardLayout";
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
      <DashboardLayout
        sidebar={<AdminSidebar />}
        header={
          <DashboardHeader
            user={user}
            onLogout={onLogout}
            subtitle="Quản lý trung tâm dịch vụ EV"
            notificationCount={3}
          />
        }>
        {/* Main Content: chỉ hiện nội dung theo route con */}
        <main className="flex-1 p-6 bg-background">
          <Outlet />
        </main>
      </DashboardLayout>
    </SidebarProvider>
  );
};
