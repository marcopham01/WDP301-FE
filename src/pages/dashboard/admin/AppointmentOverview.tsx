import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "react-toastify";
import { getAppointmentsApi, Appointment, Pagination } from "@/lib/appointmentApi";
import { getServiceCentersApi, ServiceCenter } from "@/lib/serviceCenterApi";
import { Badge } from "@/components/ui/badge";

const AppointmentOverview = () => {
  const navigate = useNavigate();
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [centerId, setCenterId] = useState("all");
  const [serviceCenters, setServiceCenters] = useState<ServiceCenter[]>([]);

  // State cho danh sách lịch hẹn
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);
  const [appointmentsPagination, setAppointmentsPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    totalPages: 0,
    totalDocs: 0,
  });

  const loadServiceCenters = useCallback(async () => {
    try {
      const res = await getServiceCentersApi();
      if (res.ok && res.data?.data) {
        setServiceCenters(res.data.data);
      } else {
        console.error("Không thể tải danh sách trung tâm dịch vụ");
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Hàm tải danh sách lịch hẹn
  const loadAppointments = useCallback(async (page = 1) => {
    setAppointmentsLoading(true);
    try {
      const params: {
        page: number;
        limit: number;
        date_from?: string;
        date_to?: string;
        service_center_id?: string;
      } = {
        page,
        limit: 10,
      };
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
      if (centerId && centerId !== "all") params.service_center_id = centerId;

      const res = await getAppointmentsApi(params);
      console.log("API Response:", res);
      if (res.ok && res.data) {
        console.log("Appointments data:", res.data);
        // API trả về structure: { success, data: { items, pagination } } hoặc { success, data: { appointments, pagination } }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const responseData: any = res.data.data || res.data;
        const appointmentsList = responseData.items || responseData.appointments || [];
        const paginationData = responseData.pagination || {
          page: 1,
          limit: 10,
          totalPages: 0,
          totalDocs: 0,
        };
        
        setAppointments(appointmentsList);
        setAppointmentsPagination(paginationData);
      } else {
        console.error("API Error:", res);
        toast.error(res.message || "Không thể tải danh sách lịch hẹn");
      }
    } catch (e) {
      console.error(e);
      toast.error("Lỗi khi tải danh sách lịch hẹn");
    } finally {
      setAppointmentsLoading(false);
    }
  }, [dateFrom, dateTo, centerId]);

  useEffect(() => {
    loadServiceCenters();
    loadAppointments(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilter = () => {
    loadAppointments(1);
  };

  const handleReset = () => {
    setDateFrom("");
    setDateTo("");
    setCenterId("all");
    setTimeout(() => {
      loadAppointments(1);
    }, 100);
  };

  // Helper function để format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN");
  };

  // Helper function để lấy badge màu cho trạng thái
  const getStatusBadge = (status?: string) => {
    if (!status) return <Badge>N/A</Badge>;
    
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      pending: { label: "Chờ xử lý", variant: "outline" },
      assigned: { label: "Đã phân công", variant: "secondary" },
      check_in: { label: "Đã check-in", variant: "default" },
      in_progress: { label: "Đang thực hiện", variant: "default" },
      repaired: { label: "Đã sửa chữa", variant: "default" },
      completed: { label: "Hoàn thành", variant: "default" },
      delay: { label: "Trễ hạn", variant: "destructive" },
      canceled: { label: "Đã hủy", variant: "destructive" },
    };

    const statusInfo = statusMap[status] || { label: status, variant: "outline" as const };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => navigate("/dashboard/admin/appointments")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại thống kê
          </Button>
          <h1 className="text-2xl font-bold">Tổng quan lịch hẹn</h1>
        </div>
      </div>

      {/* Filter Section */}
      <Card className="mb-6 bg-gradient-card border-0 shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Bộ lọc
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="dateFrom">Từ ngày</Label>
              <Input
                id="dateFrom"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="dateTo">Đến ngày</Label>
              <Input
                id="dateTo"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="centerId">Trung tâm dịch vụ</Label>
              <Select
                value={centerId || "all"}
                onValueChange={(value) => setCenterId(value)}>
                <SelectTrigger id="centerId">
                  <SelectValue placeholder="Chọn trung tâm dịch vụ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả trung tâm</SelectItem>
                  {serviceCenters.map((center) => (
                    <SelectItem key={center._id} value={center._id}>
                      {center.center_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={handleFilter} className="flex-1">
                Áp dụng
              </Button>
              <Button variant="outline" onClick={handleReset}>
                Đặt lại
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danh sách lịch hẹn */}
      <Card className="bg-gradient-card border-0 shadow-soft">
        <CardHeader>
          <CardTitle>Danh sách tất cả lịch hẹn</CardTitle>
          <p className="text-sm text-muted-foreground">
            Hiển thị tất cả các lịch hẹn từ các trung tâm dịch vụ
          </p>
        </CardHeader>
        <CardContent>
          {appointmentsLoading ? (
            <div className="text-center py-8">Đang tải danh sách lịch hẹn...</div>
          ) : appointments && appointments.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3">Khách hàng</th>
                      <th className="text-left p-3">Xe</th>
                      <th className="text-left p-3">Trung tâm</th>
                      <th className="text-left p-3">Ngày giờ</th>
                      <th className="text-left p-3">Dịch vụ</th>
                      <th className="text-left p-3">Trạng thái</th>
                      <th className="text-left p-3">Kỹ thuật viên</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.map((appointment) => (
                      <tr
                        key={appointment._id}
                        className="border-b hover:bg-muted/50">
                        <td className="p-3">
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {appointment.user_id?.fullName || appointment.user_id?.username || "N/A"}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {appointment.user_id?.phone || appointment.user_id?.email || ""}
                            </span>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {appointment.vehicle_id?.license_plate || "N/A"}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {appointment.vehicle_id?.brand} {appointment.vehicle_id?.model}
                            </span>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {appointment.center_id?.center_name || appointment.center_id?.name || "N/A"}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {appointment.center_id?.address || ""}
                            </span>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {formatDate(appointment.appoinment_date)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {appointment.appoinment_time || ""}
                            </span>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex flex-col">
                            <span className="text-sm">
                              {appointment.service_type_id?.service_name || "N/A"}
                            </span>
                            {appointment.estimated_cost && (
                              <span className="text-xs text-muted-foreground">
                                {appointment.estimated_cost.toLocaleString()} VND
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          {getStatusBadge(appointment.status)}
                        </td>
                        <td className="p-3">
                          <span className="text-sm">
                            {appointment.technician_id?.fullName || 
                             appointment.assigned?.fullName || 
                             "Chưa phân công"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Hiển thị {appointments.length} / {appointmentsPagination.totalDocs} lịch hẹn
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loadAppointments(appointmentsPagination.page - 1)}
                    disabled={appointmentsPagination.page === 1}>
                    <ChevronLeft className="h-4 w-4" />
                    Trước
                  </Button>
                  <div className="text-sm">
                    Trang {appointmentsPagination.page} / {appointmentsPagination.totalPages}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loadAppointments(appointmentsPagination.page + 1)}
                    disabled={appointmentsPagination.page >= appointmentsPagination.totalPages}>
                    Sau
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Không có lịch hẹn nào
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AppointmentOverview;
