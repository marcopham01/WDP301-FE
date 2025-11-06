import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "react-toastify";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { CalendarIcon, Car, MapPin, Wrench, ChevronRight, ChevronLeft, Check, Home, Phone, Clock, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import Header from "@/components/MainLayout/Header";
import Footer from "@/components/MainLayout/Footer";
import { getUserVehiclesApi, Vehicle, VehicleModel, getVehicleModelsApi, createVehicleApi } from "@/lib/vehicleApi";
import { getAllServicesApi, ServiceType } from "@/lib/serviceApi";
import { getServiceCentersApi, ServiceCenter, getTechniciansApi, Technician } from "@/lib/serviceCenterApi";
import { getProfileApi } from "@/lib/authApi";
import { createAppointmentApi, getAppointmentByIdApi, getTechnicianScheduleApi, TechnicianScheduleResponse } from "@/lib/appointmentApi";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

// Stepper steps
const STEPS = [
  { id: 1, title: "Chọn xe", subtitle: "Chọn xe hoặc thêm xe mới" },
  { id: 2, title: "Chọn trung tâm", subtitle: "Tìm trung tâm dịch vụ" },
  { id: 3, title: "Chọn dịch vụ", subtitle: "Dịch vụ tương thích" },
  { id: 4, title: "Thông tin cuối", subtitle: "Ngày giờ & chi tiết" }
];

export default function BookingPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [serviceCenters, setServiceCenters] = useState<ServiceCenter[]>([]);

  const [selectedVehicle, setSelectedVehicle] = useState("");
  const [selectedServiceType, setSelectedServiceType] = useState("");
  const [selectedCenter, setSelectedCenter] = useState("");
  const [bookingDate, setBookingDate] = useState<Date | undefined>(undefined);
  const [bookingTime, setBookingTime] = useState("");
  const [notes, setNotes] = useState("");
  const [currentUser, setCurrentUser] = useState<{ id: string; username: string } | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState<{ amount?: number; checkout_url?: string; qr_code?: string; order_code?: number } | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("online");
  const [showAddVehicleForm, setShowAddVehicleForm] = useState(false);
  const [vehicleModels, setVehicleModels] = useState<VehicleModel[]>([]);
  const [centerTechnicians, setCenterTechnicians] = useState<Technician[]>([]);
  const [loadingTechnicians, setLoadingTechnicians] = useState(false);
  const [assignedTechnician, setAssignedTechnician] = useState<{ fullName?: string; phone?: string; email?: string } | null>(null);
  const [selectedTechnicianId, setSelectedTechnicianId] = useState<string>(""); // user_id of technician; "" means auto
  const [techScheduleBusyTimes, setTechScheduleBusyTimes] = useState<Set<string>>(new Set());
  const [techDayBookedCount, setTechDayBookedCount] = useState<number>(0);
  const [loadingTechSchedule, setLoadingTechSchedule] = useState<boolean>(false);
  
  // Form states for adding vehicle
  const [newVehicle, setNewVehicle] = useState({
    model_id: "",
    license_plate: "",
    color: "",
    purchase_date: "",
    current_miliage: "",
    battery_health: "",
    last_service_mileage: "",
  });
  const [addingVehicle, setAddingVehicle] = useState(false);

  const colors = [
    { value: "white", label: "Trắng" },
    { value: "black", label: "Đen" },
    { value: "silver", label: "Bạc" },
    { value: "red", label: "Đỏ" },
    { value: "blue", label: "Xanh dương" },
    { value: "green", label: "Xanh lá" },
    { value: "gray", label: "Xám" },
    { value: "other", label: "Khác" },
  ];

  const timeSlots = [
    "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
    "11:00", "11:30", "13:00", "13:30", "14:00", "14:30",
    "15:00", "15:30", "16:00", "16:30", "17:00"
  ];

  useEffect(() => {
    const load = async () => {
      const [profile, veh, svc, centers] = await Promise.all([
        getProfileApi(),
        getUserVehiclesApi(),
        getAllServicesApi(),
        getServiceCentersApi(),
      ]);
      if (profile.ok && profile.data?.user) {
        const u = profile.data.user;
        setCurrentUser({ id: u._id || u.id, username: u.username });
      } else {
        setCurrentUser(null);
      }
      if (veh.ok && veh.data?.data) setVehicles(veh.data.data);
      else setVehicles([]);
      if (svc.ok && svc.data?.data) setServiceTypes(svc.data.data);
      else setServiceTypes([]);
      if (centers.ok && centers.data?.data) {
        setServiceCenters(centers.data.data);
      } else {
        console.error("[BookingPage] Failed to load service centers:", centers);
        setServiceCenters([]);
        // Show user-friendly error message
        if (centers.status === 500) {
          alert("Không thể tải danh sách trung tâm bảo dưỡng. Vui lòng thử lại sau hoặc liên hệ hỗ trợ.");
        }
      }
    };
    load();
  }, []);

  // Load technicians whenever user selects a service center
  useEffect(() => {
    const loadTechs = async () => {
      if (!selectedCenter) {
        setCenterTechnicians([]);
        setSelectedTechnicianId("");
        return;
      }
      setLoadingTechnicians(true);
      try {
        const res = await getTechniciansApi(selectedCenter);
        if (res.ok && res.data?.data) {
          setCenterTechnicians(res.data.data);
        } else {
          setCenterTechnicians([]);
        }
      } catch (e) {
        console.error("loadTechnicians error", e);
        setCenterTechnicians([]);
      } finally {
        setLoadingTechnicians(false);
      }
    };
    loadTechs();
  }, [selectedCenter]);

  // Load technician availability for the selected date when a technician is chosen
  useEffect(() => {
    const fetchTechSchedule = async () => {
      if (!selectedTechnicianId || !bookingDate) {
        setTechScheduleBusyTimes(new Set());
        setTechDayBookedCount(0);
        return;
      }
      setLoadingTechSchedule(true);
      try {
        const dayStr = format(bookingDate, "yyyy-MM-dd");
        const res = await getTechnicianScheduleApi({
          technician_id: selectedTechnicianId,
          date_from: dayStr,
          date_to: dayStr,
        });
        if (res.ok && res.data && res.data.data) {
          const dataUnion = res.data.data as TechnicianScheduleResponse | { items: unknown[] };
          if (!('technician' in dataUnion)) {
            // Unexpected shape for this call with technician_id; reset
            setTechScheduleBusyTimes(new Set());
            setTechDayBookedCount(0);
            setLoadingTechSchedule(false);
            return;
          }
          const payload = dataUnion as TechnicianScheduleResponse;
          const schedules = payload.schedules || [];
          // Build a set of busy time slots considering estimated durations
          const busy = new Set<string>();
          // Active statuses that block the slot
          const blockStatuses = new Set(["pending", "assigned", "accepted", "in_progress", "deposited"]);
          // Determine service duration (minutes) from selected service or fallback 60
          const serviceDurationMin = Number(
            (selectedServiceType && (serviceTypes.find(s => s._id === selectedServiceType)?.estimated_duration)) || 60
          );

          // Helper to convert HH:mm to minutes since 00:00
          const toMin = (t: string) => {
            const [h, m] = t.split(":").map(Number);
            return h * 60 + m;
          };

          // For each existing appointment on that day, mark overlapping start times as busy
          schedules
            .filter((s) => s.appoinment_date?.startsWith(dayStr) && blockStatuses.has(s.status))
            .forEach((s) => {
              const existStart = toMin(s.appoinment_time);
              const existEnd = s.estimated_end_time && /^\d{2}:\d{2}$/.test(s.estimated_end_time)
                ? toMin(s.estimated_end_time)
                : existStart + Number(s.service_type_id?.estimated_duration ?? 60);

              timeSlots.forEach((slot) => {
                const slotStart = toMin(slot);
                const slotEnd = slotStart + serviceDurationMin;
                const overlap = (slotStart >= existStart && slotStart < existEnd)
                  || (slotEnd > existStart && slotEnd <= existEnd)
                  || (slotStart <= existStart && slotEnd >= existEnd);
                if (overlap) busy.add(slot);
              });
            });

          setTechScheduleBusyTimes(busy);
          setTechDayBookedCount(
            schedules.filter((s) => s.appoinment_date?.startsWith(dayStr) && blockStatuses.has(s.status)).length
          );
        } else {
          setTechScheduleBusyTimes(new Set());
          setTechDayBookedCount(0);
        }
      } catch (e) {
        console.error("getTechnicianScheduleApi error", e);
        setTechScheduleBusyTimes(new Set());
        setTechDayBookedCount(0);
      } finally {
        setLoadingTechSchedule(false);
      }
    };
    fetchTechSchedule();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTechnicianId, bookingDate, selectedServiceType]);

  const handleSubmit = async () => {
    if (!selectedVehicle || !selectedServiceType || !selectedCenter || !bookingDate || !bookingTime) {
      toast.error("Thiếu thông tin. Vui lòng điền đầy đủ thông tin đặt lịch (bao gồm ngày và giờ)");
      return;
    }
    if (!currentUser?.id) {
      toast.error("Chưa xác thực người dùng");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        appoinment_date: format(bookingDate, "yyyy-MM-dd"),
        appoinment_time: bookingTime,
        notes: notes || undefined,
        user_id: currentUser.id,
        vehicle_id: selectedVehicle,
        center_id: selectedCenter,
        service_type_id: selectedServiceType,
        ...(selectedTechnicianId ? { technician_id: selectedTechnicianId } : {}),
      };

      const res = await createAppointmentApi(payload);
      
  if (res.ok && res.data?.success) {
        // ✨ Hiển thị thông báo thành công
        toast.success("🎉 Đặt lịch thành công! " + (res.data.message || "Lịch hẹn của bạn đã được tạo."));

        // ✨ Kiểm tra và hiển thị Technician đã được tự động gán
        /* eslint-disable @typescript-eslint/no-explicit-any */
        const appointmentAny: any = res.data.data as unknown;
        if ((appointmentAny as any)?.technician_id) {
          const technicianInfo = (appointmentAny as any).technician_id as { fullName?: string; phone?: string; email?: string };
          const techName = technicianInfo.fullName || "N/A";
          const techPhone = technicianInfo.phone || "";
          setAssignedTechnician(technicianInfo);
          
          // Hiển thị thông báo về technician
          setTimeout(() => {
            toast.info(
              `🔧 Kỹ thuật viên phụ trách: ${techName}${techPhone ? ` - ${techPhone}` : ""}`,
              { autoClose: 8000 }
            );
          }, 1000);
        } else {
          // Nếu không có technician_id, có thể là do không có technician rảnh
          console.warn("⚠️ Appointment được tạo nhưng chưa có technician_id");
        }
        /* eslint-enable @typescript-eslint/no-explicit-any */

        const appointmentId = res.data.data?._id;
        if (appointmentId) {
          const detail = await getAppointmentByIdApi(appointmentId);
          const appt = detail.data?.data as Record<string, unknown>;
          const pay = appt?.payment_id as Record<string, unknown>;
          if (detail.ok && pay) {
            setPaymentInfo({
              amount: pay.amount as number,
              checkout_url: pay.checkout_url as string,
              qr_code: pay.qr_code as string,
              order_code: pay.order_code as number,
            });
            setPaymentDialogOpen(true);
          } else if ((pay as Record<string, unknown>)?.checkout_url as string) {
            window.open((pay as Record<string, unknown>)?.checkout_url as string, "_blank");
          }
        }
      } else {
        toast.error("Không thể tạo lịch. " + (res.message || "Đã có lỗi xảy ra."));
      }
    } catch (error) {
      console.error("Booking error:", error);
      toast.error("Lỗi hệ thống. Không thể kết nối đến server.");
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (currentStep === 1 && !selectedVehicle) {
      toast.error("Vui lòng chọn xe");
      return;
    }
    if (currentStep === 2 && !selectedCenter) {
      toast.error("Vui lòng chọn trung tâm");
      return;
    }
    if (currentStep === 3 && !selectedServiceType) {
      toast.error("Vui lòng chọn dịch vụ");
      return;
    }
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    toast.success("Đăng xuất thành công!");
    setTimeout(() => {
      navigate("/login");
    }, 1000);
  };

  const loadVehicles = async () => {
    const veh = await getUserVehiclesApi();
    if (veh.ok && veh.data?.data) {
      setVehicles(veh.data.data);
    } else {
      setVehicles([]);
    }
  };

  const loadVehicleModels = async () => {
    const res = await getVehicleModelsApi();
    if (res.ok && res.data?.data) {
      setVehicleModels(res.data.data);
    }
  };

  const handleShowAddForm = () => {
    setShowAddVehicleForm(true);
    if (vehicleModels.length === 0) {
      loadVehicleModels();
    }
  };

  const handleCancelAddVehicle = () => {
    setShowAddVehicleForm(false);
    setNewVehicle({
      model_id: "",
      license_plate: "",
      color: "",
      purchase_date: "",
      current_miliage: "",
      battery_health: "",
      last_service_mileage: "",
    });
  };

  const handleAddVehicle = async () => {
    if (!newVehicle.model_id || !newVehicle.license_plate || !newVehicle.color) {
      toast.error("Vui lòng điền đầy đủ thông tin bắt buộc (Model, Biển số, Màu xe)");
      return;
    }

    setAddingVehicle(true);
    const res = await createVehicleApi({
      model_id: newVehicle.model_id,
      license_plate: newVehicle.license_plate,
      color: newVehicle.color,
      purchase_date: newVehicle.purchase_date || undefined,
      current_miliage: newVehicle.current_miliage ? Number(newVehicle.current_miliage) : undefined,
      battery_health: newVehicle.battery_health ? Number(newVehicle.battery_health) : undefined,
      last_service_mileage: newVehicle.last_service_mileage ? Number(newVehicle.last_service_mileage) : undefined,
    });

    if (res.ok) {
      toast.success("Thêm xe thành công!");
      await loadVehicles();
      handleCancelAddVehicle();
    } else {
      toast.error(res.message || "Không thể thêm xe");
    }
    setAddingVehicle(false);
  };

  const getVehicleLabel = (v: Vehicle) => {
    const m = v.model_id;
    const model = typeof m === "object" ? `${m.brand ?? ""} ${m.model_name ?? ""}`.trim() : "";
    return model;
  };

  const getVehicleInfo = (v: Vehicle) => {
    const m = v.model_id;
    const color = typeof m === "object" && m ? (m as { color?: string }).color : "";
    return color || "N/A";
  };

  const selectedVehicleData = vehicles.find(v => v._id === selectedVehicle);
  const selectedCenterData = serviceCenters.find(c => c._id === selectedCenter);
  const selectedServiceData = serviceTypes.find(s => s._id === selectedServiceType);

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="min-h-screen flex flex-col bg-gradient-to-br from-ev-green-light via-green-50/30 to-teal-50/20"
    >
      <Header onLogout={handleLogout} />
      <main className="flex-1 py-8">
        <div className="container max-w-5xl pt-20">
          {/* Header */}
          <div className="mb-8 text-center">
            <Button
              variant="ghost"
              className="mb-4"
              onClick={() => navigate("/")}
            >
              <Home className="mr-2 h-4 w-4" />
              Về trang chủ
            </Button>
            <h1 className="text-3xl font-bold text-foreground mb-2">Đặt lịch bảo dưỡng</h1>
            <p className="text-muted-foreground">Đặt lịch bảo dưỡng xe điện một cách dễ dàng</p>
          </div>

          {/* Stepper */}
          <div className="mb-8">
            <div className="relative max-w-4xl mx-auto px-4">
              {/* Track line (background) */}
              <div className="absolute left-4 right-4 top-5 h-1 bg-gray-200 rounded-full" />
              {/* Progress line (animated) */}
              <motion.div
                className="absolute left-4 top-5 h-1 bg-gradient-to-r from-ev-green to-teal-500 rounded-full"
                animate={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
                transition={{ duration: 0.5, ease: 'easeInOut' }}
              />

              {/* Markers */}
              <div className="grid grid-cols-4 gap-0">
                {STEPS.map((step) => {
                  const isDone = currentStep > step.id;
                  const isActive = currentStep === step.id;
                  return (
                    <div key={step.id} className="relative flex flex-col items-center">
                      <div className="relative z-10">
                        {isActive && (
                          <motion.span
                            className="absolute -inset-2 rounded-full bg-ev-green/15"
                            animate={{ scale: [1, 1.15, 1] }}
                            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                          />
                        )}
                        <motion.div
                          className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm shadow-sm transition-colors",
                            isActive
                              ? "bg-ev-green text-white"
                              : isDone
                              ? "bg-teal-500 text-white"
                              : "bg-gray-200 text-gray-600"
                          )}
                          animate={{ scale: isActive ? 1.05 : 1 }}
                          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                          aria-current={isActive ? 'step' : undefined}
                        >
                          {isDone ? <Check className="h-5 w-5" /> : step.id}
                        </motion.div>
                      </div>
                      <div className="mt-2 text-center min-h-[40px]">
                        <div
                          className={cn(
                            "text-sm font-medium",
                            isActive ? "text-ev-green" : "text-gray-600"
                          )}
                        >
                          {step.title}
                        </div>
                        <div className="text-xs text-gray-400 hidden sm:block">{step.subtitle}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mb-8">
            <div className="text-center text-sm text-muted-foreground mb-2">
              Bước {currentStep} / {STEPS.length}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 max-w-md mx-auto">
              <div
                className="bg-gradient-to-r from-ev-green to-teal-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / STEPS.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Content */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            {/* Step 1: Choose Vehicle */}
            {currentStep === 1 && (
              <div>
                <h2 className="text-2xl font-bold mb-4 text-center">Chọn xe của bạn</h2>
                <p className="text-center text-muted-foreground mb-6">
                  Chọn xe hiện có hoặc thêm xe mới để đặt lịch bảo dưỡng
                </p>

                {vehicles.length === 0 ? (
                  <div className="text-center py-12">
                    <Car className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                    <p className="text-muted-foreground mb-4">Bạn chưa có xe nào</p>
                    <Button onClick={handleShowAddForm}>
                      Thêm xe mới
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-sm font-medium mb-3">Xe hiện có</div>
                    <div className="grid gap-4 md:grid-cols-2">
                      {vehicles.map((vehicle) => (
                        <Card
                          key={vehicle._id}
                          className={cn(
                            "cursor-pointer transition-all hover:shadow-md",
                            selectedVehicle === vehicle._id
                              ? "border-ev-green border-2 bg-green-50"
                              : "border-gray-200"
                          )}
                          onClick={() => setSelectedVehicle(vehicle._id)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <div className={cn(
                                "p-3 rounded-lg",
                                selectedVehicle === vehicle._id ? "bg-green-100" : "bg-gray-100"
                              )}>
                                <Car className={cn(
                                  "h-6 w-6",
                                  selectedVehicle === vehicle._id ? "text-ev-green" : "text-gray-600"
                                )} />
                              </div>
                              <div className="flex-1">
                                <h3 className="font-semibold text-lg">{getVehicleLabel(vehicle)}</h3>
                                <p className="text-sm text-muted-foreground">{vehicle.license_plate}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {getVehicleInfo(vehicle)} • {(vehicle.model_id as { body_type?: string })?.body_type || "Sedan"}
                                </p>
                              </div>
                              {selectedVehicle === vehicle._id && (
                                <Check className="h-5 w-5 text-ev-green" />
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    {/* Button to show add vehicle form */}
                    {!showAddVehicleForm && (
                      <button
                        onClick={handleShowAddForm}
                        className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-gray-500 hover:border-ev-green hover:text-ev-green transition-colors flex items-center justify-center gap-2"
                      >
                        <Plus className="h-5 w-5" />
                        Thêm xe
                      </button>
                    )}

                    {/* Inline Add Vehicle Form */}
                    {showAddVehicleForm && (
                      <Card className="border-2 border-green-200 bg-green-50">
                        <CardContent className="p-6">
                          <h3 className="text-lg font-semibold mb-4">Thông tin xe mới</h3>
                          <div className="space-y-4">
                            {/* Row 1: Model and License Plate */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="model_id">Model *</Label>
                                <Select
                                  value={newVehicle.model_id}
                                  onValueChange={(value) => {
                                    setNewVehicle({ ...newVehicle, model_id: value });
                                  }}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Chọn model" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {vehicleModels.map((model) => (
                                      <SelectItem key={model._id} value={model._id}>
                                        {`${model.brand ?? ""} ${model.model_name ?? ""}`.trim()} {model.year ? `(${model.year})` : ""}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="license_plate">Biển số *</Label>
                                <Input
                                  id="license_plate"
                                  placeholder="VD: 51G-123.45"
                                  value={newVehicle.license_plate}
                                  onChange={(e) => setNewVehicle({ ...newVehicle, license_plate: e.target.value })}
                                />
                              </div>
                            </div>

                            {/* Row 2: Color and Purchase Date */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="color">Màu xe *</Label>
                                <Select
                                  value={newVehicle.color}
                                  onValueChange={(value) => setNewVehicle({ ...newVehicle, color: value })}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Chọn màu xe" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {colors.map((color) => (
                                      <SelectItem key={color.value} value={color.value}>
                                        {color.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="purchase_date">Ngày mua</Label>
                                <Input
                                  id="purchase_date"
                                  type="date"
                                  value={newVehicle.purchase_date}
                                  onChange={(e) => setNewVehicle({ ...newVehicle, purchase_date: e.target.value })}
                                />
                              </div>
                            </div>

                            {/* Row 3: Mileage, Battery Health, Last Service */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="current_miliage">Số km hiện tại</Label>
                                <Input
                                  id="current_miliage"
                                  type="number"
                                  placeholder="0"
                                  value={newVehicle.current_miliage}
                                  onChange={(e) => setNewVehicle({ ...newVehicle, current_miliage: e.target.value })}
                                />
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="battery_health">Pin (%)</Label>
                                <Input
                                  id="battery_health"
                                  type="number"
                                  placeholder="100"
                                  min="0"
                                  max="100"
                                  value={newVehicle.battery_health}
                                  onChange={(e) => setNewVehicle({ ...newVehicle, battery_health: e.target.value })}
                                />
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="last_service_mileage">Km bảo dưỡng cuối</Label>
                                <Input
                                  id="last_service_mileage"
                                  type="number"
                                  placeholder="0"
                                  value={newVehicle.last_service_mileage}
                                  onChange={(e) => setNewVehicle({ ...newVehicle, last_service_mileage: e.target.value })}
                                />
                              </div>
                            </div>

                            {/* Info Box */}
                            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 p-4 rounded-xl">
                              <h4 className="font-semibold text-gray-900 mb-2">💡 Lưu ý:</h4>
                              <ul className="text-sm text-gray-700 space-y-1">
                                <li>• Biển số, model và màu xe là bắt buộc</li>
                                <li>• Số km hiện tại sẽ được sử dụng để tính toán lịch bảo dưỡng</li>
                                <li>• Có thể bổ sung tình trạng pin để gợi ý chính xác hơn</li>
                              </ul>
                            </div>
                          </div>

                          <div className="flex gap-3 mt-6">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={handleCancelAddVehicle}
                              disabled={addingVehicle}
                              className="flex-1"
                            >
                              Hủy
                            </Button>
                            <Button
                              onClick={handleAddVehicle}
                              disabled={addingVehicle}
                              className="flex-1"
                            >
                              {addingVehicle ? "Đang thêm..." : "Thêm xe"}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Choose Service Center */}
            {currentStep === 2 && (
              <div>
                <h2 className="text-2xl font-bold mb-4 text-center">Chọn trung tâm dịch vụ</h2>
                <p className="text-center text-muted-foreground mb-6">
                  Tìm và chọn trung tâm dịch vụ gần bạn nhất
                </p>

                <div className="space-y-4">
                  {serviceCenters.map((center) => (
                    <Card
                      key={center._id}
                      className={cn(
                        "cursor-pointer transition-all hover:shadow-md",
                        selectedCenter === center._id
                          ? "border-ev-green border-2 bg-green-50"
                          : "border-gray-200"
                      )}
                      onClick={() => setSelectedCenter(center._id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-lg">{center.center_name}</h3>
                              <Badge variant="default" className="bg-green-100 text-green-700 hover:bg-green-100">
                                Hoạt động
                              </Badge>
                            </div>
                            <div className="flex items-start gap-2 text-sm text-muted-foreground mb-2">
                              <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                              <span>{center.address}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Phone className="h-4 w-4" />
                              <span>{center.phone || "N/A"}</span>
                            </div>
                            {center.working_hours && center.working_hours.length > 0 && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                <Clock className="h-4 w-4" />
                                <span>Giờ làm việc: {center.working_hours[0].open_time} - {center.working_hours[0].close_time}</span>
                              </div>
                            )}
                          </div>
                          {selectedCenter === center._id && (
                            <Check className="h-5 w-5 text-ev-green ml-2" />
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {serviceCenters.length === 0 && (
                  <div className="text-center py-12">
                    <MapPin className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                    <p className="text-muted-foreground">Không tìm thấy trung tâm nào</p>
                  </div>
                )}

                {/* Technicians of selected center */}
                {selectedCenter && (
                  <div className="mt-6">
                    <div className="text-sm font-medium mb-2 flex items-center gap-2">
                      <Wrench className="h-4 w-4" />
                      Kỹ thuật viên của trung tâm đã chọn
                    </div>
                    <div className="rounded-lg border p-4 bg-gray-50">
                      {loadingTechnicians ? (
                        <div className="text-sm text-muted-foreground">Đang tải kỹ thuật viên...</div>
                      ) : centerTechnicians.length === 0 ? (
                        <div className="text-sm text-muted-foreground">Trung tâm này chưa có kỹ thuật viên.</div>
                      ) : (
                        <div className="grid gap-3 sm:grid-cols-2">
                          {centerTechnicians.map((t) => (
                            <div key={t._id} className="flex items-start justify-between rounded-md bg-white p-3 border">
                              <div>
                                <div className="font-medium">{t.user.fullName}</div>
                                <div className="text-xs text-muted-foreground">{t.user.email}</div>
                                {t.user.phone && (
                                  <div className="text-xs text-muted-foreground">{t.user.phone}</div>
                                )}
                              </div>
                              <Badge className={t.status === 'on' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700'}>
                                {t.status === 'on' ? 'Hoạt động' : 'Không hoạt động'}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground mt-3">
                        Hệ thống sẽ tự động phân công kỹ thuật viên khi bạn hoàn tất đặt lịch.
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Choose Service */}
            {currentStep === 3 && (
              <div>
                <h2 className="text-2xl font-bold mb-4 text-center">Chọn dịch vụ</h2>
                <p className="text-center text-muted-foreground mb-6">
                  Dịch vụ tương thích với{" "}
                  <span className="font-semibold">
                    {selectedVehicleData ? getVehicleLabel(selectedVehicleData) : "xe của bạn"}
                  </span>
                </p>

                <div className="space-y-4">
                  <div className="text-sm font-medium mb-3">Dịch vụ ({serviceTypes.length})</div>
                  <div className="grid gap-4">
                    {serviceTypes.map((service) => (
                      <Card
                        key={service._id}
                        className={cn(
                          "cursor-pointer transition-all hover:shadow-md",
                          selectedServiceType === service._id
                            ? "border-ev-green border-2 bg-green-50"
                            : "border-gray-200"
                        )}
                        onClick={() => setSelectedServiceType(service._id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Wrench className={cn(
                                  "h-5 w-5",
                                  selectedServiceType === service._id ? "text-ev-green" : "text-gray-600"
                                )} />
                                <h3 className="font-semibold text-lg">{service.service_name}</h3>
                                {service.base_price && (
                                  <Badge variant="secondary" className="ml-auto bg-green-100 text-green-700">
                                    Giá tốt
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mb-3">
                                {service.description || "Dịch vụ chuyên nghiệp cho xe điện của bạn"}
                              </p>
                              {service.base_price && (
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-muted-foreground">Giá cơ bản:</span>
                                  <span className="text-lg font-bold text-ev-green">
                                    {service.base_price.toLocaleString("vi-VN")} đ
                                  </span>
                                </div>
                              )}
                              {service.estimated_duration && (
                                <div className="text-xs text-muted-foreground mt-2">
                                  Thời gian dự kiến: ~{service.estimated_duration} phút
                                </div>
                              )}
                            </div>
                            {selectedServiceType === service._id && (
                              <Check className="h-5 w-5 text-ev-green ml-2" />
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {serviceTypes.length === 0 && (
                  <div className="text-center py-12">
                    <Wrench className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                    <p className="text-muted-foreground">Không có dịch vụ nào</p>
                  </div>
                )}
              </div>
            )}

            {/* Step 4: Date and Details */}
            {currentStep === 4 && (
              <div>
                <h2 className="text-2xl font-bold mb-4 text-center">Thông tin cuối cùng</h2>
                <p className="text-center text-muted-foreground mb-6">
                  Chọn ngày giờ và cung cấp thông tin bổ sung
                </p>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Left: Date and Notes */}
                  <div className="space-y-4">
                          {/* Technician selection (optional) */}
                          <div>
                            <Label className="text-sm font-medium mb-2 block">Chọn kỹ thuật viên (tùy chọn)</Label>
                            <Select
                              value={selectedTechnicianId || "auto"}
                              onValueChange={(v) => setSelectedTechnicianId(v === "auto" ? "" : v)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Tự động (hệ thống phân công)" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="auto">Tự động (hệ thống phân công)</SelectItem>
                                {centerTechnicians
                                  .filter(t => t.status === 'on')
                                  .map((t) => (
                                    <SelectItem key={t._id} value={t.user._id}>
                                      {t.user.fullName}{t.user.phone ? ` — ${t.user.phone}` : ''}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                            {!selectedTechnicianId && (
                              <div className="text-xs text-muted-foreground mt-2">
                                Bạn đang để hệ thống tự phân công KTV. Chọn KTV để xem lịch rảnh/bận theo ngày/giờ.
                              </div>
                            )}
                          </div>

                    <div>
                      <Label className="text-sm font-medium mb-2 block">Chọn ngày</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !bookingDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {bookingDate ? format(bookingDate, "PPP", { locale: vi }) : "Chọn ngày hẹn"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={bookingDate}
                            onSelect={setBookingDate}
                            disabled={(date) => date < new Date() || date < new Date("1900-01-01")}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    {/* Time Picker - Only show when date is selected */}
                    {bookingDate && (
                      <div>
                        <Label className="text-sm font-medium mb-2 block">Chọn giờ</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !bookingTime && "text-muted-foreground"
                              )}
                            >
                              <Clock className="mr-2 h-4 w-4" />
                              {bookingTime || "Chọn giờ hẹn"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-80 p-0" align="start">
                            <div className="p-4 border-b">
                              <Input
                                type="time"
                                value={bookingTime}
                                onChange={(e) => setBookingTime(e.target.value)}
                                placeholder="Nhập giờ (HH:mm)"
                                className="w-full"
                              />
                            </div>
                            <div className="max-h-64 overflow-y-auto p-2">
                              <div className="space-y-1">
                                {timeSlots.map((time) => {
                                  const isBusy = selectedTechnicianId ? techScheduleBusyTimes.has(time) : false;
                                  return (
                                    <button
                                      key={time}
                                      onClick={() => {
                                        if (isBusy) {
                                          toast.warn("Khung giờ này KTV đã bận. Vui lòng chọn giờ khác hoặc để hệ thống tự động.");
                                          return;
                                        }
                                        setBookingTime(time);
                                      }}
                                      disabled={!!selectedTechnicianId && isBusy}
                                      className={cn(
                                        "w-full text-left px-3 py-2 rounded-md transition-colors",
                                        bookingTime === time
                                          ? "bg-green-100 text-ev-green font-medium"
                                          : isBusy
                                          ? "text-gray-400 bg-gray-50 cursor-not-allowed"
                                          : "text-gray-700 hover:bg-gray-100"
                                      )}
                                    >
                                      <div className="flex items-center justify-between">
                                        <span>{time}</span>
                                        {selectedTechnicianId && (
                                          <Badge className={cn(
                                            "text-xs",
                                            isBusy ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                                          )}>
                                            {isBusy ? "Bận" : "Rảnh"}
                                          </Badge>
                                        )}
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                              <div className="mt-2 pt-2 border-t">
                                <button
                                  onClick={() => setBookingTime("")}
                                  className="w-full text-center px-3 py-2 rounded-md text-sm text-gray-500 hover:bg-gray-100"
                                >
                                  Xóa giờ đã chọn
                                </button>
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                        {selectedTechnicianId && bookingDate && (
                          <div className="mt-2 text-xs text-muted-foreground">
                            {loadingTechSchedule ? (
                              <span>Đang tải lịch của KTV...</span>
                            ) : (
                              <span>
                                Đã đặt trong ngày: <span className="font-medium">{techDayBookedCount}/4</span> slot (tối đa 4 slot/ngày)
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    <div>
                      <Label className="text-sm font-medium mb-2 block">Mô tả dịch vụ</Label>
                      <Textarea
                        placeholder="Mô tả vấn đề về xe của bạn hoặc các yêu cầu đặc biệt (nếu có)..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={5}
                        maxLength={500}
                      />
                      <div className="text-xs text-right text-muted-foreground mt-1">
                        {notes.length} / 500
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium mb-3 block">Hình thức thanh toán</Label>
                      <div className="space-y-2">
                        <div
                          className={cn(
                            "flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all",
                            paymentMethod === "online"
                              ? "border-ev-green bg-green-50"
                              : "border-gray-200 hover:border-gray-300"
                          )}
                          onClick={() => setPaymentMethod("online")}
                        >
                          <div className={cn(
                            "w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center",
                            paymentMethod === "online" ? "border-ev-green" : "border-gray-300"
                          )}>
                            {paymentMethod === "online" && (
                              <div className="w-3 h-3 rounded-full bg-ev-green" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-sm">Tại trung tâm</div>
                            <div className="text-xs text-muted-foreground">
                              Thanh toán khi hoàn thành dịch vụ
                            </div>
                          </div>
                        </div>
                        <div
                          className={cn(
                            "flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all",
                            paymentMethod === "later"
                              ? "border-ev-green bg-green-50"
                              : "border-gray-200 hover:border-gray-300"
                          )}
                          onClick={() => setPaymentMethod("later")}
                        >
                          <div className={cn(
                            "w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center",
                            paymentMethod === "later" ? "border-ev-green" : "border-gray-300"
                          )}>
                            {paymentMethod === "later" && (
                              <div className="w-3 h-3 rounded-full bg-ev-green" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-sm">Trực tuyến</div>
                            <div className="text-xs text-muted-foreground">
                              Thanh toán trước qua thẻ hoặc ví điện tử
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: Summary */}
                  <div>
                    <Label className="text-sm font-medium mb-3 block">Tóm tắt đặt lịch</Label>
                    <Card className="border-2">
                      <CardContent className="p-4 space-y-3">
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Xe:</div>
                          <div className="font-semibold">
                            {selectedVehicleData ? getVehicleLabel(selectedVehicleData) : "—"}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {selectedVehicleData?.license_plate || ""}
                          </div>
                        </div>

                        <div className="border-t pt-3">
                          <div className="text-xs text-muted-foreground mb-1">Dịch vụ:</div>
                          <div className="font-semibold">
                            {selectedServiceData?.service_name || "—"}
                          </div>
                          <div className="text-sm text-blue-600 font-semibold">
                            {selectedServiceData?.base_price
                              ? `Giá cơ bản: ${selectedServiceData.base_price.toLocaleString("vi-VN")} đ`
                              : ""}
                          </div>
                        </div>

                        <div className="border-t pt-3">
                          <div className="text-xs text-muted-foreground mb-1">Ngày giờ:</div>
                          <div className="font-semibold">
                            {bookingDate ? format(bookingDate, "PPP", { locale: vi }) : "Chưa chọn ngày"}
                          </div>
                          {bookingTime && (
                            <div className="text-sm text-blue-600 font-medium mt-1">
                              Giờ hẹn: {bookingTime}
                            </div>
                          )}
                        </div>

                        <div className="border-t pt-3">
                          <div className="text-xs text-muted-foreground mb-1">Trung tâm:</div>
                          <div className="font-semibold">
                            {selectedCenterData?.center_name || "—"}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {selectedCenterData?.address || ""}
                          </div>
                        </div>

                        <div className="border-t pt-3">
                          <div className="text-xs text-muted-foreground mb-1">Kỹ thuật viên:</div>
                          {selectedTechnicianId ? (
                            <div className="text-sm">
                              Đã chọn: {centerTechnicians.find(t => t.user._id === selectedTechnicianId)?.user.fullName || "KTV"}
                            </div>
                          ) : (
                            <div className="text-sm">
                              Sẽ được tự động phân công
                              {centerTechnicians.length > 0 && (
                                <span className="text-muted-foreground"> — {centerTechnicians.filter(t=>t.status==='on').length}/{centerTechnicians.length} đang hoạt động</span>
                              )}
                            </div>
                          )}
                          {assignedTechnician && (
                            <div className="text-xs text-blue-700 mt-1">
                              Dự kiến phụ trách: {assignedTechnician.fullName}
                              {assignedTechnician.phone ? ` - ${assignedTechnician.phone}` : ''}
                            </div>
                          )}
                        </div>

                        <div className="border-t pt-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Tiền cọc dịch vụ:</span>
                            <span className="text-lg font-bold text-ev-green">
                              {selectedServiceData?.base_price
                                ? `${(selectedServiceData.base_price * 0.1).toLocaleString("vi-VN")} đ`
                                : "—"}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="flex gap-4 justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Quay lại
            </Button>

            {currentStep < 4 ? (
              <Button
                onClick={handleNext}
                className="flex items-center gap-2"
              >
                Tiếp theo
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center gap-2"
              >
                {loading ? "Đang xử lý..." : "Hoàn thành đặt lịch"}
              </Button>
            )}
          </div>

          {/* Help text */}
          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              Cần hỗ trợ? Liên hệ hotline: <a href="tel:1900 1234" className="text-ev-green hover:underline">1900 1234</a>
            </p>
          </div>
        </div>
      </main>

      {/* Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="sm:max-w-[640px]">
          <DialogHeader>
            <DialogTitle>Thanh toán đặt lịch</DialogTitle>
            <DialogDescription>
              Vui lòng thanh toán tiền đặt cọc để xác nhận lịch hẹn
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {assignedTechnician && (
              <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm">
                🔧 Kỹ thuật viên phụ trách: <span className="font-medium">{assignedTechnician.fullName}</span>
                {assignedTechnician.phone ? (
                  <span className="text-muted-foreground"> — {assignedTechnician.phone}</span>
                ) : null}
              </div>
            )}

            <div className="rounded-md bg-muted p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">Số tiền</div>
                <div className="text-xl font-bold text-primary">
                  {paymentInfo?.amount ? paymentInfo.amount.toLocaleString("vi-VN") + " VND" : "—"}
                </div>
              </div>
            </div>

            {paymentInfo?.qr_code && (
              <div className="flex flex-col items-center gap-2">
                <img
                  src={paymentInfo.qr_code}
                  alt="QR thanh toán"
                  className="w-56 h-56 object-contain rounded-md border"
                />
                <div className="text-xs text-muted-foreground">Quét mã để thanh toán</div>
              </div>
            )}

            <div className="space-y-2">
              <div className="text-sm font-medium">Thanh toán online</div>
              <div className="flex gap-2">
                <Button
                  onClick={() => paymentInfo?.checkout_url && window.open(paymentInfo.checkout_url, "_blank")}
                >
                  Mở trang thanh toán
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={async () => {
                    if (paymentInfo?.checkout_url) {
                      await navigator.clipboard.writeText(paymentInfo.checkout_url);
                      toast.success("Đã sao chép link thanh toán");
                    }
                  }}
                >
                  Sao chép link
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setPaymentDialogOpen(false);
              navigate("/customer/booking-history");
            }}>
              Xem lịch đặt
            </Button>
            <Button variant="destructive" onClick={() => setPaymentDialogOpen(false)}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </motion.div>
  );
}
