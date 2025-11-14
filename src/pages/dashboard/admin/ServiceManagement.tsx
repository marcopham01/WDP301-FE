import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Pencil, Plus, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import {
  ServiceType,
  getAllServicesApi,
  createServiceApi,
  updateServiceApi,
  deleteServiceApi,
  CreateServicePayload,
  UpdateServicePayload,
} from "@/lib/serviceApi";

const ServiceManagement = () => {
  const [services, setServices] = useState<ServiceType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentService, setCurrentService] = useState<ServiceType | null>(
    null
  );

  // Form states
  const [serviceName, setServiceName] = useState("");
  const [description, setDescription] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [estimatedDuration, setEstimatedDuration] = useState("");
  const [isActive, setIsActive] = useState(true);

  // Đã chuyển sang dùng toast của sonner
  const navigate = useNavigate();

  // Dữ liệu mẫu để hiển thị khi không có kết nối API
  const sampleServices: ServiceType[] = [
    {
      _id: "1",
      service_name: "Bảo dưỡng định kỳ",
      description: "Kiểm tra và bảo dưỡng xe điện định kỳ",
      base_price: 500000,
      estimated_duration: "2 giờ",
      is_active: true,
    },
    {
      _id: "2",
      service_name: "Sửa chữa hệ thống pin",
      description: "Kiểm tra và sửa chữa hệ thống pin xe điện",
      base_price: 1500000,
      estimated_duration: "4 giờ",
      is_active: true,
    },
  ];

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    setLoading(true);
    try {
      const response = await getAllServicesApi();
      if (response.ok && response.data?.data) {
        setServices(response.data.data);
      } else {
        console.log("Không thể kết nối API, sử dụng dữ liệu mẫu");
        // Sử dụng dữ liệu mẫu khi không thể kết nối API
        setServices(sampleServices);
        toast("Chế độ offline. Đang hiển thị dữ liệu mẫu do không thể kết nối đến server");
      }
    } catch (error) {
      console.error("Error loading services:", error);
      // Sử dụng dữ liệu mẫu khi có lỗi
      setServices(sampleServices);
      toast("Chế độ offline. Đang hiển thị dữ liệu mẫu do không thể kết nối đến server");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setServiceName("");
    setDescription("");
    setBasePrice("");
    setEstimatedDuration("");
    setIsActive(true);
  };

  const handleOpenCreateDialog = () => {
    resetForm();
    setIsCreateDialogOpen(true);
  };

  const handleOpenEditDialog = (service: ServiceType) => {
    setCurrentService(service);
    setServiceName(service.service_name);
    setDescription(service.description || "");
    setBasePrice(service.base_price?.toString() || "");
    setEstimatedDuration(service.estimated_duration || "");
    setIsActive(service.is_active !== false);
    setIsEditDialogOpen(true);
  };

  const handleOpenDeleteDialog = (service: ServiceType) => {
    setCurrentService(service);
    setIsDeleteDialogOpen(true);
  };

  const handleCreateService = async () => {
    if (!serviceName.trim()) {
      toast.error("Lỗi. Vui lòng nhập tên dịch vụ");
      return;
    }

    const payload: CreateServicePayload = {
      service_name: serviceName.trim(),
      description: description.trim() || undefined,
      base_price: basePrice ? Number(basePrice) : undefined,
      estimated_duration: estimatedDuration.trim() || undefined,
      is_active: isActive,
    };

    try {
      const response = await createServiceApi(payload);
      if (response.ok) {
        toast.success("Đã tạo dịch vụ mới thành công");
        setIsCreateDialogOpen(false);
        resetForm();
        loadServices();
      } else {
        console.log("Không thể kết nối API, thêm dịch vụ vào dữ liệu mẫu");
        // Thêm dịch vụ mới vào danh sách hiện tại (chế độ offline)
        const newService: ServiceType = {
          _id: Date.now().toString(), // Tạo ID tạm thời
          service_name: payload.service_name,
          description: payload.description,
          base_price: payload.base_price,
          estimated_duration: payload.estimated_duration,
          is_active: payload.is_active,
        };

        setServices((prev) => [...prev, newService]);
        toast.success("Đã thêm dịch vụ mới vào danh sách tạm thời (offline)");
        setIsCreateDialogOpen(false);
        resetForm();
      }
    } catch (error) {
      console.error("Error creating service:", error);
      // Thêm dịch vụ mới vào danh sách hiện tại (chế độ offline)
      const newService: ServiceType = {
        _id: Date.now().toString(), // Tạo ID tạm thời
        service_name: payload.service_name,
        description: payload.description,
        base_price: payload.base_price,
        estimated_duration: payload.estimated_duration,
        is_active: payload.is_active,
      };

      setServices((prev) => [...prev, newService]);
      toast.success("Đã thêm dịch vụ mới vào danh sách tạm thời (offline)");
      setIsCreateDialogOpen(false);
      resetForm();
    }
  };

  const handleUpdateService = async () => {
    if (!currentService || !serviceName.trim()) {
      toast.error("Lỗi. Vui lòng nhập tên dịch vụ");
      return;
    }

    const payload: UpdateServicePayload = {
      service_name: serviceName.trim(),
      description: description.trim() || undefined,
      base_price: basePrice ? Number(basePrice) : undefined,
      estimated_duration: estimatedDuration.trim() || undefined,
      is_active: isActive,
    };

    try {
      const response = await updateServiceApi(currentService._id, payload);
      if (response.ok) {
        toast.success("Đã cập nhật dịch vụ thành công");
        setIsEditDialogOpen(false);
        resetForm();
        loadServices();
      } else {
        toast.error("Không thể cập nhật dịch vụ. " + (response.message || ""));
      }
    } catch (error) {
      console.error("Error updating service:", error);
      toast.error("Đã xảy ra lỗi khi cập nhật dịch vụ.");
    }
  };

  const handleDeleteService = async () => {
    if (!currentService) return;

    try {
      const response = await deleteServiceApi(currentService._id);
      if (response.ok) {
        toast.success("Đã xóa dịch vụ thành công");
        setIsDeleteDialogOpen(false);
        loadServices();
      } else {
        toast.error("Không thể xóa dịch vụ. " + (response.message || ""));
      }
    } catch (error) {
      console.error("Error deleting service:", error);
      toast.error("Đã xảy ra lỗi khi xóa dịch vụ.");
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => navigate("/dashboard/admin")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại
          </Button>
          <h1 className="text-2xl font-bold">Quản lý Dịch vụ</h1>
        </div>
        <Button onClick={handleOpenCreateDialog}>
          <Plus className="mr-2 h-4 w-4" /> Thêm dịch vụ mới
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách dịch vụ</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Đang tải...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên dịch vụ</TableHead>
                  <TableHead>Mô tả</TableHead>
                  <TableHead>Giá cơ bản</TableHead>
                  <TableHead>Thời gian ước tính</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">
                      Không có dịch vụ nào
                    </TableCell>
                  </TableRow>
                ) : (
                  services.map((service) => (
                    <TableRow key={service._id}>
                      <TableCell className="font-medium">
                        {service.service_name}
                      </TableCell>
                      <TableCell>{service.description || "-"}</TableCell>
                      <TableCell>
                        {service.base_price
                          ? `${service.base_price.toLocaleString("vi-VN")} VNĐ`
                          : "-"}
                      </TableCell>
                      <TableCell>{service.estimated_duration || "-"}</TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            service.is_active !== false
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}>
                          {service.is_active !== false
                            ? "Hoạt động"
                            : "Không hoạt động"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEditDialog(service)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDeleteDialog(service)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Service Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thêm dịch vụ mới</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="serviceName">Tên dịch vụ *</Label>
              <Input
                id="serviceName"
                value={serviceName}
                onChange={(e) => setServiceName(e.target.value)}
                placeholder="Nhập tên dịch vụ"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Mô tả</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Nhập mô tả dịch vụ"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="basePrice">Giá cơ bản (VNĐ)</Label>
              <Input
                id="basePrice"
                type="number"
                value={basePrice}
                onChange={(e) => setBasePrice(e.target.value)}
                placeholder="Nhập giá cơ bản"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="estimatedDuration">Thời gian ước tính</Label>
              <Input
                id="estimatedDuration"
                value={estimatedDuration}
                onChange={(e) => setEstimatedDuration(e.target.value)}
                placeholder="Ví dụ: 2 giờ"
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActive"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="isActive">Hoạt động</Label>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Hủy</Button>
            </DialogClose>
            <Button onClick={handleCreateService}>Tạo dịch vụ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Service Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chỉnh sửa dịch vụ</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="editServiceName">Tên dịch vụ *</Label>
              <Input
                id="editServiceName"
                value={serviceName}
                onChange={(e) => setServiceName(e.target.value)}
                placeholder="Nhập tên dịch vụ"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editDescription">Mô tả</Label>
              <Textarea
                id="editDescription"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Nhập mô tả dịch vụ"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editBasePrice">Giá cơ bản (VNĐ)</Label>
              <Input
                id="editBasePrice"
                type="number"
                value={basePrice}
                onChange={(e) => setBasePrice(e.target.value)}
                placeholder="Nhập giá cơ bản"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editEstimatedDuration">Thời gian ước tính</Label>
              <Input
                id="editEstimatedDuration"
                value={estimatedDuration}
                onChange={(e) => setEstimatedDuration(e.target.value)}
                placeholder="Ví dụ: 2 giờ"
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="editIsActive"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="editIsActive">Hoạt động</Label>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Hủy</Button>
            </DialogClose>
            <Button onClick={handleUpdateService}>Cập nhật</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Service Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa dịch vụ</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>
              Bạn có chắc chắn muốn xóa dịch vụ "{currentService?.service_name}
              "? Hành động này không thể hoàn tác.
            </p>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Hủy</Button>
            </DialogClose>
            <Button variant="destructive" onClick={handleDeleteService}>
              Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ServiceManagement;
