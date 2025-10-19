import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Car, Plus, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getUserVehiclesApi, Vehicle, deleteVehicleApi } from "@/lib/vehicleApi";
import Header from "@/components/MainLayout/Header";
import Footer from "@/components/MainLayout/Footer";
import { toast } from "@/hooks/use-toast";

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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Main Header */}
      <Header onLogout={handleLogout} />

      {/* Page Header */}
      <div className="bg-white shadow-sm mt-16">
        <div className="container mx-auto px-6 py-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">Quản lý xe</h1>
            <p className="text-gray-600 mt-2">Bạn có {vehicles.length} xe đã đăng ký</p>
            <Button
              className="bg-gray-900 hover:bg-gray-800 text-white px-6 mt-4 rounded-full"
              onClick={() => navigate("/customer/vehicles/add")}
            >
              <Plus className="h-4 w-4 mr-2" />
              Thêm xe
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 container mx-auto px-6 py-4">
        {/* Vehicles Grid */}
        {vehiclesLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Đang tải danh sách xe...</p>
          </div>
        ) : vehicles.length === 0 ? (
          <Card className="shadow-lg">
            <CardContent className="text-center py-12">
              <Car className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-gray-900">Chưa có xe nào</h3>
              <p className="text-gray-600 mb-6">Bắt đầu bằng việc thêm xe đầu tiên của bạn</p>
              <Button
                className="bg-gray-900 hover:bg-gray-800 text-white"
                onClick={() => navigate("/customer/vehicles/add")}
              >
                <Plus className="h-4 w-4 mr-2" />
                Thêm xe đầu tiên
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {vehicles.map((v) => {
              const model = v.model_id as unknown;
              const modelData = model && typeof model === "object" && model !== null
                ? (model as { brand?: string; model_name?: string; battery_type?: string })
                : null;

              return (
                <Card key={v._id} className="shadow-lg hover:shadow-xl transition-shadow">
                  <CardContent className="p-6">
                    {/* Vehicle Header */}
                    <div className="flex items-start gap-4 mb-6">
                      <div className="w-14 h-14 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Car className="h-7 w-7 text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-gray-900">{getModelLabel(v)}</h3>
                        <p className="text-sm text-gray-500">Biển số • {v.license_plate}</p>
                      </div>
                    </div>

                    {/* Vehicle Info Grid - 2x2 */}
                    <div className="grid grid-cols-2 gap-4 mb-6 bg-green-50 p-4 rounded-lg">
                      <div className="flex items-start gap-3">
                        <div className="text-gray-600 mt-1">📅</div>
                        <div>
                          <div className="text-xs text-gray-600 uppercase tracking-wide font-semibold mb-1">Năm</div>
                          <div className="text-lg font-semibold text-gray-900">
                            {v.purchase_date ? new Date(v.purchase_date).getFullYear() : 'N/A'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="text-gray-600 mt-1">🎨</div>
                        <div>
                          <div className="text-xs text-gray-600 uppercase tracking-wide font-semibold mb-1">Màu</div>
                          <div className="text-lg font-semibold text-gray-900">
                            {v.color || 'Chưa cập nhật'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="text-gray-600 mt-1">⚡</div>
                        <div>
                          <div className="text-xs text-gray-600 uppercase tracking-wide font-semibold mb-1">Loại pin</div>
                          <div className="text-lg font-semibold text-gray-900">
                            {modelData?.battery_type || 'Chưa cập nhật'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="text-gray-600 mt-1">🔋</div>
                        <div>
                          <div className="text-xs text-gray-600 uppercase tracking-wide font-semibold mb-1">Pin (kWh)</div>
                          <div className="text-lg font-semibold text-gray-900">
                            {v.battery_health || 'Chưa cập nhật'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        className="flex-1 text-sm border-gray-300 hover:bg-gray-50"
                        onClick={() => navigate(`/customer/vehicles/${v._id}`)}
                      >
                        Chi tiết
                      </Button>
                      <Button
                        className="flex-1 text-sm bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold"
                        onClick={() => navigate(`/customer/vehicles/${v._id}/edit`)}
                      >
                        Sửa
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 text-sm border-red-300 text-red-600 hover:bg-red-50"
                        disabled={deletingId === v._id}
                        onClick={() => handleDelete(v._id)}
                      >
                        {deletingId === v._id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          'Xóa'
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default VehiclesPage;
