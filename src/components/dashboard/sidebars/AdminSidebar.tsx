import { ChevronRight, LogOut, Search } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@radix-ui/react-collapsible";
import { Button } from "@/components/ui/button";
import { adminMenuItems } from "@/constants/adminMenuList";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import logo from "@/assets/logo.png";

export function AdminSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("role");
    setTimeout(() => {
      navigate("/login");
    }, 1000);
  };

  const handleConfirmLogout = () => {
    setIsDialogOpen(false);
    handleLogout();
  };

  const highlightText = (text: string, query: string) => {
    if (!query) return text;
    const regex = new RegExp(`(${query})`, "gi");
    const parts = text.split(regex);
    return parts.map((part, index) =>
      regex.test(part) ? (
        <span key={index} className="bg-yellow-300 text-green-600 px-1 rounded">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  const filteredMenuItems = adminMenuItems
    .filter((item) => {
      const matchesTitle = item.title
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesSubItems = item.items?.some((subItem) =>
        subItem.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
      return matchesTitle || matchesSubItems;
    })
    .map((item) => ({
      ...item,
      items: item.items?.filter((subItem) =>
        subItem.title.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    }));

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/dashboard/admin">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-white shadow-sm overflow-hidden">
                  <img
                    src={logo}
                    alt="EV Service Logo"
                    className="h-full w-full object-contain"
                  />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">EV Service</span>
                  <span className="truncate text-xs text-muted-foreground">
                    Management System
                  </span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <div className="px-4 py-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm menu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Bảng điều khiển Quản trị viên</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredMenuItems.map((item) => {
                const isItemActive = item.href === location.pathname;

                return (
                  <Collapsible
                    key={item.title}
                    asChild
                    {...(searchQuery && item.items && item.items.length > 0
                      ? { open: true }
                      : {})}
                    className="group/collapsible">
                    <SidebarMenuItem>
                      {item.items && item.items.length > 0 ? (
                        <>
                          <CollapsibleTrigger asChild>
                            <SidebarMenuButton
                              tooltip={item.title}
                              className="hover:bg-ev-green hover:text-white transition-colors duration-200 py-3 px-4 text-base">
                              {item.icon && <item.icon className="h-5 w-5" />}
                              <span>
                                {highlightText(item.title, searchQuery)}
                              </span>
                              <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                            </SidebarMenuButton>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <SidebarMenuSub>
                              {item.items.map((subItem) => {
                                const isSubActive =
                                  subItem.href === location.pathname;

                                return (
                                  <SidebarMenuSubItem key={subItem.title}>
                                    <SidebarMenuSubButton asChild>
                                      <NavLink
                                        to={subItem.href}
                                        className={`hover:bg-ev-green/20 hover:text-ev-green transition-colors duration-200 py-2 px-4 ${
                                          isSubActive
                                            ? "bg-ev-green text-white"
                                            : ""
                                        }`}>
                                        <span>
                                          {highlightText(
                                            subItem.title,
                                            searchQuery
                                          )}
                                        </span>
                                      </NavLink>
                                    </SidebarMenuSubButton>
                                  </SidebarMenuSubItem>
                                );
                              })}
                            </SidebarMenuSub>
                          </CollapsibleContent>
                        </>
                      ) : (
                        <SidebarMenuButton asChild>
                          <NavLink
                            to={item.href!}
                            className={`hover:bg-ev-green hover:text-white transition-colors duration-200 py-3 px-4 text-base flex items-center ${
                              isItemActive ? "bg-ev-green text-white" : ""
                            }`}>
                            {item.icon && (
                              <item.icon className="h-5 w-5 mr-2" />
                            )}
                            <span>
                              {highlightText(item.title, searchQuery)}
                            </span>
                          </NavLink>
                        </SidebarMenuButton>
                      )}
                    </SidebarMenuItem>
                  </Collapsible>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full" variant="outline">
                  <LogOut className="mr-2 h-4 w-4" />
                  Đăng xuất
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Xác nhận đăng xuất</DialogTitle>
                  <DialogDescription>
                    Bạn có chắc chắn muốn đăng xuất khỏi hệ thống không? Hành
                    động này sẽ kết thúc phiên làm việc hiện tại.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}>
                    Hủy
                  </Button>
                  <Button onClick={handleConfirmLogout}>Xác nhận</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
