import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  getAppointmentByIdApi,
  updateAppointmentStatusApi,
  assignTechnicianApi,
  getTechnicianScheduleApi,
  type Appointment,
  type TechnicianInfo,
  type TechnicianScheduleListResponse,
} from "@/lib/appointmentApi";
import {
  ArrowLeft,
  User,
  Car,
  MapPin,
  Calendar,
  CreditCard,
  Wrench,
  Clock,
  CheckCircle,
  X,
  CalendarDays,
} from "lucide-react";

export default function AppointmentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [technicians, setTechnicians] = useState<TechnicianInfo[]>([]);
  const [selectedTechnician, setSelectedTechnician] = useState<string>("");
  const [technicianSchedules, setTechnicianSchedules] = useState<
    Record<string, unknown[]>
  >({});
  const [loadingTechnicians, setLoadingTechnicians] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [techniciansLoaded, setTechniciansLoaded] = useState(false);
  const [selectedTechnicianForSchedule, setSelectedTechnicianForSchedule] =
    useState<string>("");
  const [showScheduleModal, setShowScheduleModal] = useState(false);

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

  // Function để cập nhật trạng thái appointment
  const updateAppointmentStatus = async (newStatus: string) => {
    if (!id) return;

    try {
      const result = await updateAppointmentStatusApi({
        appointment_id: id,
        status: newStatus,
      });

      if (result.ok && result.data?.success) {
        // Reload thông tin appointment sau khi cập nhật thành công
        await loadAppointment();
        // Nếu chuyển sang accepted, load danh sách technicians
        if (newStatus === "accepted") {
          await loadTechnicians();
        }
      } else {
        alert(result.message || "Không thể cập nhật trạng thái");
      }
    } catch (err) {
      alert("Có lỗi xảy ra khi cập nhật trạng thái");
      console.error("Error updating appointment status:", err);
    }
  };

  // Function để load danh sách technicians và schedules
  const loadTechnicians = async () => {
    if (!appointment?.appoinment_date) return;

    try {
      setLoadingTechnicians(true);

      // Tính toán khoảng thời gian 30 ngày từ ngày hiện tại
      const today = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(today.getDate() + 30);

      // Format dates to YYYY-MM-DD
      const dateFrom = today.toISOString().split("T")[0];
      const dateTo = thirtyDaysFromNow.toISOString().split("T")[0];

      // Gọi API lấy schedule cho tất cả technicians trong 30 ngày
      const result = await getTechnicianScheduleApi({
        date_from: dateFrom,
        date_to: dateTo,
        page: 1,
        limit: 50, // Lấy tối đa 50 technicians
      });

      if (result.ok && result.data?.success) {
        const responseData = result.data.data as TechnicianScheduleListResponse;

        // Lấy danh sách technicians từ response.items
        const techniciansList: TechnicianInfo[] = [];
        const schedules: Record<string, unknown[]> = {};

        // Xử lý data từ response.items
        if (responseData.items && Array.isArray(responseData.items)) {
          for (const item of responseData.items) {
            if (item.technician) {
              techniciansList.push({
                _id: item.technician._id,
                fullName: item.technician.fullName,
                email: item.technician.email,
                phone: item.technician.phone,
              });

              // Lưu schedules của technician
              schedules[item.technician._id] = item.schedules || [];
            }
          }
        } else {
          console.warn(
            "No items found in API response or items is not an array"
          );
        }

        console.log("Loaded technicians:", techniciansList);
        console.log("Loaded schedules:", schedules);
        console.log("API Response:", responseData);

        setTechnicians(techniciansList);
        setTechnicianSchedules(schedules);
        setTechniciansLoaded(true);
      } else {
        console.error("API Error:", result.message);
        alert(result.message || "Không thể tải danh sách kỹ thuật viên");
      }
    } catch (err) {
      console.error("Error loading technicians:", err);
      alert("Có lỗi xảy ra khi tải danh sách kỹ thuật viên");
    } finally {
      setLoadingTechnicians(false);
    }
  };

  // Function để assign technician
  const handleAssignTechnician = async () => {
    if (!id || !selectedTechnician) return;

    try {
      setAssigning(true);
      const result = await assignTechnicianApi({
        appointment_id: id,
        technician_id: selectedTechnician,
      });

      if (result.ok && result.data?.success) {
        // Reload thông tin appointment sau khi assign thành công
        await loadAppointment();
        setSelectedTechnician("");
      } else {
        alert(result.message || "Không thể phân công kỹ thuật viên");
      }
    } catch (err) {
      alert("Có lỗi xảy ra khi phân công kỹ thuật viên");
      console.error("Error assigning technician:", err);
    } finally {
      setAssigning(false);
    }
  };

  // Function để lấy thông tin schedule của technician
  const getTechnicianScheduleInfo = (technicianId: string) => {
    const schedules = technicianSchedules[technicianId] || [];
    return {
      totalAssignments: schedules.length,
      isAvailable: schedules.length === 0,
      schedules: schedules,
    };
  };

  // Function để format thời gian schedule
  const formatScheduleTime = (schedule: { appoinment_time?: string }) => {
    if (!schedule.appoinment_time) return "—";
    return schedule.appoinment_time;
  };

  // Function để format trạng thái schedule
  const formatScheduleStatus = (status: string) => {
    switch (status) {
      case "pending":
        return "Chờ xác nhận";
      case "accepted":
        return "Đã xác nhận";
      case "assigned":
        return "Đã phân công";
      case "in_progress":
        return "Đang thực hiện";
      case "completed":
        return "Hoàn thành";
      case "cancelled":
        return "Đã hủy";
      default:
        return status || "—";
    }
  };

  // Function để hiển thị lịch làm việc chi tiết
  const showTechnicianSchedule = (technicianId: string) => {
    setSelectedTechnicianForSchedule(technicianId);
    setShowScheduleModal(true);
  };

  // Function để đóng modal lịch làm việc
  const closeScheduleModal = () => {
    setShowScheduleModal(false);
    setSelectedTechnicianForSchedule("");
  };

  // Function để lấy thông tin technician được chọn
  const getSelectedTechnicianInfo = () => {
    return technicians.find(
      (tech) => tech._id === selectedTechnicianForSchedule
    );
  };

  // Function để lấy schedule của technician được chọn
  const getSelectedTechnicianSchedule = () => {
    return technicianSchedules[selectedTechnicianForSchedule] || [];
  };

  // Function để format ngày tháng
  const formatScheduleDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, "dd/MM/yyyy");
    } catch {
      return dateString;
    }
  };

  // Function để kiểm tra xem technician có rảnh vào ngày hẹn không
  const isTechnicianAvailableOnAppointmentDate = (technicianId: string) => {
    if (!appointment?.appoinment_date) return true;

    const schedules = technicianSchedules[technicianId] || [];
    const appointmentDate = new Date(appointment.appoinment_date)
      .toISOString()
      .split("T")[0];

    // Kiểm tra xem có lịch hẹn nào vào ngày đó không
    const hasAppointmentOnDate = schedules.some(
      (schedule: { appoinment_date?: string }) => {
        if (!schedule.appoinment_date) return false;
        const scheduleDate = new Date(schedule.appoinment_date)
          .toISOString()
          .split("T")[0];
        return scheduleDate === appointmentDate;
      }
    );

    return !hasAppointmentOnDate;
  };

  // Function để load thông tin appointment
  const loadAppointment = async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);

      const result = await getAppointmentByIdApi(id);

      if (result.ok && result.data?.success) {
        const appointmentData = result.data.data;
        setAppointment(appointmentData);
      } else {
        setError(result.message || "Không thể tải thông tin chi tiết");
      }
    } catch (err) {
      setError("Có lỗi xảy ra khi tải thông tin chi tiết");
      console.error("Error loading appointment details:", err);
    } finally {
      setLoading(false);
    }
  };

  // Load appointment khi component mount
  useEffect(() => {
    loadAppointment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Load technicians khi appointment đã được load và có status "accepted"
  useEffect(() => {
    if (
      appointment &&
      appointment.status === "accepted" &&
      !loadingTechnicians &&
      !techniciansLoaded
    ) {
      console.log("Auto-loading technicians for accepted appointment");
      loadTechnicians();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointment?.status]);

  if (loading) {
    return (
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard/staff/appointments")}
            className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại
          </Button>
          <h1 className="text-3xl font-bold mb-2">Chi tiết lịch hẹn</h1>
        </div>
        <div className="text-center py-8">
          <p className="text-muted-foreground">Đang tải dữ liệu...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard/staff/appointments")}
            className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại
          </Button>
          <h1 className="text-3xl font-bold mb-2">Chi tiết lịch hẹn</h1>
        </div>
        <div className="text-center py-8">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={loadAppointment}>Thử lại</Button>
        </div>
      </main>
    );
  }

  if (!appointment) {
    return (
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard/staff/appointments")}
            className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại
          </Button>
          <h1 className="text-3xl font-bold mb-2">Chi tiết lịch hẹn</h1>
        </div>
        <div className="text-center py-8">
          <p className="text-muted-foreground">Không tìm thấy lịch hẹn</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 container mx-auto px-4 py-8">
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/dashboard/staff/appointments")}
          className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Quay lại
        </Button>
        <h1 className="text-3xl font-bold mb-2">Chi tiết lịch hẹn</h1>
        <p className="text-muted-foreground">
          Thông tin chi tiết về lịch hẹn bảo dưỡng
        </p>
      </div>

      <div className="space-y-6">
        {/* Thông tin cơ bản */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Thông tin lịch hẹn
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Ngày hẹn
                </label>
                <p className="text-sm">
                  {appointment.appoinment_date
                    ? format(
                        new Date(appointment.appoinment_date),
                        "dd/MM/yyyy"
                      )
                    : "—"}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Giờ hẹn
                </label>
                <p className="text-sm">{appointment.appoinment_time || "—"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Trạng thái
                </label>
                <div className="mt-1">
                  {(() => {
                    const st = statusLabel(appointment.status);
                    return <Badge variant={st.variant}>{st.text}</Badge>;
                  })()}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Chi phí ước tính
                </label>
                <p className="text-sm">
                  {appointment.estimated_cost
                    ? `${appointment.estimated_cost.toLocaleString(
                        "vi-VN"
                      )} VNĐ`
                    : "—"}
                </p>
              </div>
            </div>
            {appointment.notes && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Ghi chú
                </label>
                <p className="text-sm mt-1">{appointment.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Thông tin khách hàng */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Thông tin khách hàng
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Họ tên
                </label>
                <p className="text-sm">
                  {appointment.user_id?.fullName ||
                    appointment.user_id?.username ||
                    "—"}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Email
                </label>
                <p className="text-sm">{appointment.user_id?.email || "—"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Số điện thoại
                </label>
                <p className="text-sm">{appointment.user_id?.phone || "—"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Thông tin xe */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="w-5 h-5" />
              Thông tin xe
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Biển số
                </label>
                <p className="text-sm">
                  {appointment.vehicle_id?.license_plate || "—"}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Hãng xe
                </label>
                <p className="text-sm">
                  {appointment.vehicle_id?.brand || "—"}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Model
                </label>
                <p className="text-sm">
                  {appointment.vehicle_id?.model || "—"}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Màu sắc
                </label>
                <p className="text-sm">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {(appointment.vehicle_id as any)?.color || "—"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Thông tin dịch vụ */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="w-5 h-5" />
              Dịch vụ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Tên dịch vụ
                </label>
                <p className="text-sm">
                  {appointment.service_type_id?.service_name || "—"}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Giá cơ bản
                </label>
                <p className="text-sm">
                  {appointment.service_type_id?.base_price
                    ? `${appointment.service_type_id.base_price.toLocaleString(
                        "vi-VN"
                      )} VNĐ`
                    : "—"}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Thời gian ước tính
                </label>
                <p className="text-sm">
                  {appointment.service_type_id?.estimated_duration || "—"}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Mô tả
                </label>
                <p className="text-sm">
                  {appointment.service_type_id?.description || "—"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Thông tin trung tâm */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Trung tâm dịch vụ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Tên trung tâm
                </label>
                <p className="text-sm">
                  {appointment.center_id?.center_name || "—"}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Địa chỉ
                </label>
                <p className="text-sm">
                  {appointment.center_id?.address || "—"}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Số điện thoại
                </label>
                <p className="text-sm">{appointment.center_id?.phone || "—"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Thông tin thanh toán */}
        {(appointment.payment_id || appointment.final_payment_id) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Thông tin thanh toán
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {appointment.payment_id && (
                  <div>
                    <h4 className="font-medium mb-2">Thanh toán đặt cọc</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Mã đơn hàng
                        </label>
                        <p className="text-sm">
                          {appointment.payment_id.order_code || "—"}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Số tiền
                        </label>
                        <p className="text-sm">
                          {appointment.payment_id.amount
                            ? `${appointment.payment_id.amount.toLocaleString(
                                "vi-VN"
                              )} VNĐ`
                            : "—"}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Trạng thái
                        </label>
                        <p className="text-sm">
                          {appointment.payment_id.status || "—"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {appointment.final_payment_id && (
                  <div>
                    <h4 className="font-medium mb-2">Thanh toán cuối</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Mã đơn hàng
                        </label>
                        <p className="text-sm">
                          {appointment.final_payment_id.order_code || "—"}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Số tiền
                        </label>
                        <p className="text-sm">
                          {appointment.final_payment_id.amount
                            ? `${appointment.final_payment_id.amount.toLocaleString(
                                "vi-VN"
                              )} VNĐ`
                            : "—"}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Trạng thái
                        </label>
                        <p className="text-sm">
                          {appointment.final_payment_id.status || "—"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Thông tin phân công */}
        {(appointment.assigned_by ||
          appointment.assigned ||
          appointment.technician_id) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Thông tin phân công
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {appointment.assigned_by && (
                  <div>
                    <h4 className="font-medium mb-2">Người phân công</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Họ tên
                        </label>
                        <p className="text-sm">
                          {appointment.assigned_by.fullName ||
                            appointment.assigned_by.username ||
                            "—"}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Email
                        </label>
                        <p className="text-sm">
                          {appointment.assigned_by.email || "—"}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Số điện thoại
                        </label>
                        <p className="text-sm">
                          {appointment.assigned_by.phone || "—"}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Vai trò
                        </label>
                        <p className="text-sm">
                          {appointment.assigned_by.role || "—"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {appointment.assigned && (
                  <div>
                    <h4 className="font-medium mb-2">Người được phân công</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Họ tên
                        </label>
                        <p className="text-sm">
                          {appointment.assigned.fullName ||
                            appointment.assigned.username ||
                            "—"}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Email
                        </label>
                        <p className="text-sm">
                          {appointment.assigned.email || "—"}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Số điện thoại
                        </label>
                        <p className="text-sm">
                          {appointment.assigned.phone || "—"}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Vai trò
                        </label>
                        <p className="text-sm">
                          {appointment.assigned.role || "—"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {appointment.technician_id && (
                  <div>
                    <h4 className="font-medium mb-2">Kỹ thuật viên</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Họ tên
                        </label>
                        <p className="text-sm">
                          {appointment.technician_id.fullName ||
                            appointment.technician_id.username ||
                            "—"}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Email
                        </label>
                        <p className="text-sm">
                          {appointment.technician_id.email || "—"}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Số điện thoại
                        </label>
                        <p className="text-sm">
                          {appointment.technician_id.phone || "—"}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Vai trò
                        </label>
                        <p className="text-sm">
                          {appointment.technician_id.role || "—"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Hành động</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Pending status - Nhận lịch hẹn */}
              {appointment.status === "pending" && (
                <div className="flex gap-4">
                  <Button
                    onClick={() => updateAppointmentStatus("accepted")}
                    className="bg-green-600 hover:bg-green-700">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Nhận lịch hẹn
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => updateAppointmentStatus("cancelled")}>
                    Hủy lịch hẹn
                  </Button>
                </div>
              )}

              {/* Accepted status - Chọn technician */}
              {appointment.status === "accepted" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    <span className="font-medium">Lịch hẹn đã được nhận</span>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">
                        Chọn kỹ thuật viên phù hợp:
                      </label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Chọn kỹ thuật viên có lịch trống để phân công
                      </p>
                    </div>

                    {loadingTechnicians ? (
                      <div className="text-center py-8">
                        <div className="text-sm text-muted-foreground">
                          <Clock className="w-4 h-4 animate-spin mx-auto mb-2" />
                          Đang tải danh sách kỹ thuật viên...
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Ngày: {appointment.appoinment_date}
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {technicians.map((tech) => {
                          const scheduleInfo = getTechnicianScheduleInfo(
                            tech._id
                          );
                          const isSelected = selectedTechnician === tech._id;
                          const isAvailable =
                            isTechnicianAvailableOnAppointmentDate(tech._id);

                          return (
                            <Card
                              key={tech._id}
                              className={`cursor-pointer transition-all duration-200 ${
                                isSelected
                                  ? "ring-2 ring-blue-500 bg-blue-50"
                                  : isAvailable
                                  ? "hover:shadow-md hover:border-blue-300"
                                  : "opacity-50 cursor-not-allowed"
                              }`}
                              onClick={() => {
                                if (isAvailable) {
                                  setSelectedTechnician(tech._id);
                                }
                              }}>
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex items-center gap-2">
                                    <User className="w-5 h-5 text-blue-600" />
                                    <div>
                                      <h4 className="font-medium text-sm">
                                        {tech.fullName}
                                      </h4>
                                      <p className="text-xs text-muted-foreground">
                                        {tech.email}
                                      </p>
                                    </div>
                                  </div>
                                  <Badge
                                    variant={
                                      isAvailable ? "default" : "secondary"
                                    }
                                    className={
                                      isAvailable
                                        ? "bg-green-100 text-green-800"
                                        : "bg-red-100 text-red-800"
                                    }>
                                    {isAvailable ? "Rảnh" : "Bận"}
                                  </Badge>
                                </div>

                                <div className="space-y-2">
                                  <div className="flex justify-between text-xs">
                                    <span className="text-muted-foreground">
                                      Số lịch hẹn:
                                    </span>
                                    <span className="font-medium">
                                      {scheduleInfo.totalAssignments}
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-xs">
                                    <span className="text-muted-foreground">
                                      Số điện thoại:
                                    </span>
                                    <span className="font-medium">
                                      {tech.phone || "—"}
                                    </span>
                                  </div>

                                  {/* Nút xem lịch làm việc */}
                                  <div className="mt-3">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="w-full text-xs"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        showTechnicianSchedule(tech._id);
                                      }}>
                                      <CalendarDays className="w-3 h-3 mr-1" />
                                      Xem lịch làm việc
                                    </Button>
                                  </div>

                                  {/* Hiển thị chi tiết schedule nếu có */}
                                  {/* {scheduleInfo.schedules.length > 0 && (
                                    <div className="mt-2 pt-2 border-t border-gray-200">
                                      <div className="text-xs text-muted-foreground mb-1">
                                        Lịch hẹn hiện tại:
                                      </div>
                                      <div className="space-y-1">
                                        {scheduleInfo.schedules.slice(0, 2).map(
                                          (
                                            schedule: {
                                              appoinment_time?: string;
                                              status?: string;
                                              user_id?: { fullName?: string };
                                            },
                                            index: number
                                          ) => (
                                            <div
                                              key={index}
                                              className="text-xs bg-gray-50 p-1 rounded">
                                              <div className="flex justify-between">
                                                <span>
                                                  {formatScheduleTime(schedule)}
                                                </span>
                                                <span
                                                  className={`px-1 rounded text-xs ${
                                                    schedule.status ===
                                                    "completed"
                                                      ? "bg-green-100 text-green-800"
                                                      : schedule.status ===
                                                        "in_progress"
                                                      ? "bg-blue-100 text-blue-800"
                                                      : schedule.status ===
                                                        "assigned"
                                                      ? "bg-yellow-100 text-yellow-800"
                                                      : "bg-gray-100 text-gray-800"
                                                  }`}>
                                                  {formatScheduleStatus(
                                                    schedule.status
                                                  )}
                                                </span>
                                              </div>
                                              {schedule.user_id?.fullName && (
                                                <div className="text-xs text-muted-foreground mt-1">
                                                  Khách:{" "}
                                                  {schedule.user_id.fullName}
                                                </div>
                                              )}
                                            </div>
                                          )
                                        )}
                                        {scheduleInfo.schedules.length > 2 && (
                                          <div className="text-xs text-muted-foreground">
                                            +{scheduleInfo.schedules.length - 2}{" "}
                                            lịch khác
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )} */}
                                </div>

                                {isSelected && (
                                  <div className="mt-3 pt-3 border-t border-blue-200">
                                    <div className="flex items-center gap-2 text-blue-600">
                                      <CheckCircle className="w-4 h-4" />
                                      <span className="text-sm font-medium">
                                        Đã chọn
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    )}

                    {technicians.length === 0 && !loadingTechnicians && (
                      <div className="text-center py-8">
                        <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground mb-2">
                          Không có kỹ thuật viên nào
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Ngày: {appointment.appoinment_date}
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setTechniciansLoaded(false);
                            loadTechnicians();
                          }}
                          className="mt-2">
                          Thử lại
                        </Button>
                      </div>
                    )}
                  </div>

                  {selectedTechnician && (
                    <div className="flex gap-2 pt-4 border-t">
                      <Button
                        onClick={handleAssignTechnician}
                        disabled={assigning}
                        className="bg-blue-600 hover:bg-blue-700">
                        {assigning ? (
                          <>
                            <Clock className="w-4 h-4 mr-2 animate-spin" />
                            Đang phân công...
                          </>
                        ) : (
                          <>
                            <User className="w-4 h-4 mr-2" />
                            Phân công kỹ thuật viên
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setSelectedTechnician("")}>
                        Hủy chọn
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => updateAppointmentStatus("cancelled")}>
                        Hủy lịch hẹn
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Assigned status - Đã phân công */}
              {appointment.status === "assigned" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-blue-600">
                    <User className="w-4 h-4" />
                    <span className="font-medium">
                      Đã phân công kỹ thuật viên
                    </span>
                  </div>

                  {appointment.assigned && (
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-sm">
                        <strong>Kỹ thuật viên:</strong>{" "}
                        {appointment.assigned.fullName ||
                          appointment.assigned.username}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Email: {appointment.assigned.email}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Completed status */}
              {appointment.status === "completed" && (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span className="font-medium">Lịch hẹn đã hoàn tất</span>
                </div>
              )}

              {/* Cancelled status */}
              {appointment.status === "cancelled" && (
                <div className="flex items-center gap-2 text-red-600">
                  <Clock className="w-4 h-4" />
                  <span className="font-medium">Lịch hẹn đã bị hủy</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal hiển thị lịch làm việc chi tiết */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <div className="flex items-center gap-3">
                <CalendarDays className="w-6 h-6 text-blue-600" />
                <div>
                  <h2 className="text-xl font-semibold">
                    Lịch làm việc chi tiết
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {getSelectedTechnicianInfo()?.fullName} -{" "}
                    {getSelectedTechnicianInfo()?.email}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={closeScheduleModal}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[70vh]">
              {(() => {
                const selectedTechInfo = getSelectedTechnicianInfo();
                const selectedTechSchedule = getSelectedTechnicianSchedule();

                if (!selectedTechInfo) {
                  return (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">
                        Không tìm thấy thông tin kỹ thuật viên
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-6">
                    {/* Thông tin kỹ thuật viên */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">
                          Thông tin kỹ thuật viên
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">
                              Họ tên
                            </label>
                            <p className="text-sm">
                              {selectedTechInfo.fullName}
                            </p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">
                              Email
                            </label>
                            <p className="text-sm">{selectedTechInfo.email}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">
                              Số điện thoại
                            </label>
                            <p className="text-sm">
                              {selectedTechInfo.phone || "—"}
                            </p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">
                              Tổng số lịch hẹn
                            </label>
                            <p className="text-sm">
                              {selectedTechSchedule.length}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Lịch làm việc */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">
                          Lịch làm việc (30 ngày tới)
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {selectedTechSchedule.length === 0 ? (
                          <div className="text-center py-8">
                            <CalendarDays className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground">
                              Không có lịch hẹn nào
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              Kỹ thuật viên hoàn toàn rảnh trong 30 ngày tới
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {selectedTechSchedule.map(
                              (
                                schedule: {
                                  appoinment_date?: string;
                                  appoinment_time?: string;
                                  status?: string;
                                  estimated_cost?: number;
                                  user_id?: { fullName?: string };
                                  vehicle_id?: { license_plate?: string };
                                  center_id?: { _id?: string };
                                },
                                index: number
                              ) => (
                                <div
                                  key={index}
                                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                                  <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                      <Calendar className="w-4 h-4 text-blue-600" />
                                      <div>
                                        <p className="font-medium text-sm">
                                          {formatScheduleDate(
                                            schedule.appoinment_date
                                          )}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                          {formatScheduleTime(schedule)}
                                        </p>
                                      </div>
                                    </div>
                                    <Badge
                                      variant={
                                        schedule.status === "completed"
                                          ? "default"
                                          : schedule.status === "in_progress"
                                          ? "default"
                                          : schedule.status === "assigned"
                                          ? "secondary"
                                          : "outline"
                                      }
                                      className={
                                        schedule.status === "completed"
                                          ? "bg-green-100 text-green-800"
                                          : schedule.status === "in_progress"
                                          ? "bg-blue-100 text-blue-800"
                                          : schedule.status === "assigned"
                                          ? "bg-yellow-100 text-yellow-800"
                                          : "bg-gray-100 text-gray-800"
                                      }>
                                      {formatScheduleStatus(schedule.status)}
                                    </Badge>
                                  </div>

                                  <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                      <label className="text-xs font-medium text-muted-foreground">
                                        Khách hàng
                                      </label>
                                      <p className="text-sm">
                                        {schedule.user_id?.fullName || "—"}
                                      </p>
                                    </div>
                                    <div>
                                      <label className="text-xs font-medium text-muted-foreground">
                                        Biển số xe
                                      </label>
                                      <p className="text-sm">
                                        {schedule.vehicle_id?.license_plate ||
                                          "—"}
                                      </p>
                                    </div>
                                    <div>
                                      <label className="text-xs font-medium text-muted-foreground">
                                        Chi phí ước tính
                                      </label>
                                      <p className="text-sm">
                                        {schedule.estimated_cost
                                          ? `${schedule.estimated_cost.toLocaleString(
                                              "vi-VN"
                                            )} VNĐ`
                                          : "—"}
                                      </p>
                                    </div>
                                    <div>
                                      <label className="text-xs font-medium text-muted-foreground">
                                        Trung tâm
                                      </label>
                                      <p className="text-sm">
                                        {schedule.center_id?._id
                                          ? "Đã phân công"
                                          : "—"}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Nút chọn kỹ thuật viên */}
                    <div className="flex gap-3 pt-4 border-t">
                      <Button
                        onClick={() => {
                          setSelectedTechnician(selectedTechInfo._id);
                          closeScheduleModal();
                        }}
                        className="bg-blue-600 hover:bg-blue-700">
                        <User className="w-4 h-4 mr-2" />
                        Chọn kỹ thuật viên này
                      </Button>
                      <Button variant="outline" onClick={closeScheduleModal}>
                        Đóng
                      </Button>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
