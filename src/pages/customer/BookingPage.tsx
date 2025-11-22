import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "react-toastify";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  CalendarIcon,
  Car,
  MapPin,
  Wrench,
  ChevronRight,
  ChevronLeft,
  Check,
  Home,
  Phone,
  Clock,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Header from "@/components/MainLayout/Header";
import Footer from "@/components/MainLayout/Footer";
import {
  getUserVehiclesApi,
  Vehicle,
  VehicleModel,
  getVehicleModelsApi,
  createVehicleApi,
} from "@/lib/vehicleApi";
import { getAllServicesApi, ServiceType } from "@/lib/serviceApi";
import {
  getServiceCentersApi,
  ServiceCenter,
  getTechniciansApi,
  Technician,
} from "@/lib/serviceCenterApi";
import { getProfileApi } from "@/lib/authApi";
import {
  createAppointmentApi,
  getAppointmentByIdApi,
  getTechnicianScheduleApi,
  TechnicianScheduleResponse,
} from "@/lib/appointmentApi";
import { createPaymentLinkApi } from "@/lib/paymentApi";
import { PaymentDialog } from "@/components/customer/PaymentDialog";
import { config } from "@/config/config";

const BASE_URL = config.API_BASE_URL;

// Stepper steps
const STEPS = [
  { id: 1, title: "Chọn xe", subtitle: "Chọn xe hoặc thêm xe mới" },
  { id: 2, title: "Chọn trung tâm", subtitle: "Tìm trung tâm dịch vụ" },
  { id: 3, title: "Chọn dịch vụ", subtitle: "Dịch vụ tương thích" },
  { id: 4, title: "Thông tin cuối", subtitle: "Ngày giờ & chi tiết" },
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
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    username: string;
  } | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState<{
    amount?: number;
    checkout_url?: string;
    qr_code?: string;
    order_code?: number;
    timeoutAt?: string;
    status?: string;
    description?: string;
  } | null>(null);
  const [showAddVehicleForm, setShowAddVehicleForm] = useState(false);
  const [vehicleModels, setVehicleModels] = useState<VehicleModel[]>([]);
  const [centerTechnicians, setCenterTechnicians] = useState<Technician[]>([]);
  const [assignedTechnician, setAssignedTechnician] = useState<{
    fullName?: string;
    phone?: string;
    email?: string;
  } | null>(null);
  const [purchaseDate, setPurchaseDate] = useState<Date | undefined>(undefined);
  const [selectedTechnicianId, setSelectedTechnicianId] = useState<string>(""); // user_id of technician; "" means auto
  const [techScheduleBusyTimes, setTechScheduleBusyTimes] = useState<
    Set<string>
  >(new Set());
  const [techDayBookedCount, setTechDayBookedCount] = useState<number>(0);
  const [loadingTechSchedule, setLoadingTechSchedule] =
    useState<boolean>(false);
  // Times the current user already booked at this center/date
  const [userBusyTimes, setUserBusyTimes] = useState<Set<string>>(new Set());

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

  // Dynamic time slots from backend
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
  const [loadingTimeSlots, setLoadingTimeSlots] = useState(false);

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
          toast.error(
            "Không thể tải danh sách trung tâm bảo dưỡng. Vui lòng thử lại hoặc liên hệ hỗ trợ."
          );
        }
      }
    };
    load();
  }, []);

  // Load technicians for the optional selector in step 4
  useEffect(() => {
    const loadTechs = async () => {
      if (!selectedCenter) {
        setCenterTechnicians([]);
        setSelectedTechnicianId("");
        return;
      }
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
      }
    };
    loadTechs();
  }, [selectedCenter]);

  // Load available time slots from backend when center and date are selected
  useEffect(() => {
    const fetchTimeSlots = async () => {
      if (!selectedCenter || !bookingDate) {
        setAvailableTimeSlots([]);
        return;
      }
      setLoadingTimeSlots(true);
      try {
        const dateStr = format(bookingDate, "yyyy-MM-dd");
        const res = await fetch(
          `${BASE_URL}/api/service-center/get?center_id=${selectedCenter}&date=${dateStr}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
          }
        );
        const data = await res.json();
        if (data.success && data.data && data.data.length > 0) {
          const centerData = data.data[0];
          if (centerData.weeks && centerData.weeks.length > 0) {
            const week = centerData.weeks[0];
            const dayData = week.days.find((d: { date: string }) => d.date === dateStr);
            if (dayData && dayData.timeSlots) {
              // Extract time from timeSlots array
              const slots = dayData.timeSlots.map((slot: { time: string }) => slot.time);
              setAvailableTimeSlots(slots);
            } else {
              setAvailableTimeSlots([]);
            }
          } else {
            setAvailableTimeSlots([]);
          }
        } else {
          setAvailableTimeSlots([]);
        }
      } catch (e) {
        console.error("fetchTimeSlots error", e);
        setAvailableTimeSlots([]);
      } finally {
        setLoadingTimeSlots(false);
      }
    };
    fetchTimeSlots();
  }, [selectedCenter, bookingDate]);

  // Fetch user's existing appointments for the chosen center/date
  useEffect(() => {
    if (!currentUser?.id || !selectedCenter || !bookingDate) {
      setUserBusyTimes(new Set());
      return;
    }
    const dateStr = format(bookingDate, "yyyy-MM-dd");
    const load = async () => {
      try {
        const res = await getAppointmentsApi({
          customer_id: currentUser.id,
          service_center_id: selectedCenter,
          date: dateStr,
          limit: 50,
        });
        if (res.ok && res.data?.data?.appointments) {
          const blockStatuses = new Set([
            "pending",
            "assigned",
            "check_in",
            "in_progress",
          ]);
          const times = new Set<string>();
          res.data.data.appointments.forEach((a) => {
            if (
              a.appoinment_date?.startsWith(dateStr) &&
              a.appoinment_time &&
              blockStatuses.has(a.status)
            ) {
              times.add(a.appoinment_time);
            }
          });
          setUserBusyTimes(times);
        } else {
          setUserBusyTimes(new Set());
        }
      } catch (e) {
        console.error("load user appointments for busy times error", e);
        setUserBusyTimes(new Set());
      }
    };
    load();
  }, [currentUser?.id, selectedCenter, bookingDate]);

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
          const dataUnion = res.data.data as
            | TechnicianScheduleResponse
            | { items: unknown[] };
          if (!("technician" in dataUnion)) {
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
          const blockStatuses = new Set([
            "pending",
            "assigned",
            "check_in",
            "in_progress",
          ]);
          // Determine service duration (minutes) from selected service or fallback 60
          const serviceDurationMin = Number(
            (selectedServiceType &&
              serviceTypes.find((s) => s._id === selectedServiceType)
                ?.estimated_duration) ||
              60
          );

          // Helper to convert HH:mm to minutes since 00:00
          const toMin = (t: string) => {
            const [h, m] = t.split(":").map(Number);
            return h * 60 + m;
          };

          // For each existing appointment on that day, mark overlapping start times as busy
          schedules
            .filter(
              (s) =>
                s.appoinment_date?.startsWith(dayStr) &&
                blockStatuses.has(s.status)
            )
            .forEach((s) => {
              const existStart = toMin(s.appoinment_time);
              const existEnd =
                s.estimated_end_time &&
                /^\d{2}:\d{2}$/.test(s.estimated_end_time)
                  ? toMin(s.estimated_end_time)
                  : existStart +
                    Number(s.service_type_id?.estimated_duration ?? 60);

              availableTimeSlots.forEach((slot) => {
                const slotStart = toMin(slot);
                const slotEnd = slotStart + serviceDurationMin;
                const overlap =
                  (slotStart >= existStart && slotStart < existEnd) ||
                  (slotEnd > existStart && slotEnd <= existEnd) ||
                  (slotStart <= existStart && slotEnd >= existEnd);
                if (overlap) busy.add(slot);
              });
            });

          setTechScheduleBusyTimes(busy);
          setTechDayBookedCount(
            schedules.filter(
              (s) =>
                s.appoinment_date?.startsWith(dayStr) &&
                blockStatuses.has(s.status)
            ).length
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
  }, [selectedTechnicianId, bookingDate, selectedServiceType, availableTimeSlots]);

  const handleSubmit = async () => {
    if (
      !selectedVehicle ||
      !selectedServiceType ||
      !selectedCenter ||
      !bookingDate ||
      !bookingTime
    ) {
      toast.error(
        "Thiếu thông tin. Vui lòng điền đầy đủ thông tin đặt lịch (bao gồm ngày và giờ)"
      );
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
        ...(selectedTechnicianId
          ? { technician_id: selectedTechnicianId }
          : {}),
      };

      const res = await createAppointmentApi(payload);

      if (res.ok && res.data?.success) {
        // ✨ Hiển thị thông báo thành công
        toast.success(
          "🎉 Đặt lịch thành công! " +
            (res.data.message || "Lịch hẹn của bạn đã được tạo.")
        );

        // ✨ Kiểm tra và hiển thị Technician đã được tự động gán
        /* eslint-disable @typescript-eslint/no-explicit-any */
        const appointmentAny: any = res.data.data as unknown;
        if ((appointmentAny as any)?.technician_id) {
          const technicianInfo = (appointmentAny as any).technician_id as {
            fullName?: string;
            phone?: string;
            email?: string;
          };
          const techName = technicianInfo.fullName || "N/A";
          const techPhone = technicianInfo.phone || "";
          setAssignedTechnician(technicianInfo);

          // Hiển thị thông báo về technician
          setTimeout(() => {
            toast.info(
              `🔧 Kỹ thuật viên phụ trách: ${techName}${
                techPhone ? ` - ${techPhone}` : ""
              }`,
              { autoClose: 8000 }
            );
          }, 1000);
        } else {
          // Nếu không có technician_id, có thể là do không có technician rảnh
          console.warn("⚠️ Appointment được tạo nhưng chưa có technician_id");
        }
        /* eslint-enable @typescript-eslint/no-explicit-any */

        // 1) Try to use payment returned directly from create API (if available)
        const created = res.data.data as Record<string, unknown> | undefined;
        const createdPayment = (created?.payment_id ||
          (created && (created as Record<string, unknown>).payment)) as
          | {
              amount?: number;
              checkoutUrl?: string;
              checkout_url?: string;
              qrCode?: string;
              qr_code?: string;
              orderCode?: number;
              order_code?: number;
              timeoutAt?: string;
              timeout_at?: string;
              status?: string;
            }
          | undefined;
        if (
          createdPayment &&
          (createdPayment.checkoutUrl ||
            createdPayment.checkout_url ||
            createdPayment.qrCode ||
            createdPayment.qr_code)
        ) {
          console.log("📦 [BookingPage] Payment from create API:", {
            qrCode: createdPayment.qrCode,
            qr_code: createdPayment.qr_code,
            checkoutUrl: createdPayment.checkoutUrl,
          });
          setPaymentInfo({
            amount: createdPayment.amount,
            checkout_url:
              createdPayment.checkoutUrl || createdPayment.checkout_url,
            qr_code: createdPayment.qrCode || createdPayment.qr_code,
            order_code: (createdPayment.orderCode ||
              createdPayment.order_code) as number,
            timeoutAt: createdPayment.timeoutAt || createdPayment.timeout_at,
            status: createdPayment.status || "PENDING",
            description: `Thanh toán booking #${(
              (created?._id as string) || ""
            ).slice(-6)} - Thay dầu hộp số xe điện`,
          });
          setPaymentDialogOpen(true);
          setLoading(false);
          return; // Stop here; dialog already opened
        }

        const appointmentId = res.data.data?._id;
        if (appointmentId) {
          const detail = await getAppointmentByIdApi(appointmentId);
          const appt = detail.data?.data as Record<string, unknown>;
          // Try multiple shapes to extract payment
          type RawPayment =
            | {
                _id?: string;
                amount?: number;
                checkoutUrl?: string;
                checkout_url?: string;
                qrCode?: string;
                qr_code?: string;
                orderCode?: number;
                order_code?: number;
                timeoutAt?: string;
                timeout_at?: string;
                status?: string;
              }
            | undefined;
          const apptAny = appt as Record<string, unknown> | undefined;
          const createRespAny = res.data?.data as
            | Record<string, unknown>
            | undefined;
          const payCandidates: RawPayment[] = [
            apptAny?.payment_id as RawPayment,
            apptAny?.payment as RawPayment,
            createRespAny?.payment_id as RawPayment,
            createRespAny?.payment as RawPayment,
          ];

          let paymentFound: Record<string, unknown> | null = null;
          for (const cand of payCandidates) {
            if (!cand) continue;
            if (cand._id) {
              paymentFound = cand as Record<string, unknown>;
              break;
            }
            if (
              cand.checkoutUrl ||
              cand.checkout_url ||
              cand.qrCode ||
              cand.qr_code
            ) {
              paymentFound = cand as Record<string, unknown>;
              break;
            }
          }

          if (!paymentFound) {
            // Direct fallback: create payment link (history endpoint not available)
            console.warn(
              "[BookingPage] Không tìm thấy payment trong appointment. Tạo link thanh toán mới (direct fallback)."
            );
            const service = selectedServiceData;
            const basePrice = service?.base_price || 0;
            const depositAmount = Math.round(basePrice * 0.1);
            if (depositAmount > 0) {
              try {
                const createPayRes = await createPaymentLinkApi({
                  amount: depositAmount,
                  description: service?.service_name
                    ? `Đặt cọc ${service.service_name}`.slice(0, 25)
                    : "Dat coc dich vu",
                  customer: currentUser
                    ? {
                        username: currentUser.username,
                        fullName: currentUser.username,
                        email: "",
                      }
                    : undefined,
                  // Set timeoutSeconds = 60s to match backend PAYMENT_EXPIRED_TIME constant
                  timeoutSeconds: 60,
                });
                if (createPayRes.ok && createPayRes.data?.data) {
                  const d = createPayRes.data.data;
                  console.log("📦 Backend Payment Response:", d);
                  setPaymentInfo({
                    amount: d.amount,
                    checkout_url: d.checkoutUrl,
                    qr_code: d.qrCode,
                    order_code: d.orderCode,
                    timeoutAt: d.timeoutAt,
                    status: "PENDING",
                    description: service?.service_name
                      ? `Đặt cọc ${service.service_name}`
                      : "Đặt cọc dịch vụ",
                  });
                  setPaymentDialogOpen(true);
                  toast.info("Đã tạo link thanh toán đặt cọc");
                } else {
                  console.error(
                    "[BookingPage] Fallback create payment thất bại",
                    createPayRes.message
                  );
                  toast.error(
                    "Không thể tạo link thanh toán. Vui lòng thử lại hoặc liên hệ hỗ trợ."
                  );
                }
              } catch (e) {
                console.error("[BookingPage] Lỗi tạo payment fallback", e);
                toast.error("Lỗi tạo link thanh toán. Vui lòng thử lại sau.");
              }
            } else {
              console.warn(
                "[BookingPage] base_price không hợp lệ, bỏ qua tạo payment fallback."
              );
            }
          } else {
            const p = paymentFound as RawPayment & Record<string, unknown>;
            console.log("📦 [BookingPage] Payment from appointment detail:", {
              qrCode: p.qrCode,
              qr_code: p.qr_code,
              checkoutUrl: p.checkoutUrl,
              checkout_url: p.checkout_url,
            });
            setPaymentInfo({
              amount: p.amount,
              checkout_url: (p.checkoutUrl || p.checkout_url) as string,
              qr_code: (p.qrCode || p.qr_code) as string,
              order_code: (p.orderCode || p.order_code) as number,
              timeoutAt: (p.timeoutAt || p.timeout_at) as string | undefined,
              status: (p.status as string) || "PENDING",
              description:
                (p.description as string) ||
                `Thanh toán booking #${appointmentId?.slice(-6)}`,
            });
            setPaymentDialogOpen(true);
          }
        }
      } else {
        toast.error(
          "Không thể tạo lịch. " + (res.message || "Đã có lỗi xảy ra.")
        );
      }
    } catch (error) {
      console.error("Booking error:", error);
      toast.error("Lỗi hệ thống. Không thể kết nối đến server.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelPayment = async () => {
    try {
      if (!paymentInfo?.order_code) return;
      // Call cancel payment API
      const res = await fetch(
        `${BASE_URL}/api/payment/cancel/${paymentInfo.order_code}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );
      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        toast.success("Đã hủy giao dịch thanh toán");
        setPaymentInfo((prev) =>
          prev ? { ...prev, status: "CANCELLED" } : prev
        );
        // Close dialog after successful cancellation
        setTimeout(() => {
          setPaymentDialogOpen(false);
        }, 1000);
      } else {
        toast.error(json?.message || "Không thể hủy thanh toán");
      }
    } catch (e) {
      console.error("Cancel payment error", e);
      toast.error("Lỗi hủy thanh toán");
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
    if (
      !newVehicle.model_id ||
      !newVehicle.license_plate ||
      !newVehicle.color
    ) {
      toast.error(
        "Vui lòng điền đầy đủ thông tin bắt buộc (Model, Biển số, Màu xe)"
      );
      return;
    }

    setAddingVehicle(true);
    const res = await createVehicleApi({
      model_id: newVehicle.model_id,
      license_plate: newVehicle.license_plate,
      color: newVehicle.color,
      purchase_date: newVehicle.purchase_date || undefined,
      current_miliage: newVehicle.current_miliage
        ? Number(newVehicle.current_miliage)
        : undefined,
      battery_health: newVehicle.battery_health
        ? Number(newVehicle.battery_health)
        : undefined,
      last_service_mileage: newVehicle.last_service_mileage
        ? Number(newVehicle.last_service_mileage)
        : undefined,
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
    const model =
      typeof m === "object"
        ? `${m.brand ?? ""} ${m.model_name ?? ""}`.trim()
        : "";
    return model;
  };

  const getVehicleInfo = (v: Vehicle) => {
    const m = v.model_id;
    const color =
      typeof m === "object" && m ? (m as { color?: string }).color : "";
    return color || "N/A";
  };

  const selectedVehicleData = vehicles.find((v) => v._id === selectedVehicle);
  const selectedCenterData = serviceCenters.find(
    (c) => c._id === selectedCenter
  );
  const selectedServiceData = serviceTypes.find(
    (s) => s._id === selectedServiceType
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="min-h-screen flex flex-col bg-gray-50" // Background trắng/xám nhạt, ít màu
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
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Đặt lịch bảo dưỡng
            </h1>
            <p className="text-muted-foreground">
              Đặt lịch bảo dưỡng xe điện một cách dễ dàng
            </p>
          </div>

          {/* Stepper */}
          <div className="mb-8">
            <div className="relative max-w-4xl mx-auto px-4">
              {/* Track line (background) */}
              <div className="absolute left-4 right-4 top-5 h-1 bg-gray-200 rounded-full" />
              {/* Progress line (animated) */}
              <motion.div
                className="absolute left-4 top-5 h-1 bg-ev-green rounded-full" // ev-green, không gradient
                animate={{
                  width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%`,
                }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
              />

              {/* Markers */}
              <div className="grid grid-cols-4 gap-0">
                {STEPS.map((step) => {
                  const isDone = currentStep > step.id;
                  const isActive = currentStep === step.id;
                  return (
                    <div
                      key={step.id}
                      className="relative flex flex-col items-center"
                    >
                      <div className="relative z-10">
                        {isActive && (
                          <motion.span
                            className="absolute -inset-2 rounded-full bg-ev-green/15" // ev-green nhạt
                            animate={{ scale: [1, 1.15, 1] }}
                            transition={{
                              duration: 1.6,
                              repeat: Infinity,
                              ease: "easeInOut",
                            }}
                          />
                        )}
                        <motion.div
                          className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm shadow-sm",
                            isActive
                              ? "bg-ev-green text-white" // ev-green
                              : isDone
                              ? "bg-ev-green text-white" // ev-green
                              : "bg-gray-200 text-gray-600"
                          )}
                          animate={{ scale: isActive ? 1.05 : 1 }}
                          transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 20,
                          }}
                          aria-current={isActive ? "step" : undefined}
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
                        <div className="text-xs text-gray-400 hidden sm:block">
                          {step.subtitle}
                        </div>
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
                className="bg-ev-green h-2 rounded-full transition-all duration-300" // ev-green
                style={{ width: `${(currentStep / STEPS.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Content */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border border-gray-200">
            {" "}
            {/* Trắng, border xám, shadow nhẹ */}
            {/* Step 1: Choose Vehicle */}
            {currentStep === 1 && (
              <div>
                <h2 className="text-2xl font-bold mb-4 text-center">
                  Chọn xe của bạn
                </h2>
                <p className="text-center text-muted-foreground mb-6">
                  Chọn xe hiện có hoặc thêm xe mới để đặt lịch bảo dưỡng
                </p>

                {vehicles.length === 0 ? (
                  <div className="text-center py-12">
                    <Car className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                    <p className="text-muted-foreground mb-4">
                      Bạn chưa có xe nào
                    </p>
                    <Button
                      onClick={handleShowAddForm}
                      className="bg-ev-green hover:bg-ev-green/90 text-white"
                    >
                      {" "}
                      {/* ev-green */}
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
                            "cursor-pointer transition-all hover:shadow-md border border-gray-200", // Border xám
                            selectedVehicle === vehicle._id
                              ? "border-ev-green border-2 bg-gray-50" // ev-green, xám nhạt
                              : "bg-white"
                          )}
                          onClick={() => setSelectedVehicle(vehicle._id)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <div
                                className={cn(
                                  "p-3 rounded-lg",
                                  selectedVehicle === vehicle._id
                                    ? "bg-ev-green/10"
                                    : "bg-gray-100" // ev-green nhạt hoặc xám
                                )}
                              >
                                <Car
                                  className={cn(
                                    "h-6 w-6",
                                    selectedVehicle === vehicle._id
                                      ? "text-ev-green"
                                      : "text-gray-600"
                                  )}
                                />
                              </div>
                              <div className="flex-1">
                                <h3 className="font-semibold text-lg">
                                  {getVehicleLabel(vehicle)}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                  {vehicle.license_plate}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {getVehicleInfo(vehicle)} •{" "}
                                  {(vehicle.model_id as { body_type?: string })
                                    ?.body_type || "Sedan"}
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
                        className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-gray-500 hover:border-ev-green hover:text-ev-green transition-colors flex items-center justify-center gap-2" // ev-green hover
                      >
                        <Plus className="h-5 w-5" />
                        Thêm xe
                      </button>
                    )}

                    {/* Inline Add Vehicle Form */}
                    {showAddVehicleForm && (
                      <Card className="border-2 border-ev-green/20 bg-gray-50">
                        {" "}
                        {/* ev-green nhạt, xám nhạt */}
                        <CardContent className="p-6">
                          <h3 className="text-lg font-semibold mb-4">
                            Thông tin xe mới
                          </h3>
                          <div className="space-y-4">
                            {/* Row 1: Model and License Plate */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="model_id">Model *</Label>
                                <Select
                                  value={newVehicle.model_id}
                                  onValueChange={(value) => {
                                    setNewVehicle({
                                      ...newVehicle,
                                      model_id: value,
                                    });
                                  }}
                                >
                                  <SelectTrigger className="border-gray-300">
                                    <SelectValue placeholder="Chọn model" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {vehicleModels.map((model) => (
                                      <SelectItem
                                        key={model._id}
                                        value={model._id}
                                      >
                                        {`${model.brand ?? ""} ${
                                          model.model_name ?? ""
                                        }`.trim()}{" "}
                                        {model.year ? `(${model.year})` : ""}
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
                                  onChange={(e) =>
                                    setNewVehicle({
                                      ...newVehicle,
                                      license_plate: e.target.value,
                                    })
                                  }
                                  className="border-gray-300"
                                />
                              </div>
                            </div>

                            {/* Row 2: Color and Purchase Date */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="color">Màu xe *</Label>
                                <Select
                                  value={newVehicle.color}
                                  onValueChange={(value) =>
                                    setNewVehicle({
                                      ...newVehicle,
                                      color: value,
                                    })
                                  }
                                >
                                  <SelectTrigger className="border-gray-300">
                                    <SelectValue placeholder="Chọn màu xe" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {colors.map((color) => (
                                      <SelectItem
                                        key={color.value}
                                        value={color.value}
                                      >
                                        {color.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="purchase_date">Ngày mua</Label>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button
                                      variant="outline"
                                      className="w-full justify-start text-left font-normal border-gray-300"
                                    >
                                      <CalendarIcon className="mr-2 h-4 w-4" />
                                      {purchaseDate
                                        ? format(purchaseDate, "dd/MM/yyyy")
                                        : "Chọn ngày"}
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0 bg-white border border-gray-200 rounded-lg shadow-lg">
                                    <Calendar
                                      mode="single"
                                      selected={purchaseDate}
                                      onSelect={(date) => {
                                        setPurchaseDate(date);
                                        setNewVehicle({
                                          ...newVehicle,
                                          purchase_date: date
                                            ? format(date, "yyyy-MM-dd")
                                            : "",
                                        });
                                      }}
                                      initialFocus
                                    />
                                  </PopoverContent>
                                </Popover>
                              </div>
                            </div>

                            {/* Row 3: Mileage, Battery Health, Last Service */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="current_miliage">
                                  Số km hiện tại
                                </Label>
                                <Input
                                  id="current_miliage"
                                  type="number"
                                  placeholder="0"
                                  value={newVehicle.current_miliage}
                                  onChange={(e) =>
                                    setNewVehicle({
                                      ...newVehicle,
                                      current_miliage: e.target.value,
                                    })
                                  }
                                  className="border-gray-300"
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
                                  onChange={(e) =>
                                    setNewVehicle({
                                      ...newVehicle,
                                      battery_health: e.target.value,
                                    })
                                  }
                                  className="border-gray-300"
                                />
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="last_service_mileage">
                                  Km bảo dưỡng cuối
                                </Label>
                                <Input
                                  id="last_service_mileage"
                                  type="number"
                                  placeholder="0"
                                  value={newVehicle.last_service_mileage}
                                  onChange={(e) =>
                                    setNewVehicle({
                                      ...newVehicle,
                                      last_service_mileage: e.target.value,
                                    })
                                  }
                                  className="border-gray-300"
                                />
                              </div>
                            </div>

                            {/* Info Box */}
                            <div className="bg-gray-50 border border-gray-200 p-4 rounded-md">
                              {" "}
                              {/* Xám nhạt */}
                              <h4 className="font-semibold text-gray-900 mb-2">
                                💡 Lưu ý:
                              </h4>
                              <ul className="text-sm text-gray-700 space-y-1">
                                <li>• Biển số, model và màu xe là bắt buộc</li>
                                <li>
                                  • Số km hiện tại sẽ được sử dụng để tính toán
                                  lịch bảo dưỡng
                                </li>
                                <li>
                                  • Có thể bổ sung tình trạng pin để gợi ý chính
                                  xác hơn
                                </li>
                              </ul>
                            </div>
                          </div>

                          <div className="flex gap-3 mt-6">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={handleCancelAddVehicle}
                              disabled={addingVehicle}
                              className="flex-1 border-gray-300 hover:bg-gray-50 transition-colors"
                            >
                              Hủy
                            </Button>
                            <Button
                              onClick={handleAddVehicle}
                              disabled={addingVehicle}
                              className="flex-1 bg-ev-green hover:bg-ev-green/90 text-white" // ev-green
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
                <h2 className="text-2xl font-bold mb-4 text-center">
                  Chọn trung tâm dịch vụ
                </h2>
                <p className="text-center text-muted-foreground mb-6">
                  Tìm và chọn trung tâm dịch vụ gần bạn nhất
                </p>

                <div className="space-y-4">
                  {serviceCenters.map((center) => (
                    <Card
                      key={center._id}
                      className={cn(
                        "cursor-pointer transition-all hover:shadow-md border border-gray-200", // Border xám
                        selectedCenter === center._id
                          ? "border-ev-green border-2 bg-gray-50" // ev-green, xám nhạt
                          : "bg-white"
                      )}
                      onClick={() => setSelectedCenter(center._id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-lg">
                                {center.center_name}
                              </h3>
                              <Badge
                                variant="default"
                                className="bg-ev-green/10 text-ev-green hover:bg-ev-green/10"
                              >
                                {" "}
                                {/* ev-green nhạt */}
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
                            {center.working_hours &&
                              center.working_hours.length > 0 && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                  <Clock className="h-4 w-4" />
                                  <span>
                                    Giờ làm việc:{" "}
                                    {center.working_hours[0].open_time} -{" "}
                                    {center.working_hours[0].close_time}
                                  </span>
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
                    <p className="text-muted-foreground">
                      Không tìm thấy trung tâm nào
                    </p>
                  </div>
                )}
              </div>
            )}
            {/* Step 3: Choose Service */}
            {currentStep === 3 && (
              <div>
                <h2 className="text-2xl font-bold mb-4 text-center">
                  Chọn dịch vụ
                </h2>
                <p className="text-center text-muted-foreground mb-6">
                  Dịch vụ tương thích với{" "}
                  <span className="font-semibold">
                    {selectedVehicleData
                      ? getVehicleLabel(selectedVehicleData)
                      : "xe của bạn"}
                  </span>
                </p>

                <div className="space-y-4">
                  <div className="text-sm font-medium mb-3">
                    Dịch vụ ({serviceTypes.length})
                  </div>
                  <div className="grid gap-4">
                    {serviceTypes.map((service) => (
                      <Card
                        key={service._id}
                        className={cn(
                          "cursor-pointer transition-all hover:shadow-md border border-gray-200", // Border xám
                          selectedServiceType === service._id
                            ? "border-ev-green border-2 bg-gray-50" // ev-green, xám nhạt
                            : "bg-white"
                        )}
                        onClick={() => setSelectedServiceType(service._id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Wrench
                                  className={cn(
                                    "h-5 w-5",
                                    selectedServiceType === service._id
                                      ? "text-ev-green"
                                      : "text-gray-600"
                                  )}
                                />
                                <h3 className="font-semibold text-lg">
                                  {service.service_name}
                                </h3>
                                {service.base_price && (
                                  <Badge
                                    variant="secondary"
                                    className="ml-auto bg-ev-green/10 text-ev-green hover:bg-ev-green/10"
                                  >
                                    {" "}
                                    {/* ev-green nhạt */}
                                    Giá tốt
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mb-3">
                                {service.description ||
                                  "Dịch vụ chuyên nghiệp cho xe điện của bạn"}
                              </p>
                              {service.base_price && (
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-muted-foreground">
                                    Giá cơ bản:
                                  </span>
                                  <span className="text-lg font-bold text-ev-green">
                                    {service.base_price.toLocaleString("vi-VN")}{" "}
                                    đ
                                  </span>
                                </div>
                              )}
                              {service.estimated_duration && (
                                <div className="text-xs text-muted-foreground mt-2">
                                  Thời gian dự kiến: ~
                                  {service.estimated_duration} phút
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
                    <p className="text-muted-foreground">
                      Không có dịch vụ nào
                    </p>
                  </div>
                )}
              </div>
            )}
            {/* Step 4: Date and Details */}
            {currentStep === 4 && (
              <div>
                <h2 className="text-2xl font-bold mb-2 text-center">
                  Thông tin cuối cùng
                </h2>
                <p className="text-center text-muted-foreground mb-8">
                  Chọn ngày giờ và cung cấp thông tin bổ sung
                </p>

                <div className="grid md:grid-cols-2 gap-8">
                  {/* Left: Date and Notes */}
                  <div className="space-y-5">
                    {/* Technician selection (optional) */}
                    <div>
                      <Label className="text-sm font-medium mb-3 block">
                        Chọn kỹ thuật viên (tùy chọn)
                      </Label>
                      <Select
                        value={selectedTechnicianId || "auto"}
                        onValueChange={(v) =>
                          setSelectedTechnicianId(v === "auto" ? "" : v)
                        }
                      >
                        <SelectTrigger className="border-gray-300">
                          <SelectValue placeholder="Tự động (hệ thống phân công)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="auto">
                            Tự động (hệ thống phân công)
                          </SelectItem>
                          {centerTechnicians
                            .filter((t) => t.status === "on")
                            .map((t) => (
                              <SelectItem key={t._id} value={t.user._id}>
                                {t.user.fullName}
                                {t.user.phone ? ` — ${t.user.phone}` : ""}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      {!selectedTechnicianId ? (
                        <div className="text-xs text-muted-foreground mt-2 bg-gray-50 p-2.5 rounded leading-relaxed">
                          💡 Bạn đang để hệ thống tự động phân công KTV. Chọn một KTV cụ thể để xem lịch rảnh/bận chi tiết theo giờ.
                        </div>
                      ) : (
                        <div className="text-xs text-ev-green bg-ev-green/10 rounded p-2.5 mt-2 leading-relaxed">
                          ✓ Đã chọn KTV cụ thể. Các khung giờ bận sẽ được đánh dấu màu xám và không thể chọn.
                        </div>
                      )}
                    </div>

                    <div>
                      <Label className="text-sm font-medium mb-3 block">
                        Chọn ngày
                      </Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal border-gray-300",
                              !bookingDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {bookingDate
                              ? format(bookingDate, "PPP", { locale: vi })
                              : "Chọn ngày hẹn"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-white border border-gray-200 rounded-lg shadow-lg">
                          {" "}
                          {/* Trắng, border xám, shadow nhẹ */}
                          <Calendar
                            mode="single"
                            selected={bookingDate}
                            onSelect={setBookingDate}
                            disabled={(date) =>
                              date < new Date() || date < new Date("1900-01-01")
                            }
                            className="bg-white" // Background trắng
                            classNames={{
                              months:
                                "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                              month: "space-y-4",
                              caption:
                                "flex justify-center pt-1 relative items-center",
                              caption_label: "text-sm font-medium",
                              nav: "space-x-1 flex items-center",
                              nav_button:
                                "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
                              nav_button_previous: "absolute left-1",
                              nav_button_next: "absolute right-1",
                              table: "w-full border-collapse space-y-1",
                              head_row: "flex",
                              head_cell:
                                "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
                              row: "flex w-full mt-2",
                              cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                              day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-ev-green/10 focus:bg-ev-green/10", // Hover ev-green nhạt
                              day_range_end: "day-range-end",
                              day_selected:
                                "bg-ev-green text-white hover:bg-ev-green hover:text-white focus:bg-ev-green focus:text-white", // ev-green selected
                              day_today: "bg-accent text-accent-foreground",
                              day_outside:
                                "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
                              day_disabled: "text-muted-foreground opacity-50",
                              day_range_middle:
                                "aria-selected:bg-accent aria-selected:text-accent-foreground",
                              day_hidden: "invisible",
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    {/* Time Picker - Only show when date is selected */}
                    {bookingDate && (
                      <div>
                        <Label className="text-sm font-medium mb-3 block">
                          Chọn giờ
                        </Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal border-gray-300",
                                !bookingTime && "text-muted-foreground"
                              )}
                            >
                              <Clock className="mr-2 h-4 w-4" />
                              {bookingTime || "Chọn giờ hẹn"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-80 p-0 bg-white border border-gray-200 rounded-lg shadow-lg">
                            {" "}
                            {/* Trắng, border xám, shadow nhẹ */}
                            <div className="p-4 border-b border-gray-200">
                              <Input
                                type="time"
                                value={bookingTime}
                                onChange={(e) => setBookingTime(e.target.value)}
                                placeholder="Nhập giờ (HH:mm)"
                                className="w-full border-gray-300"
                              />
                            </div>
                            <div className="max-h-64 overflow-y-auto p-2">
                              {loadingTimeSlots ? (
                                <div className="p-4 text-center text-sm text-muted-foreground">
                                  Đang tải khung giờ...
                                </div>
                              ) : availableTimeSlots.length === 0 ? (
                                <div className="p-4 text-center text-sm text-muted-foreground">
                                  Không có khung giờ khả dụng cho ngày này
                                </div>
                              ) : (
                                <div className="space-y-1">
                                  {availableTimeSlots.map((time) => {
                                  const isBusyUser = userBusyTimes.has(time);
                                  const isBusyTech = selectedTechnicianId
                                    ? techScheduleBusyTimes.has(time)
                                    : false;
                                  const isBusy = isBusyUser || isBusyTech;
                                  return (
                                    <button
                                      key={time}
                                      onClick={() => {
                                        if (isBusy) {
                                          toast.warn(
                                            isBusyUser
                                              ? "⏰ Bạn đã có lịch hẹn trùng thời gian tại trung tâm này."
                                              : "⏰ Khung giờ này KTV đã có lịch. Vui lòng chọn giờ khác hoặc để hệ thống tự động phân công.",
                                            { autoClose: 3000 }
                                          );
                                          return;
                                        }
                                        setBookingTime(time);
                                      }}
                                      disabled={isBusy}
                                      title={
                                        isBusy
                                          ? isBusyUser
                                            ? `${time} - Bạn đã có lịch hẹn trùng giờ tại trung tâm này.`
                                            : `${time} - Khung giờ này KTV đã có lịch hẹn. Không thể chọn.`
                                          : `${time} - Click để chọn giờ hẹn.`
                                      }
                                      className={cn(
                                        "w-full text-left px-3 py-2 rounded-md transition-colors",
                                        bookingTime === time
                                          ? "bg-ev-green text-white font-medium border-2 border-ev-green" // ev-green
                                          : isBusy
                                          ? "text-gray-400 bg-gray-100 cursor-not-allowed opacity-60"
                                          : "text-gray-700 hover:bg-gray-100 hover:border hover:border-gray-300"
                                      )}
                                    >
                                      <div className="flex items-center justify-between">
                                        <span
                                          className={
                                            bookingTime === time
                                              ? "font-semibold"
                                              : ""
                                          }
                                        >
                                          {time}
                                        </span>
                                        {(selectedTechnicianId || isBusyUser) && (
                                          <Badge
                                            className={cn(
                                              "text-xs",
                                              isBusy
                                                ? "bg-red-100 text-red-700"
                                                : "bg-ev-green/10 text-ev-green" // ev-green nhạt
                                            )}
                                          >
                                            {isBusy ? "🚫 Bận" : "✓ Rảnh"}
                                          </Badge>
                                        )}
                                      </div>
                                    </button>
                                  );
                                })}
                                </div>
                              )}
                              <div className="mt-2 pt-2 border-t border-gray-200">
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
                          <div className="mt-3 text-xs">
                            {loadingTechSchedule ? (
                              <span className="text-muted-foreground bg-gray-50 p-2.5 rounded block">
                                ⏳ Đang tải lịch của KTV...
                              </span>
                            ) : (
                              <div className="space-y-2">
                                <div className="text-muted-foreground bg-gray-50 p-2.5 rounded leading-relaxed">
                                  📅 Đã đặt trong ngày:{" "}
                                  <span className="font-medium text-foreground">
                                    {techDayBookedCount}/4 slot
                                  </span>{" "}
                                  (tối đa 4 slot/ngày)
                                </div>
                                {techScheduleBusyTimes.size > 0 && (
                                  <div className="text-amber-700 bg-amber-50 rounded p-2.5 leading-relaxed">
                                    ⚠️ {techScheduleBusyTimes.size} khung giờ không khả dụng (màu xám)
                                  </div>
                                )}
                                {techDayBookedCount >= 4 && (
                                  <div className="text-red-700 bg-red-50 rounded p-2.5 font-medium leading-relaxed">
                                    🚫 KTV đã đủ 4 slot. Vui lòng chọn ngày khác hoặc KTV khác.
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    <div>
                      <Label className="text-sm font-medium mb-3 block">
                        Mô tả dịch vụ
                      </Label>
                      <Textarea
                        placeholder="Mô tả vấn đề về xe của bạn hoặc các yêu cầu đặc biệt (nếu có)..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={4}
                        maxLength={500}
                        className="border-gray-300 resize-none"
                      />
                      <div className="text-xs text-right text-muted-foreground mt-2">
                        {notes.length} / 500
                      </div>
                    </div>

                    {/* Payment Method - Simplified to single option */}
                    <div>
                      <Label className="text-sm font-medium mb-3 block">
                        Hình thức thanh toán
                      </Label>
                      <div className="flex items-start p-5 rounded-lg border-2 border-ev-green bg-ev-green/5">
                        <div className="w-5 h-5 rounded-full border-2 border-ev-green mr-3 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <div className="w-3 h-3 rounded-full bg-ev-green" />
                        </div>
                        <div className="flex-1 space-y-3">
                          <div>
                            <div className="font-semibold text-sm mb-2">
                              Tại trung tâm
                            </div>
                            <div className="text-xs text-muted-foreground leading-relaxed">
                              Thanh toán trước một phần và thanh toán phần còn lại sau khi hoàn thành
                            </div>
                          </div>
                          <div className="pt-3 border-t border-ev-green/20">
                            <div className="text-xs text-muted-foreground leading-relaxed">
                              💡 <span className="font-medium">Lưu ý:</span> Bạn cần thanh toán tiền cọc trước để xác nhận đặt lịch
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: Summary */}
                  <div>
                    <Label className="text-sm font-medium mb-3 block">
                      Tóm tắt đặt lịch
                    </Label>
                    <Card className="border-2 border-gray-200 sticky top-4">
                      <CardContent className="p-5 space-y-4">
                        <div>
                          <div className="text-xs text-muted-foreground mb-2">
                            Xe:
                          </div>
                          <div className="font-semibold text-base">
                            {selectedVehicleData
                              ? getVehicleLabel(selectedVehicleData)
                              : "—"}
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            {selectedVehicleData?.license_plate || ""}
                          </div>
                        </div>

                        <div className="border-t border-gray-200 pt-4">
                          <div className="text-xs text-muted-foreground mb-2">
                            Dịch vụ:
                          </div>
                          <div className="font-semibold text-base">
                            {selectedServiceData?.service_name || "—"}
                          </div>
                          <div className="text-sm text-ev-green font-semibold mt-1">
                            {selectedServiceData?.base_price
                              ? `Giá cơ bản: ${selectedServiceData.base_price.toLocaleString(
                                  "vi-VN"
                                )} đ`
                              : ""}
                          </div>
                        </div>

                        <div className="border-t border-gray-200 pt-4">
                          <div className="text-xs text-muted-foreground mb-2">
                            Ngày giờ:
                          </div>
                          <div className="font-semibold text-base">
                            {bookingDate
                              ? format(bookingDate, "PPP", { locale: vi })
                              : "Chưa chọn ngày"}
                          </div>
                          {bookingTime && (
                            <div className="text-sm text-ev-green font-medium mt-1">
                              Giờ hẹn: {bookingTime}
                            </div>
                          )}
                        </div>

                        <div className="border-t border-gray-200 pt-4">
                          <div className="text-xs text-muted-foreground mb-2">
                            Trung tâm:
                          </div>
                          <div className="font-semibold text-base">
                            {selectedCenterData?.center_name || "—"}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1 leading-relaxed">
                            {selectedCenterData?.address || ""}
                          </div>
                        </div>

                        <div className="border-t border-gray-200 pt-4">
                          <div className="text-xs text-muted-foreground mb-2">
                            Kỹ thuật viên:
                          </div>
                          {selectedTechnicianId ? (
                            <div className="text-sm font-medium">
                              Đã chọn:{" "}
                              {centerTechnicians.find(
                                (t) => t.user._id === selectedTechnicianId
                              )?.user.fullName || "KTV"}
                            </div>
                          ) : (
                            <div className="text-sm">
                              <span className="font-medium">Sẽ được tự động phân công</span>
                              {centerTechnicians.length > 0 && (
                                <span className="text-muted-foreground block mt-1">
                                  {
                                    centerTechnicians.filter(
                                      (t) => t.status === "on"
                                    ).length
                                  }
                                  /{centerTechnicians.length} đang hoạt động
                                </span>
                              )}
                            </div>
                          )}
                          {assignedTechnician && (
                            <div className="text-xs text-ev-green mt-2 bg-ev-green/5 p-2 rounded">
                              Dự kiến phụ trách: {assignedTechnician.fullName}
                              {assignedTechnician.phone
                                ? ` - ${assignedTechnician.phone}`
                                : ""}
                            </div>
                          )}
                        </div>

                        <div className="border-t-2 border-gray-300 pt-4 mt-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">
                              Tiền cọc dịch vụ:
                            </span>
                            <span className="text-xl font-bold text-ev-green">
                              {selectedServiceData?.base_price
                                ? `${(
                                    selectedServiceData.base_price * 0.1
                                  ).toLocaleString("vi-VN")} đ`
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
              className="flex items-center gap-2 border-gray-300 hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              Quay lại
            </Button>

            {currentStep < 4 ? (
              <Button
                onClick={handleNext}
                className="flex items-center gap-2 bg-ev-green hover:bg-ev-green/90 text-white" // ev-green
              >
                Tiếp theo
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center gap-2 bg-ev-green hover:bg-ev-green/90 text-white" // ev-green
              >
                {loading ? "Đang xử lý..." : "Hoàn thành đặt lịch"}
              </Button>
            )}
          </div>

          {/* Help text */}
          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              Cần hỗ trợ? Liên hệ hotline:{" "}
              <a href="tel:1900 1234" className="text-ev-green hover:underline">
                1900 1234
              </a>
            </p>
          </div>
        </div>
      </main>

      {/* Payment Dialog */}
      <PaymentDialog
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        paymentInfo={paymentInfo}
        technician={assignedTechnician}
        onCancel={handleCancelPayment}
        onViewHistory={() => {
          setPaymentDialogOpen(false);
          navigate("/customer/booking-history");
        }}
      />

      <Footer />
    </motion.div>
  );
}
