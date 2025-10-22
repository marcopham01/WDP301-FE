import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Car, ArrowLeft } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { getUserVehiclesApi, Vehicle } from "@/lib/vehicleApi";
import Header from "@/components/MainLayout/Header";
import Footer from "@/components/MainLayout/Footer";
import { toast } from "react-toastify";

const VehicleDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadVehicle = async () => {
      if (!id) {
        navigate("/customer/vehicles");
        return;
      }

      setLoading(true);
      const res = await getUserVehiclesApi();

      if (res.ok && res.data?.data) {
        const foundVehicle = res.data.data.find(v => v._id === id);
        if (foundVehicle) {
          setVehicle(foundVehicle);
        } else {
          toast.error("Không tìm thấy xe. Xe không tồn tại hoặc không thuộc về bạn");
          navigate("/customer/vehicles");
        }
      } else {
        toast.error("Lỗi tải dữ liệu. Không thể tải thông tin xe");
        navigate("/customer/vehicles");
      }
      setLoading(false);
    };

    loadVehicle();
  }, [id, navigate]);

  const getModelLabel = (v: Vehicle) => {
    const m = v.model_id as unknown;
    if (m && typeof m === "object" && m !== null) {
      const model = m as { brand?: string; model_name?: string };
      const label = `${model.brand ?? ""} ${model.model_name ?? ""}`.trim();
      return label || "Model";
    }
    return "Model";
  };

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    toast.success("Đăng xuất thành công!");
    setTimeout(() => {
      navigate("/login");
    }, 1000);
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        className="min-h-screen flex flex-col"
      >
        <Header onLogout={handleLogout} />
        <main className="flex-1 py-8">
          <div className="container max-w-2xl pt-20">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Đang tải thông tin xe...</p>
            </div>
          </div>
        </main>
        <Footer />
      </motion.div>
    );
  }

  if (!vehicle) {
    return null;
  }

  const model = vehicle.model_id as unknown;
  const modelData = model && typeof model === "object" && model !== null
    ? (model as { brand?: string; model_name?: string; battery_type?: string; year?: number })
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
      className="min-h-screen flex flex-col"
    >
      <Header onLogout={handleLogout} />
      <main className="flex-1 py-8">
        <div className="container max-w-3xl pt-20">
          {/* Header Section */}
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/customer/vehicles")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Chi tiết xe</h1>
              <p className="text-muted-foreground">
                {vehicle.license_plate} - {getModelLabel(vehicle)}
              </p>
            </div>
          </div>

          {/* Vehicle Details Card */}
          <Card className="shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Car className="h-8 w-8 text-gray-600" />
                </div>
                <div>
                  <CardTitle className="text-2xl">{getModelLabel(vehicle)}</CardTitle>
                  <CardDescription className="text-base">
                    Biển số: {vehicle.license_plate}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 uppercase tracking-wide font-semibold mb-2">Năm sản xuất</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {modelData?.year || (vehicle.purchase_date ? new Date(vehicle.purchase_date).getFullYear() : 'N/A')}
                  </div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 uppercase tracking-wide font-semibold mb-2">Màu xe</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {vehicle.color || 'Chưa cập nhật'}
                  </div>
                </div>
              </div>

              {/* Battery Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 uppercase tracking-wide font-semibold mb-2">Loại pin</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {modelData?.battery_type || 'Chưa cập nhật'}
                  </div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 uppercase tracking-wide font-semibold mb-2">Sức khỏe pin (kWh)</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {vehicle.battery_health || 'Chưa cập nhật'}
                  </div>
                </div>
              </div>

              {/* Mileage Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 uppercase tracking-wide font-semibold mb-2">Số km hiện tại</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {vehicle.current_miliage ? `${vehicle.current_miliage.toLocaleString()} km` : 'Chưa cập nhật'}
                  </div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 uppercase tracking-wide font-semibold mb-2">Km bảo dưỡng cuối</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {vehicle.last_service_mileage ? `${vehicle.last_service_mileage.toLocaleString()} km` : 'Chưa cập nhật'}
                  </div>
                </div>
              </div>

              {/* Purchase Date */}
              <div className="bg-indigo-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600 uppercase tracking-wide font-semibold mb-2">Ngày mua</div>
                <div className="text-2xl font-bold text-gray-900">
                  {vehicle.purchase_date ? new Date(vehicle.purchase_date).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold"
                  onClick={() => navigate(`/customer/vehicles/${vehicle._id}/edit`)}
                >
                  Chỉnh sửa
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => navigate("/customer/vehicles")}
                >
                  Quay lại
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </motion.div>
  );
};

export default VehicleDetailPage;
