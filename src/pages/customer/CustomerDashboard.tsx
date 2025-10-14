import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Car, Plus, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getProfileApi } from "@/lib/authApi";
import { getUserVehiclesApi, Vehicle } from "@/lib/vehicleApi";
import Header from "@/components/MainLayout/Header";
import Footer from "@/components/MainLayout/Footer";
import { useAuth } from "@/context/AuthContext/useAuth";
// import { getUserAppointmentsApi } from "@/lib/appointmentApi"; // Temporarily disabled

interface Booking {
  _id: string;
  center_id?: { name?: string };
  vehicle_id?: { brand?: string; model?: string; license_plate?: string };
  appoinment_date: string;
  appoinment_time: string;
  status?: string;
}

const CustomerDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(true);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      const res = await getProfileApi();
      if (!res.ok) {
        setLoading(false);
        return;
      }
      setLoading(false);
    };
    fetchProfile();
  }, []);

  useEffect(() => {
    const loadVehicles = async () => {
      setVehiclesLoading(true);
      const res = await getUserVehiclesApi();
      if (res.ok && res.data?.data) {
        setVehicles(res.data.data);
      } else {
        setVehicles([]);
      }
      setVehiclesLoading(false);
    };
    loadVehicles();
  }, []);

  useEffect(() => {
    const loadAppointments = async () => {
      setAppointmentsLoading(true);
      // API appointment chưa sẵn sàng
      // const profile = await getProfileApi();
      // const username = profile.ok ? (profile.data?.user?.username as string) : undefined;
      // if (!username) {
      //   setRecentBookings([]);
      //   setAppointmentsLoading(false);
      //   return;
      // }
      // const res = await getUserAppointmentsApi(username, { page: 1, limit: 5 });
      // if (res.ok && res.data?.data?.appointments) {
      //   setRecentBookings(res.data.data.appointments);
      // } else {
      //   setRecentBookings([]);
      // }
      setRecentBookings([]); // Empty for now
      setAppointmentsLoading(false);
    };
    loadAppointments();
  }, []);

  const getModelLabel = (v: Vehicle) => {
    const m = v.model_id as unknown; // populated object or string id
    if (m && typeof m === "object" && m !== null) {
      const model = m as { brand?: string; model_name?: string };
      const label = `${model.brand ?? ""} ${model.model_name ?? ""}`.trim();
      return label || "Model";
    }
    return "Model";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Đăng xuất (giả lập)
  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    navigate("/login");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
      className="min-h-screen flex flex-col"
    >
      <Header
        navItems={[
          { label: "Dashboard", href: "/customer", active: true },
          { label: "Xe của tôi", href: "/customer/vehicles" },
          { label: "Đặt lịch", href: "/customer/booking" },
          { label: "Lịch sử", href: "/customer/history" },        ]}
        onLogout={handleLogout}
        showLogout
      />
      <main className="flex-1 py-8">
        <div className="container max-w-4xl pt-20">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Chào {user?.fullName || user?.username || "Khách hàng"}!</h1>
            <p className="text-muted-foreground">Quản lý xe và lịch bảo dưỡng của bạn</p>
          </div>



        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Vehicles Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="h-5 w-5" />
                Xe của bạn ({vehicles.length})
              </CardTitle>
              <CardDescription>Quản lý thông tin và lịch bảo dưỡng xe</CardDescription>
            </CardHeader>
            <CardContent>
              {vehiclesLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Đang tải danh sách xe...</p>
                </div>
              ) : vehicles.length === 0 ? (
                <div className="text-center py-8">
                  <Car className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">Chưa có xe nào được đăng ký</p>
                  <Button variant="outline" onClick={() => navigate("/customer/vehicles/add")}> 
                    <Plus className="h-4 w-4 mr-2" />
                    Thêm xe đầu tiên
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {vehicles.map((v) => (
                    <div key={v._id} className="border rounded-lg p-4">
                      <div className="font-semibold">{v.license_plate}</div>
                      <div className="text-sm text-muted-foreground">{getModelLabel(v)}</div>
                      {v.color ? (
                        <div className="text-sm text-muted-foreground mt-1">Màu: {v.color}</div>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Bookings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Lịch bảo dưỡng gần đây
              </CardTitle>
              <CardDescription>Theo dõi trạng thái các lịch hẹn</CardDescription>
            </CardHeader>
            <CardContent>
              {appointmentsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Đang tải lịch bảo dưỡng...</p>
                </div>
              ) : recentBookings.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">Chưa có lịch bảo dưỡng nào</p>
                  <Button variant="outline" onClick={() => navigate("/customer/booking")}>
                    <Plus className="h-4 w-4 mr-2" />
                    Đặt lịch đầu tiên
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentBookings.map((b) => (
                    <div key={b._id} className="border rounded-lg p-4 flex items-start justify-between gap-4">
                      <div>
                        <div className="font-medium">{b.center_id?.name ?? "Trung tâm"}</div>
                        <div className="text-sm text-muted-foreground">{b.vehicle_id?.brand ?? ""} {b.vehicle_id?.model ?? ""} ({b.vehicle_id?.license_plate ?? "--"})</div>
                        <div className="text-xs text-muted-foreground mt-1">{new Date(b.appoinment_date).toLocaleDateString("vi-VN")} {b.appoinment_time}</div>
                      </div>
                      <div className="text-xs px-2 py-1 rounded bg-muted capitalize">{b.status ?? "pending"}</div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        </div>
      </main>
      <Footer />
    </motion.div>
  );
};

export default CustomerDashboard;
