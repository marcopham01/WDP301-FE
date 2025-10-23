import { TechnicianSidebar } from "@/components/dashboard/sidebars/TechnicianSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { DashboardLayout } from "@/components/dashboard/mainlayout/DashboardLayout";
import { DashboardHeader } from "@/components/dashboard/mainlayout/DashboardHeader";
import { Outlet } from "react-router-dom";

interface TechnicianDashboardProps {
  user: {
    name: string;
    role: string;
  };
  onLogout: () => void;
}

export const TechnicianDashboard = ({
  user,
  onLogout,
}: TechnicianDashboardProps) => {
  return (
    <SidebarProvider>
      <DashboardLayout
        sidebar={<TechnicianSidebar />}
        header={
          <DashboardHeader
            user={user}
            onLogout={onLogout}
            notificationCount={0}
          />
        }>
        <Outlet />
      </DashboardLayout>
    </SidebarProvider>
  );
};
