import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Wrench, Clock, CheckCircle, Battery, FileText } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext/useAuth";
import { useNavigate } from "react-router-dom";
import {
  getTechnicianScheduleApi,
  TechnicianScheduleParams,
  ScheduleItem,
  updateAppointmentStatusApi,
} from "@/lib/appointmentApi";

export const TechnicianOverview = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  // Lấy dữ liệu schedule của technician
  useEffect(() => {
    const fetchTechnicianSchedule = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);
        setError(null);

        // Lấy schedule trong 30 ngày gần đây
        const today = new Date();
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(today.getDate() + 30);

        const params: TechnicianScheduleParams = {
          technician_id: user.id,
          date_from: today.toISOString().split("T")[0],
          date_to: thirtyDaysFromNow.toISOString().split("T")[0],
        };

        const result = await getTechnicianScheduleApi(params);

        console.log("Technician Schedule API Response:", result);
        console.log("Technician ID:", user.id);
        console.log("Date range:", params.date_from, "to", params.date_to);

        if (result.ok && result.data?.success) {
          // Lấy schedules từ response - technician chỉ lấy schedule của chính mình
          const scheduleData = result.data.data;
          console.log("Schedule Data Structure:", scheduleData);

          // Kiểm tra cấu trúc response và lấy schedules
          const dataWithSchedules = scheduleData as unknown as {
            schedules?: ScheduleItem[];
          };
          if (
            dataWithSchedules.schedules &&
            Array.isArray(dataWithSchedules.schedules)
          ) {
            // Trường hợp response có schedules trực tiếp (TechnicianScheduleResponse)
            setSchedules(dataWithSchedules.schedules);
          } else if (scheduleData.items && scheduleData.items.length > 0) {
            // Trường hợp response có items array (TechnicianScheduleListResponse)
            setSchedules(scheduleData.items[0].schedules);
          } else {
            setSchedules([]);
          }
        } else {
          setError(result.message || "Không thể tải dữ liệu lịch làm việc");
        }
      } catch (err) {
        setError("Có lỗi xảy ra khi tải dữ liệu");
        console.error("Error fetching technician schedule:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTechnicianSchedule();
  }, [user?.id]);

  // Debug logging để kiểm tra schedules
  useEffect(() => {
    console.log("Schedules state updated:", schedules);
    console.log("Schedules length:", schedules.length);
  }, [schedules]);

  // Phân loại tasks theo status
  console.log("All schedules for filtering:", schedules);
  console.log(
    "Schedule statuses:",
    schedules.map((s) => s.status)
  );

  const assignedTasks = schedules
    .filter(
      (schedule) =>
        schedule.status === "assigned" || schedule.status === "pending"
    )
    .map((schedule) => ({
      id: schedule._id,
      vehicle: `${schedule.vehicle_id.brand} ${schedule.vehicle_id.model} - ${schedule.vehicle_id.license_plate}`,
      customer: schedule.user_id.fullName,
      service: schedule.service_type_id.service_name,
      priority: "medium", // Có thể thêm logic để xác định priority
      assignedDate: schedule.appoinment_date,
      estimatedHours:
        parseInt(schedule.service_type_id.estimated_duration) || 2,
      description: schedule.notes || "Không có mô tả chi tiết",
      estimatedCost: schedule.estimated_cost,
      centerName: schedule.center_id.center_name,
      centerAddress: schedule.center_id.address,
      customerPhone: schedule.user_id.phone,
      vehicleVin: (schedule.vehicle_id as { vin?: string })?.vin || "N/A",
      serviceDescription:
        (schedule.service_type_id as { description?: string })?.description ||
        "Không có mô tả",
    }));

  console.log("Assigned tasks:", assignedTasks);

  const inProgressTasks = schedules
    .filter(
      (schedule) =>
        schedule.status === "in_progress" || schedule.status === "working"
    )
    .map((schedule) => ({
      id: schedule._id,
      vehicle: `${schedule.vehicle_id.brand} ${schedule.vehicle_id.model} - ${schedule.vehicle_id.license_plate}`,
      customer: schedule.user_id.fullName,
      service: schedule.service_type_id.service_name,
      progress: 50, // Có thể thêm logic để tính progress thực tế
      startTime: schedule.appoinment_time,
      estimatedCompletion: schedule.estimated_end_time || "16:00",
      description: schedule.notes || "Không có mô tả chi tiết",
      estimatedCost: schedule.estimated_cost,
      centerName: schedule.center_id.center_name,
      centerAddress: schedule.center_id.address,
      customerPhone: schedule.user_id.phone,
      vehicleVin: (schedule.vehicle_id as { vin?: string })?.vin || "N/A",
      serviceDescription:
        (schedule.service_type_id as { description?: string })?.description ||
        "Không có mô tả",
    }));

  const completedTasks = schedules
    .filter(
      (schedule) =>
        schedule.status === "completed" || schedule.status === "done"
    )
    .map((schedule) => ({
      id: schedule._id,
      vehicle: `${schedule.vehicle_id.brand} ${schedule.vehicle_id.model} - ${schedule.vehicle_id.license_plate}`,
      customer: schedule.user_id.fullName,
      service: schedule.service_type_id.service_name,
      completedDate: schedule.appoinment_date,
      completedTime: schedule.appoinment_time,
      rating: 5, // Có thể thêm logic để lấy rating thực tế
      feedback: "Công việc hoàn thành tốt", // Có thể thêm logic để lấy feedback thực tế
      estimatedCost: schedule.estimated_cost,
      centerName: schedule.center_id.center_name,
      centerAddress: schedule.center_id.address,
      customerPhone: schedule.user_id.phone,
      vehicleVin: (schedule.vehicle_id as { vin?: string })?.vin || "N/A",
      serviceDescription:
        (schedule.service_type_id as { description?: string })?.description ||
        "Không có mô tả",
    }));

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-destructive";
      case "medium":
        return "bg-warning";
      case "low":
        return "bg-success";
      default:
        return "bg-muted";
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case "high":
        return "Cao";
      case "medium":
        return "Trung bình";
      case "low":
        return "Thấp";
      default:
        return priority;
    }
  };

  // Function để navigate đến trang task detail
  const handleViewDetails = (appointmentId: string) => {
    navigate(`/dashboard/technician/task/${appointmentId}`);
  };

  // Function để bắt đầu công việc (đổi status thành in_progress)
  const handleStartWork = async (appointmentId: string) => {
    try {
      setUpdating(true);
      const result = await updateAppointmentStatusApi({
        appointment_id: appointmentId,
        status: "in_progress",
      });

      if (result.ok && result.data?.success) {
        // Cập nhật local state
        setSchedules((prevSchedules) =>
          prevSchedules.map((schedule) =>
            schedule._id === appointmentId
              ? { ...schedule, status: "in_progress" }
              : schedule
          )
        );
        console.log("Đã bắt đầu công việc thành công");
      } else {
        setError(result.message || "Không thể bắt đầu công việc");
      }
    } catch (err) {
      setError("Có lỗi xảy ra khi bắt đầu công việc");
      console.error("Error starting work:", err);
    } finally {
      setUpdating(false);
    }
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-gradient-card border-0 shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10">
                <Clock className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Công việc được giao
                </p>
                <p className="text-2xl font-bold">{assignedTasks.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-0 shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Wrench className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Đang thực hiện</p>
                <p className="text-2xl font-bold">{inProgressTasks.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-0 shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10">
                <CheckCircle className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Hoàn thành tuần này
                </p>
                <p className="text-2xl font-bold">{completedTasks.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-0 shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-electric/10">
                <Battery className="h-5 w-5 text-electric" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Đánh giá trung bình
                </p>
                <p className="text-2xl font-bold">
                  {completedTasks.length > 0
                    ? (
                        completedTasks.reduce(
                          (sum, task) => sum + task.rating,
                          0
                        ) / completedTasks.length
                      ).toFixed(1)
                    : "0.0"}
                </p>
              </div>
            </div>
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
                className="bg-gradient-card border-0 shadow-soft">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold">{task.vehicle}</h4>
                        <Badge
                          className={`${getPriorityColor(
                            task.priority
                          )} text-white`}>
                          Ưu tiên {getPriorityText(task.priority)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">
                        Khách hàng: {task.customer}
                      </p>
                      <p className="text-sm font-medium mb-3">{task.service}</p>
                      <p className="text-sm text-muted-foreground mb-4">
                        {task.description}
                      </p>

                      <div className="grid grid-cols-2 gap-4 text-sm">
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
                      className="bg-primary text-primary-foreground"
                      onClick={() => handleStartWork(task.id)}
                      disabled={updating}>
                      {updating ? "Đang cập nhật..." : "Bắt đầu công việc"}
                    </Button>
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
                className="bg-gradient-card border-0 shadow-soft">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1">{task.vehicle}</h4>
                      <p className="text-sm text-muted-foreground mb-1">
                        Khách hàng: {task.customer}
                      </p>
                      <p className="text-sm font-medium mb-3">{task.service}</p>
                      <p className="text-sm text-muted-foreground mb-4">
                        {task.description}
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

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Tiến độ</span>
                          <span>{task.progress}%</span>
                        </div>
                        <Progress value={task.progress} className="h-2" />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      Cập nhật tiến độ
                    </Button>
                    <Button variant="outline" size="sm">
                      Gửi báo cáo
                    </Button>
                    <Button
                      className="bg-success text-success-foreground"
                      size="sm">
                      Hoàn thành
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
                className="bg-gradient-card border-0 shadow-soft">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold">{task.vehicle}</h4>
                        <Badge className="bg-success text-white">
                          Hoàn thành
                        </Badge>
                        <div className="flex items-center gap-1">
                          {[...Array(task.rating)].map((_, i) => (
                            <CheckCircle
                              key={i}
                              className="h-4 w-4 text-warning fill-current"
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">
                        Khách hàng: {task.customer}
                      </p>
                      <p className="text-sm font-medium mb-3">{task.service}</p>

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
