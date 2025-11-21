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
  CreditCard,
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
      return "Đã giao";
    case "pending":
      return "Chờ xử lý";
    case "check_in":
      return "Đã nhận xe";
    case "in_progress":
    case "working":
      return "Đang thực hiện";
    case "completed":
    case "done":
      return "Hoàn thành";
    case "delay":
      return "Trì hoãn";
    case "canceled":
    case "cancelled":
      return "Đã hủy";
    default:
      return status || "—";
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case "assigned":
    case "pending":
      return "bg-warning";
    case "check_in":
    case "in_progress":
    case "working":
      return "bg-primary";
    case "completed":
    case "done":
      return "bg-success";
    case "delay":
      return "bg-orange-500";
    case "canceled":
    case "cancelled":
      return "bg-destructive";
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
      if (res.ok && res.data?.success) setAppointment(res.data.data);
      else setError(res.message || "Không thể tải lịch hẹn");
    } catch {
      setError("Lỗi khi tải lịch hẹn");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading)
    return (
      <main className="flex-1 p-6 bg-background">
        <Button
          variant="outline"
          onClick={() => navigate("/dashboard/staff/appointments")}
          className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> Quay lại
        </Button>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Đang tải dữ liệu...</p>
          </div>
        </div>
      </main>
    );
  if (error)
    return (
      <main className="flex-1 p-6 bg-background">
        <Button
          variant="outline"
          onClick={() => navigate("/dashboard/staff/appointments")}
          className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> Quay lại
        </Button>
        <div className="text-center py-24">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={load}>Thử lại</Button>
        </div>
      </main>
    );
  if (!appointment)
    return (
      <main className="flex-1 p-6 bg-background">
        <Button
          variant="outline"
          onClick={() => navigate("/dashboard/staff/appointments")}
          className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> Quay lại
        </Button>
        <div className="text-center py-24">
          <p className="text-muted-foreground">Không tìm thấy lịch hẹn</p>
        </div>
      </main>
    );

  const userPhone =
    (appointment.user_id as unknown as { phoneNumber?: string })?.phoneNumber ||
    (appointment.user_id as unknown as { phone?: string })?.phone ||
    "—";

  const technicianPhone =
    appointment.technician_id &&
    ((appointment.technician_id as unknown as { phoneNumber?: string })
      ?.phoneNumber ||
      (appointment.technician_id as unknown as { phone?: string })?.phone ||
      "—");

  const depositCost = (appointment as unknown as { deposit_cost?: number })
    .deposit_cost;
  const finalCost = (appointment as unknown as { final_cost?: number })
    .final_cost;
  const checkinDatetime = (
    appointment as unknown as {
      checkin_datetime?: string;
    }
  ).checkin_datetime;
  const estimatedEndTime = (
    appointment as unknown as {
      estimated_end_time?: string;
    }
  ).estimated_end_time;

  const depositPayment = appointment.payment_id as unknown as
    | {
        orderCode?: number | string;
        order_code?: number | string;
        amount?: number;
        status?: string;
        timeoutAt?: string;
      }
    | undefined;

  return (
    <main className="flex-1 p-6 bg-background">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate("/dashboard/staff/appointments")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Quay lại
        </Button>
        <div>
          <h2 className="text-2xl font-bold">Chi tiết lịch hẹn</h2>
          <p className="text-muted-foreground">
            Chế độ chỉ xem. Phân công kỹ thuật viên diễn ra tự động trên hệ
            thống.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cột trái: Thông tin chính */}
        <div className="lg:col-span-2 space-y-6">
          {/* Thông tin Appointment */}
          <Card className="bg-gradient-card border-2 border-border shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Thông tin lịch hẹn
                </h3>
                <Badge
                  className={`${getStatusColor(
                    appointment.status
                  )} text-white px-3 py-1.5 text-sm font-semibold`}>
                  {getStatusText(appointment.status)}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3 p-3 bg-primary/5 rounded-lg border border-primary/10">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      Ngày hẹn
                    </p>
                    <p className="font-bold text-base">
                      {formatDate(appointment.appoinment_date)}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-primary/5 rounded-lg border border-primary/10">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      Giờ hẹn
                    </p>
                    <p className="font-bold text-base">
                      {appointment.appoinment_time || "—"}
                    </p>
                  </div>
                </div>
                {checkinDatetime && (
                  <div className="flex items-start gap-3 p-3 bg-primary/5 rounded-lg border border-primary/10">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Clock className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">
                        Thời gian check-in
                      </p>
                      <p className="font-bold text-base">
                        {formatDate(checkinDatetime)}
                      </p>
                    </div>
                  </div>
                )}
                {estimatedEndTime && (
                  <div className="flex items-start gap-3 p-3 bg-primary/5 rounded-lg border border-primary/10">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Clock className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">
                        Dự kiến kết thúc
                      </p>
                      <p className="font-bold text-base">{estimatedEndTime}</p>
                    </div>
                  </div>
                )}
              </div>

              {appointment.notes && (
                <div className="mt-6 pt-4 border-t">
                  <p className="text-sm font-semibold text-muted-foreground mb-2">
                    Ghi chú
                  </p>
                  <p className="text-sm bg-muted/50 p-4 rounded-lg border">
                    {appointment.notes}
                  </p>
                </div>
              )}

              {(
                appointment as unknown as { initial_vehicle_condition?: string }
              ).initial_vehicle_condition && (
                <div className="mt-4">
                  <p className="text-sm font-semibold text-muted-foreground mb-2">
                    Tình trạng ban đầu của xe
                  </p>
                  <p className="text-sm bg-muted/50 p-4 rounded-lg border">
                    {
                      (
                        appointment as unknown as {
                          initial_vehicle_condition?: string;
                        }
                      ).initial_vehicle_condition
                    }
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Khách hàng & Xe */}
          <Card className="bg-gradient-card border-2 border-border shadow-md">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Thông tin khách hàng & Phương tiện
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Khách hàng */}
                <div className="p-4 bg-blue-50/50 dark:bg-blue-950/20 rounded-lg border border-blue-200/50">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                    <h4 className="font-semibold text-base">Khách hàng</h4>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">
                        Họ tên
                      </p>
                      <p className="font-bold text-base">
                        {appointment.user_id?.fullName ||
                          appointment.user_id?.username ||
                          "—"}
                      </p>
                    </div>
                    {appointment.user_id?.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          {appointment.user_id.email}
                        </p>
                      </div>
                    )}
                    {userPhone && userPhone !== "—" && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          {userPhone}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Xe */}
                <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-lg border border-emerald-200/50">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-emerald-500/10 rounded-lg">
                      <Bike className="h-5 w-5 text-emerald-600" />
                    </div>
                    <h4 className="font-semibold text-base">Phương tiện</h4>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">
                        Biển số
                      </p>
                      <p className="font-bold text-lg text-emerald-700 dark:text-emerald-400">
                        {appointment.vehicle_id?.license_plate || "—"}
                      </p>
                    </div>
                    {(
                      appointment.vehicle_id as unknown as {
                        color?: string;
                      }
                    )?.color && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">
                          Màu sắc
                        </p>
                        <p className="font-medium">
                          {
                            (
                              appointment.vehicle_id as unknown as {
                                color?: string;
                              }
                            )?.color
                          }
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dịch vụ & Trung tâm */}
          <Card className="bg-gradient-card border-2 border-border shadow-md">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <Wrench className="h-5 w-5 text-primary" />
                Thông tin dịch vụ & Trung tâm
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Dịch vụ */}
                <div className="p-4 bg-purple-50/50 dark:bg-purple-950/20 rounded-lg border border-purple-200/50">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-purple-500/10 rounded-lg">
                      <Wrench className="h-5 w-5 text-purple-600" />
                    </div>
                    <h4 className="font-semibold text-base">Dịch vụ</h4>
                  </div>
                  <div className="space-y-2">
                    <p className="font-bold text-base">
                      {appointment.service_type_id?.service_name ||
                        "Không xác định"}
                    </p>
                    {(
                      appointment.service_type_id as {
                        description?: string;
                      }
                    )?.description && (
                      <p className="text-sm text-muted-foreground">
                        {
                          (
                            appointment.service_type_id as {
                              description?: string;
                            }
                          ).description
                        }
                      </p>
                    )}
                    {appointment.service_type_id?.estimated_duration && (
                      <p className="text-sm text-muted-foreground">
                        Thời gian dự kiến:{" "}
                        <span className="font-semibold">
                          {appointment.service_type_id.estimated_duration} giờ
                        </span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Trung tâm */}
                <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-lg border border-indigo-200/50">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-indigo-500/10 rounded-lg">
                      <Building2 className="h-5 w-5 text-indigo-600" />
                    </div>
                    <h4 className="font-semibold text-base">Trung tâm</h4>
                  </div>
                  <div className="space-y-2">
                    <p className="font-bold text-base">
                      {appointment.center_id?.center_name ||
                        appointment.center_id?.name ||
                        "Không xác định"}
                    </p>
                    {appointment.center_id?.address && (
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-muted-foreground">
                          {appointment.center_id.address}
                        </p>
                      </div>
                    )}
                    {appointment.center_id?.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          Hotline: {appointment.center_id.phone}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Kỹ thuật viên */}
          {appointment.technician_id && (
            <Card className="bg-gradient-card border-2 border-border shadow-md">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Kỹ thuật viên
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Họ tên</p>
                    <p className="text-sm font-semibold">
                      {appointment.technician_id.fullName ||
                        appointment.technician_id.username ||
                        "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Email</p>
                    <p className="text-sm">
                      {appointment.technician_id.email || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      Số điện thoại
                    </p>
                    <p className="text-sm">{technicianPhone}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      Vai trò
                    </p>
                    <p className="text-sm">
                      {appointment.technician_id.role || "—"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Thanh toán */}
          {(appointment.payment_id || finalCost) && (
            <Card className="bg-gradient-card border-2 border-border shadow-md">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  Thông tin thanh toán
                </h3>
                <div className="space-y-4">
                  {depositCost && (
                    <div className="p-3 bg-amber-50/50 dark:bg-amber-950/20 rounded-lg border border-amber-200/50">
                      <p className="text-xs text-muted-foreground mb-1">
                        Tiền đặt cọc
                      </p>
                      <p className="font-bold text-base text-amber-700 dark:text-amber-400">
                        {depositCost.toLocaleString("vi-VN")} VNĐ
                      </p>
                    </div>
                  )}
                  {finalCost && (
                    <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-lg border border-emerald-200/50">
                      <p className="text-xs text-muted-foreground mb-1">
                        Tổng chi phí
                      </p>
                      <p className="font-bold text-lg text-emerald-700 dark:text-emerald-400">
                        {finalCost.toLocaleString("vi-VN")} VNĐ
                      </p>
                    </div>
                  )}
                  {depositPayment && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">
                          Mã đơn đặt cọc
                        </p>
                        <p className="text-sm font-mono">
                          {depositPayment.orderCode ||
                            depositPayment.order_code ||
                            "—"}
                        </p>
                      </div>
                      {depositPayment.status && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">
                            Trạng thái thanh toán
                          </p>
                          <p className="text-sm">{depositPayment.status}</p>
                        </div>
                      )}
                      {depositPayment.timeoutAt && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">
                            Hạn thanh toán
                          </p>
                          <p className="text-sm">
                            {formatDate(depositPayment.timeoutAt)}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Cột phải: Thông tin hệ thống */}
        <div className="space-y-6">
          {/* ID & thời gian tạo/cập nhật */}
          <Card className="bg-gradient-card border-2 border-border shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Hash className="h-5 w-5 text-primary" />
                  Thông tin hệ thống
                </h3>
              </div>
              <div className="space-y-4">
                <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                  <p className="text-xs text-muted-foreground mb-1">
                    ID lịch hẹn
                  </p>
                  <p className="font-bold text-lg text-primary font-mono">
                    {appointment._id
                      ? appointment._id.slice(-4).toUpperCase()
                      : "N/A"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 font-mono break-all">
                    {appointment._id}
                  </p>
                </div>

                <div className="space-y-3">
                  {appointment.createdAt && (
                    <div className="flex items-center gap-3 p-2 bg-muted/30 rounded-lg">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Tạo lúc</p>
                        <p className="text-sm font-semibold">
                          {formatDate(appointment.createdAt)}
                        </p>
                      </div>
                    </div>
                  )}
                  {appointment.updatedAt && (
                    <div className="flex items-center gap-3 p-2 bg-muted/30 rounded-lg">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Cập nhật
                        </p>
                        <p className="text-sm font-semibold">
                          {formatDate(appointment.updatedAt)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
