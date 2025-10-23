import {
  Calendar,
  ClipboardList,
  Users,
  Wrench,
  Settings,
  MapPin,
  LucideIcon,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useNavigate, useLocation } from "react-router-dom";

const items: Array<{ title: string; icon: LucideIcon; href: string }> = [
  { title: "Tổng quan", icon: ClipboardList, href: "/dashboard/staff" },
  {
    title: "Quản lý khách hàng",
    icon: Users,
    href: "/dashboard/staff/customers",
  },
  {
    title: "Quản lý lịch hẹn",
    icon: Calendar,
    href: "/dashboard/staff/appointments",
  },
  {
    title: "Quản lý bảo dưỡng",
    icon: Wrench,
    href: "/dashboard/staff/maintenance",
  },
];

export default function StaffSidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Sidebar className="w-64 border-r bg-card">
      <SidebarContent className="p-4">
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <div>
              <h2 className="font-semibold text-lg">EV Service</h2>
              <p className="text-sm text-muted-foreground">Staff Panel</p>
            </div>
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Điều hướng</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                // Check if current path starts with the item href (for nested routes)
                const active =
                  location.pathname === item.href ||
                  (item.href !== "/dashboard/staff" &&
                    location.pathname.startsWith(item.href));
                const Icon = item.icon as any;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      isActive={active}
                      onClick={() => navigate(item.href)}>
                      <Icon className="h-4 w-4" />
                      <span className="text-sm">{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
