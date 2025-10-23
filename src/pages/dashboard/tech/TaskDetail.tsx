import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Car,
  MapPin,
  Wrench,
  DollarSign,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext/useAuth";
import {
  getTechnicianScheduleApi,
  TechnicianScheduleParams,
  ScheduleItem,
  updateAppointmentStatusApi,
} from "@/lib/appointmentApi";

export const TaskDetail = () => {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [schedule, setSchedule] = useState<ScheduleItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  // Lấy thông tin chi tiết appointment
  useEffect(() => {
    const fetchAppointmentDetail = async () => {
      if (!user?.id || !appointmentId) return;

      try {
        setLoading(true);
        setError(null);

        // Lấy schedule trong 30 ngày gần đây để tìm appointment
        const today = new Date();
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(today.getDate() + 30);

        const params: TechnicianScheduleParams = {
          technician_id: user.id,
          date_from: today.toISOString().split("T")[0],
          date_to: thirtyDaysFromNow.toISOString().split("T")[0],
        };

        const result = await getTechnicianScheduleApi(params);

        if (result.ok && result.data?.success) {
          const scheduleData = result.data.data;
          const dataWithSchedules = scheduleData as unknown as {
            schedules?: ScheduleItem[];
          };

          let schedules: ScheduleItem[] = [];
          if (
            dataWithSchedules.schedules &&
            Array.isArray(dataWithSchedules.schedules)
          ) {
            schedules = dataWithSchedules.schedules;
          } else if (scheduleData.items && scheduleData.items.length > 0) {
            schedules = scheduleData.items[0].schedules;
          }

          // Tìm appointment theo ID
          const foundSchedule = schedules.find((s) => s._id === appointmentId);
          if (foundSchedule) {
            setSchedule(foundSchedule);
          } else {
            setError("Không tìm thấy thông tin appointment");
          }
        } else {
          setError(result.message || "Không thể tải dữ liệu appointment");
        }
      } catch (err) {
        setError("Có lỗi xảy ra khi tải dữ liệu");
        console.error("Error fetching appointment detail:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointmentDetail();
  }, [user?.id, appointmentId]);

  // Function để bắt đầu công việc (đổi status thành in_progress)
  const handleStartWork = async () => {
    if (!appointmentId) return;

    try {
      setUpdating(true);
      const result = await updateAppointmentStatusApi({
        appointment_id: appointmentId,
        status: "in_progress",
      });

      if (result.ok && result.data?.success) {
        // Cập nhật local state
        if (schedule) {
          setSchedule({ ...schedule, status: "in_progress" });
        }
        // Có thể thêm toast notification ở đây
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

  // Function để hoàn thành công việc
  const handleCompleteWork = async () => {
    if (!appointmentId) return;

    try {
      setUpdating(true);
      const result = await updateAppointmentStatusApi({
        appointment_id: appointmentId,
        status: "completed",
      });

      if (result.ok && result.data?.success) {
        // Cập nhật local state
        if (schedule) {
          setSchedule({ ...schedule, status: "completed" });
        }
        console.log("Đã hoàn thành công việc thành công");
      } else {
        setError(result.message || "Không thể hoàn thành công việc");
      }
    } catch (err) {
      setError("Có lỗi xảy ra khi hoàn thành công việc");
      console.error("Error completing work:", err);
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "assigned":
      case "pending":
        return "bg-warning";
      case "in_progress":
      case "working":
        return "bg-primary";
      case "completed":
      case "done":
        return "bg-success";
      default:
        return "bg-muted";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "assigned":
        return "Đã giao";
      case "pending":
        return "Chờ xử lý";
      case "in_progress":
      case "working":
        return "Đang thực hiện";
      case "completed":
      case "done":
        return "Hoàn thành";
      default:
        return status;
    }
  };

  // Loading state
  if (loading) {
    return (
      <main className="flex-1 p-6 bg-background">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/dashboard/technician")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại
          </Button>
          <h2 className="text-2xl font-bold">Chi tiết công việc</h2>
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
  if (error || !schedule) {
    return (
      <main className="flex-1 p-6 bg-background">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/dashboard/technician")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại
          </Button>
          <h2 className="text-2xl font-bold">Chi tiết công việc</h2>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-destructive mb-4">
              {error || "Không tìm thấy thông tin"}
            </p>
            <Button onClick={() => navigate("/dashboard/technician")}>
              Quay về trang chủ
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 p-6 bg-background">
      {/* Header với nút back */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate("/dashboard/technician")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Quay lại
        </Button>
        <div>
          <h2 className="text-2xl font-bold">Chi tiết công việc</h2>
          <p className="text-muted-foreground">
            Thông tin chi tiết về appointment được giao
          </p>
        </div>
      </div>

      {/* Thông tin chính */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Thông tin appointment */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-gradient-card border-0 shadow-soft">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Thông tin Appointment</h3>
                <Badge
                  className={`${getStatusColor(schedule.status)} text-white`}>
                  {getStatusText(schedule.status)}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Ngày hẹn</p>
                    <p className="font-medium">{schedule.appoinment_date}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Giờ hẹn</p>
                    <p className="font-medium">{schedule.appoinment_time}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <DollarSign className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Chi phí dự kiến
                    </p>
                    <p className="font-medium">
                      {schedule.estimated_cost?.toLocaleString("vi-VN")} VNĐ
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Wrench className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Thời gian dự kiến
                    </p>
                    <p className="font-medium">
                      {schedule.service_type_id.estimated_duration} giờ
                    </p>
                  </div>
                </div>
              </div>

              {schedule.notes && (
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground mb-2">Ghi chú</p>
                  <p className="text-sm bg-muted/50 p-3 rounded-lg">
                    {schedule.notes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Thông tin khách hàng */}
          <Card className="bg-gradient-card border-0 shadow-soft">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">
                Thông tin khách hàng
              </h3>
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{schedule.user_id.fullName}</p>
                  <p className="text-sm text-muted-foreground">
                    {schedule.user_id.phone}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Thông tin xe */}
          <Card className="bg-gradient-card border-0 shadow-soft">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Thông tin xe</h3>
              <div className="flex items-center gap-3">
                <Car className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">
                    {schedule.vehicle_id.brand} {schedule.vehicle_id.model}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Biển số: {schedule.vehicle_id.license_plate}
                  </p>
                  {(schedule.vehicle_id as { vin?: string })?.vin && (
                    <p className="text-sm text-muted-foreground">
                      VIN: {(schedule.vehicle_id as { vin?: string }).vin}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Thông tin dịch vụ */}
          <Card className="bg-gradient-card border-0 shadow-soft">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Thông tin dịch vụ</h3>
              <div>
                <p className="font-medium mb-2">
                  {schedule.service_type_id.service_name}
                </p>
                {(schedule.service_type_id as { description?: string })
                  ?.description && (
                  <p className="text-sm text-muted-foreground">
                    {
                      (schedule.service_type_id as { description?: string })
                        .description
                    }
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar với actions */}
        <div className="space-y-6">
          {/* Thông tin trung tâm */}
          <Card className="bg-gradient-card border-0 shadow-soft">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Trung tâm dịch vụ</h3>
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">
                    {schedule.center_id.center_name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {schedule.center_id.address}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card className="bg-gradient-card border-0 shadow-soft">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Hành động</h3>
              <div className="space-y-3">
                {schedule.status === "assigned" ||
                schedule.status === "pending" ? (
                  <Button
                    className="w-full bg-primary text-primary-foreground"
                    onClick={handleStartWork}
                    disabled={updating}>
                    {updating ? "Đang cập nhật..." : "Bắt đầu công việc"}
                  </Button>
                ) : schedule.status === "in_progress" ||
                  schedule.status === "working" ? (
                  <Button
                    className="w-full bg-success text-success-foreground"
                    onClick={handleCompleteWork}
                    disabled={updating}>
                    {updating ? "Đang cập nhật..." : "Hoàn thành công việc"}
                  </Button>
                ) : (
                  <div className="text-center">
                    <Badge className="bg-success text-white">
                      Công việc đã hoàn thành
                    </Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
};
