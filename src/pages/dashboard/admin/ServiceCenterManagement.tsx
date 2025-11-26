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
import { ArrowLeft, Pencil, Plus, Trash2, Clock, Users, UserPlus, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription,
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
} from "@/components/ui/alert-dialog";
// Select UI bị gỡ vì hiện chưa có API list users theo role
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "react-toastify";
import {
  ServiceCenter,
  getServiceCentersApi,
  createServiceCenterApi,
  updateServiceCenterApi,
  deleteServiceCenterApi,
  CreateServiceCenterPayload,
  UpdateServiceCenterPayload,
  getTechniciansApi,
  addTechnicianToServiceCenterApi,
  removeTechnicianFromServiceCenterApi,
  Technician,
} from "@/lib/serviceCenterApi";
import { useNavigate } from "react-router-dom";
import { getAllProfilesApi, UserProfileItem } from "@/lib/authApi";
// Gỡ gọi API không tồn tại ở backend

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
  // Staff selection (one staff per center)
  const [staffList, setStaffList] = useState<{ _id: string; fullName: string; email: string }[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string>("");
  const [loadingStaff, setLoadingStaff] = useState(false);

  // ✨ Technician Management States
  const [isTechnicianDialogOpen, setIsTechnicianDialogOpen] = useState(false);
  const [isAddTechnicianDialogOpen, setIsAddTechnicianDialogOpen] = useState(false);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [allUsers, setAllUsers] = useState<{ _id: string; fullName: string; email: string; phone?: string }[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [loadingTechnicians, setLoadingTechnicians] = useState(false);
  const [addingTechnician, setAddingTechnician] = useState(false);
  const [removingTechnicianId, setRemovingTechnicianId] = useState<string | null>(null);
  const [deleteTechnicianDialogOpen, setDeleteTechnicianDialogOpen] = useState(false);
  const [technicianToDelete, setTechnicianToDelete] = useState<string | null>(null);
  // remove manual user id path as per request

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
    setSelectedStaffId("");
  };

  const handleOpenCreateDialog = () => {
    resetForm();
    // Load staff list lazily on open if empty
    if (staffList.length === 0) {
      loadStaffUsers();
    }
    setIsCreateDialogOpen(true);
  };

  const handleOpenEditDialog = (serviceCenter: ServiceCenter) => {
    setCurrentServiceCenter(serviceCenter);
    setCenterName(serviceCenter.center_name);
    setAddress(serviceCenter.address || "");
    setPhone(serviceCenter.phone || "");
    setEmail(serviceCenter.email || "");
    setIsActive(serviceCenter.is_active !== false);
    // Preselect current staff (user_id) if present
    const scUser: any = (serviceCenter as any).user_id;
    if (scUser && typeof scUser === 'object') {
      setSelectedStaffId(scUser._id || "");
    } else if (typeof scUser === 'string') {
      setSelectedStaffId(scUser);
    } else {
      setSelectedStaffId("");
    }
    if (staffList.length === 0) {
      loadStaffUsers();
    }
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
    if (!selectedStaffId) {
      toast.error("Vui lòng chọn nhân viên (staff) phụ trách trung tâm");
      return;
    }

    const payload: CreateServiceCenterPayload = {
      center_name: centerName.trim(),
      address: address.trim() || undefined,
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      is_active: isActive,
      user_id: selectedStaffId,
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
    if (!selectedStaffId) {
      toast.error("Vui lòng chọn nhân viên (staff) phụ trách trung tâm");
      return;
    }

    const payload: UpdateServiceCenterPayload = {
      center_name: centerName.trim(),
      address: address.trim() || undefined,
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      is_active: isActive,
      user_id: selectedStaffId,
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

  // ✨ Technician Management Functions
  const handleOpenTechnicianDialog = async (serviceCenter: ServiceCenter) => {
    setCurrentServiceCenter(serviceCenter);
    setIsTechnicianDialogOpen(true);
    await loadTechnicians(serviceCenter._id);
  };

  const loadTechnicians = async (centerId: string) => {
    setLoadingTechnicians(true);
    try {
      const response = await getTechniciansApi(centerId);
      if (response.ok && response.data?.data) {
        setTechnicians(response.data.data);
      } else {
        toast.error("Không thể tải danh sách kỹ thuật viên");
      }
    } catch (error) {
      console.error("Error loading technicians:", error);
      toast.error("Đã xảy ra lỗi khi tải danh sách kỹ thuật viên");
    } finally {
      setLoadingTechnicians(false);
    }
  };

  // Lấy tất cả user rồi lọc role = technician
  const loadAllUsers = async () => {
    try {
      const pageSize = 50;
      let page = 1;
      const acc: UserProfileItem[] = [];

      while (true) {
        const res = await getAllProfilesApi({ page, limit: pageSize, role: "technician" });
        if (!res.ok) {
          toast.error(res.message || "Không thể tải danh sách người dùng");
          break;
        }
        type Paged = { items?: UserProfileItem[]; users?: UserProfileItem[]; pagination?: { total_pages?: number; current_page?: number } };
  const raw = res.data as { success?: boolean; data?: Paged } | null | undefined;
        const container: Paged | undefined = raw?.data ?? (raw as unknown as Paged);
        const items = (container?.items ?? container?.users ?? (Array.isArray(container) ? (container as unknown as UserProfileItem[]) : undefined)) as UserProfileItem[] | undefined;
        const pagination = container?.pagination as { total_pages?: number; current_page?: number } | undefined;

        if (Array.isArray(items)) acc.push(...items);

        const totalPages = pagination?.total_pages ?? 1;
        const currentPage = pagination?.current_page ?? page;
        if (currentPage >= totalPages) break;
        page += 1;
        if (page > 20) break; // safety cap
      }

      const techniciansOnly = acc.filter((u) => (u.role || "").toLowerCase() === "technician");
      const mapped = techniciansOnly.map((u) => ({
        _id: u._id,
        fullName: u.fullName,
        email: u.email,
        phone: u.phoneNumber,
      }));
      setAllUsers(mapped);

      if (mapped.length === 0) {
        toast.info("Không tìm thấy user có role 'technician' trong danh sách trả về");
      }
    } catch (error) {
      console.error("Error loadAllUsers:", error);
      toast.error("Không thể tải danh sách người dùng");
    }
  };

  // Load staff users (role = staff)
  const loadStaffUsers = async () => {
    setLoadingStaff(true);
    try {
      const pageSize = 50;
      let page = 1;
      const acc: UserProfileItem[] = [];
      while (true) {
        const res = await getAllProfilesApi({ page, limit: pageSize, role: 'staff' });
        if (!res.ok) {
          toast.error(res.message || 'Không thể tải danh sách staff');
          break;
        }
        type Paged = { items?: UserProfileItem[]; users?: UserProfileItem[]; pagination?: { total_pages?: number; current_page?: number } };
        const raw = res.data as { success?: boolean; data?: Paged } | null | undefined;
        const container: Paged | undefined = raw?.data ?? (raw as unknown as Paged);
        const items = (container?.items ?? container?.users ?? (Array.isArray(container) ? (container as unknown as UserProfileItem[]) : undefined)) as UserProfileItem[] | undefined;
        const pagination = container?.pagination as { total_pages?: number; current_page?: number } | undefined;
        if (Array.isArray(items)) acc.push(...items);
        const totalPages = pagination?.total_pages ?? 1;
        const currentPage = pagination?.current_page ?? page;
        if (currentPage >= totalPages) break;
        page += 1;
        if (page > 20) break;
      }
      const staffOnly = acc.filter(u => (u.role || '').toLowerCase() === 'staff');
      const mapped = staffOnly.map(u => ({ _id: u._id, fullName: u.fullName, email: u.email }));
      setStaffList(mapped);
      if (mapped.length === 0) {
        toast.info("Không tìm thấy user có role 'staff'");
      }
    } catch (e) {
      console.error('Error loadStaffUsers:', e);
      toast.error('Không thể tải danh sách staff');
    } finally {
      setLoadingStaff(false);
    }
  };

  // Đã gỡ gọi API lấy users theo role vì backend chưa có

  const handleOpenAddTechnicianDialog = async () => {
    setIsAddTechnicianDialogOpen(true);
    setSelectedUserId("");
    if (allUsers.length === 0) {
      await loadAllUsers();
    }
  };

  const handleAddTechnician = async () => {
    if (!selectedUserId) {
      toast.error("Vui lòng chọn kỹ thuật viên");
      return;
    }
    if (!currentServiceCenter) return;

    const objectIdToUse = selectedUserId;
    const isValidObjectId = /^[a-fA-F0-9]{24}$/.test(objectIdToUse);
    if (!isValidObjectId) {
      toast.error("user_id không hợp lệ. Vui lòng nhập ObjectId 24 ký tự hex.");
      return;
    }

    setAddingTechnician(true);
    try {
      const response = await addTechnicianToServiceCenterApi({
        user_id: objectIdToUse,
        center_id: currentServiceCenter._id,
        maxSlotsPerDay: 4,
        status: "on",
      });

      if (response.ok) {
        toast.success("✅ Thêm kỹ thuật viên thành công!");
        toast.info("🔄 Hệ thống đã cập nhật availableSlots = 4");
        setIsAddTechnicianDialogOpen(false);
        setSelectedUserId("");
        await loadTechnicians(currentServiceCenter._id);
        await loadServiceCenters(); // Refresh service centers
      } else {
        toast.error(response.message || "Không thể thêm kỹ thuật viên");
      }
    } catch (error) {
      console.error("Error adding technician:", error);
      toast.error("Đã xảy ra lỗi khi thêm kỹ thuật viên");
    } finally {
      setAddingTechnician(false);
    }
  };

  const handleRemoveTechnician = (userId: string) => {
    setTechnicianToDelete(userId);
    setDeleteTechnicianDialogOpen(true);
  };

  const confirmRemoveTechnician = async () => {
    if (!currentServiceCenter || !technicianToDelete) return;

    setRemovingTechnicianId(technicianToDelete);
    try {
      const response = await removeTechnicianFromServiceCenterApi({
        user_id: technicianToDelete,
        center_id: currentServiceCenter._id,
      });

      if (response.ok) {
        toast.success("Đã xóa kỹ thuật viên thành công");
        await loadTechnicians(currentServiceCenter._id);
        await loadServiceCenters(); // Refresh service centers
      } else {
        toast.error(response.message || "Không thể xóa kỹ thuật viên");
      }
    } catch (error) {
      console.error("Error removing technician:", error);
      toast.error("Đã xảy ra lỗi khi xóa kỹ thuật viên");
    } finally {
      setRemovingTechnicianId(null);
      setDeleteTechnicianDialogOpen(false);
      setTechnicianToDelete(null);
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
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-center">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {serviceCenters.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">
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
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenTechnicianDialog(center)}
                          title="Quản lý kỹ thuật viên"
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                          <Users className="h-4 w-4" />
                        </Button>
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
                        </div>
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
              <Label>Nhân viên phụ trách *</Label>
              <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
                <SelectTrigger>
                  <SelectValue placeholder={loadingStaff ? 'Đang tải...' : '-- Chọn staff --'} />
                </SelectTrigger>
                <SelectContent>
                  {loadingStaff ? (
                    <div className="p-2 text-center text-sm text-muted-foreground">Đang tải...</div>
                  ) : staffList.length === 0 ? (
                    <div className="p-2 text-center text-sm text-muted-foreground">Không có staff</div>
                  ) : (
                    staffList.map(s => (
                      <SelectItem key={s._id} value={s._id}>{s.fullName} - {s.email}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
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
              <Label>Nhân viên phụ trách *</Label>
              <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
                <SelectTrigger>
                  <SelectValue placeholder={loadingStaff ? 'Đang tải...' : '-- Chọn staff --'} />
                </SelectTrigger>
                <SelectContent>
                  {loadingStaff ? (
                    <div className="p-2 text-center text-sm text-muted-foreground">Đang tải...</div>
                  ) : staffList.length === 0 ? (
                    <div className="p-2 text-center text-sm text-muted-foreground">Không có staff</div>
                  ) : (
                    staffList.map(s => (
                      <SelectItem key={s._id} value={s._id}>{s.fullName} - {s.email}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
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

      {/* ✨ Technician Management Dialog */}
      <Dialog open={isTechnicianDialogOpen} onOpenChange={setIsTechnicianDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Quản lý Kỹ thuật viên</DialogTitle>
            <DialogDescription>
              Trung tâm: {currentServiceCenter?.center_name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium">
                Danh sách kỹ thuật viên ({technicians.length})
              </h3>
              <Button 
                size="sm" 
                onClick={handleOpenAddTechnicianDialog}
                className="flex items-center gap-2"
              >
                <UserPlus className="h-4 w-4" />
                Thêm kỹ thuật viên
              </Button>
            </div>

            {loadingTechnicians ? (
              <div className="text-center py-8 text-muted-foreground">
                Đang tải...
              </div>
            ) : technicians.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Chưa có kỹ thuật viên nào
              </div>
            ) : (
              <div className="space-y-2">
                {technicians.map((tech) => (
                  <Card key={tech._id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={tech.user.avatar} />
                          <AvatarFallback>
                            {tech.user.fullName.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{tech.user.fullName}</div>
                          <div className="text-sm text-muted-foreground">
                            {tech.user.email}
                          </div>
                          {tech.user.phone && (
                            <div className="text-xs text-muted-foreground">
                              {tech.user.phone}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={tech.status === "on" ? "default" : "secondary"}
                          className={
                            tech.status === "on"
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-700"
                          }
                        >
                          {tech.status === "on" ? "Đang hoạt động" : "Không hoạt động"}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveTechnician(tech.user._id)}
                          disabled={removingTechnicianId === tech.user._id}
                          title="Xóa khỏi trung tâm"
                        >
                          {removingTechnicianId === tech.user._id ? (
                            <span className="animate-spin">⏳</span>
                          ) : (
                            <X className="h-4 w-4 text-red-600" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <p className="text-sm text-blue-800">
                💡 <strong>Lưu ý:</strong> Sau khi thêm kỹ thuật viên, hệ thống sẽ 
                tự động cập nhật <code className="bg-blue-100 px-1 rounded">availableSlots = 4</code> cho 
                trung tâm này (mỗi technician có thể nhận tối đa 4 appointments/ngày).
              </p>
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Đóng</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ✨ Add Technician Dialog */}
      <Dialog open={isAddTechnicianDialogOpen} onOpenChange={setIsAddTechnicianDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thêm Kỹ thuật viên</DialogTitle>
            <DialogDescription>
              Chọn người dùng có role "technician" để thêm vào trung tâm
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="technician">Chọn kỹ thuật viên *</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="-- Chọn kỹ thuật viên --" />
                </SelectTrigger>
                <SelectContent>
                  {allUsers.length === 0 ? (
                    <div className="p-2 text-center text-sm text-muted-foreground">
                      Không có người dùng nào
                    </div>
                  ) : (
                    allUsers.map((user) => (
                      <SelectItem key={user._id} value={user._id}>
                        {user.fullName} - {user.email}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
              <p className="text-xs text-green-800">
                ℹ️ Mỗi technician chỉ có thể thuộc về 1 trung tâm duy nhất.
              </p>
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={addingTechnician}>
                Hủy
              </Button>
            </DialogClose>
            <Button onClick={handleAddTechnician} disabled={addingTechnician}>
              {addingTechnician ? "Đang thêm..." : "Thêm kỹ thuật viên"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Technician Confirmation Dialog */}
      <AlertDialog open={deleteTechnicianDialogOpen} onOpenChange={setDeleteTechnicianDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bạn có chắc chắn muốn xóa kỹ thuật viên này?</AlertDialogTitle>
            <AlertDialogDescription>
              Kỹ thuật viên sẽ bị xóa khỏi trung tâm dịch vụ này. 
              Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRemoveTechnician} className="bg-red-600 hover:bg-red-700">
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ServiceCenterManagement;
