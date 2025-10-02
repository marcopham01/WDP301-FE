import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { CalendarIcon, Clock, MapPin, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
// import Header from "@/components/MainLayout/Header";
import Footer from "@/components/MainLayout/Footer";

export default function BookingPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  // Demo data, replace with API call
  const [vehicles] = useState([
    { id: "1", model: "VinFast VF e34", vin: "ABC123" },
    { id: "2", model: "Tesla Model 3", vin: "XYZ456" },
  ]);
  const [serviceTypes] = useState([
    { id: "1", name: "Bảo dưỡng định kỳ", base_price: 500000 },
    { id: "2", name: "Sửa chữa nhanh", base_price: 200000 },
  ]);
  const [serviceCenters] = useState([
    { id: "1", name: "Trung tâm EVCare Hà Nội", address: "123 Đường A, Hà Nội" },
    { id: "2", name: "Trung tâm EVCare HCM", address: "456 Đường B, TP.HCM" },
  ]);
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

  const handleSubmit = (e) => {
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
    setTimeout(() => {
      toast({
        title: "Đặt lịch thành công!",
        description: "Chúng tôi sẽ liên hệ với bạn để xác nhận lịch hẹn",
      });
      setLoading(false);
      navigate("/dashboard");
    }, 1200);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="min-h-screen flex flex-col"
    >
  {/* <Header /> */}
  <main className="flex-1 py-8">
        <div className="container max-w-4xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Đặt lịch bảo dưỡng</h1>
            <p className="text-muted-foreground">Chọn xe, dịch vụ và thời gian phù hợp</p>
          </div>
          {vehicles.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground mb-4">Bạn chưa có xe nào để đặt lịch</p>
                <Button onClick={() => navigate("/vehicles/add")}>Thêm xe ngay</Button>
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
                            <SelectItem key={vehicle.id} value={vehicle.id}>
                              {vehicle.model} ({vehicle.vin})
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
                            <SelectItem key={service.id} value={service.id}>
                              {service.name} - {service.base_price?.toLocaleString('vi-VN')} VNĐ
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
                            {bookingDate ? format(bookingDate, "PPP", { locale: vi }) : "Chọn ngày"}
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
