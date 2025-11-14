import {
  Calendar,
  ClipboardList,
  Users,
  Wrench,
  LucideIcon,
  MessageCircle,
  Clock,
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
import logo from "@/assets/logo.png";

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
    title: "Điều phối KTV",
    icon: Wrench,
    href: "/dashboard/staff/maintenance",
  },
  {
    title: "Hàng chờ",
    icon: Clock,
    href: "/dashboard/staff/queue",
  },
  {
    title: "Chat",
    icon: MessageCircle,
    href: "/dashboard/staff/chat",
  },
];

export default function StaffSidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Sidebar
      className="w-64 border-r bg-white dark:bg-gray-950"
      collapsible="icon">
      <SidebarContent className="p-4 group-data-[collapsible=icon]:p-2">
        <div className="mb-6">
          <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
            <div className="h-9 w-9 rounded-lg bg-white flex items-center justify-center shadow-sm overflow-hidden">
              <img src={logo} alt="EV Service Logo" className="h-full w-full object-contain" />
            </div>
            <div className="group-data-[collapsible=icon]:hidden">
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
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      isActive={active}
                      tooltip={item.title}
                      className="relative data-[active=true]:bg-ev-green/10 data-[active=true]:text-ev-green hover:text-ev-green data-[active=true]:shadow-sm data-[active=true]:before:content-[''] data-[active=true]:before:absolute data-[active=true]:before:left-0 data-[active=true]:before:top-1 data-[active=true]:before:bottom-1 data-[active=true]:before:w-1 data-[active=true]:before:bg-ev-green"
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
