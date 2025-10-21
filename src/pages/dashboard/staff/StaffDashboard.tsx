import StaffSidebar from "@/components/dashboard/sidebars/StaffSidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Button } from "../../../components/ui/button";
import { Car, LogOut } from "lucide-react";
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
      <div className="min-h-screen flex w-full">
        <StaffSidebar />
        <SidebarInset>
          <header className="bg-white border-b border-border">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Car className="h-8 w-8 text-primary" />
                <span className="text-xl font-bold bg-gradient-to-r from-ev-green to-ev-blue bg-clip-text text-transparent">
                  EV Service
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">
                  {user
                    ? `Chào ${user.name}`
                    : "Không tìm thấy thông tin người dùng"}
                </span>
                <Button variant="ghost" size="sm" onClick={onLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Đăng xuất
                </Button>
              </div>
            </div>
          </header>
          <main className="flex-1">
            <Outlet />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
