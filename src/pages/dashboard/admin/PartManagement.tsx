import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Pencil, Plus, Trash2, Search, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
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
  PartItem,
  getPartsApi,
  createPartApi,
  updatePartApi,
  deletePartApi,
  CreatePartPayload,
  UpdatePartPayload,
} from "@/lib/partApi";

const PartManagement = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [items, setItems] = useState<PartItem[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const searchRef = useRef("");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc" | null>(null);

  // Dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [current, setCurrent] = useState<PartItem | null>(null);

  // Form states
  const [partNumber, setPartNumber] = useState("");
  const [partName, setPartName] = useState("");
  const [description, setDescription] = useState("");
  const [supplier, setSupplier] = useState("");
  const [warrantyMonth, setWarrantyMonth] = useState<string>("");

  const loadData = useCallback(async (override?: { page?: number; q?: string }) => {
    setLoading(true);
    try {
      const p = override?.page ?? page;
      const q = override?.q ?? searchRef.current;
      const res = await getPartsApi({ page: p, limit, search: q });
      if (res.ok && res.data?.data) {
        setItems(res.data.data.items);
        setTotalPages(res.data.data.pagination.total_pages || 1);
      } else {
        toast.error(res.message || "Không thể tải danh sách phụ tùng");
      }
    } catch (e) {
      console.error(e);
      toast.error("Lỗi khi tải danh sách phụ tùng");
    } finally {
      setLoading(false);
    }
  }, [page, limit]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const resetForm = () => {
    setPartNumber("");
    setPartName("");
    setDescription("");
    setSupplier("");
    setWarrantyMonth("");
  };

  const openCreate = () => {
    resetForm();
    setIsCreateOpen(true);
  };

  const openEdit = (item: PartItem) => {
    setCurrent(item);
    setPartNumber(item.part_number || "");
    setPartName(item.part_name || "");
    setDescription(item.description || "");
    setSupplier(item.supplier || "");
    setWarrantyMonth(
      typeof item.warranty_month === "number" ? String(item.warranty_month) : ""
    );
    setIsEditOpen(true);
  };

  const openDelete = (item: PartItem) => {
    setCurrent(item);
    setIsDeleteOpen(true);
  };

  const onCreate = async () => {
    if (!partName.trim()) {
      toast.error("Vui lòng nhập tên phụ tùng");
      return;
    }
    const payload: CreatePartPayload = {
      part_number: partNumber.trim() || undefined,
      part_name: partName.trim(),
      description: description.trim() || undefined,
      supplier: supplier.trim() || undefined,
      warranty_month: warrantyMonth ? Number(warrantyMonth) : undefined,
    };
    try {
      setCreating(true);
      const res = await createPartApi(payload);
      if (res.ok) {
        toast.success("Đã tạo phụ tùng thành công");
        setIsCreateOpen(false);
        resetForm();
        await loadData();
      } else {
        toast.error(res.message || "Không thể tạo phụ tùng");
      }
    } catch (e) {
      console.error(e);
      toast.error("Lỗi khi tạo phụ tùng");
    } finally {
      setCreating(false);
    }
  };

  const onUpdate = async () => {
    if (!current) return;
    if (!partName.trim()) {
      toast.error("Vui lòng nhập tên phụ tùng");
      return;
    }
    const payload: UpdatePartPayload = {
      part_number: partNumber.trim() || undefined,
      part_name: partName.trim() || undefined,
      description: description.trim() || undefined,
      supplier: supplier.trim() || undefined,
      warranty_month: warrantyMonth ? Number(warrantyMonth) : undefined,
    };
    try {
      setUpdating(true);
      const res = await updatePartApi(current._id, payload);
      if (res.ok) {
        toast.success("Đã cập nhật phụ tùng");
        setIsEditOpen(false);
        resetForm();
        await loadData();
      } else {
        toast.error(res.message || "Không thể cập nhật phụ tùng");
      }
    } catch (e) {
      console.error(e);
      toast.error("Lỗi khi cập nhật phụ tùng");
    } finally {
      setUpdating(false);
    }
  };

  const onDelete = async () => {
    if (!current) return;
    try {
      setDeleting(true);
      const res = await deletePartApi(current._id);
      if (res.ok) {
        toast.success("Đã xóa phụ tùng");
        setIsDeleteOpen(false);
        await loadData();
      } else {
        const baseMsg = res.message || "Không thể xóa phụ tùng";
        const conflictInfo = res.data?.data;
        if (conflictInfo?.inventory_id) {
          toast.error(`${baseMsg}. Đang được sử dụng trong kho (inventory: ${conflictInfo.inventory_id}).`);
        } else {
          toast.error(baseMsg);
        }
      }
    } catch (e) {
      console.error(e);
      toast.error("Lỗi khi xóa phụ tùng");
    } finally {
      setDeleting(false);
    }
  };

  const onSearch = async () => {
    searchRef.current = search;
    setPage(1);
    await loadData({ page: 1, q: search });
  };

  const toggleRowExpansion = (id: string) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else if (sortDirection === "desc") {
        setSortColumn(null);
        setSortDirection(null);
      }
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const getSortedItems = () => {
    if (!sortColumn || !sortDirection) return items;

    return [...items].sort((a, b) => {
      let aVal: string | number = "";
      let bVal: string | number = "";

      switch (sortColumn) {
        case "part_number":
          aVal = a.part_number || "";
          bVal = b.part_number || "";
          break;
        case "part_name":
          aVal = a.part_name || "";
          bVal = b.part_name || "";
          break;
        case "description":
          aVal = a.description || "";
          bVal = b.description || "";
          break;
        case "supplier":
          aVal = a.supplier || "";
          bVal = b.supplier || "";
          break;
        case "warranty_month":
          aVal = typeof a.warranty_month === "number" ? a.warranty_month : -1;
          bVal = typeof b.warranty_month === "number" ? b.warranty_month : -1;
          break;
        default:
          return 0;
      }

      if (typeof aVal === "string" && typeof bVal === "string") {
        const comparison = aVal.localeCompare(bVal, "vi");
        return sortDirection === "asc" ? comparison : -comparison;
      }

      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
      }

      return 0;
    });
  };

  const SortIcon = ({ column }: { column: string }) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="ml-2 h-4 w-4 inline opacity-50" />;
    }
    if (sortDirection === "asc") {
      return <ArrowUp className="ml-2 h-4 w-4 inline text-primary" />;
    }
    return <ArrowDown className="ml-2 h-4 w-4 inline text-primary" />;
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate("/dashboard/admin")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại
          </Button>
          <h1 className="text-2xl font-bold">Quản lý Phụ tùng</h1>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" /> Thêm phụ tùng mới
        </Button>
      </div>

      <Card className="mb-4">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
            <div className="flex-1">
              <Label htmlFor="search">Tìm kiếm</Label>
              <div className="flex gap-2">
                <Input
                  id="search"
                  placeholder="Theo tên, Mã phụ tùng, mô tả..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <Button onClick={onSearch} variant="secondary">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div>
              <Label htmlFor="limit">Mỗi trang</Label>
              <Input
                id="limit"
                type="number"
                min={1}
                value={limit}
                onChange={(e) => setLimit(Math.max(1, Number(e.target.value)))}
                className="w-28"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách phụ tùng</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Đang tải...</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead 
                      className="cursor-pointer select-none hover:bg-muted/50"
                      onClick={() => handleSort("part_number")}
                    >
                      Mã phụ tùng
                      <SortIcon column="part_number" />
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer select-none hover:bg-muted/50"
                      onClick={() => handleSort("part_name")}
                    >
                      Tên
                      <SortIcon column="part_name" />
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer select-none hover:bg-muted/50"
                      onClick={() => handleSort("description")}
                    >
                      Mô tả
                      <SortIcon column="description" />
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer select-none hover:bg-muted/50"
                      onClick={() => handleSort("supplier")}
                    >
                      Nhà cung cấp
                      <SortIcon column="supplier" />
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer select-none hover:bg-muted/50"
                      onClick={() => handleSort("warranty_month")}
                    >
                      Bảo hành (tháng)
                      <SortIcon column="warranty_month" />
                    </TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center">
                        Không có phụ tùng nào
                      </TableCell>
                    </TableRow>
                  ) : (
                    getSortedItems().map((it) => {
                      const isExpanded = expandedRows.has(it._id);
                      const hasDescription = it.description && it.description.length > 0;
                      return (
                      <TableRow key={it._id}>
                        <TableCell className="font-medium">{it.part_number || "-"}</TableCell>
                        <TableCell>{it.part_name}</TableCell>
                        <TableCell 
                          className={`max-w-[320px] ${!isExpanded ? "truncate" : ""} ${hasDescription ? "cursor-pointer hover:bg-muted/50 transition-colors" : ""}`}
                          onClick={() => hasDescription && toggleRowExpansion(it._id)}
                          title={hasDescription ? (isExpanded ? "Nhấn để thu gọn" : "Nhấn để xem đầy đủ") : ""}
                        >
                          {it.description || "-"}
                        </TableCell>
                        <TableCell>{it.supplier || "-"}</TableCell>
                        <TableCell>{typeof it.warranty_month === "number" ? it.warranty_month : "-"}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(it)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => openDelete(it)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                      );
                    })
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thêm phụ tùng</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="partName">Tên phụ tùng *</Label>
              <Input id="partName" value={partName} onChange={(e) => setPartName(e.target.value)} placeholder="Nhập tên phụ tùng" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="partNumber">Mã phụ tùng</Label>
              <Input id="partNumber" value={partNumber} onChange={(e) => setPartNumber(e.target.value)} placeholder="Nhập Mã phụ tùng" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supplier">Nhà cung cấp</Label>
              <Input id="supplier" value={supplier} onChange={(e) => setSupplier(e.target.value)} placeholder="Nhập nhà cung cấp" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="warranty">Bảo hành (tháng)</Label>
              <Input id="warranty" type="number" value={warrantyMonth} onChange={(e) => setWarrantyMonth(e.target.value)} placeholder="VD: 12" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Mô tả</Label>
              <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Mô tả..." />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Hủy</Button>
            </DialogClose>
            <Button onClick={onCreate} disabled={creating}>{creating ? "Đang tạo..." : "Tạo"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chỉnh sửa phụ tùng</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="editPartName">Tên phụ tùng *</Label>
              <Input id="editPartName" value={partName} onChange={(e) => setPartName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editPartNumber">Mã phụ tùng</Label>
              <Input id="editPartNumber" value={partNumber} onChange={(e) => setPartNumber(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editSupplier">Nhà cung cấp</Label>
              <Input id="editSupplier" value={supplier} onChange={(e) => setSupplier(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editWarranty">Bảo hành (tháng)</Label>
              <Input id="editWarranty" type="number" value={warrantyMonth} onChange={(e) => setWarrantyMonth(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editDescription">Mô tả</Label>
              <Textarea id="editDescription" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Hủy</Button>
            </DialogClose>
            <Button onClick={onUpdate} disabled={updating}>{updating ? "Đang cập nhật..." : "Cập nhật"}</Button>
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
            Bạn có chắc muốn xóa phụ tùng "{current?.part_name}"?
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Hủy</Button>
            </DialogClose>
            <Button variant="destructive" onClick={onDelete} disabled={deleting}>{deleting ? "Đang xóa..." : "Xóa"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PartManagement;
