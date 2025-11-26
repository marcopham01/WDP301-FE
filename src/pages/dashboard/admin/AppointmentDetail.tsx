import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAppointmentByIdApi, type Appointment } from "@/lib/appointmentApi";
import {
  ArrowLeft,
  User,
  Bike,
  MapPin,
  Calendar,
  Wrench,
  Clock,
  Hash,
  Phone,
  Mail,
  Building2,
} from "lucide-react";

function formatDate(date?: string) {
  if (!date) return "—";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function getStatusText(status: string) {
  switch (status) {
    case "assigned":
      return "Đã phân công";
    case "pending":
      return "Chờ xử lý";
    case "check_in":
      return "Đã check-in";
    case "in_progress":
      return "Đang thực hiện";
    case "repaired":
      return "Đã sửa chữa";
    case "completed":
      return "Hoàn thành";
    case "delay":
      return "Trễ hạn";
    case "canceled":
      return "Đã hủy";
    default:
      return status || "—";
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case "pending":
      return "bg-yellow-500";
    case "assigned":
      return "bg-blue-500";
    case "check_in":
      return "bg-green-400";
    case "in_progress":
      return "bg-orange-500";
    case "repaired":
      return "bg-green-600";
    case "completed":
      return "bg-green-700";
    case "delay":
      return "bg-red-500";
    case "canceled":
      return "bg-gray-500";
    default:
      return "bg-muted";
  }
}

export default function AppointmentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [appointment, setAppointment] = useState<Appointment | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const res = await getAppointmentByIdApi(id);
      console.log("Full API response:", res);
      console.log("res.data:", res.data);
      if (res.ok && res.data) {
        // Handle different response structures
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let appointmentData: any = res.data;
        
        // If data is nested in data.data
        if (appointmentData.data) {
          appointmentData = appointmentData.data;
        }
        
        console.log("Final appointment data:", appointmentData);
        setAppointment(appointmentData as Appointment);
      } else {
        setError(res.message || "Không thể tải lịch hẹn");
      }
    } catch (err) {
      console.error("Error loading appointment:", err);
      setError("Lỗi khi tải lịch hẹn");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-8">Đang tải chi tiết lịch hẹn...</div>
      </div>
    );
  }

  if (error || !appointment) {
    return (
      <div className="p-6">
        <Card className="bg-gradient-card border-0 shadow-soft">
          <CardContent className="p-8 text-center text-destructive">
            {error || "Không tìm thấy lịch hẹn"}
          </CardContent>
        </Card>
        <div className="mt-4">
          <Button variant="outline" onClick={() => navigate("/dashboard/admin/appointments/overview")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại danh sách
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => navigate("/dashboard/admin/appointments/overview")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại
          </Button>
          <h1 className="text-2xl font-bold">Chi tiết lịch hẹn</h1>
        </div>
        <Badge className={`${getStatusColor(appointment.status || "")} text-white`}>
          {getStatusText(appointment.status || "")}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Thông tin khách hàng */}
        <Card className="bg-gradient-card border-0 shadow-soft">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <User className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Thông tin khách hàng</h2>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <User className="h-4 w-4 text-muted-foreground mt-1" />
                <div>
                  <p className="text-sm text-muted-foreground">Họ tên</p>
                  <p className="font-medium">
                    {appointment.user_id?.fullName || appointment.user_id?.username || "—"}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Mail className="h-4 w-4 text-muted-foreground mt-1" />
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{appointment.user_id?.email || "—"}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Phone className="h-4 w-4 text-muted-foreground mt-1" />
                <div>
                  <p className="text-sm text-muted-foreground">Số điện thoại</p>
                  <p className="font-medium">{appointment.user_id?.phoneNumber || appointment.user_id?.phone || "—"}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Thông tin xe */}
        <Card className="bg-gradient-card border-0 shadow-soft">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Bike className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Thông tin xe</h2>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <Hash className="h-4 w-4 text-muted-foreground mt-1" />
                <div>
                  <p className="text-sm text-muted-foreground">Biển số xe</p>
                  <p className="font-medium">{appointment.vehicle_id?.license_plate || "—"}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Bike className="h-4 w-4 text-muted-foreground mt-1" />
                <div>
                  <p className="text-sm text-muted-foreground">Màu xe</p>
                  <p className="font-medium">
                    {appointment.vehicle_id?.color || "—"}
                  </p>
                </div>
              </div>
              {appointment.vehicle_id?.vin && (
                <div className="flex items-start gap-2">
                  <Hash className="h-4 w-4 text-muted-foreground mt-1" />
                  <div>
                    <p className="text-sm text-muted-foreground">VIN</p>
                    <p className="font-medium">{appointment.vehicle_id.vin}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Thông tin trung tâm */}
        <Card className="bg-gradient-card border-0 shadow-soft">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Trung tâm dịch vụ</h2>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground mt-1" />
                <div>
                  <p className="text-sm text-muted-foreground">Tên trung tâm</p>
                  <p className="font-medium">
                    {appointment.center_id?.center_name || appointment.center_id?.name || "—"}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                <div>
                  <p className="text-sm text-muted-foreground">Địa chỉ</p>
                  <p className="font-medium">{appointment.center_id?.address || "—"}</p>
                </div>
              </div>
              {appointment.center_id?.phone && (
                <div className="flex items-start gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground mt-1" />
                  <div>
                    <p className="text-sm text-muted-foreground">Số điện thoại</p>
                    <p className="font-medium">{appointment.center_id.phone}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Thông tin lịch hẹn */}
        <Card className="bg-gradient-card border-0 shadow-soft">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Thông tin lịch hẹn</h2>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground mt-1" />
                <div>
                  <p className="text-sm text-muted-foreground">Ngày hẹn</p>
                  <p className="font-medium">{formatDate(appointment.appoinment_date)}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Clock className="h-4 w-4 text-muted-foreground mt-1" />
                <div>
                  <p className="text-sm text-muted-foreground">Giờ hẹn</p>
                  <p className="font-medium">{appointment.appoinment_time || "—"}</p>
                </div>
              </div>
              {/* <div className="flex items-start gap-2">
                <Clock className="h-4 w-4 text-muted-foreground mt-1" />
                <div>
                  <p className="text-sm text-muted-foreground">Giờ dự kiến hoàn thành</p>
                  <p className="font-medium">{appointment.estimated_end_time || "—"}</p>
                </div>
              </div> */}
              {appointment.notes && (
                <div className="flex items-start gap-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Ghi chú</p>
                    <p className="font-medium">{appointment.notes}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Thông tin dịch vụ */}
        <Card className="bg-gradient-card border-0 shadow-soft">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Wrench className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Dịch vụ</h2>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <Wrench className="h-4 w-4 text-muted-foreground mt-1" />
                <div>
                  <p className="text-sm text-muted-foreground">Loại dịch vụ</p>
                  <p className="font-medium">
                    {appointment.service_type_id?.service_name || "—"}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Wrench className="h-4 w-4 text-muted-foreground mt-1" />
                <div>
                  <p className="text-sm text-muted-foreground">Mô tả</p>
                  <p className="font-medium">{appointment.service_type_id?.description || "—"}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Clock className="h-4 w-4 text-muted-foreground mt-1" />
                <div>
                  <p className="text-sm text-muted-foreground">Thời gian dự kiến</p>
                  <p className="font-medium">{appointment.service_type_id?.estimated_duration || "—"}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Thông tin kỹ thuật viên */}
        <Card className="bg-gradient-card border-0 shadow-soft">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <User className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Kỹ thuật viên</h2>
            </div>
            <div className="space-y-3">
              {appointment.technician_id || appointment.assigned ? (
                <>
                  <div className="flex items-start gap-2">
                    <User className="h-4 w-4 text-muted-foreground mt-1" />
                    <div>
                      <p className="text-sm text-muted-foreground">Họ tên</p>
                      <p className="font-medium">
                        {appointment.technician_id?.fullName ||
                          appointment.assigned?.fullName ||
                          "—"}
                      </p>
                    </div>
                  </div>
                  {(appointment.technician_id?.email || appointment.assigned?.email) && (
                    <div className="flex items-start gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground mt-1" />
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="font-medium">
                          {appointment.technician_id?.email || appointment.assigned?.email}
                        </p>
                      </div>
                    </div>
                  )}
                  {(appointment.technician_id?.phone || appointment.assigned?.phone) && (
                    <div className="flex items-start gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground mt-1" />
                      <div>
                        <p className="text-sm text-muted-foreground">Số điện thoại</p>
                        <p className="font-medium">
                          {appointment.technician_id?.phone || appointment.assigned?.phone}
                        </p>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-muted-foreground">Chưa phân công kỹ thuật viên</p>
              )}
            </div>
          </CardContent>
        </Card>


      </div>
    </div>
  );
}
