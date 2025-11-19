import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Wrench,
  Clock,
  CheckCircle,
  FileText,
  Hash,
  User,
  Bike,
  Calendar,
  Building2,
  Eye,
  DollarSign,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext/useAuth";
import { useNavigate } from "react-router-dom";
import {
  getAppointmentsApi,
  GetAppointmentsParams,
  Appointment,
} from "@/lib/appointmentApi";

function formatDate(date?: string) {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return date;
  return d.toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export const TechnicianOverview = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTechnicianAppointments = useCallback(async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      setError(null);
      const params: GetAppointmentsParams = {
        technicianId: user.id,
        page: 1,
        limit: 100,
      };
      const result = await getAppointmentsApi(params);
      if (result.ok && result.data?.success) {
        const data = result.data.data as {
          items?: Appointment[];
          appointments?: Appointment[];
        };
        const appointmentsData = (data.items ||
          data.appointments ||
          []) as Appointment[];
        setAppointments(appointmentsData);
      } else {
        setError(result.message || "Không thể tải danh sách appointments");
      }
    } catch (err) {
      setError("Có lỗi xảy ra khi tải dữ liệu");
      console.error("Error fetching technician appointments:", err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Lấy dữ liệu appointments của technician khi đăng nhập
  useEffect(() => {
    fetchTechnicianAppointments();
  }, [fetchTechnicianAppointments]);

  // Realtime: refresh on socket 'appointment_updated'
  useEffect(() => {
    let cleanup: (() => void) | undefined;
    (async () => {
      try {
        const { initializeSocket, onAppointmentUpdated } = await import(
          "@/lib/socket"
        );
        const socket = initializeSocket();
        if (user?.id) socket.emit("join", user.id);
        const handler = () => {
          fetchTechnicianAppointments();
        };
        onAppointmentUpdated(handler);
        cleanup = () => {
          try {
            socket.off("appointment_updated", handler);
          } catch {}
        };
      } catch (e) {
        console.error("Realtime subscribe error (TechnicianOverview):", e);
      }
    })();
    return () => {
      if (cleanup) cleanup();
    };
  }, [user?.id, fetchTechnicianAppointments]);

  // Helper function to get vehicle info
  const getVehicleInfo = (vehicle: any) => {
    if (!vehicle) return { brand: "", model: "", licensePlate: "" };
    const modelData =
      vehicle.model_id && typeof vehicle.model_id === "object"
        ? vehicle.model_id
        : null;
    return {
      brand: modelData?.brand || vehicle.brand || "",
      model: modelData?.model_name || vehicle.model || "",
      licensePlate: vehicle.license_plate || "",
      color: vehicle.color || "",
    };
  };

  // Helper function to get status badge
  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "assigned":
      case "pending":
        return {
          text: "Đã giao",
          className: "bg-amber-100 text-amber-800 border-amber-200",
        };
      case "check_in":
      case "in_progress":
        return {
          text: "Đang thực hiện",
          className: "bg-blue-100 text-blue-800 border-blue-200",
        };
      case "completed":
      case "done":
        return {
          text: "Đã hoàn thành",
          className: "bg-emerald-100 text-emerald-800 border-emerald-200",
        };
      default:
        return {
          text: status || "N/A",
          className: "bg-muted text-muted-foreground",
        };
    }
  };

  // Phân loại tasks theo status
  const assignedTasks = appointments
    .filter(
      (appointment) =>
        appointment.status === "assigned" || appointment.status === "pending"
    )
    .map((appointment) => {
      const vehicleInfo = getVehicleInfo(appointment.vehicle_id);
      return {
        id: appointment._id,
        appointment,
        vehicleInfo,
        customer: appointment.user_id?.fullName || "N/A",
        customerEmail: appointment.user_id?.email || "N/A",
        customerPhone: appointment.user_id?.phoneNumber || "",
        service: appointment.service_type_id?.service_name || "N/A",
        serviceDescription:
          appointment.service_type_id?.description || "Không có mô tả",
        assignedDate: formatDate(appointment.appoinment_date) || "",
        appointmentTime: appointment.appoinment_time || "",
        estimatedHours:
          parseInt(appointment.service_type_id?.estimated_duration || "2") || 2,
        estimatedCost: appointment.service_type_id?.base_price,
        centerName:
          appointment.center_id?.center_name ||
          appointment.center_id?.name ||
          "N/A",
        centerAddress: appointment.center_id?.address || "N/A",
        depositCost: appointment.deposit_cost,
        finalCost: appointment.final_cost,
      };
    });

  const inProgressTasks = appointments
    .filter(
      (appointment) =>
        appointment.status === "in_progress" ||
        appointment.status === "check_in"
    )
    .map((appointment) => {
      const vehicleInfo = getVehicleInfo(appointment.vehicle_id);
      return {
        id: appointment._id,
        appointment,
        vehicleInfo,
        customer: appointment.user_id?.fullName || "N/A",
        customerEmail: appointment.user_id?.email || "N/A",
        customerPhone: appointment.user_id?.phoneNumber || "",
        service: appointment.service_type_id?.service_name || "N/A",
        serviceDescription:
          appointment.service_type_id?.description || "Không có mô tả",
        startTime: appointment.appoinment_time || "",
        estimatedCompletion: appointment.estimated_end_time || "16:00",
        estimatedCost: appointment.service_type_id?.base_price,
        centerName:
          appointment.center_id?.center_name ||
          appointment.center_id?.name ||
          "N/A",
        centerAddress: appointment.center_id?.address || "N/A",
        depositCost: appointment.deposit_cost,
        finalCost: appointment.final_cost,
      };
    });

  const completedTasks = appointments
    .filter((appointment) => appointment.status === "completed")
    .map((appointment) => {
      const vehicleInfo = getVehicleInfo(appointment.vehicle_id);
      return {
        id: appointment._id,
        appointment,
        vehicleInfo,
        customer: appointment.user_id?.fullName || "N/A",
        customerEmail: appointment.user_id?.email || "N/A",
        customerPhone: appointment.user_id?.phoneNumber || "",
        service: appointment.service_type_id?.service_name || "N/A",
        serviceDescription:
          appointment.service_type_id?.description || "Không có mô tả",
        completedDate: formatDate(appointment.appoinment_date) || "",
        completedTime: appointment.appoinment_time || "",
        estimatedCost: appointment.service_type_id?.base_price,
        centerName:
          appointment.center_id?.center_name ||
          appointment.center_id?.name ||
          "N/A",
        centerAddress: appointment.center_id?.address || "N/A",
        depositCost: appointment.deposit_cost,
        finalCost: appointment.final_cost,
      };
    });

  // Function để navigate đến trang task detail
  const handleViewDetails = (appointmentId: string) => {
    navigate(`/dashboard/technician/task/${appointmentId}`);
  };

  // Render card component
  const renderTaskCard = (task: any) => {
    const shortId = task.id ? task.id.slice(-4).toUpperCase() : "N/A";
    const statusBadge = getStatusBadge(task.appointment?.status);
    return (
      <Card
        key={task.id}
        className="bg-card border-2 rounded-xl shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden">
        {/* Header with ID and Status */}
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-primary/10 px-3 py-1.5 rounded-lg border border-primary/20">
                <Hash className="h-4 w-4 text-primary" />
                <span className="font-bold text-lg text-primary font-mono">
                  {shortId}
                </span>
              </div>
              <Badge
                className={`text-xs px-2.5 py-1 font-semibold border ${statusBadge.className}`}>
                {statusBadge.text}
              </Badge>
            </div>
            {(task.assignedDate || task.completedDate) && (
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Ngày</p>
                <p className="text-sm font-semibold">
                  {task.assignedDate || task.completedDate}
                </p>
              </div>
            )}
          </div>
        </div>

        <CardContent className="p-6">
          {/* Key Information Grid */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {/* Customer */}
            <div className="flex items-start gap-3 p-3 bg-blue-50/50 dark:bg-blue-950/20 rounded-lg border border-blue-200/50">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <User className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground mb-1">Khách hàng</p>
                <p className="text-sm font-semibold text-foreground truncate">
                  {task.customer}
                </p>
                {task.customerEmail !== "N/A" && (
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {task.customerEmail}
                  </p>
                )}
              </div>
            </div>

            {/* Vehicle */}
            {(task.vehicleInfo.brand ||
              task.vehicleInfo.model ||
              task.vehicleInfo.licensePlate) && (
              <div className="flex items-start gap-3 p-3 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-lg border border-emerald-200/50">
                <div className="p-2 bg-emerald-500/10 rounded-lg">
                  <Bike className="h-4 w-4 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground mb-1">
                    Phương tiện
                  </p>
                  {(task.vehicleInfo.brand || task.vehicleInfo.model) && (
                    <p className="text-sm font-semibold text-foreground">
                      {[task.vehicleInfo.brand, task.vehicleInfo.model]
                        .filter(Boolean)
                        .join(" ")}
                    </p>
                  )}
                  {task.vehicleInfo.licensePlate && (
                    <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400 mt-1">
                      {task.vehicleInfo.licensePlate}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Service */}
            <div className="flex items-start gap-3 p-3 bg-purple-50/50 dark:bg-purple-950/20 rounded-lg border border-purple-200/50">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Wrench className="h-4 w-4 text-purple-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground mb-1">Dịch vụ</p>
                <p className="text-sm font-semibold text-foreground truncate">
                  {task.service}
                </p>
              </div>
            </div>

            {/* Center */}
            <div className="flex items-start gap-3 p-3 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-lg border border-indigo-200/50">
              <div className="p-2 bg-indigo-500/10 rounded-lg">
                <Building2 className="h-4 w-4 text-indigo-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground mb-1">Trung tâm</p>
                <p className="text-sm font-semibold text-foreground truncate">
                  {task.centerName}
                </p>
              </div>
            </div>
          </div>

          {/* Service Description */}
          {task.serviceDescription && (
            <div className="mb-4 p-4 bg-primary/5 rounded-lg border-l-4 border-primary">
              <p className="text-xs text-muted-foreground mb-1">
                Mô tả dịch vụ
              </p>
              <p className="text-sm font-medium">{task.serviceDescription}</p>
            </div>
          )}

          {/* Additional Info */}
          <div className="pt-4 border-t space-y-2">
            <div className="grid grid-cols-3 gap-3 text-xs">
              {(task.appointmentTime ||
                task.startTime ||
                task.completedTime) && (
                <div>
                  <p className="text-muted-foreground">Giờ</p>
                  <p className="font-medium">
                    {task.appointmentTime ||
                      task.startTime ||
                      task.completedTime}
                  </p>
                </div>
              )}
              {task.estimatedHours && (
                <div>
                  <p className="text-muted-foreground">Thời gian dự kiến</p>
                  <p className="font-medium">{task.estimatedHours} giờ</p>
                </div>
              )}
              {(task.estimatedCost || task.finalCost) && (
                <div>
                  <p className="text-muted-foreground">
                    {task.finalCost ? "Chi phí cuối" : "Chi phí dự kiến"}
                  </p>
                  <p className="font-medium">
                    {(task.finalCost || task.estimatedCost)?.toLocaleString(
                      "vi-VN"
                    )}{" "}
                    VNĐ
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Action Button */}
          <div className="flex gap-2 mt-6 pt-4 border-t">
            <Button
              variant="default"
              size="sm"
              onClick={() => handleViewDetails(task.id)}
              className="flex-1">
              <Eye className="h-4 w-4 mr-2" />
              Xem chi tiết
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Loading state
  if (loading) {
    return (
      <main className="flex-1 p-6 bg-background">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">Dashboard Kỹ thuật viên</h2>
          <p className="text-muted-foreground">
            Quản lý công việc được giao và tiến độ thực hiện
          </p>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Đang tải dữ liệu...</p>
          </div>
        </div>
      </main>
    );
  }

  // Error state
  if (error) {
    return (
      <main className="flex-1 p-6 bg-background">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">Dashboard Kỹ thuật viên</h2>
          <p className="text-muted-foreground">
            Quản lý công việc được giao và tiến độ thực hiện
          </p>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>Thử lại</Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 p-6 bg-background">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Dashboard Kỹ thuật viên</h2>
        <p className="text-muted-foreground">
          Quản lý công việc được giao và tiến độ thực hiện
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Công việc được giao
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assignedTasks.length}</div>
            <p className="text-xs text-muted-foreground">Tổng số nhiệm vụ</p>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Đang thực hiện
            </CardTitle>
            <Wrench className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inProgressTasks.length}</div>
            <p className="text-xs text-muted-foreground">Đang xử lý</p>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Hoàn thành tuần này
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedTasks.length}</div>
            <p className="text-xs text-muted-foreground">Trong 7 ngày qua</p>
          </CardContent>
        </Card>

        {/* <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Đánh giá trung bình
            </CardTitle>
            <Battery className="h-4 w-4 text-electric" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {completedTasks.length > 0
                ? (
                    completedTasks.reduce((sum, task) => sum + task.rating, 0) /
                    completedTasks.length
                  ).toFixed(1)
                : "0.0"}
            </div>
            <p className="text-xs text-muted-foreground">
              Từ phản hồi khách hàng
            </p>
          </CardContent>
        </Card> */}
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="assigned" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:grid-cols-3">
          <TabsTrigger value="assigned" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Công việc được giao
          </TabsTrigger>
          <TabsTrigger value="progress" className="flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            Đang thực hiện
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Đã hoàn thành
          </TabsTrigger>
        </TabsList>

        {/* Assigned Tasks */}
        <TabsContent value="assigned" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              Công việc được giao ({assignedTasks.length})
            </h3>
          </div>

          <div className="grid gap-4">
            {assignedTasks.map((task) => renderTaskCard(task))}
          </div>
        </TabsContent>

        {/* In Progress Tasks */}
        <TabsContent value="progress" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              Đang thực hiện ({inProgressTasks.length})
            </h3>
          </div>

          <div className="grid gap-4">
            {inProgressTasks.map((task) => renderTaskCard(task))}
          </div>
        </TabsContent>

        {/* Completed Tasks */}
        <TabsContent value="completed" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Đã hoàn thành gần đây</h3>
          </div>

          <div className="grid gap-4">
            {completedTasks.map((task) => renderTaskCard(task))}
          </div>
        </TabsContent>
      </Tabs>
    </main>
  );
};
