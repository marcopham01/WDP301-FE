import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { CalendarIcon, Clock, MapPin, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import Header from "@/components/MainLayout/Header";
import Footer from "@/components/MainLayout/Footer";
import { getUserVehiclesApi, Vehicle } from "@/lib/vehicleApi";
import { getActiveServicesApi, ServiceType } from "@/lib/serviceApi";

export default function BookingPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [serviceCenters] = useState([
    { id: "1", name: "Trung tâm EVCare Hà Nội", address: "123 Đường A, Hà Nội" },
    { id: "2", name: "Trung tâm EVCare HCM", address: "456 Đường B, TP.HCM" },
  ]); // TODO: replace when backend provides centers API

  const [selectedVehicle, setSelectedVehicle] = useState("");
  const [selectedServiceType, setSelectedServiceType] = useState("");
  const [selectedCenter, setSelectedCenter] = useState("");
  const [bookingDate, setBookingDate] = useState<Date | undefined>(undefined);
  const [bookingTime, setBookingTime] = useState("");
  const [notes, setNotes] = useState("");

  const timeSlots = [
    "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
    "11:00", "11:30", "13:00", "13:30", "14:00", "14:30",
    "15:00", "15:30", "16:00", "16:30", "17:00"
  ];

  useEffect(() => {
    const load = async () => {
      const [veh, svc] = await Promise.all([getUserVehiclesApi(), getActiveServicesApi()]);
      if (veh.ok && veh.data?.data) setVehicles(veh.data.data);
      else setVehicles([]);
      if (svc.ok && svc.data?.data) setServiceTypes(svc.data.data);
      else setServiceTypes([]);
    };
    load();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicle || !selectedServiceType || !selectedCenter || !bookingDate || !bookingTime) {
      toast({
        title: "Thiếu thông tin",
        description: "Vui lòng điền đầy đủ thông tin đặt lịch",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);

    // Build booking object (temporary local persistence until backend API is available)
    const vehicle = vehicles.find((v) => v._id === selectedVehicle);
    const service = serviceTypes.find((s) => s._id === selectedServiceType);
    const center = serviceCenters.find((c) => c.id === selectedCenter);

    const [hh, mm] = bookingTime.split(":");
    const schedule = new Date(bookingDate);
    schedule.setHours(parseInt(hh || "0", 10), parseInt(mm || "0", 10), 0, 0);

    const booking = {
      id: `${Date.now()}`,
      vehicle: vehicle
        ? {
            id: vehicle._id,
            license_plate: vehicle.license_plate,
            model: (vehicle.model_id && typeof vehicle.model_id === "object")
              ? `${(vehicle.model_id as any).brand ?? ""} ${(vehicle.model_id as any).model_name ?? ""}`.trim()
              : "Xe",
          }
        : undefined,
      service: service
        ? {
            id: service._id,
            name: service.service_name,
            base_price: service.base_price,
          }
        : undefined,
      center: center
        ? {
            id: center.id,
            name: center.name,
            address: center.address,
          }
        : undefined,
      schedule_at: schedule.toISOString(),
      notes,
      createdAt: new Date().toISOString(),
      status: "pending",
    };

    try {
      const raw = localStorage.getItem("recentBookings");
      const list: any[] = raw ? JSON.parse(raw) : [];
      list.unshift(booking);
      // keep only latest 5
      const trimmed = list.slice(0, 5);
      localStorage.setItem("recentBookings", JSON.stringify(trimmed));
    } catch (_) {}

    toast({
      title: "Đặt lịch thành công!",
      description: "Chúng tôi sẽ liên hệ với bạn để xác nhận lịch hẹn",
    });

    setLoading(false);
    navigate("/customer");
  };

  // Đăng xuất (giả lập)
  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    navigate("/login");
  };

  const getVehicleLabel = (v: Vehicle) => {
    const m: any = v.model_id as any;
    const model = m && typeof m === "object" ? `${m.brand ?? ""} ${m.model_name ?? ""}`.trim() : "Xe";
    return `${model} (${v.license_plate})`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="min-h-screen flex flex-col"
    >
      <Header
        navItems={[
          { label: "Dashboard", href: "/customer" },
          { label: "Xe của tôi", href: "/customer/vehicles" },
          { label: "Đặt lịch", href: "/customer/booking", active: true },
          { label: "Lịch sử", href: "/customer/history" },
          { label: "Thông báo", href: "/customer/notifications" },
        ]}
        onLogout={handleLogout}
        showLogout
      />
      <main className="flex-1 py-8">
        <div className="container max-w-4xl pt-20">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Đặt lịch bảo dưỡng</h1>
            <p className="text-muted-foreground">Chọn xe, dịch vụ và thời gian phù hợp</p>
          </div>
          {vehicles.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground mb-4">Bạn chưa có xe nào để đặt lịch</p>
                <Button onClick={() => navigate("/customer/vehicles/add")}>Thêm xe ngay</Button>
              </CardContent>
            </Card>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Wrench className="h-5 w-5" />
                      Thông tin dịch vụ
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Chọn xe</label>
                      <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn xe cần bảo dưỡng" />
                        </SelectTrigger>
                        <SelectContent>
                          {vehicles.map((vehicle) => (
                            <SelectItem key={vehicle._id} value={vehicle._id}>
                              {getVehicleLabel(vehicle)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Loại dịch vụ</label>
                      <Select value={selectedServiceType} onValueChange={setSelectedServiceType}>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn loại dịch vụ" />
                        </SelectTrigger>
                        <SelectContent>
                          {serviceTypes.map((service) => (
                            <SelectItem key={service._id} value={service._id}>
                              {service.service_name} {service.base_price ? `- ${service.base_price.toLocaleString("vi-VN")} VNĐ` : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Trung tâm bảo dưỡng</label>
                      <Select value={selectedCenter} onValueChange={setSelectedCenter}>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn trung tâm" />
                        </SelectTrigger>
                        <SelectContent>
                          {serviceCenters.map((center) => (
                            <SelectItem key={center.id} value={center.id}>
                              <div className="flex items-start gap-2">
                                <MapPin className="h-4 w-4 mt-1" />
                                <div>
                                  <div>{center.name}</div>
                                  <div className="text-xs text-muted-foreground">{center.address}</div>
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CalendarIcon className="h-5 w-5" />
                      Chọn ngày và giờ
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Ngày hẹn</label>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !bookingDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {bookingDate ? format(bookingDate, "PPP", { locale: vi }) : "Chọn ngày"}
                      </Button>
                      <div className="mt-2">
                        <Calendar
                          mode="single"
                          selected={bookingDate}
                          onSelect={setBookingDate}
                          disabled={(date) => date < new Date() || date < new Date("1900-01-01")}
                          initialFocus
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Giờ hẹn</label>
                      <Select value={bookingTime} onValueChange={setBookingTime}>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn giờ" />
                        </SelectTrigger>
                        <SelectContent>
                          {timeSlots.map((time) => (
                            <SelectItem key={time} value={time}>
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                {time}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Ghi chú (tùy chọn)</label>
                      <Textarea
                        placeholder="Nhập các yêu cầu đặc biệt hoặc ghi chú..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={4}
                      />
                    </div>
                  </CardContent>
                </Card>
                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/customer")}
                    className="flex-1"
                  >
                    Hủy
                  </Button>
                  <Button type="submit" disabled={loading} className="flex-1">
                    {loading ? "Đang xử lý..." : "Xác nhận đặt lịch"}
                  </Button>
                </div>
              </div>
            </form>
          )}
        </div>
      </main>
      <Footer />
    </motion.div>
  );
}
