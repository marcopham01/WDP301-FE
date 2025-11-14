import { Wrench, Clock, FileText, Home } from "lucide-react";

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
import logo from "@/assets/logo.png";

const technicianMenuItems = [
  { title: "Tổng quan", icon: Home, isActive: true },
];

export function TechnicianSidebar() {
  return (
    <Sidebar className="w-64 border-r bg-card" collapsible="icon">
      <SidebarContent className="p-4 group-data-[collapsible=icon]:p-2">
        <div className="mb-6">
          <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
            <div className="h-9 w-9 rounded-lg bg-white flex items-center justify-center shadow-sm overflow-hidden">
              <img src={logo} alt="EV Service Logo" className="h-full w-full object-contain" />
            </div>
            <div className="group-data-[collapsible=icon]:hidden">
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
                    tooltip={item.title}
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
