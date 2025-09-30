import { useState } from "react";
import { AdminSidebar } from "@/components/dashboard/sidebars/AdminSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  Car,
  Calendar,
  Clock,
  DollarSign,
  TrendingUp,
  Activity,
  Bell,
  Plus,
  Search,
  Filter,
  BarChart3,
  FileText,
} from "lucide-react";

// interface User {
//   name: string;
//   role: string;
// }

// interface AdminDashboardProps {
//   user: User;
//   onLogout: () => void;
// }
// { user, onLogout }: AdminDashboardProps

export const AdminDashboard = () => {
  // Mock data for admin dashboard
  const overviewStats = [
    {
      title: "Tổng khách hàng",
      value: "2,847",
      change: "+12%",
      changeType: "increase",
      icon: Users,
      color: "bg-primary",
    },
    {
      title: "Xe đang bảo dưỡng",
      value: "157",
      change: "-5%",
      changeType: "decrease",
      icon: Car,
      color: "bg-warning",
    },
    {
      title: "Lịch hẹn hôm nay",
      value: "34",
      change: "-3%",
      changeType: "decrease",
      icon: Calendar,
      color: "bg-electric",
    },
    {
      title: "Doanh thu tháng",
      value: "đ847.2M",
      change: "+18%",
      changeType: "increase",
      icon: DollarSign,
      color: "bg-success",
    },
  ];

  const recentAppointments = [
    {
      id: 1,
      time: "09:00",
      customer: "Nguyễn Văn A",
      vehicle: "Tesla Model 3 - 59A-123.45",
      service: "Bảo dưỡng định kỳ",
      technician: "Trần Văn B",
      status: "Đang thực hiện",
    },
    {
      id: 2,
      time: "10:30",
      customer: "Lê Thị C",
      vehicle: "VinFast VF8 - 30G-789.12",
      service: "Thay pin xe",
      technician: "Nguyễn Văn D",
      status: "Chờ xử lý",
    },
  ];

  const topTechnicians = [
    {
      id: 1,
      name: "Trần Văn B",
      completedTasks: 23,
      rating: 4.8,
      efficiency: "95%",
    },
    {
      id: 2,
      name: "Nguyễn Văn D",
      completedTasks: 19,
      rating: 4.6,
      efficiency: "88%",
    },
    {
      id: 3,
      name: "Võ Thị F",
      completedTasks: 21,
      rating: 4.9,
      efficiency: "92%",
    },
  ];

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AdminSidebar />

        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="bg-card border-b border-border/50 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-semibold">
                   Chào mừng trở lại,{/* {user.name} */}
                </h1>
                <p className="text-sm text-muted-foreground">
                  Theo dõi hoạt động trung tâm dịch vụ EV
                </p>
              </div>
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon">
                  <Bell className="h-5 w-5" />
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-destructive rounded-full text-xs text-white flex items-center justify-center">
                    3
                  </span>
                </Button>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                    A
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{/* {user.name} */}</p>
                    <p className="text-sm text-muted-foreground capitalize">
                      {/* {user.role} */}
                    </p>
                  </div>
                </div>
                <Button variant="outline" >
                  Đăng xuất 
                </Button>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-6 bg-background">
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2">Tổng quan hệ thống</h2>
              <p className="text-muted-foreground">
                Theo dõi hoạt động trung tâm dịch vụ EV
              </p>
            </div>

            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              {overviewStats.map((stat, index) => (
                <Card
                  key={index}
                  className="bg-gradient-card border-0 shadow-soft">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className={`p-2 rounded-lg ${stat.color}/10`}>
                        <stat.icon
                          className={`h-5 w-5 ${stat.color.replace(
                            "bg-",
                            "text-"
                          )}`}
                        />
                      </div>
                      <Badge
                        variant={
                          stat.changeType === "increase"
                            ? "default"
                            : "destructive"
                        }
                        className="text-xs">
                        {stat.change} từ tháng trước
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {stat.title}
                      </p>
                      <p className="text-2xl font-bold">{stat.value}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Appointments */}
              <Card className="bg-gradient-card border-0 shadow-soft">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Lịch hẹn gần đây
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentAppointments.map((appointment) => (
                      <div
                        key={appointment.id}
                        className="flex items-center gap-4 p-4 border rounded-lg bg-background/50">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
                            <Clock className="h-4 w-4 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium">
                                {appointment.time}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                {appointment.customer}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground truncate">
                              {appointment.vehicle}
                            </p>
                            <p className="text-sm">{appointment.service}</p>
                            <p className="text-xs text-muted-foreground">
                              KTV: {appointment.technician}
                            </p>
                          </div>
                        </div>
                        <Badge
                          className={
                            appointment.status === "Đang thực hiện"
                              ? "bg-warning text-white"
                              : "bg-pending text-white"
                          }>
                          {appointment.status}
                        </Badge>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8">
                            <FileText className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button variant="outline" className="w-full mt-4">
                    Xem tất cả lịch hẹn
                  </Button>
                </CardContent>
              </Card>

              {/* Top Technicians */}
              <Card className="bg-gradient-card border-0 shadow-soft">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Hiệu suất kỹ thuật viên
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {topTechnicians.map((tech, index) => (
                      <div
                        key={tech.id}
                        className="flex items-center gap-4 p-4 border rounded-lg bg-background/50">
                        <div className="flex items-center gap-3 flex-1">
                          <div
                            className={`w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium flex-shrink-0`}>
                            {tech.name.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium">{tech.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {tech.completedTasks} công việc hoàn thành
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1 mb-1">
                            <span className="text-sm font-medium">⭐</span>
                            <span className="text-sm font-medium">
                              {tech.rating}
                            </span>
                          </div>
                          <Badge className="bg-success text-white text-xs">
                            {tech.efficiency}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button variant="outline" className="w-full mt-4">
                    Xem báo cáo chi tiết
                  </Button>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};
