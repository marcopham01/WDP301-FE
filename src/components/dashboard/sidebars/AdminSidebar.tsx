import {
  BarChart3,
  Users,
  Car,
  Settings,
  FileText,
  DollarSign,
  Home,
  MapPin,
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
import { NavLink } from "react-router-dom";

const adminMenuItems = [
  { title: "Tổng quan", icon: Home, href: "/dashboard/admin" },
  {
    title: "Quản lý trung tâm",
    icon: MapPin,
    href: "/dashboard/admin/service-centers",
  },
  {
    title: "Quản lý dịch vụ",
    icon: Settings,
    href: "/dashboard/admin/services",
  },
  { title: "Quản lý khách hàng", icon: Users },
  { title: "Quản lý phương tiện", icon: Car },
  { title: "Quản lý lịch hẹn", icon: FileText },
  { title: "Quản lý kỹ thuật viên", icon: Users },
  { title: "Quản lý phụ tùng", icon: Settings },
  { title: "Báo cáo & Thống kê", icon: BarChart3 },
  { title: "Quản lý tài chính", icon: DollarSign },
];

export function AdminSidebar() {
  return (
    <Sidebar className="w-64 border-r bg-card">
      <SidebarContent className="p-4">
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary text-primary-foreground">
              <Car className="h-6 w-6" />
            </div>
            <div>
              <h2 className="font-semibold text-lg">EV Service</h2>
              <p className="text-sm text-muted-foreground">Management System</p>
            </div>
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Bảng điều khiển Quản trị viên</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    {item.href ? (
                      <NavLink
                        to={item.href}
                        className={({ isActive }) =>
                          `w-full flex items-center gap-3 p-2 text-left rounded-md ${
                            isActive
                              ? "bg-primary text-primary-foreground"
                              : "hover:bg-accent"
                          }`
                        }>
                        <item.icon className="h-4 w-4" />
                        <span className="text-sm">{item.title}</span>
                      </NavLink>
                    ) : (
                      <button className="w-full flex items-center gap-3 p-2 text-left hover:bg-accent rounded-md">
                        <item.icon className="h-4 w-4" />
                        <span className="text-sm">{item.title}</span>
                      </button>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
