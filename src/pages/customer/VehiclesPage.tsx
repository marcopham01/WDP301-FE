import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Car,
  Plus,
  Loader2,
  Edit,
  Trash2,
  Eye,
  Calendar,
  Palette,
  Battery,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  getUserVehiclesApi,
  Vehicle,
  deleteVehicleApi,
} from "@/lib/vehicleApi";
import Header from "@/components/MainLayout/Header";
import Footer from "@/components/MainLayout/Footer";
import { toast } from "react-toastify";
import { VehicleDetailDialog } from "@/components/customer/VehicleDetailDialog";
import { AddVehicleDialog } from "@/components/customer/AddVehicleDialog";
import { EditVehicleDialog } from "@/components/customer/EditVehicleDialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"; // Thêm import Dialog components

const VehiclesPage = () => {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Dialog states
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false); // State cho delete dialog
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [selectedVehicleToDelete, setSelectedVehicleToDelete] =
    useState<Vehicle | null>(null); // State cho vehicle to delete

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

  const handleConfirmDelete = () => {
    if (selectedVehicleToDelete) {
      handleDelete(selectedVehicleToDelete._id);
    }
    setDeleteDialogOpen(false);
    setSelectedVehicleToDelete(null);
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

  const handleOpenDelete = (vehicle: Vehicle) => {
    setSelectedVehicleToDelete(vehicle);
    setDeleteDialogOpen(true);
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Main Header */}
      <Header onLogout={handleLogout} />
      {/* Main Content */}
      <main className="flex-1 py-8">
        <div className="container max-w-[1200px] pt-16 space-y-6">
          {/* Page Header */}
          <div className="bg-ev-green text-white rounded-lg p-6 flex items-center justify-between shadow-md">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                <Car className="w-6 h-6" /> Quản lý xe
              </h1>
              <p className="opacity-90 mt-1">
                Bạn có <span className="font-semibold">{vehicles.length}</span>{" "}
                xe đã đăng ký
              </p>
            </div>
            <Button variant="ghost" onClick={handleOpenAdd}>
              <Plus className="w-4 h-4" /> Thêm xe
            </Button>
          </div>

          {/* Vehicles Grid */}
          <div>
            {vehiclesLoading ? (
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-ev-green rounded-lg mb-4 shadow-md">
                  <Loader2 className="h-8 w-8 animate-spin text-white" />
                </div>
                <p className="text-gray-700 font-medium">
                  Đang tải danh sách xe...
                </p>
              </div>
            ) : vehicles.length === 0 ? (
              <Card className="shadow-md border border-gray-200 bg-white rounded-lg">
                <CardContent className="text-center py-16 px-6">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-lg mb-6 shadow-sm">
                    <Car className="h-10 w-10 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-gray-900">
                    Chưa có xe nào
                  </h3>
                  <p className="text-gray-600 mb-8 max-w-md mx-auto">
                    Bắt đầu bằng việc thêm xe đầu tiên của bạn và trải nghiệm
                    dịch vụ tuyệt vời
                  </p>
                  <Button
                    className="bg-ev-green hover:bg-ev-green/90 text-white font-semibold px-6 py-3 rounded-md shadow-md hover:shadow-lg transition-shadow"
                    onClick={handleOpenAdd}
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Thêm xe đầu tiên
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {vehicles.map((v, index) => {
                  const model = v.model_id as unknown;
                  const modelData =
                    model && typeof model === "object" && model !== null
                      ? (model as {
                          brand?: string;
                          model_name?: string;
                          battery_type?: string;
                        })
                      : null;

                  return (
                    <motion.div
                      key={v._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1, duration: 0.4 }}
                    >
                      <Card className="shadow-md hover:shadow-lg transition-shadow border border-gray-200 bg-white rounded-lg overflow-hidden">
                        <CardContent className="p-6">
                          {/* Vehicle Header */}
                          <div className="flex items-start gap-4 mb-6">
                            <div className="w-16 h-16 bg-ev-green rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                              <Car className="h-8 w-8 text-white" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-bold text-xl text-gray-900 mb-1">
                                {getModelLabel(v)}
                              </h3>
                              <Badge
                                variant="outline"
                                className="text-sm border-gray-300 rounded-md px-2 py-1"
                              >
                                {v.license_plate}
                              </Badge>
                            </div>
                          </div>

                          {/* Vehicle Info Grid */}
                          <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                              <div className="flex items-center gap-2 mb-2">
                                <Calendar className="w-4 h-4 text-ev-green" />
                                <div className="text-xs text-gray-600 uppercase font-semibold">
                                  Năm
                                </div>
                              </div>
                              <div className="text-lg font-bold text-gray-900">
                                {v.purchase_date
                                  ? new Date(v.purchase_date).getFullYear()
                                  : "2025"}
                              </div>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                              <div className="flex items-center gap-2 mb-2">
                                <Palette className="w-4 h-4 text-ev-green" />
                                <div className="text-xs text-gray-600 uppercase font-semibold">
                                  Màu
                                </div>
                              </div>
                              <div className="text-lg font-bold text-gray-900 capitalize">
                                {v.color || "blue"}
                              </div>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                              <div className="flex items-center gap-2 mb-2">
                                <Battery className="w-4 h-4 text-ev-green" />
                                <div className="text-xs text-gray-600 uppercase font-semibold">
                                  Loại pin
                                </div>
                              </div>
                              <div className="text-lg font-bold text-gray-900">
                                {modelData?.battery_type || "Lithium-ion"}
                              </div>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="text-xs text-gray-600 uppercase font-semibold">
                                  Pin (kWh)
                                </div>
                              </div>
                              <div className="text-lg font-bold text-gray-900">
                                {v.battery_health || "92"}
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-3">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 border-gray-300 hover:bg-ev-green hover:text-white transition-colors rounded-md"
                              onClick={() => handleOpenDetail(v)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Chi tiết
                            </Button>
                            <Button
                              size="sm"
                              className="flex-1 bg-ev-green hover:bg-ev-green/90 text-white font-semibold rounded-md"
                              onClick={() => handleOpenEdit(v)}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Sửa
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 border-red-300 text-red-600 hover:bg-red-50 transition-colors rounded-md"
                              disabled={deletingId === v._id}
                              onClick={() => handleOpenDelete(v)}
                            >
                              {deletingId === v._id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <Trash2 className="h-4 w-4 mr-2" />
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
              </div>
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
      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-white border border-gray-200 rounded-lg shadow-lg">
          <DialogHeader>
            <DialogTitle>Xác nhận xóa xe</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa xe{" "}
              <strong>{selectedVehicleToDelete?.license_plate}</strong> -{" "}
              {selectedVehicleToDelete
                ? getModelLabel(selectedVehicleToDelete)
                : ""}{" "}
              không? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deletingId === selectedVehicleToDelete?._id}
            >
              {deletingId === selectedVehicleToDelete?._id ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang xóa...
                </>
              ) : (
                "Xác nhận"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VehiclesPage;
