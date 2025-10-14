import { Wrench, Clock, Car, FileText, Home } from "lucide-react";

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

const technicianMenuItems = [
  { title: "Tổng quan", icon: Home, isActive: true },
  { title: "Công việc được giao", icon: FileText },
  { title: "Bảo dưỡng đang thực hiện", icon: Wrench },
  { title: "Lịch sử hoàn thành", icon: Clock },
];

export function TechnicianSidebar() {
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
          <SidebarGroupLabel>Bảng điều khiển Kỹ thuật viên</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {technicianMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    className={
                      item.isActive ? "bg-primary text-primary-foreground" : ""
                    }>
                    <button className="w-full flex items-center gap-3 p-2 text-left hover:bg-accent rounded-md">
                      <item.icon className="h-4 w-4" />
                      <span className="text-sm">{item.title}</span>
                    </button>
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
