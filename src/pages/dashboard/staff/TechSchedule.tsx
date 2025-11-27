import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { vi } from "date-fns/locale";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowLeft, Calendar as CalendarIcon, Clock, User, MapPin, Car, Wrench, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "react-toastify";
import {
  getTechnicianScheduleApi,
  TechnicianScheduleListResponse,
  TechnicianScheduleItem,
  ScheduleItem,
} from "@/lib/appointmentApi";
import { getServiceCentersApi, ServiceCenter, getTechniciansApi } from "@/lib/serviceCenterApi";
import { useAuth } from "@/context/AuthContext/useAuth";
import { TechnicianCalendarView } from "@/components/dashboard/TechnicianCalendarView";

// Màu sắc theo trạng thái
const STATUS_COLORS: Record<string, string> = {
  assigned: "bg-blue-100 text-blue-800 border-blue-300",
  check_in: "bg-green-100 text-green-800 border-green-300",
  in_progress: "bg-orange-100 text-orange-800 border-orange-300",
  completed: "bg-emerald-100 text-emerald-800 border-emerald-300",
};

const STATUS_LABELS: Record<string, string> = {
  assigned: "Đã phân công",
  check_in: "Đã check-in",
  in_progress: "Đang thực hiện",
  completed: "Hoàn thành",
};

