/**
 * Staff Appointment Detail (View-Only)
 * Clean implementation. Legacy manual technician assignment code fully removed.
 */
import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAppointmentByIdApi, updateAppointmentStatusApi, type Appointment } from "@/lib/appointmentApi";
import { ArrowLeft, User, Car, MapPin, Calendar, CreditCard, Wrench } from "lucide-react";

function statusLabel(s?: string) {
  switch (s) {
    case "pending": return { text: "Chờ xử lý", variant: "secondary" as const };
    case "assigned": return { text: "Đã phân công", variant: "default" as const };
    case "check_in": return { text: "Chờ tiếp nhận", variant: "outline" as const };
    case "in_progress": return { text: "Đang sửa chữa", variant: "default" as const };
    case "repaired": return { text: "Đã sửa xong", variant: "default" as const };
    case "completed": return { text: "Hoàn thành", variant: "default" as const };
    case "delay": return { text: "Trì hoãn", variant: "secondary" as const };
    case "canceled":
    case "cancelled": return { text: "Đã hủy", variant: "destructive" as const };
    default: return { text: s || "—", variant: "secondary" as const };
  }
}

export default function AppointmentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true); setError(null);
      const res = await getAppointmentByIdApi(id);
      if (res.ok && res.data?.success) setAppointment(res.data.data);
      else setError(res.message || "Không thể tải lịch hẹn");
    } catch { setError("Lỗi khi tải lịch hẹn"); } finally { setLoading(false); }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const handleCancel = async () => {
    if (!appointment) return;
    if (["canceled","cancelled","completed"].includes(appointment.status)) return;
    if (!confirm("Bạn có chắc muốn hủy lịch hẹn này?")) return;
    try {
      setCancelling(true);
      const res = await updateAppointmentStatusApi({ appointment_id: appointment._id, status: "canceled" });
      if (res.ok && res.data?.success) await load(); else alert(res.message || "Không thể hủy lịch hẹn");
    } catch { alert("Lỗi hủy lịch hẹn"); } finally { setCancelling(false); }
  };

  if (loading) return (
    <main className="flex-1 container mx-auto px-4 py-8">
      <Button variant="ghost" onClick={() => navigate("/dashboard/staff/appointments")} className="mb-4"><ArrowLeft className="w-4 h-4 mr-2" /> Quay lại</Button>
      <div className="text-center py-24"><div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto mb-4" /><p className="text-muted-foreground">Đang tải dữ liệu...</p></div>
    </main>
  );
  if (error) return (
    <main className="flex-1 container mx-auto px-4 py-8">
      <Button variant="ghost" onClick={() => navigate("/dashboard/staff/appointments")} className="mb-4"><ArrowLeft className="w-4 h-4 mr-2" /> Quay lại</Button>
      <div className="text-center py-24"><p className="text-red-600 mb-4">{error}</p><Button onClick={load}>Thử lại</Button></div>
    </main>
  );
  if (!appointment) return (
    <main className="flex-1 container mx-auto px-4 py-8">
      <Button variant="ghost" onClick={() => navigate("/dashboard/staff/appointments")} className="mb-4"><ArrowLeft className="w-4 h-4 mr-2" /> Quay lại</Button>
      <div className="text-center py-24"><p className="text-muted-foreground">Không tìm thấy lịch hẹn</p></div>
    </main>
  );

  return (
    <main className="flex-1 container mx-auto px-4 py-8">
      <div className="mb-8">
        <Button variant="ghost" onClick={() => navigate("/dashboard/staff/appointments")} className="mb-4"><ArrowLeft className="w-4 h-4 mr-2" /> Quay lại</Button>
        <h1 className="text-3xl font-bold mb-2">Chi tiết lịch hẹn</h1>
        <p className="text-muted-foreground">Chế độ chỉ xem. Phân công kỹ thuật viên diễn ra tự động trên hệ thống.</p>
      </div>
      <div className="space-y-6">
        <Card><CardHeader><CardTitle className="flex items-center gap-2"><Calendar className="w-5 h-5" />Thông tin lịch hẹn</CardTitle></CardHeader><CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-sm text-muted-foreground">Ngày hẹn</label><p className="text-sm">{appointment.appoinment_date ? format(new Date(appointment.appoinment_date), "dd/MM/yyyy") : "—"}</p></div>
            <div><label className="text-sm text-muted-foreground">Giờ hẹn</label><p className="text-sm">{appointment.appoinment_time || "—"}</p></div>
            <div><label className="text-sm text-muted-foreground">Trạng thái</label><div className="mt-1"><Badge variant={statusLabel(appointment.status).variant}>{statusLabel(appointment.status).text}</Badge></div></div>
            <div><label className="text-sm text-muted-foreground">Chi phí ước tính</label><p className="text-sm">{appointment.estimated_cost ? `${appointment.estimated_cost.toLocaleString("vi-VN")} VNĐ` : "—"}</p></div>
          </div>
          {appointment.notes && <div><label className="text-sm text-muted-foreground">Ghi chú</label><p className="text-sm mt-1">{appointment.notes}</p></div>}
        </CardContent></Card>
        <Card><CardHeader><CardTitle className="flex items-center gap-2"><User className="w-5 h-5" />Khách hàng</CardTitle></CardHeader><CardContent><div className="grid grid-cols-3 gap-4">
          <div><label className="text-sm text-muted-foreground">Họ tên</label><p className="text-sm">{appointment.user_id?.fullName || appointment.user_id?.username || "—"}</p></div>
          <div><label className="text-sm text-muted-foreground">Email</label><p className="text-sm">{appointment.user_id?.email || "—"}</p></div>
          <div><label className="text-sm text-muted-foreground">Số điện thoại</label><p className="text-sm">{appointment.user_id?.phone || "—"}</p></div>
        </div></CardContent></Card>
        <Card><CardHeader><CardTitle className="flex items-center gap-2"><Car className="w-5 h-5" />Xe</CardTitle></CardHeader><CardContent><div className="grid grid-cols-2 gap-4">
          <div><label className="text-sm text-muted-foreground">Biển số</label><p className="text-sm">{appointment.vehicle_id?.license_plate || "—"}</p></div>
          <div><label className="text-sm text-muted-foreground">Hãng</label><p className="text-sm">{appointment.vehicle_id?.brand || "—"}</p></div>
          <div><label className="text-sm text-muted-foreground">Model</label><p className="text-sm">{appointment.vehicle_id?.model || "—"}</p></div>
          <div><label className="text-sm text-muted-foreground">Màu sắc</label><p className="text-sm">{(appointment.vehicle_id as unknown as { color?: string })?.color || "—"}</p></div>
        </div></CardContent></Card>
        <Card><CardHeader><CardTitle className="flex items-center gap-2"><Wrench className="w-5 h-5" />Dịch vụ</CardTitle></CardHeader><CardContent><div className="grid grid-cols-2 gap-4">
          <div><label className="text-sm text-muted-foreground">Tên dịch vụ</label><p className="text-sm">{appointment.service_type_id?.service_name || "—"}</p></div>
          <div><label className="text-sm text-muted-foreground">Giá cơ bản</label><p className="text-sm">{appointment.service_type_id?.base_price ? `${appointment.service_type_id.base_price.toLocaleString("vi-VN")} VNĐ` : "—"}</p></div>
          <div><label className="text-sm text-muted-foreground">Thời gian ước tính</label><p className="text-sm">{appointment.service_type_id?.estimated_duration || "—"}</p></div>
          <div><label className="text-sm text-muted-foreground">Mô tả</label><p className="text-sm">{appointment.service_type_id?.description || "—"}</p></div>
        </div></CardContent></Card>
        <Card><CardHeader><CardTitle className="flex items-center gap-2"><MapPin className="w-5 h-5" />Trung tâm dịch vụ</CardTitle></CardHeader><CardContent><div className="grid grid-cols-2 gap-4">
          <div><label className="text-sm text-muted-foreground">Tên trung tâm</label><p className="text-sm">{appointment.center_id?.center_name || "—"}</p></div>
          <div><label className="text-sm text-muted-foreground">Địa chỉ</label><p className="text-sm">{appointment.center_id?.address || "—"}</p></div>
          <div><label className="text-sm text-muted-foreground">Số điện thoại</label><p className="text-sm">{appointment.center_id?.phone || "—"}</p></div>
        </div></CardContent></Card>
        {appointment.technician_id && <Card><CardHeader><CardTitle className="flex items-center gap-2"><User className="w-5 h-5" />Kỹ thuật viên</CardTitle></CardHeader><CardContent><div className="grid grid-cols-2 gap-4">
          <div><label className="text-sm text-muted-foreground">Họ tên</label><p className="text-sm">{appointment.technician_id.fullName || appointment.technician_id.username || "—"}</p></div>
          <div><label className="text-sm text-muted-foreground">Email</label><p className="text-sm">{appointment.technician_id.email || "—"}</p></div>
          <div><label className="text-sm text-muted-foreground">Số điện thoại</label><p className="text-sm">{appointment.technician_id.phone || "—"}</p></div>
          <div><label className="text-sm text-muted-foreground">Vai trò</label><p className="text-sm">{appointment.technician_id.role || "—"}</p></div>
        </div></CardContent></Card>}
        {(appointment.payment_id || appointment.final_payment_id) && <Card><CardHeader><CardTitle className="flex items-center gap-2"><CreditCard className="w-5 h-5" />Thanh toán</CardTitle></CardHeader><CardContent><div className="space-y-4">{appointment.payment_id && <div className="grid grid-cols-2 gap-4">
          <div><label className="text-sm text-muted-foreground">Đặt cọc - Mã đơn</label><p className="text-sm">{appointment.payment_id.order_code || "—"}</p></div>
          <div><label className="text-sm text-muted-foreground">Số tiền</label><p className="text-sm">{appointment.payment_id.amount ? `${appointment.payment_id.amount.toLocaleString("vi-VN")} VNĐ` : "—"}</p></div>
          <div><label className="text-sm text-muted-foreground">Trạng thái</label><p className="text-sm">{appointment.payment_id.status || "—"}</p></div>
        </div>}{appointment.final_payment_id && <div className="grid grid-cols-2 gap-4">
          <div><label className="text-sm text-muted-foreground">Thanh toán cuối - Mã đơn</label><p className="text-sm">{appointment.final_payment_id.order_code || "—"}</p></div>
          <div><label className="text-sm text-muted-foreground">Số tiền</label><p className="text-sm">{appointment.final_payment_id.amount ? `${appointment.final_payment_id.amount.toLocaleString("vi-VN")} VNĐ` : "—"}</p></div>
          <div><label className="text-sm text-muted-foreground">Trạng thái</label><p className="text-sm">{appointment.final_payment_id.status || "—"}</p></div>
        </div>}</div></CardContent></Card>}
        <Card><CardHeader><CardTitle>Hành động</CardTitle></CardHeader><CardContent><div className="flex flex-wrap gap-3">
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>Làm mới</Button>
          <Button variant="destructive" size="sm" onClick={handleCancel} disabled={cancelling || ["canceled","cancelled","completed"].includes(appointment.status)}>{cancelling ? "Đang hủy..." : "Hủy lịch hẹn"}</Button>
        </div><p className="text-xs text-muted-foreground mt-4">* Phân công kỹ thuật viên tự động dựa trên slot trống. Nhân viên chỉ xem thông tin.</p></CardContent></Card>
      </div>
    </main>
  );
}
