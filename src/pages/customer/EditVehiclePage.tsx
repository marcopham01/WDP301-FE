import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Car, Save, Loader2, ArrowLeft } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { getUserVehiclesApi, Vehicle, updateVehicleApi, UpdateVehiclePayload } from "@/lib/vehicleApi";
import Header from "@/components/MainLayout/Header";
import Footer from "@/components/MainLayout/Footer";
import { toast } from "react-toastify";

const EditVehiclePage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<UpdateVehiclePayload>({
    color: "",
    current_miliage: 0,
    battery_health: 0,
    last_service_mileage: 0,
    purchase_date: "",
  });

  useEffect(() => {
    const loadVehicle = async () => {
      if (!id) {
        navigate("/");
        return;
      }

      setLoading(true);
      const res = await getUserVehiclesApi();

      if (res.ok && res.data?.data) {
        const foundVehicle = res.data.data.find(v => v._id === id);
        if (foundVehicle) {
          setVehicle(foundVehicle);
          setFormData({
            color: foundVehicle.color || "",
            current_miliage: foundVehicle.current_miliage || 0,
            battery_health: foundVehicle.battery_health || 0,
            last_service_mileage: foundVehicle.last_service_mileage || 0,
            purchase_date: foundVehicle.purchase_date ?
              new Date(foundVehicle.purchase_date).toISOString().split('T')[0] : "",
          });
        } else {
          toast.error("Không tìm thấy xe. Xe không tồn tại hoặc không thuộc về bạn");
          navigate("/");
        }
      } else {
        toast.error("Lỗi tải dữ liệu. Không thể tải thông tin xe");
        navigate("/");
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!id) return;

    setSaving(true);
    const res = await updateVehicleApi(id, formData);

    if (res.ok) {
      toast.success("Cập nhật thành công. Thông tin xe đã được cập nhật.");
      navigate("/");
    } else {
      toast.error(res.message || "Không thể cập nhật xe");
    }
    setSaving(false);
  };

  const handleInputChange = (field: keyof UpdateVehiclePayload, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Đăng xuất (giả lập)
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
        <Header
          navItems={[
            { label: "Dashboard", href: "/customer" },
            { label: "Xe của tôi", href: "/customer/vehicles" },
            { label: "Đặt lịch", href: "/customer/booking" },
          ]}
        onLogout={handleLogout}
        />
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
          { label: "Xe của tôi", href: "/customer/vehicles" },
          { label: "Đặt lịch", href: "/customer/booking" },
        ]}
        onLogout={handleLogout}
      />
      <main className="flex-1 py-8">
        <div className="container max-w-2xl pt-20">
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
              <h1 className="text-3xl font-bold text-foreground mb-2">Chỉnh sửa xe</h1>
              <p className="text-muted-foreground">
                Cập nhật thông tin xe {vehicle.license_plate} - {getModelLabel(vehicle)}
              </p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="h-5 w-5" />
                Thông tin xe
              </CardTitle>
              <CardDescription>
                Chỉnh sửa thông tin chi tiết của xe
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="license_plate">Biển số xe</Label>
                    <Input
                      id="license_plate"
                      value={vehicle.license_plate}
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">
                      Không thể chỉnh sửa biển số xe
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="color">Màu sắc</Label>
                    <Input
                      id="color"
                      value={formData.color || ""}
                      onChange={(e) => handleInputChange("color", e.target.value)}
                      placeholder="Nhập màu xe"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="current_miliage">Số km hiện tại</Label>
                    <Input
                      id="current_miliage"
                      type="number"
                      value={formData.current_miliage || ""}
                      onChange={(e) => handleInputChange("current_miliage", Number(e.target.value))}
                      placeholder="Nhập số km hiện tại"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="battery_health">Tình trạng pin (%)</Label>
                    <Input
                      id="battery_health"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.battery_health || ""}
                      onChange={(e) => handleInputChange("battery_health", Number(e.target.value))}
                      placeholder="Nhập % pin"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="last_service_mileage">Km bảo dưỡng cuối</Label>
                    <Input
                      id="last_service_mileage"
                      type="number"
                      value={formData.last_service_mileage || ""}
                      onChange={(e) => handleInputChange("last_service_mileage", Number(e.target.value))}
                      placeholder="Nhập km bảo dưỡng cuối"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="purchase_date">Ngày mua</Label>
                    <Input
                      id="purchase_date"
                      type="date"
                      value={formData.purchase_date || ""}
                      onChange={(e) => handleInputChange("purchase_date", e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button
                    type="submit"
                    disabled={saving}
                    className="flex-1"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Đang lưu...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Lưu thay đổi
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/customer/vehicles")}
                    disabled={saving}
                  >
                    Hủy
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </motion.div>
  );
};

export default EditVehiclePage;
