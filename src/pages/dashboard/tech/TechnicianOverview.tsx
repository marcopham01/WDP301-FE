import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wrench, Clock, CheckCircle, Battery, FileText } from "lucide-react";
import { useState, useEffect } from "react";
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

  // Lấy dữ liệu appointments của technician khi đăng nhập
  useEffect(() => {
    const fetchTechnicianAppointments = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);
        setError(null);

        const params: GetAppointmentsParams = {
          technicianId: user.id,
          page: 1,
          limit: 100, // Lấy nhiều appointments để hiển thị
        };

        const result = await getAppointmentsApi(params);

        console.log("Technician Appointments API Response:", result);
        console.log("Technician ID:", user.id);

        if (result.ok && result.data?.success) {
          // Backend trả về items hoặc appointments
          const data = result.data.data as {
            items?: Appointment[];
            appointments?: Appointment[];
          };
          const appointmentsData = (data.items ||
            data.appointments ||
            []) as Appointment[];
          setAppointments(appointmentsData);
          console.log("Appointments loaded:", appointmentsData.length);
          console.log("Appointments data:", appointmentsData);
        } else {
          setError(result.message || "Không thể tải danh sách appointments");
        }
      } catch (err) {
        setError("Có lỗi xảy ra khi tải dữ liệu");
        console.error("Error fetching technician appointments:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTechnicianAppointments();
  }, [user?.id]);

  // Phân loại tasks theo status
  const assignedTasks = appointments
    .filter(
      (appointment) =>
        appointment.status === "assigned" || appointment.status === "pending"
    )
    .map((appointment) => ({
      id: appointment._id,
      vehicle: `${appointment.vehicle_id?.brand || ""} ${
        appointment.vehicle_id?.model || ""
      } - ${appointment.vehicle_id?.license_plate || ""}`,
      licensePlate: appointment.vehicle_id?.license_plate || "",
      customer: appointment.user_id?.fullName || "N/A",
      service: appointment.service_type_id?.service_name || "N/A",
      serviceDescription:
        appointment.service_type_id?.description || "Không có mô tả",
      assignedDate: formatDate(appointment.appoinment_date) || "",
      estimatedHours:
        parseInt(appointment.service_type_id?.estimated_duration || "2") || 2,
      description: appointment.notes || "Không có mô tả chi tiết",
      estimatedCost: appointment.service_type_id?.base_price,
      centerName:
        appointment.center_id?.center_name ||
        appointment.center_id?.name ||
        "N/A",
      centerAddress: appointment.center_id?.address || "N/A",
      customerEmail: appointment.user_id?.email || "N/A",
      vehicleVin: appointment.vehicle_id?.vin || "N/A",
    }));

  const inProgressTasks = appointments
    .filter(
      (appointment) =>
        appointment.status === "in_progress" ||
        appointment.status === "check_in"
    )
    .map((appointment) => ({
      id: appointment._id,
      vehicle: `${appointment.vehicle_id?.brand || ""} ${
        appointment.vehicle_id?.model || ""
      } - ${appointment.vehicle_id?.license_plate || ""}`,
      licensePlate: appointment.vehicle_id?.license_plate || "",
      customer: appointment.user_id?.fullName || "N/A",
      service: appointment.service_type_id?.service_name || "N/A",
      serviceDescription:
        appointment.service_type_id?.description || "Không có mô tả",
      progress: 50,
      startTime: appointment.appoinment_time || "",
      estimatedCompletion: appointment.estimated_end_time || "16:00",
      description: appointment.notes || "Không có mô tả chi tiết",
      estimatedCost: appointment.service_type_id?.base_price,
      centerName:
        appointment.center_id?.center_name ||
        appointment.center_id?.name ||
        "N/A",
      centerAddress: appointment.center_id?.address || "N/A",
      customerEmail: appointment.user_id?.email || "N/A",
      vehicleVin: appointment.vehicle_id?.vin || "N/A",
    }));

  const completedTasks = appointments
    .filter(
      (appointment) =>
        appointment.status === "completed" || appointment.status === "repaired"
    )
    .map((appointment) => ({
      id: appointment._id,
      vehicle: `${appointment.vehicle_id?.brand || ""} ${
        appointment.vehicle_id?.model || ""
      } - ${appointment.vehicle_id?.license_plate || ""}`,
      licensePlate: appointment.vehicle_id?.license_plate || "",
      customer: appointment.user_id?.fullName || "N/A",
      service: appointment.service_type_id?.service_name || "N/A",
      serviceDescription:
        appointment.service_type_id?.description || "Không có mô tả",
      completedDate: formatDate(appointment.appoinment_date) || "",
      completedTime: appointment.appoinment_time || "",
      rating: 5,
      feedback: "Công việc hoàn thành tốt",
      estimatedCost: appointment.service_type_id?.base_price,
      centerName:
        appointment.center_id?.center_name ||
        appointment.center_id?.name ||
        "N/A",
      centerAddress: appointment.center_id?.address || "N/A",
      customerEmail: appointment.user_id?.email || "N/A",
      vehicleVin: appointment.vehicle_id?.vin || "N/A",
    }));

  // Function để navigate đến trang task detail
  const handleViewDetails = (appointmentId: string) => {
    navigate(`/dashboard/technician/task/${appointmentId}`);
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
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

        <Card className="border shadow-sm">
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
        </Card>
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
            {assignedTasks.map((task) => (
              <Card
                key={task.id}
                className="bg-card border rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <h4 className="font-semibold text-lg">
                            {task.service}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {task.serviceDescription}
                          </p>
                        </div>
                      </div>

                      <p className="text-sm font-medium mt-3">
                        Phương tiện: {task.vehicle}
                      </p>
                      <p className="text-sm text-muted-foreground mb-1">
                        Khách hàng: {task.customer} • Liên hệ:{" "}
                        {task.customerEmail}
                      </p>

                      <div className="grid grid-cols-2 gap-4 text-sm mt-3">
                        <div>
                          <p className="text-muted-foreground">Ngày giao</p>
                          <p className="font-medium">{task.assignedDate}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">
                            Thời gian dự kiến
                          </p>
                          <p className="font-medium">
                            {task.estimatedHours} giờ
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">
                            Chi phí dự kiến
                          </p>
                          <p className="font-medium">
                            {task.estimatedCost?.toLocaleString("vi-VN")} VNĐ
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Trung tâm</p>
                          <p className="font-medium">{task.centerName}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetails(task.id)}>
                      Xem chi tiết
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
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
            {inProgressTasks.map((task) => (
              <Card
                key={task.id}
                className="bg-card border rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg">{task.service}</h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        {task.serviceDescription}
                      </p>

                      <p className="text-sm font-medium">
                        Phương tiện: {task.vehicle}
                      </p>
                      <p className="text-sm text-muted-foreground mb-4">
                        Khách hàng: {task.customer} • Liên hệ:{" "}
                        {task.customerEmail}
                      </p>

                      <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                        <div>
                          <p className="text-muted-foreground">Bắt đầu</p>
                          <p className="font-medium">{task.startTime}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">
                            Dự kiến hoàn thành
                          </p>
                          <p className="font-medium">
                            {task.estimatedCompletion}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">
                            Chi phí dự kiến
                          </p>
                          <p className="font-medium">
                            {task.estimatedCost?.toLocaleString("vi-VN")} VNĐ
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Trung tâm</p>
                          <p className="font-medium">{task.centerName}</p>
                        </div>
                      </div>

                      {/* Removed progress section per request */}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetails(task.id)}>
                      Xem chi tiết
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Completed Tasks */}
        <TabsContent value="completed" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Đã hoàn thành gần đây</h3>
          </div>

          <div className="grid gap-4">
            {completedTasks.map((task) => (
              <Card
                key={task.id}
                className="bg-card border rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold text-lg">
                          {task.service}
                        </h4>
                        <Badge className="bg-success text-white">
                          Hoàn thành
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {task.serviceDescription}
                      </p>

                      <p className="text-sm text-muted-foreground mb-1">
                        Khách hàng: {task.customer} • Liên hệ:{" "}
                        {task.customerEmail}
                      </p>

                      <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                        <div>
                          <p className="text-muted-foreground">Hoàn thành</p>
                          <p className="font-medium">
                            {task.completedDate} - {task.completedTime}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Đánh giá</p>
                          <p className="font-medium">{task.rating}/5 sao</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Chi phí</p>
                          <p className="font-medium">
                            {task.estimatedCost?.toLocaleString("vi-VN")} VNĐ
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Trung tâm</p>
                          <p className="font-medium">{task.centerName}</p>
                        </div>
                      </div>

                      {task.feedback && (
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <p className="text-sm text-muted-foreground mb-1">
                            Phản hồi từ khách hàng:
                          </p>
                          <p className="text-sm italic">"{task.feedback}"</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetails(task.id)}>
                      Xem chi tiết
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </main>
  );
};
