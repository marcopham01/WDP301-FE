import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Car, Plus, Edit, Trash2, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getUserVehiclesApi, Vehicle, deleteVehicleApi } from "@/lib/vehicleApi";
import Header from "@/components/MainLayout/Header";
import Footer from "@/components/MainLayout/Footer";
import { toast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const VehiclesPage = () => {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  const getModelLabel = (v: Vehicle) => {
    const m = v.model_id as unknown; // populated object or string id
    if (m && typeof m === "object" && m !== null) {
      const model = m as { brand?: string; model_name?: string };
      const label = `${model.brand ?? ""} ${model.model_name ?? ""}`.trim();
      return label || "Model";
    }
    return "Model";
  };

  const handleDelete = async (vehicleId: string) => {
    setDeletingId(vehicleId);
    const res = await deleteVehicleApi(vehicleId);
    if (res.ok) {
      toast({ title: "Xóa xe thành công" });
      setVehicles(vehicles.filter(v => v._id !== vehicleId));
    } else {
      toast({ title: "Không thể xóa xe", description: res.message, variant: "destructive" });
    }
    setDeletingId(null);
  };

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
          { label: "Dashboard", href: "/customer" },
          { label: "Xe của tôi", href: "/customer/vehicles", active: true },
          { label: "Đặt lịch", href: "/customer/booking" },
          { label: "Lịch sử", href: "/customer/history" },
                 ]}
        onLogout={handleLogout}
        showLogout
      />
      <main className="flex-1 py-8">
        <div className="container max-w-6xl pt-20">
          {/* Header Section */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Xe của tôi</h1>
              <p className="text-muted-foreground">Quản lý thông tin và lịch bảo dưỡng xe</p>
            </div>
            <Button onClick={() => navigate("/customer/vehicles/add")}>
              <Plus className="h-4 w-4 mr-2" />
              Thêm xe mới
            </Button>
          </div>

          {/* Vehicles Grid */}
          {vehiclesLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Đang tải danh sách xe...</p>
            </div>
          ) : vehicles.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Car className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Chưa có xe nào</h3>
                <p className="text-muted-foreground mb-6">Bắt đầu bằng việc thêm xe đầu tiên của bạn</p>
                <Button onClick={() => navigate("/customer/vehicles/add")}>
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm xe đầu tiên
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {vehicles.map((v) => (
                <Card key={v._id} className="relative">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Car className="h-5 w-5" />
                      {v.license_plate}
                    </CardTitle>
                    <CardDescription>{getModelLabel(v)}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      {v.color && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Màu:</span>
                          <span className="capitalize">{v.color}</span>
                        </div>
                      )}
                      {v.current_miliage && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Số km:</span>
                          <span>{v.current_miliage.toLocaleString()} km</span>
                        </div>
                      )}
                      {v.battery_health && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Pin:</span>
                          <span>{v.battery_health}%</span>
                        </div>
                      )}
                      {v.purchase_date && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Ngày mua:</span>
                          <span>{new Date(v.purchase_date).toLocaleDateString("vi-VN")}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => navigate(`/customer/vehicles/${v._id}/edit`)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Sửa
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="flex-1" disabled={deletingId === v._id}>
                            {deletingId === v._id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <Trash2 className="h-4 w-4 mr-2" />
                                Xóa
                              </>
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Xác nhận xóa xe</AlertDialogTitle>
                            <AlertDialogDescription>
                              Bạn có chắc chắn muốn xóa xe {v.license_plate}? Hành động này không thể hoàn tác.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Hủy</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(v._id)}>
                              Xóa
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </motion.div>
  );
};

export default VehiclesPage;
