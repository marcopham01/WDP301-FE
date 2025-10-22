import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Loader2, Search, Car } from "lucide-react";
import {
  getVehicleModelsApi,
  createVehicleModelApi,
  VehicleModel,
  CreateVehicleModelPayload
} from "@/lib/vehicleApi";
import { toast } from "react-toastify";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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

const VehicleModelManagement = () => {
  const [models, setModels] = useState<VehicleModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState<CreateVehicleModelPayload>({
    brand: "",
    model_name: "",
    year: new Date().getFullYear(),
    battery_type: "",
    maintenanceIntervalKm: 10000,
    maintenanceIntervaMonths: 6,
  });

  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    setLoading(true);
    const res = await getVehicleModelsApi();
    if (res.ok && res.data?.data) {
      setModels(res.data.data);
    } else {
      toast.error("Lỗi tải dữ liệu. Không thể tải danh sách model xe");
    }
    setLoading(false);
  };

  const handleCreateModel = async () => {
    if (!formData.brand || !formData.model_name || !formData.battery_type) {
      toast.error("Thiếu thông tin. Vui lòng điền đầy đủ thông tin bắt buộc");
      return;
    }

    setCreating(true);
    const res = await createVehicleModelApi(formData);

    if (res.ok) {
      toast.success("Tạo model thành công. Model xe mới đã được thêm vào hệ thống");
      setIsCreateDialogOpen(false);
      setFormData({
        brand: "",
        model_name: "",
        year: new Date().getFullYear(),
        battery_type: "",
        maintenanceIntervalKm: 10000,
        maintenanceIntervaMonths: 6,
      });
      loadModels();
    } else {
      toast.error(res.message || "Tạo model thất bại. Không thể tạo model xe mới");
    }
    setCreating(false);
  };

  const filteredModels = models.filter(model =>
    model.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    model.model_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    model.battery_type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Quản lý Model Xe</h1>
          <p className="text-muted-foreground">Quản lý các model xe điện trong hệ thống</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Thêm Model mới
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Thêm Model Xe mới</DialogTitle>
              <DialogDescription>
                Tạo model xe điện mới trong hệ thống
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="brand" className="text-right">
                  Hãng xe
                </Label>
                <Input
                  id="brand"
                  value={formData.brand}
                  onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
                  className="col-span-3"
                  placeholder="VinFast, Tesla..."
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="model_name" className="text-right">
                  Tên model
                </Label>
                <Input
                  id="model_name"
                  value={formData.model_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, model_name: e.target.value }))}
                  className="col-span-3"
                  placeholder="VF 9, Model 3..."
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="year" className="text-right">
                  Năm
                </Label>
                <Input
                  id="year"
                  type="number"
                  value={formData.year}
                  onChange={(e) => setFormData(prev => ({ ...prev, year: Number(e.target.value) }))}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="battery_type" className="text-right">
                  Loại pin
                </Label>
                <Input
                  id="battery_type"
                  value={formData.battery_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, battery_type: e.target.value }))}
                  className="col-span-3"
                  placeholder="Lithium-ion, NMC..."
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="maintenanceIntervalKm" className="text-right">
                  Bảo dưỡng (km)
                </Label>
                <Input
                  id="maintenanceIntervalKm"
                  type="number"
                  value={formData.maintenanceIntervalKm}
                  onChange={(e) => setFormData(prev => ({ ...prev, maintenanceIntervalKm: Number(e.target.value) }))}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="maintenanceIntervaMonths" className="text-right">
                  Bảo dưỡng (tháng)
                </Label>
                <Input
                  id="maintenanceIntervaMonths"
                  type="number"
                  value={formData.maintenanceIntervaMonths}
                  onChange={(e) => setFormData(prev => ({ ...prev, maintenanceIntervaMonths: Number(e.target.value) }))}
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="submit"
                onClick={handleCreateModel}
                disabled={creating}
              >
                {creating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Đang tạo...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Tạo Model
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Tìm kiếm model xe..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Models Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Đang tải danh sách model...</p>
        </div>
      ) : filteredModels.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Car className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {searchTerm ? "Không tìm thấy model nào" : "Chưa có model nào"}
            </h3>
            <p className="text-muted-foreground mb-6">
              {searchTerm ? "Thử tìm kiếm với từ khóa khác" : "Bắt đầu bằng việc thêm model đầu tiên"}
            </p>
            {!searchTerm && (
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Thêm Model đầu tiên
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredModels.map((model) => (
            <Card key={model._id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Car className="h-5 w-5" />
                    {model.brand} {model.model_name}
                  </span>
                  <Badge variant="secondary">{model.year}</Badge>
                </CardTitle>
                <CardDescription>
                  Pin: {model.battery_type}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Bảo dưỡng:</span>
                    <span>{model.maintenanceIntervalKm?.toLocaleString()} km</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Chu kỳ:</span>
                    <span>{model.maintenanceIntervaMonths} tháng</span>
                  </div>
                  {model.createdAt && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Ngày tạo:</span>
                      <span>{new Date(model.createdAt).toLocaleDateString("vi-VN")}</span>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Edit className="h-4 w-4 mr-2" />
                    Sửa
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="flex-1">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Xóa
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Xác nhận xóa model</AlertDialogTitle>
                        <AlertDialogDescription>
                          Bạn có chắc chắn muốn xóa model {model.brand} {model.model_name}?
                          Hành động này không thể hoàn tác và có thể ảnh hưởng đến các xe hiện tại.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
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
    </motion.div>
  );
};

export default VehicleModelManagement;
