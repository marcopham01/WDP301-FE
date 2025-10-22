import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Pencil, Plus, Trash2, Clock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { toast } from "react-toastify";
import {
  ServiceCenter,
  getServiceCentersApi,
  createServiceCenterApi,
  updateServiceCenterApi,
  deleteServiceCenterApi,
  CreateServiceCenterPayload,
  UpdateServiceCenterPayload,
} from "@/lib/serviceCenterApi";
import { useNavigate } from "react-router-dom";

const ServiceCenterManagement = () => {
  const [serviceCenters, setServiceCenters] = useState<ServiceCenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentServiceCenter, setCurrentServiceCenter] =
    useState<ServiceCenter | null>(null);

  // Form states
  const [centerName, setCenterName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [isActive, setIsActive] = useState(true);

  // Đã chuyển sang dùng toast của sonner
  const navigate = useNavigate();

  useEffect(() => {
    loadServiceCenters();
  }, []);

  const loadServiceCenters = async () => {
    setLoading(true);
    try {
      const response = await getServiceCentersApi();
      if (response.ok && response.data?.data) {
        setServiceCenters(response.data.data);
      } else {
        toast.error("Không thể tải danh sách trung tâm dịch vụ. " + (response.message || ""));
      }
    } catch (error) {
      console.error("Error loading service centers:", error);
      toast.error("Đã xảy ra lỗi khi tải danh sách trung tâm dịch vụ.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setCenterName("");
    setAddress("");
    setPhone("");
    setEmail("");
    setIsActive(true);
  };

  const handleOpenCreateDialog = () => {
    resetForm();
    setIsCreateDialogOpen(true);
  };

  const handleOpenEditDialog = (serviceCenter: ServiceCenter) => {
    setCurrentServiceCenter(serviceCenter);
    setCenterName(serviceCenter.center_name);
    setAddress(serviceCenter.address || "");
    setPhone(serviceCenter.phone || "");
    setEmail(serviceCenter.email || "");
    setIsActive(serviceCenter.is_active !== false);
    setIsEditDialogOpen(true);
  };

  const handleOpenDeleteDialog = (serviceCenter: ServiceCenter) => {
    setCurrentServiceCenter(serviceCenter);
    setIsDeleteDialogOpen(true);
  };

  const handleCreateServiceCenter = async () => {
    if (!centerName.trim()) {
      toast.error("Vui lòng nhập tên trung tâm dịch vụ");
      return;
    }

    const payload: CreateServiceCenterPayload = {
      center_name: centerName.trim(),
      address: address.trim() || undefined,
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      is_active: isActive,
    };

    try {
      const response = await createServiceCenterApi(payload);
      if (response.ok) {
        toast.success("Đã tạo trung tâm dịch vụ mới thành công");
        setIsCreateDialogOpen(false);
        resetForm();
        loadServiceCenters();
      } else {
        toast.error("Không thể tạo trung tâm dịch vụ. " + (response.message || ""));
      }
    } catch (error) {
      console.error("Error creating service center:", error);
      toast.error("Đã xảy ra lỗi khi tạo trung tâm dịch vụ mới.");
    }
  };

  const handleUpdateServiceCenter = async () => {
    if (!currentServiceCenter) return;

    if (!centerName.trim()) {
      toast.error("Vui lòng nhập tên trung tâm dịch vụ");
      return;
    }

    const payload: UpdateServiceCenterPayload = {
      center_name: centerName.trim(),
      address: address.trim() || undefined,
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      is_active: isActive,
    };

    try {
      const response = await updateServiceCenterApi(currentServiceCenter._id, payload);
      if (response.ok) {
        toast.success("Đã cập nhật trung tâm dịch vụ thành công");
        setIsEditDialogOpen(false);
        loadServiceCenters();
      } else {
        toast.error("Không thể cập nhật trung tâm dịch vụ. " + (response.message || ""));
      }
    } catch (error) {
      console.error("Error updating service center:", error);
      toast.error("Đã xảy ra lỗi khi cập nhật trung tâm dịch vụ.");
    }
  };

  const handleDeleteServiceCenter = async () => {
    if (!currentServiceCenter) return;

    try {
      const response = await deleteServiceCenterApi(currentServiceCenter._id);
      if (response.ok) {
        toast.success("Đã xóa trung tâm dịch vụ thành công");
        setIsDeleteDialogOpen(false);
        loadServiceCenters();
      } else {
        toast.error("Không thể xóa trung tâm dịch vụ. " + (response.message || ""));
      }
    } catch (error) {
      console.error("Error deleting service center:", error);
      toast.error("Đã xảy ra lỗi khi xóa trung tâm dịch vụ.");
    }
  };

  const handleManageWorkingHours = (serviceCenter: ServiceCenter) => {
    navigate(
      `/dashboard/admin/service-center/${serviceCenter._id}/working-hours`
    );
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
          <h1 className="text-2xl font-bold">Quản lý Trung tâm Dịch vụ</h1>
        </div>
        <Button onClick={handleOpenCreateDialog}>
          <Plus className="mr-2 h-4 w-4" /> Thêm trung tâm mới
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách trung tâm dịch vụ</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Đang tải...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên trung tâm</TableHead>
                  <TableHead>Địa chỉ</TableHead>
                  <TableHead>Số điện thoại</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {serviceCenters.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">
                      Không có trung tâm dịch vụ nào
                    </TableCell>
                  </TableRow>
                ) : (
                  serviceCenters.map((center) => (
                    <TableRow key={center._id}>
                      <TableCell className="font-medium">
                        {center.center_name}
                      </TableCell>
                      <TableCell>{center.address || "-"}</TableCell>
                      <TableCell>{center.phone || "-"}</TableCell>
                      <TableCell>{center.email || "-"}</TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            center.is_active !== false
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}>
                          {center.is_active !== false
                            ? "Hoạt động"
                            : "Không hoạt động"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleManageWorkingHours(center)}
                          title="Quản lý giờ làm việc">
                          <Clock className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEditDialog(center)}
                          title="Chỉnh sửa">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDeleteDialog(center)}
                          title="Xóa">
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

      {/* Create Service Center Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thêm trung tâm dịch vụ mới</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="centerName">Tên trung tâm *</Label>
              <Input
                id="centerName"
                value={centerName}
                onChange={(e) => setCenterName(e.target.value)}
                placeholder="Nhập tên trung tâm dịch vụ"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Địa chỉ</Label>
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Nhập địa chỉ"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Số điện thoại</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Nhập số điện thoại"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Nhập email"
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
            <Button onClick={handleCreateServiceCenter}>Tạo trung tâm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Service Center Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chỉnh sửa trung tâm dịch vụ</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="editCenterName">Tên trung tâm *</Label>
              <Input
                id="editCenterName"
                value={centerName}
                onChange={(e) => setCenterName(e.target.value)}
                placeholder="Nhập tên trung tâm dịch vụ"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editAddress">Địa chỉ</Label>
              <Input
                id="editAddress"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Nhập địa chỉ"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editPhone">Số điện thoại</Label>
              <Input
                id="editPhone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Nhập số điện thoại"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editEmail">Email</Label>
              <Input
                id="editEmail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Nhập email"
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
            <Button onClick={handleUpdateServiceCenter}>Cập nhật</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Service Center Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa trung tâm dịch vụ</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>
              Bạn có chắc chắn muốn xóa trung tâm dịch vụ "
              {currentServiceCenter?.center_name}"? Hành động này không thể hoàn
              tác.
            </p>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Hủy</Button>
            </DialogClose>
            <Button variant="destructive" onClick={handleDeleteServiceCenter}>
              Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ServiceCenterManagement;
