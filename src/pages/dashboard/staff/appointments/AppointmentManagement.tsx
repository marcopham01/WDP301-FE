import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getAppointmentsApi,
  updateAppointmentStatusApi,
  type Appointment,
} from "@/lib/appointmentApi";
import { Eye, X } from "lucide-react";

// Sử dụng type Appointment từ API thay vì định nghĩa lại
type AppointmentItem = Appointment;

export default function AppointmentManagement() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookings, setBookings] = useState<AppointmentItem[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10, // Giảm xuống 10 để pagination có ý nghĩa
    totalPages: 0,
    totalDocs: 0,
  });
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  function statusLabel(s?: string) {
    switch (s) {
      case "pending":
        return { text: "Chờ xác nhận", variant: "secondary" as const };
      case "assigned":
        return { text: "Đã phân công", variant: "default" as const };
      case "check_in":
        return { text: "Đã check-in", variant: "outline" as const };
      case "in_progress":
        return { text: "Đang sửa chữa", variant: "default" as const };
      case "completed":
        return { text: "Hoàn thành", variant: "default" as const };
      case "delay":
        return { text: "Trì hoãn", variant: "secondary" as const };
      case "canceled":
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

      const params: Record<string, string | number> = {
        page: pagination.page,
        limit: pagination.limit,
      };

      if (statusFilter) params.status = statusFilter;
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;

      const result = await getAppointmentsApi(params);

      if (result.ok && result.data?.success) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data = result.data.data as any;
        
        const items = (data.items ||
          data.appointments ||
          []) as AppointmentItem[];
        
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
      console.error("[Staff] Exception:", err);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, statusFilter, dateFrom, dateTo]);

  // Function để cập nhật trạng thái appointment
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

  // Function để reset tất cả filters
  const handleResetFilters = () => {
    setStatusFilter("");
    setDateFrom("");
    setDateTo("");
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Check xem có filter nào đang active không
  const hasActiveFilters = statusFilter || dateFrom || dateTo;

  // Load appointments khi component mount
  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  return (
    <main className="flex-1 container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Quản lý lịch hẹn</h1>
          <p className="text-muted-foreground">
            Tổng: {pagination.totalDocs} lịch hẹn
          </p>
        </div>
        <Button 
          onClick={loadAppointments}
          variant="outline"
          disabled={loading}
        >
          {loading ? "Đang tải..." : "🔄 Làm mới"}
        </Button>
      </div>

      {/* Filter Section */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Bộ lọc</CardTitle>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4 mr-2" />
                Xóa lọc
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Status Filter */}
            <div className="space-y-2">
              <Label htmlFor="status-filter">Trạng thái</Label>
              <Select 
                value={statusFilter || "all"} 
                onValueChange={(val) => setStatusFilter(val === "all" ? "" : val)}
              >
                <SelectTrigger id="status-filter">
                  <SelectValue placeholder="Tất cả trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="pending">Chờ xác nhận</SelectItem>
                  <SelectItem value="assigned">Đã phân công</SelectItem>
                  <SelectItem value="check_in">Đã check-in</SelectItem>
                  <SelectItem value="in_progress">Đang sửa chữa</SelectItem>
                  <SelectItem value="completed">Hoàn thành</SelectItem>
                  <SelectItem value="canceled">Đã hủy</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Appointment Date From */}
            <div className="space-y-2">
              <Label htmlFor="date-from">Ngày hẹn từ</Label>
              <Input
                id="date-from"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>

            {/* Appointment Date To */}
            <div className="space-y-2">
              <Label htmlFor="date-to">Ngày hẹn đến</Label>
              <Input
                id="date-to"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách lịch hẹn</CardTitle>
          <CardDescription>
            Trang {pagination.page} / {pagination.totalPages} - Tổng {pagination.totalDocs} lịch hẹn
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Khách Hàng</TableHead>
                <TableHead>Phương Tiện</TableHead>
                <TableHead>Dịch Vụ</TableHead>
                <TableHead>Ngày Hẹn</TableHead>
                <TableHead>Ngày Tạo</TableHead>
                <TableHead>Trạng Thái</TableHead>
                <TableHead>Hành Động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center text-muted-foreground py-8">
                    Đang tải dữ liệu...
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
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
                    colSpan={7}
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
                      {booking.createdAt
                        ? format(
                            new Date(booking.createdAt),
                            "dd/MM/yyyy HH:mm",
                            { locale: vi }
                          )
                        : "N/A"}
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

          {/* Pagination Controls */}
          {!loading && !error && bookings.length > 0 && (
            <div className="flex items-center justify-between px-4 py-4 border-t">
              <div className="text-sm text-muted-foreground">
                Hiển thị {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.totalDocs)} trong tổng số {pagination.totalDocs} lịch hẹn
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                  disabled={pagination.page <= 1 || loading}
                >
                  Trước
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    // Show first page, current page, and last page with ellipsis
                    let pageNum;
                    if (pagination.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (pagination.page <= 3) {
                      pageNum = i + 1;
                    } else if (pagination.page >= pagination.totalPages - 2) {
                      pageNum = pagination.totalPages - 4 + i;
                    } else {
                      pageNum = pagination.page - 2 + i;
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={pagination.page === pageNum ? "default" : "outline"}
                        size="sm"
                        className="w-8 h-8 p-0"
                        onClick={() => setPagination(prev => ({ ...prev, page: pageNum }))}
                        disabled={loading}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
                  disabled={pagination.page >= pagination.totalPages || loading}
                >
                  Sau
                </Button>
                <select
                  value={pagination.limit}
                  onChange={(e) => setPagination(prev => ({ ...prev, limit: Number(e.target.value), page: 1 }))}
                  className="h-8 rounded-md border border-input bg-background px-3 py-1 text-sm"
                  disabled={loading}
                >
                  <option value={5}>5 / trang</option>
                  <option value={10}>10 / trang</option>
                  <option value={20}>20 / trang</option>
                  <option value={50}>50 / trang</option>
                </select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