export default function TechSchedule() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<TechnicianScheduleListResponse | null>(null);
  const [viewMode, setViewMode] = useState<"week" | "month">("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [centerId, setCenterId] = useState<string>("");
  const [technicianId, setTechnicianId] = useState<string>("all");
  const [serviceCenters, setServiceCenters] = useState<ServiceCenter[]>([]);
  const [technicians, setTechnicians] = useState<Array<{ _id: string; fullName: string; email: string }>>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSchedules, setSelectedSchedules] = useState<ScheduleItem[]>([]);

  // Calculate date range based on view mode
  const getDateRange = useCallback(() => {
    if (viewMode === "week") {
      return {
        from: startOfWeek(currentDate, { locale: vi }),
        to: endOfWeek(currentDate, { locale: vi }),
      };
    } else {
      return {
        from: startOfMonth(currentDate),
        to: endOfMonth(currentDate),
      };
    }
  }, [viewMode, currentDate]);

  // Load trung tâm dịch vụ mà staff này quản lý
  const loadServiceCenters = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const res = await getServiceCentersApi();
      if (res.ok && res.data?.data) {
        const centers = res.data.data;
        // Tìm trung tâm mà staff này quản lý (user_id trùng với staff id)
        const staffCenter = centers.find((center: any) => 
          center.user_id === user.id || center.user_id?._id === user.id || center.user_id?.toString() === user.id
        );
        
        if (staffCenter) {
          setServiceCenters([staffCenter]);
          setCenterId(staffCenter._id);
        } else {
          // Nếu không tìm thấy, vẫn hiển thị tất cả để debug
          setServiceCenters(centers);
          if (centers.length === 1) {
            setCenterId(centers[0]._id);
          }
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, [user?.id]);

  // Load danh sách technicians của trung tâm
  const loadTechnicians = useCallback(async () => {
    if (!centerId) {
      setTechnicians([]);
      return;
    }
    try {
      const res = await getTechniciansApi(centerId);
      if (res.ok && res.data?.data) {
        const techs = res.data.data.map((tech: any) => ({
          _id: tech.user?._id || tech.user_id || tech._id,
          fullName: tech.user?.fullName || tech.fullName || "N/A",
          email: tech.user?.email || tech.email || "",
        }));
        setTechnicians(techs);
      }
    } catch (e) {
      console.error(e);
    }
  }, [centerId]);

  // Load lịch làm việc
  const loadSchedules = useCallback(async () => {
    if (!centerId) {
      return;
    }

    setLoading(true);
    try {
      const { from, to } = getDateRange();
      
      const params: {
        date_from: string;
        date_to: string;
        center_id: string;
        technician_id?: string;
      } = {
        date_from: format(from, "yyyy-MM-dd"),
        date_to: format(to, "yyyy-MM-dd"),
        center_id: centerId,
      };

      // Nếu chọn technician cụ thể, chỉ lấy lịch của technician đó
      if (technicianId && technicianId !== "all") {
        params.technician_id = technicianId;
      }

      const res = await getTechnicianScheduleApi(params);
      
      if (res.ok && res.data?.success) {
        const responseData = res.data.data;
        
        // Nếu có technician_id, response sẽ là TechnicianScheduleResponse
        // Nếu không, sẽ là TechnicianScheduleListResponse
        if (technicianId && technicianId !== "all") {
          // Convert single technician response to list format
          const singleResponse = responseData as any;
          if (singleResponse.technician) {
            const listResponse: TechnicianScheduleListResponse = {
              items: [{
                technician: singleResponse.technician,
                schedules: singleResponse.schedules || [],
                total_assignments: singleResponse.total_assignments || 0,
              }],
              pagination: {
                current_page: 1,
                items_per_page: 1,
                total_items: 1,
                total_pages: 1,
                has_next_page: false,
                has_prev_page: false,
              },
              date_range: singleResponse.date_range || {
                from: params.date_from,
                to: params.date_to,
              },
            };
            setData(listResponse);
          }
        } else {
          // Filter by center_id (should already be filtered by API, but double check)
          let listResponse = responseData as TechnicianScheduleListResponse;
          
          // Ensure all schedules belong to the selected center
          listResponse = {
            ...listResponse,
            items: listResponse.items.map(item => ({
              ...item,
              schedules: item.schedules.filter(
                schedule => schedule.center_id._id === centerId
              ),
              total_assignments: item.schedules.filter(
                schedule => schedule.center_id._id === centerId
              ).length,
            })).filter(item => item.total_assignments > 0),
          };
          
          setData(listResponse);
        }
      } else {
        toast.error(res.message || "Không thể tải lịch làm việc");
        setData(null);
      }
    } catch (e) {
      console.error(e);
      toast.error("Lỗi khi tải lịch làm việc");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [getDateRange, centerId, technicianId]);

  useEffect(() => {
    loadServiceCenters();
  }, [loadServiceCenters]);

  useEffect(() => {
    if (centerId) {
      loadTechnicians();
      setTechnicianId("all"); // Reset technician filter when center changes
    }
  }, [centerId, loadTechnicians]);

  useEffect(() => {
    if (centerId) {
      loadSchedules();
    }
  }, [loadSchedules, viewMode, currentDate]);

  const handleFilter = () => {
    if (!centerId) {
      toast.error("Vui lòng chọn trung tâm dịch vụ");
      return;
    }
    loadSchedules();
  };

  const handleReset = () => {
    setCurrentDate(new Date());
    setTechnicianId("all");
    // Giữ nguyên centerId vì staff chỉ quản lý 1 trung tâm
    if (serviceCenters.length > 0 && !centerId) {
      setCenterId(serviceCenters[0]._id);
    }
  };

  const handleDateClick = (date: Date, schedules: ScheduleItem[]) => {
    setSelectedDate(date);
    setSelectedSchedules(schedules);
  };

  // Group schedules by technician for selected date
  const groupSchedulesByTechnician = (schedules: ScheduleItem[]) => {
    const grouped: Record<string, { tech: TechnicianScheduleItem["technician"]; schedules: ScheduleItem[] }> = {};
    
    if (!data || !schedules || schedules.length === 0) return grouped;
    
    // Create a map of schedule ID to technician
    const scheduleToTech: Record<string, TechnicianScheduleItem["technician"]> = {};
    data.items.forEach((item) => {
      if (item.schedules && Array.isArray(item.schedules)) {
        item.schedules.forEach((schedule) => {
          if (schedule && schedule._id) {
            scheduleToTech[schedule._id] = item.technician;
          }
        });
      }
    });
    
    // Group schedules by technician
    schedules.forEach((schedule) => {
      if (!schedule || !schedule._id) return;
      
      const tech = scheduleToTech[schedule._id];
      if (tech && tech._id) {
        if (!grouped[tech._id]) {
          grouped[tech._id] = {
            tech,
            schedules: [],
          };
        }
        grouped[tech._id].schedules.push(schedule);
      }
    });
    
    return grouped;
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => navigate("/dashboard/staff")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Quản lý lịch làm việc KTV</h1>
            <p className="text-sm text-muted-foreground">
              Xem và quản lý lịch làm việc của các kỹ thuật viên trong trung tâm
            </p>
          </div>
        </div>
      </div>

      {/* Filter Section */}
      <Card className="mb-6 bg-gradient-card border-0 shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Bộ lọc
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {serviceCenters.length > 1 && (
              <div>
                <Label htmlFor="centerId">Trung tâm dịch vụ *</Label>
                <Select
                  value={centerId || ""}
                  onValueChange={(value) => setCenterId(value)}>
                  <SelectTrigger id="centerId">
                    <SelectValue placeholder="Chọn trung tâm" />
                  </SelectTrigger>
                  <SelectContent>
                    {serviceCenters.map((center) => (
                      <SelectItem key={center._id} value={center._id}>
                        {center.center_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {serviceCenters.length === 1 && centerId && (
              <div>
                <Label>Trung tâm dịch vụ</Label>
                <div className="h-10 px-3 py-2 rounded-md border bg-muted flex items-center text-sm">
                  {serviceCenters[0].center_name}
                </div>
              </div>
            )}
             <div>
              <Label htmlFor="technicianId">Kỹ thuật viên</Label>
              <Select
                value={technicianId || "all"}
                onValueChange={(value) => setTechnicianId(value)}
                disabled={!centerId || technicians.length === 0 || loading}>
                <SelectTrigger id="technicianId">
                  <SelectValue placeholder={centerId ? "Tất cả KTV" : "Chờ tải trung tâm..."} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả KTV</SelectItem>
                  {technicians.map((tech) => (
                    <SelectItem key={tech._id} value={tech._id}>
                      {tech.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2">
              <Button 
                onClick={handleFilter} 
                className="flex-1" 
                disabled={loading || !centerId}>
                {loading ? "Đang tải..." : "Áp dụng"}
              </Button>
              <Button 
                variant="outline" 
                onClick={handleReset}
                disabled={loading}>
                Đặt lại
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {centerId && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="bg-gradient-card border-0 shadow-soft">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground mb-1">Tổng số KTV</p>
              <p className="text-3xl font-bold text-primary">
                {technicians.length}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-card border-0 shadow-soft">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground mb-1">Tổng số công việc</p>
              <p className="text-3xl font-bold text-success">
                {data ? data.items.reduce((sum, item) => sum + item.total_assignments, 0) : 0}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-card border-0 shadow-soft">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground mb-1">Khoảng thời gian</p>
              <p className="text-sm font-medium">
                {data ? (
                  <>
                    {format(new Date(data.date_range.from), "dd/MM/yyyy", { locale: vi })} - {format(new Date(data.date_range.to), "dd/MM/yyyy", { locale: vi })}
                  </>
                ) : (
                  <span className="text-muted-foreground">Chưa có dữ liệu</span>
                )}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

       {/* Calendar View */}
      {loading ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-muted-foreground">Đang tải dữ liệu...</div>
          </CardContent>
        </Card>
      ) : !centerId ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            Vui lòng chọn trung tâm dịch vụ để xem lịch làm việc
          </CardContent>
        </Card>
      ) : (
        <TechnicianCalendarView
          data={data?.items || []}
          viewMode={viewMode}
          onViewModeChange={(mode) => {
            setViewMode(mode);
            setCurrentDate(new Date());
          }}
          currentDate={currentDate}
          onCurrentDateChange={setCurrentDate}
          onDateClick={handleDateClick}
        />
      )}

      {/* Detail Dialog */}
      <Dialog open={selectedDate !== null} onOpenChange={(open) => !open && setSelectedDate(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Chi tiết lịch làm việc - {selectedDate && format(selectedDate, "EEEE, dd/MM/yyyy", { locale: vi })}
            </DialogTitle>
            <DialogDescription>
              {selectedSchedules.length} lịch hẹn trong ngày
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {selectedSchedules.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Không có lịch hẹn trong ngày này
              </div>
            ) : (
              Object.entries(groupSchedulesByTechnician(selectedSchedules)).map(([techId, { tech, schedules }]) => (
                <Card key={techId} className="border-l-4 border-l-primary">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{tech.fullName}</CardTitle>
                          <CardDescription className="flex items-center gap-2 mt-1">
                            <Mail className="h-3 w-3" />
                            {tech.email}
                          </CardDescription>
                        </div>
                      </div>
                      <Badge variant="outline">{schedules.length} lịch hẹn</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {schedules.map((schedule) => (
                        <Card key={schedule._id} className="hover:shadow-md transition-shadow">
                          <CardContent className="p-3">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Clock className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-sm font-medium">
                                    {schedule.appoinment_time}
                                    {schedule.estimated_end_time && ` - ${schedule.estimated_end_time}`}
                                  </span>
                                </div>
                                <Badge
                                  className={cn(
                                    "text-xs",
                                    STATUS_COLORS[schedule.status] || "bg-gray-100 text-gray-800"
                                  )}>
                                  {STATUS_LABELS[schedule.status] || schedule.status}
                                </Badge>
                              </div>
                              <div className="space-y-1 text-sm">
                                <div className="flex items-center gap-2">
                                  <User className="h-3 w-3 text-muted-foreground" />
                                  <span>{schedule.user_id?.fullName || "N/A"}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Car className="h-3 w-3 text-muted-foreground" />
                                  <span>
                                    {schedule.vehicle_id?.license_plate || "N/A"} - {schedule.vehicle_id?.brand || ""} {schedule.vehicle_id?.model || ""}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Wrench className="h-3 w-3 text-muted-foreground" />
                                  <span>{schedule.service_type_id?.service_name || "N/A"}</span>
                                </div>
                                {schedule.center_id && (
                                  <div className="flex items-center gap-2">
                                    <MapPin className="h-3 w-3 text-muted-foreground" />
                                    <span className="text-xs">{schedule.center_id.center_name || "N/A"}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

