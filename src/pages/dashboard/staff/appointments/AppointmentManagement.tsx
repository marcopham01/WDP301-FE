import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  getAppointmentsApi,
  updateAppointmentStatusApi,
  type Appointment,
} from "@/lib/appointmentApi";
import { Eye } from "lucide-react";

// Sử dụng type Appointment từ API thay vì định nghĩa lại
type AppointmentItem = Appointment;

export default function AppointmentManagement() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookings, setBookings] = useState<AppointmentItem[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalPages: 0,
    totalDocs: 0,
  });
  const [statusFilter] = useState<string>("");

  function statusLabel(s?: string) {
    switch (s) {
      case "pending":
        return { text: "Chờ xác nhận", variant: "secondary" as const };
      case "accepted":
        return { text: "Đã xác nhận", variant: "default" as const };
      case "confirmed":
        return { text: "Đã xác nhận", variant: "default" as const };
      case "assigned":
        return { text: "Đã phân công", variant: "outline" as const };
      case "deposited":
        return { text: "Đã đặt cọc", variant: "outline" as const };
      case "in_progress":
        return { text: "Đang thực hiện", variant: "default" as const };
      case "completed":
        return { text: "Hoàn thành", variant: "default" as const };
      case "paid":
        return { text: "Đã thanh toán", variant: "default" as const };
      case "canceled":
      case "cancelled":
        return { text: "Đã hủy", variant: "destructive" as const };
      default:
        return { text: s || "—", variant: "secondary" as const };
    }
  }

  // Function để load danh sách appointments
  const loadAppointments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...(statusFilter && { status: statusFilter }),
      };

      const result = await getAppointmentsApi(params);
      console.log("API Response:", result); // Debug log

      if (result.ok && result.data?.success) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data = result.data.data as any;
        const items = (data.items ||
          data.appointments ||
          []) as AppointmentItem[];
        console.log("Items to set:", items); // Debug log
        setBookings(items);
        setPagination({
          page: data.pagination?.current_page || data.pagination?.page || 1,
          limit:
            data.pagination?.items_per_page || data.pagination?.limit || 10,
          totalPages:
            data.pagination?.total_pages || data.pagination?.totalPages || 0,
          totalDocs:
            data.pagination?.total_items || data.pagination?.totalDocs || 0,
        });
      } else {
        setError(result.message || "Không thể tải danh sách lịch hẹn");
        setBookings([]); // Đảm bảo bookings luôn là array
      }
    } catch (err) {
      setError("Có lỗi xảy ra khi tải dữ liệu");
      setBookings([]); // Đảm bảo bookings luôn là array
      console.error("Error loading appointments:", err);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, statusFilter]);

  // Function để cập nhật trạng thái appointment
  const updateAppointmentStatus = async (
    appointmentId: string,
    newStatus: string
  ) => {
    try {
      const result = await updateAppointmentStatusApi({
        appointment_id: appointmentId,
        status: newStatus,
      });

      if (result.ok && result.data?.success) {
        // Reload danh sách sau khi cập nhật thành công
        await loadAppointments();
      } else {
        alert(result.message || "Không thể cập nhật trạng thái");
      }
    } catch (err) {
      alert("Có lỗi xảy ra khi cập nhật trạng thái");
      console.error("Error updating appointment status:", err);
    }
  };

  // Function để xem chi tiết appointment
  const handleViewDetails = (appointmentId: string) => {
    navigate(`/dashboard/staff/appointments/${appointmentId}`);
  };

  // Load appointments khi component mount
  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  return (
    <main className="flex-1 container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Quản lý lịch hẹn</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lịch Hẹn Gần Đây</CardTitle>
          <CardDescription>10 lịch hẹn mới nhất</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Khách Hàng</TableHead>
                <TableHead>Phương Tiện</TableHead>
                <TableHead>Dịch Vụ</TableHead>
                <TableHead>Ngày Hẹn</TableHead>
                <TableHead>Trạng Thái</TableHead>
                <TableHead>Hành Động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-muted-foreground py-8">
                    Đang tải dữ liệu...
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-red-500 py-8">
                    {error}
                    <Button
                      variant="outline"
                      size="sm"
                      className="ml-4"
                      onClick={loadAppointments}>
                      Thử lại
                    </Button>
                  </TableCell>
                </TableRow>
              ) : !bookings || bookings.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-muted-foreground py-8">
                    Không có lịch hẹn nào
                  </TableCell>
                </TableRow>
              ) : (
                (bookings || []).map((booking) => (
                  <TableRow key={booking._id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {booking.user_id?.fullName ||
                            booking.user_id?.username ||
                            "N/A"}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {booking.user_id?.email || "N/A"}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {booking.vehicle_id?.brand}{" "}
                        {booking.vehicle_id?.model || ""}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {booking.vehicle_id?.license_plate || "N/A"}
                      </div>
                    </TableCell>
                    <TableCell>
                      {booking.service_type_id?.service_name ||
                        booking.center_id?.name ||
                        booking.center_id?.center_name ||
                        "N/A"}
                    </TableCell>
                    <TableCell>
                      <div>
                        {booking.appoinment_date
                          ? format(
                              new Date(booking.appoinment_date),
                              "dd/MM/yyyy"
                            )
                          : "-"}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {booking.appoinment_time?.substring?.(0, 5) ||
                          booking.appoinment_time ||
                          "-"}
                      </div>
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const st = statusLabel(booking.status);
                        return <Badge variant={st.variant}>{st.text}</Badge>;
                      })()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleViewDetails(booking._id)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
}
