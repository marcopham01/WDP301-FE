import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Car, Plus, Loader2, Edit, Trash2, Eye, Zap, Calendar, Palette, Battery } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getUserVehiclesApi, Vehicle, deleteVehicleApi } from "@/lib/vehicleApi";
import Header from "@/components/MainLayout/Header";
import Footer from "@/components/MainLayout/Footer";
import { toast } from "react-toastify";
import { VehicleDetailDialog } from "@/components/customer/VehicleDetailDialog";
import { AddVehicleDialog } from "@/components/customer/AddVehicleDialog";
import { EditVehicleDialog } from "@/components/customer/EditVehicleDialog";

const VehiclesPage = () => {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Dialog states
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  useEffect(() => {
    loadVehicles();
  }, []);

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
    if (!confirm("Bạn có chắc chắn muốn xóa xe này?")) return;
    
    setDeletingId(vehicleId);
    const res = await deleteVehicleApi(vehicleId);
    if (res.ok) {
      toast.success("Xóa xe thành công");
      loadVehicles();
    } else {
      toast.error(res.message || "Không thể xóa xe");
    }
    setDeletingId(null);
  };

  const handleOpenDetail = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setDetailDialogOpen(true);
  };

  const handleOpenEdit = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setEditDialogOpen(true);
  };

  const handleOpenAdd = () => {
    setAddDialogOpen(true);
  };

  // Đăng xuất (giả lập)
  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    toast.success("Đăng xuất thành công!");
    setTimeout(() => {
      navigate("/login");
    }, 1000);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 flex flex-col"
    >
      {/* Main Header */}
      <Header onLogout={handleLogout} />
      {/* Main Content */}
      <main className="flex-1 py-8">
        <div className="container max-w-[1200px] pt-20 space-y-6">
          {/* Page Header - Consistent with history pages */}
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl p-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                <Car className="w-6 h-6" /> Quản lý xe
              </h1>
              <p className="opacity-90 mt-1">
                Bạn có <span className="font-bold text-yellow-300">{vehicles.length}</span> xe đã đăng ký
              </p>
            </div>
            <Button variant="secondary" onClick={handleOpenAdd} className="gap-2">
              <Plus className="w-4 h-4" /> Thêm xe
            </Button>
          </div>

          {/* Vehicles Grid */}
          <div>
        {vehiclesLoading ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mb-4 shadow-lg">
              <div className="animate-spin rounded-full h-8 w-8 border-3 border-white border-t-transparent"></div>
            </div>
            <p className="text-gray-600 font-medium">Đang tải danh sách xe...</p>
          </motion.div>
        ) : vehicles.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur">
              <CardContent className="text-center py-16 px-6">
                <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl mb-6 shadow-inner">
                  <Car className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-gray-900">Chưa có xe nào</h3>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  Bắt đầu bằng việc thêm xe đầu tiên của bạn và trải nghiệm dịch vụ tuyệt vời
                </p>
                <Button
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold px-8 py-6 text-base rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105"
                  onClick={handleOpenAdd}
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Thêm xe đầu tiên
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ staggerChildren: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            <AnimatePresence>
              {vehicles.map((v, index) => {
                const model = v.model_id as unknown;
                const modelData = model && typeof model === "object" && model !== null
                  ? (model as { brand?: string; model_name?: string; battery_type?: string })
                  : null;

                return (
                  <motion.div
                    key={v._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.1, duration: 0.4 }}
                  >
                    <Card className="group relative shadow-xl hover:shadow-2xl transition-all duration-300 border-0 bg-white overflow-hidden hover:scale-[1.02]">
                      {/* Gradient accent bar */}
                      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
                      
                      <CardContent className="p-6">
                        {/* Vehicle Header */}
                        <div className="flex items-start gap-4 mb-6">
                          <div className="relative w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform">
                            <Car className="h-8 w-8 text-white" />
                            <div className="absolute -top-1 -right-1">
                              <Badge className="bg-gradient-to-r from-yellow-400 to-orange-400 text-xs font-bold border-2 border-white shadow-md">
                                {v.purchase_date ? new Date(v.purchase_date).getFullYear() : 'N/A'}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex-1">
                            <h3 className="font-bold text-xl text-gray-900 mb-1 group-hover:text-indigo-600 transition-colors">
                              {getModelLabel(v)}
                            </h3>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs font-semibold border-gray-300">
                                {v.license_plate}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        {/* Vehicle Info Grid - Modern cards */}
                        <div className="grid grid-cols-2 gap-3 mb-6">
                          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100 hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-2 mb-2">
                              <Calendar className="w-4 h-4 text-indigo-600" />
                              <div className="text-xs text-gray-600 uppercase tracking-wide font-semibold">Năm</div>
                            </div>
                            <div className="text-xl font-bold text-gray-900">
                              {v.purchase_date ? new Date(v.purchase_date).getFullYear() : '2025'}
                            </div>
                          </div>
                          
                          <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-xl border border-purple-100 hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-2 mb-2">
                              <Palette className="w-4 h-4 text-purple-600" />
                              <div className="text-xs text-gray-600 uppercase tracking-wide font-semibold">Màu</div>
                            </div>
                            <div className="text-xl font-bold text-gray-900 capitalize">
                              {v.color || 'blue'}
                            </div>
                          </div>
                          
                          <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl border border-green-100 hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-2 mb-2">
                              <Zap className="w-4 h-4 text-green-600" />
                              <div className="text-xs text-gray-600 uppercase tracking-wide font-semibold">Loại pin</div>
                            </div>
                            <div className="text-xl font-bold text-gray-900">
                              {modelData?.battery_type || 'Lithium-ion'}
                            </div>
                          </div>
                          
                          <div className="bg-gradient-to-br from-orange-50 to-yellow-50 p-4 rounded-xl border border-orange-100 hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-2 mb-2">
                              <Battery className="w-4 h-4 text-orange-600" />
                              <div className="text-xs text-gray-600 uppercase tracking-wide font-semibold">Pin (kWh)</div>
                            </div>
                            <div className="text-xl font-bold text-gray-900">
                              {v.battery_health || '92'}
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons - Modern style */}
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 text-sm border-2 border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 font-semibold transition-all group/btn"
                            onClick={() => handleOpenDetail(v)}
                          >
                            <Eye className="h-4 w-4 mr-1.5 group-hover/btn:scale-110 transition-transform" />
                            Chi tiết
                          </Button>
                          <Button
                            size="sm"
                            className="flex-1 text-sm bg-gradient-to-r from-yellow-400 to-orange-400 hover:from-yellow-500 hover:to-orange-500 text-gray-900 font-bold shadow-md hover:shadow-lg transition-all"
                            onClick={() => handleOpenEdit(v)}
                          >
                            <Edit className="h-4 w-4 mr-1.5" />
                            Sửa
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 text-sm border-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-400 font-semibold transition-all group/btn"
                            disabled={deletingId === v._id}
                            onClick={() => handleDelete(v._id)}
                          >
                            {deletingId === v._id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <Trash2 className="h-4 w-4 mr-1.5 group-hover/btn:scale-110 transition-transform" />
                                Xóa
                              </>
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />

      {/* Dialogs */}
      <VehicleDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        vehicle={selectedVehicle}
        onEdit={() => {
          setDetailDialogOpen(false);
          if (selectedVehicle) {
            handleOpenEdit(selectedVehicle);
          }
        }}
      />

      <AddVehicleDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSuccess={loadVehicles}
      />

      <EditVehicleDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        vehicle={selectedVehicle}
        onSuccess={loadVehicles}
      />
    </motion.div>
  );
};

export default VehiclesPage;
