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
import { getServiceCentersApi, ServiceCenter } from "@/lib/serviceCenterApi";
import { getProfileApi } from "@/lib/authApi";
import { createAppointmentApi, getAppointmentByIdApi } from "@/lib/appointmentApi";
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
      };

      const res = await createAppointmentApi(payload);
      
      if (res.ok && res.data?.success) {
        toast.success("Đặt lịch thành công! " + (res.data.message || "Lịch hẹn của bạn đã được tạo."));

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
      className="min-h-screen flex flex-col bg-gray-50"
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
            <div className="flex items-center justify-between max-w-3xl mx-auto">
              {STEPS.map((step, index) => (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-colors",
                        currentStep === step.id
                          ? "bg-blue-600 text-white"
                          : currentStep > step.id
                          ? "bg-green-500 text-white"
                          : "bg-gray-200 text-gray-500"
                      )}
                    >
                      {currentStep > step.id ? <Check className="h-5 w-5" /> : step.id}
                    </div>
                    <div className="mt-2 text-center">
                      <div className={cn(
                        "text-sm font-medium",
                        currentStep === step.id ? "text-blue-600" : "text-gray-500"
                      )}>
                        {step.title}
                      </div>
                      <div className="text-xs text-gray-400 hidden sm:block">{step.subtitle}</div>
                    </div>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div className={cn(
                      "h-0.5 flex-1 mx-2 transition-colors",
                      currentStep > step.id ? "bg-green-500" : "bg-gray-200"
                    )} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Progress bar */}
          <div className="mb-8">
            <div className="text-center text-sm text-muted-foreground mb-2">
              Bước {currentStep} / {STEPS.length}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 max-w-md mx-auto">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
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
                              ? "border-blue-500 border-2 bg-blue-50"
                              : "border-gray-200"
                          )}
                          onClick={() => setSelectedVehicle(vehicle._id)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <div className={cn(
                                "p-3 rounded-lg",
                                selectedVehicle === vehicle._id ? "bg-blue-100" : "bg-gray-100"
                              )}>
                                <Car className={cn(
                                  "h-6 w-6",
                                  selectedVehicle === vehicle._id ? "text-blue-600" : "text-gray-600"
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
                                <Check className="h-5 w-5 text-blue-600" />
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
                        className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-gray-500 hover:border-blue-500 hover:text-blue-500 transition-colors flex items-center justify-center gap-2"
                      >
                        <Plus className="h-5 w-5" />
                        Thêm xe
                      </button>
                    )}

                    {/* Inline Add Vehicle Form */}
                    {showAddVehicleForm && (
                      <Card className="border-2 border-blue-200 bg-blue-50">
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
                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 p-4 rounded-xl">
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
                          ? "border-blue-500 border-2 bg-blue-50"
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
                            <Check className="h-5 w-5 text-blue-600 ml-2" />
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
                            ? "border-blue-500 border-2 bg-blue-50"
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
                                  selectedServiceType === service._id ? "text-blue-600" : "text-gray-600"
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
                                  <span className="text-lg font-bold text-blue-600">
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
                              <Check className="h-5 w-5 text-blue-600 ml-2" />
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
                                {timeSlots.map((time) => (
                                  <button
                                    key={time}
                                    onClick={() => setBookingTime(time)}
                                    className={cn(
                                      "w-full text-left px-3 py-2 rounded-md transition-colors hover:bg-gray-100",
                                      bookingTime === time 
                                        ? "bg-blue-100 text-blue-700 font-medium" 
                                        : "text-gray-700"
                                    )}
                                  >
                                    {time}
                                  </button>
                                ))}
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
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-200 hover:border-gray-300"
                          )}
                          onClick={() => setPaymentMethod("online")}
                        >
                          <div className={cn(
                            "w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center",
                            paymentMethod === "online" ? "border-blue-500" : "border-gray-300"
                          )}>
                            {paymentMethod === "online" && (
                              <div className="w-3 h-3 rounded-full bg-blue-500" />
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
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-200 hover:border-gray-300"
                          )}
                          onClick={() => setPaymentMethod("later")}
                        >
                          <div className={cn(
                            "w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center",
                            paymentMethod === "later" ? "border-blue-500" : "border-gray-300"
                          )}>
                            {paymentMethod === "later" && (
                              <div className="w-3 h-3 rounded-full bg-blue-500" />
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
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Tiền cọc dịch vụ:</span>
                            <span className="text-lg font-bold text-blue-600">
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
              Cần hỗ trợ? Liên hệ hotline: <a href="tel:1900 1234" className="text-blue-600 hover:underline">1900 1234</a>
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
