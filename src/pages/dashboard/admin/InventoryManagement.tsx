import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Pencil, Plus, Trash2, Search, AlertTriangle } from "lucide-react";
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
  InventoryItem,
  CenterInfo,
  PartInfo,
  getInventoryApi,
  createInventoryApi,
  updateInventoryApi,
  deleteInventoryApi,
  CreateInventoryPayload,
  UpdateInventoryPayload,
} from "@/lib/inventoryApi";
import { getPartsApi, PartItem } from "@/lib/partApi";
import { getServiceCentersApi, ServiceCenter } from "@/lib/serviceCenterApi";

const InventoryManagement = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [partNameFilter, setPartNameFilter] = useState("");
  const [centerFilter, setCenterFilter] = useState("all");
  const [lowStockFilter, setLowStockFilter] = useState(false);
  const filterRef = useRef({ partName: "", centerId: "", lowStock: false });

  // Dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [current, setCurrent] = useState<InventoryItem | null>(null);

  // Form states
  const [quantityAvailable, setQuantityAvailable] = useState<string>("");
  const [minimumStock, setMinimumStock] = useState<string>("");
  const [costPerUnit, setCostPerUnit] = useState<string>("");
  const [selectedPartId, setSelectedPartId] = useState<string>("");
  const [selectedCenterId, setSelectedCenterId] = useState<string>("");

  // Loading states
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Dropdown data
  const [parts, setParts] = useState<PartItem[]>([]);
  const [centers, setCenters] = useState<ServiceCenter[]>([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(false);

  const loadData = useCallback(
    async (override?: { page?: number; filters?: typeof filterRef.current }) => {
      setLoading(true);
      try {
        const p = override?.page ?? page;
        const filters = override?.filters ?? filterRef.current;
        const res = await getInventoryApi({
          page: p,
          limit,
          part_name: filters.partName,
          center_id: filters.centerId,
          low_stock: filters.lowStock,
        });
        if (res.ok && res.data?.data) {
          console.log("Inventory API Response:", res.data.data.items);
          setItems(res.data.data.items);
          setTotalPages(res.data.data.pagination.total_pages || 1);
        } else {
          toast.error(res.message || "Không thể tải danh sách inventory");
        }
      } catch (e) {
        console.error(e);
        toast.error("Lỗi khi tải danh sách inventory");
      } finally {
        setLoading(false);
      }
    },
    [page, limit]
  );

  useEffect(() => {
    void loadData();
    void loadDropdowns();
  }, [loadData]);

  const loadDropdowns = async () => {
    setLoadingDropdowns(true);
    try {
      const [partsRes, centersRes] = await Promise.all([
        getPartsApi({ page: 1, limit: 1000 }),
        getServiceCentersApi(),
      ]);

      if (partsRes.ok && partsRes.data?.data) {
        setParts(partsRes.data.data.items);
      }
      if (centersRes.ok && centersRes.data?.data) {
        setCenters(centersRes.data.data);
      }
    } catch (e) {
      console.error(e);
      toast.error("Không thể tải danh sách parts/centers");
    } finally {
      setLoadingDropdowns(false);
    }
  };

  const resetForm = () => {
    setQuantityAvailable("");
    setMinimumStock("");
    setCostPerUnit("");
    setSelectedPartId("");
    setSelectedCenterId("");
  };

  const openCreate = () => {
    resetForm();
    void loadDropdowns();
    setIsCreateOpen(true);
  };

  const openEdit = (item: InventoryItem) => {
    setCurrent(item);
    setQuantityAvailable(String(item.quantity_avaiable));
    setMinimumStock(
      typeof item.minimum_stock === "number" ? String(item.minimum_stock) : ""
    );
    setCostPerUnit(
      typeof item.cost_per_unit === "number" ? String(item.cost_per_unit) : ""
    );
    // Don't allow changing part/center in edit
    setIsEditOpen(true);
  };

  const openDelete = (item: InventoryItem) => {
    setCurrent(item);
    setIsDeleteOpen(true);
  };

  const onCreate = async () => {
    if (!selectedPartId || !selectedCenterId || !quantityAvailable) {
      toast.error("Vui lòng nhập đầy đủ thông tin bắt buộc");
      return;
    }
    const payload: CreateInventoryPayload = {
      part_id: selectedPartId,
      center_id: selectedCenterId,
      quantity_avaiable: Number(quantityAvailable),
      minimum_stock: minimumStock ? Number(minimumStock) : undefined,
      cost_per_unit: costPerUnit ? Number(costPerUnit) : undefined,
    };
    try {
      setCreating(true);
      const res = await createInventoryApi(payload);
      if (res.ok) {
        toast.success("Đã tạo inventory thành công");
        setIsCreateOpen(false);
        resetForm();
        await loadData();
      } else {
        toast.error(res.message || "Không thể tạo inventory");
      }
    } catch (e) {
      console.error(e);
      toast.error("Lỗi khi tạo inventory");
    } finally {
      setCreating(false);
    }
  };

  const onUpdate = async () => {
    if (!current) return;
    if (!quantityAvailable) {
      toast.error("Vui lòng nhập số lượng tồn kho");
      return;
    }
    const payload: UpdateInventoryPayload = {
      quantity_avaiable: Number(quantityAvailable),
      minimum_stock: minimumStock ? Number(minimumStock) : undefined,
      cost_per_unit: costPerUnit ? Number(costPerUnit) : undefined,
    };
    try {
      setUpdating(true);
      const res = await updateInventoryApi(current._id, payload);
      if (res.ok) {
        toast.success("Đã cập nhật inventory");
        setIsEditOpen(false);
        resetForm();
        await loadData();
      } else {
        toast.error(res.message || "Không thể cập nhật inventory");
      }
    } catch (e) {
      console.error(e);
      toast.error("Lỗi khi cập nhật inventory");
    } finally {
      setUpdating(false);
    }
  };

  const onDelete = async () => {
    if (!current) return;
    try {
      setDeleting(true);
      const res = await deleteInventoryApi(current._id);
      if (res.ok) {
        toast.success("Đã xóa inventory");
        setIsDeleteOpen(false);
        await loadData();
      } else {
        const baseMsg = res.message || "Không thể xóa inventory";
        const conflictInfo = res.data?.data;
        if (conflictInfo?.appointment_id) {
          toast.error(
            `${baseMsg}. Center đang được sử dụng trong appointments (appointment: ${conflictInfo.appointment_id}).`
          );
        } else {
          toast.error(baseMsg);
        }
      }
    } catch (e) {
      console.error(e);
      toast.error("Lỗi khi xóa inventory");
    } finally {
      setDeleting(false);
    }
  };

  const onFilter = async () => {
    filterRef.current = {
      partName: partNameFilter,
      centerId: centerFilter === "all" ? "" : centerFilter,
      lowStock: lowStockFilter,
    };
    setPage(1);
    await loadData({ page: 1, filters: filterRef.current });
  };

  const getPartName = (item: InventoryItem): string => {
    // Case 1: populated object
    if (typeof item.part_id === "object" && item.part_id) {
      const part = item.part_id as PartInfo;
      return part.part_name || part.name || part.description || part.part_number || "N/A";
    }
    // Case 2: only ID string -> resolve from preloaded parts list
    if (typeof item.part_id === "string") {
      const p = parts.find((x) => x._id === item.part_id);
      return p?.part_name || p?.description || p?.part_number || "N/A";
    }
    return "N/A";
  };

  const getPartNumber = (item: InventoryItem): string => {
    if (typeof item.part_id === "object" && item.part_id) {
      return (item.part_id as PartInfo).part_number || "-";
    }
    if (typeof item.part_id === "string") {
      const p = parts.find((x) => x._id === item.part_id);
      return p?.part_number || "-";
    }
    return "-";
  };

  const getCenterName = (item: InventoryItem): string => {
    if (typeof item.center_id === "object" && item.center_id) {
      const center = item.center_id as CenterInfo;
      return center.center_name || center.name || center.address || "N/A";
    }
    if (typeof item.center_id === "string") {
      const c = centers.find((x) => x._id === item.center_id);
      return c?.center_name || c?.address || "N/A";
    }
    return "N/A";
  };

  const isLowStock = (item: InventoryItem): boolean => {
    if (typeof item.minimum_stock === "number") {
      return item.quantity_avaiable <= item.minimum_stock;
    }
    return false;
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate("/dashboard/admin")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại
          </Button>
          <h1 className="text-2xl font-bold">Quản lý Inventory</h1>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" /> Thêm inventory mới
        </Button>
      </div>

      <Card className="mb-4">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <Label htmlFor="partNameFilter">Tên phụ tùng</Label>
              <Input
                id="partNameFilter"
                placeholder="Tìm theo tên part..."
                value={partNameFilter}
                onChange={(e) => setPartNameFilter(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="centerFilter">Trung tâm</Label>
              <Select value={centerFilter} onValueChange={setCenterFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tất cả" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  {centers.map((c) => (
                    <SelectItem key={c._id} value={c._id}>
                      {c.center_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={onFilter} variant="secondary" className="flex-1">
                <Search className="mr-2 h-4 w-4" /> Lọc
              </Button>
              <div>
                <Label htmlFor="limit">Mỗi trang</Label>
                <Input
                  id="limit"
                  type="number"
                  min={1}
                  value={limit}
                  onChange={(e) => setLimit(Math.max(1, Number(e.target.value)))}
                  className="w-20"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>Danh sách Inventory</CardTitle>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="lowStockFilter"
              checked={lowStockFilter}
              onChange={(e) => setLowStockFilter(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="lowStockFilter" className="cursor-pointer">Chỉ hiện tồn kho thấp</Label>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Đang tải...</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Phụ tùng</TableHead>
                    <TableHead>Số part</TableHead>
                    <TableHead>Trung tâm</TableHead>
                    <TableHead>Tồn kho</TableHead>
                    <TableHead>Tồn tối thiểu</TableHead>
                    <TableHead>Giá/đơn vị</TableHead>
                    <TableHead>Nhập kho lần cuối</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center">
                        Không có inventory nào
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((it) => (
                      <TableRow key={it._id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {isLowStock(it) && (
                              <AlertTriangle className="h-4 w-4 text-red-500" />
                            )}
                            {getPartName(it)}
                          </div>
                        </TableCell>
                        <TableCell>{getPartNumber(it)}</TableCell>
                        <TableCell>{getCenterName(it)}</TableCell>
                        <TableCell>
                          <span
                            className={
                              isLowStock(it) ? "text-red-600 font-semibold" : ""
                            }>
                            {it.quantity_avaiable}
                          </span>
                        </TableCell>
                        <TableCell>
                          {typeof it.minimum_stock === "number"
                            ? it.minimum_stock
                            : "-"}
                        </TableCell>
                        <TableCell>
                          {typeof it.part_id.sellPrice === "number"
                            ? `${it.part_id.sellPrice.toLocaleString("vi-VN")} VNĐ`
                            : "-"}
                        </TableCell>
                        <TableCell>
                          {it.last_restocked
                            ? new Date(it.last_restocked).toLocaleDateString(
                                "vi-VN"
                              )
                            : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEdit(it)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDelete(it)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              {/* Pagination */}
              {items.length > 0 && (
                <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
                  <div>
                    {items.length > 0 ? (
                      <span>
                        {`${(page - 1) * limit + 1}-${(page - 1) * limit + items.length}`} của {items.length} kết quả
                      </span>
                    ) : (
                      <span>0 kết quả</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>{"<"}</Button>
                    <span className="min-w-8 text-center">{page}</span>
                    <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>{">"}</Button>
                    <Select value={String(limit)} onValueChange={(v)=> { setLimit(Number(v)); setPage(1); }}>
                      <SelectTrigger className="w-[90px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5 / page</SelectItem>
                        <SelectItem value="10">10 / page</SelectItem>
                        <SelectItem value="20">20 / page</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Thêm inventory</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label htmlFor="createPartId">Phụ tùng *</Label>
              <Select
                value={selectedPartId}
                onValueChange={setSelectedPartId}
                disabled={loadingDropdowns}>
                <SelectTrigger id="createPartId">
                  <SelectValue placeholder="Chọn phụ tùng" />
                </SelectTrigger>
                <SelectContent>
                  {parts.map((p) => (
                    <SelectItem key={p._id} value={p._id}>
                      {p.part_name} {p.part_number ? `(${p.part_number})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="createCenterId">Trung tâm *</Label>
              <Select
                value={selectedCenterId}
                onValueChange={setSelectedCenterId}
                disabled={loadingDropdowns}>
                <SelectTrigger id="createCenterId">
                  <SelectValue placeholder="Chọn trung tâm" />
                </SelectTrigger>
                <SelectContent>
                  {centers.map((c) => (
                    <SelectItem key={c._id} value={c._id}>
                      {c.center_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantityAvailable">Số lượng tồn kho *</Label>
              <Input
                id="quantityAvailable"
                type="number"
                value={quantityAvailable}
                onChange={(e) => setQuantityAvailable(e.target.value)}
                placeholder="VD: 100"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="minimumStock">Tồn kho tối thiểu</Label>
              <Input
                id="minimumStock"
                type="number"
                value={minimumStock}
                onChange={(e) => setMinimumStock(e.target.value)}
                placeholder="VD: 10"
              />
            </div>
            {/* <div className="space-y-2">
              <Label htmlFor="costPerUnit">Giá mỗi đơn vị (VNĐ)</Label>
              <Input
                id="costPerUnit"
                type="number"
                value={costPerUnit}
                onChange={(e) => setCostPerUnit(e.target.value)}
                placeholder="VD: 50000"
              />
            </div> */}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Hủy</Button>
            </DialogClose>
            <Button onClick={onCreate} disabled={creating}>
              {creating ? "Đang tạo..." : "Tạo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chỉnh sửa inventory</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Phụ tùng</Label>
              <div className="text-sm text-muted-foreground">
                {current ? getPartName(current) : "N/A"}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Trung tâm</Label>
              <div className="text-sm text-muted-foreground">
                {current ? getCenterName(current) : "N/A"}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="editQuantityAvailable">Số lượng tồn kho *</Label>
              <Input
                id="editQuantityAvailable"
                type="number"
                value={quantityAvailable}
                onChange={(e) => setQuantityAvailable(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editMinimumStock">Tồn kho tối thiểu</Label>
              <Input
                id="editMinimumStock"
                type="number"
                value={minimumStock}
                onChange={(e) => setMinimumStock(e.target.value)}
              />
            </div>
            {/* <div className="space-y-2">
              <Label htmlFor="editCostPerUnit">Giá mỗi đơn vị (VNĐ)</Label>
              <Input
                id="editCostPerUnit"
                type="number"
                value={costPerUnit}
                onChange={(e) => setCostPerUnit(e.target.value)}
              />
            </div> */}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Hủy</Button>
            </DialogClose>
            <Button onClick={onUpdate} disabled={updating}>
              {updating ? "Đang cập nhật..." : "Cập nhật"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            Bạn có chắc muốn xóa inventory "{current ? getPartName(current) : ""}"
            tại "{current ? getCenterName(current) : ""}"?
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Hủy</Button>
            </DialogClose>
            <Button variant="destructive" onClick={onDelete} disabled={deleting}>
              {deleting ? "Đang xóa..." : "Xóa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InventoryManagement;
