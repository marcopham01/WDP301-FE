import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { ArrowLeft, Calendar, ChevronLeft, ChevronRight, Eye, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { toast } from "react-toastify";
import { getAppointmentsApi, Appointment, Pagination } from "@/lib/appointmentApi";
import { getServiceCentersApi, ServiceCenter } from "@/lib/serviceCenterApi";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { cn } from "@/lib/utils";

const AppointmentOverview = () => {
  const navigate = useNavigate();
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [centerId, setCenterId] = useState("all");
  const [serviceCenters, setServiceCenters] = useState<ServiceCenter[]>([]);

  // State cho danh sách lịch hẹn
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc" | null>(null);
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
      if (dateFrom) params.date_from = format(dateFrom, "yyyy-MM-dd");
      if (dateTo) params.date_to = format(dateTo, "yyyy-MM-dd");
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
    setDateFrom(undefined);
    setDateTo(undefined);
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

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else if (sortDirection === "desc") {
        setSortColumn(null);
        setSortDirection(null);
      }
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const getSortedAppointments = () => {
    if (!sortColumn || !sortDirection) return appointments;

    return [...appointments].sort((a, b) => {
      let aVal: string | number = "";
      let bVal: string | number = "";

      switch (sortColumn) {
        case "customer":
          aVal = a.user_id?.fullName || a.user_id?.username || "";
          bVal = b.user_id?.fullName || b.user_id?.username || "";
          break;
        case "vehicle":
          aVal = a.vehicle_id?.license_plate || "";
          bVal = b.vehicle_id?.license_plate || "";
          break;
        case "center":
          aVal = a.center_id?.center_name || a.center_id?.name || "";
          bVal = b.center_id?.center_name || b.center_id?.name || "";
          break;
        case "date":
          aVal = a.appoinment_date ? new Date(a.appoinment_date).getTime() : 0;
          bVal = b.appoinment_date ? new Date(b.appoinment_date).getTime() : 0;
          break;
        case "service":
          aVal = a.service_type_id?.service_name || "";
          bVal = b.service_type_id?.service_name || "";
          break;
        case "status":
          aVal = a.status || "";
          bVal = b.status || "";
          break;
        case "technician":
          aVal = a.technician_id?.fullName || a.assigned?.fullName || "";
          bVal = b.technician_id?.fullName || b.assigned?.fullName || "";
          break;
        default:
          return 0;
      }

      if (typeof aVal === "string" && typeof bVal === "string") {
        const comparison = aVal.localeCompare(bVal, "vi");
        return sortDirection === "asc" ? comparison : -comparison;
      }

      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
      }

      return 0;
    });
  };

  const SortIcon = ({ column }: { column: string }) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="ml-2 h-4 w-4 inline opacity-50" />;
    }
    if (sortDirection === "asc") {
      return <ArrowUp className="ml-2 h-4 w-4 inline text-primary" />;
    }
    return <ArrowDown className="ml-2 h-4 w-4 inline text-primary" />;
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
          <h1 className="text-2xl font-bold">Quản lý lịch hẹn</h1>
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
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="dateFrom"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateFrom && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {dateFrom ? format(dateFrom, "PPP", { locale: vi }) : "Chọn ngày"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={dateFrom}
                    onSelect={setDateFrom}
                    locale={vi}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label htmlFor="dateTo">Đến ngày</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="dateTo"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateTo && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {dateTo ? format(dateTo, "PPP", { locale: vi }) : "Chọn ngày"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={dateTo}
                    onSelect={setDateTo}
                    locale={vi}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
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
                      <th 
                        className="text-left p-3 cursor-pointer select-none hover:bg-muted/50"
                        onClick={() => handleSort("customer")}
                      >
                        Khách hàng
                        <SortIcon column="customer" />
                      </th>
                      <th 
                        className="text-left p-3 cursor-pointer select-none hover:bg-muted/50"
                        onClick={() => handleSort("vehicle")}
                      >
                        Xe
                        <SortIcon column="vehicle" />
                      </th>
                      <th 
                        className="text-left p-3 cursor-pointer select-none hover:bg-muted/50"
                        onClick={() => handleSort("center")}
                      >
                        Trung tâm
                        <SortIcon column="center" />
                      </th>
                      <th 
                        className="text-left p-3 cursor-pointer select-none hover:bg-muted/50"
                        onClick={() => handleSort("date")}
                      >
                        Ngày giờ
                        <SortIcon column="date" />
                      </th>
                      <th 
                        className="text-left p-3 cursor-pointer select-none hover:bg-muted/50"
                        onClick={() => handleSort("service")}
                      >
                        Dịch vụ
                        <SortIcon column="service" />
                      </th>
                      <th 
                        className="text-left p-3 cursor-pointer select-none hover:bg-muted/50"
                        onClick={() => handleSort("status")}
                      >
                        Trạng thái
                        <SortIcon column="status" />
                      </th>
                      <th 
                        className="text-left p-3 cursor-pointer select-none hover:bg-muted/50"
                        onClick={() => handleSort("technician")}
                      >
                        Kỹ thuật viên
                        <SortIcon column="technician" />
                      </th>
                      <th className="text-center p-3">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getSortedAppointments().map((appointment) => (
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
                              {appointment.center_id?.center_name || appointment.center_id?.name || "-"}
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
                        <td className="p-3 text-center">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => navigate(`/dashboard/admin/appointments/${appointment._id}`)}>
                            <Eye className="h-4 w-4" />
                          </Button>
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
