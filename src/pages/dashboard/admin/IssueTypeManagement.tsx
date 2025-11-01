import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { ArrowLeft, Pencil, Plus, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "react-toastify";
import {
  IssueType,
  IssueCategory,
  IssueSeverity,
  getIssueTypesApi,
  createIssueTypeApi,
  updateIssueTypeApi,
  deleteIssueTypeApi,
  CreateIssueTypePayload,
  UpdateIssueTypePayload,
} from "@/lib/issueTypeApi";
import { seedIssueTypes } from "@/utils/seedIssueTypes";

const CATEGORY_LABELS: Record<IssueCategory, string> = {
  battery: "Pin",
  motor: "Động cơ",
  charging: "Sạc điện",
  brake: "Phanh",
  cooling: "Làm mát",
  electrical: "Điện",
  software: "Phần mềm",
  mechanical: "Cơ khí",
  suspension: "Hệ thống treo",
  tire: "Lốp xe",
  other: "Khác",
};

const SEVERITY_LABELS: Record<IssueSeverity, string> = {
  minor: "Nhỏ",
  moderate: "Trung bình",
  major: "Lớn",
  critical: "Nghiêm trọng",
};

const SEVERITY_COLORS: Record<IssueSeverity, string> = {
  minor: "bg-blue-100 text-blue-800",
  moderate: "bg-yellow-100 text-yellow-800",
  major: "bg-orange-100 text-orange-800",
  critical: "bg-red-100 text-red-800",
};

const IssueTypeManagement = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [items, setItems] = useState<IssueType[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const filterRef = useRef({ category: "", severity: "" });

  // Dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [current, setCurrent] = useState<IssueType | null>(null);

  // Form states
  const [category, setCategory] = useState<IssueCategory>("battery");
  const [severity, setSeverity] = useState<IssueSeverity>("minor");

  const loadData = useCallback(
    async (override?: { page?: number; filters?: typeof filterRef.current }) => {
      setLoading(true);
      try {
        const p = override?.page ?? page;
        const filters = override?.filters ?? filterRef.current;
        const res = await getIssueTypesApi({
          page: p,
          limit,
          category: filters.category ? (filters.category as IssueCategory) : undefined,
          severity: filters.severity ? (filters.severity as IssueSeverity) : undefined,
        });
        if (res.ok && res.data?.data) {
          setItems(res.data.data.items);
          setTotalPages(res.data.data.pagination.total_pages || 1);
        } else {
          toast.error(res.message || "Không thể tải danh sách issue types");
        }
      } catch (e) {
        console.error(e);
        toast.error("Lỗi khi tải danh sách issue types");
      } finally {
        setLoading(false);
      }
    },
    [page, limit]
  );

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const resetForm = () => {
    setCategory("battery");
    setSeverity("minor");
  };

  const openCreate = () => {
    resetForm();
    setIsCreateOpen(true);
  };

  const openEdit = (item: IssueType) => {
    setCurrent(item);
    setCategory(item.category);
    setSeverity(item.severity);
    setIsEditOpen(true);
  };

  const openDelete = (item: IssueType) => {
    setCurrent(item);
    setIsDeleteOpen(true);
  };

  const onCreate = async () => {
    const payload: CreateIssueTypePayload = {
      category,
      severity,
    };
    try {
      setCreating(true);
      const res = await createIssueTypeApi(payload);
      if (res.ok) {
        toast.success("Đã tạo issue type thành công");
        setIsCreateOpen(false);
        resetForm();
        await loadData();
      } else {
        toast.error(res.message || "Không thể tạo issue type");
      }
    } catch (e) {
      console.error(e);
      toast.error("Lỗi khi tạo issue type");
    } finally {
      setCreating(false);
    }
  };

  const onUpdate = async () => {
    if (!current) return;
    const payload: UpdateIssueTypePayload = {
      category,
      severity,
    };
    try {
      setUpdating(true);
      const res = await updateIssueTypeApi(current._id, payload);
      if (res.ok) {
        toast.success("Đã cập nhật issue type");
        setIsEditOpen(false);
        resetForm();
        await loadData();
      } else {
        toast.error(res.message || "Không thể cập nhật issue type");
      }
    } catch (e) {
      console.error(e);
      toast.error("Lỗi khi cập nhật issue type");
    } finally {
      setUpdating(false);
    }
  };

  const onDelete = async () => {
    if (!current) return;
    try {
      setDeleting(true);
      const res = await deleteIssueTypeApi(current._id);
      if (res.ok) {
        toast.success("Đã xóa issue type");
        setIsDeleteOpen(false);
        await loadData();
      } else {
        toast.error(res.message || "Không thể xóa issue type");
      }
    } catch (e) {
      console.error(e);
      toast.error("Lỗi khi xóa issue type");
    } finally {
      setDeleting(false);
    }
  };

  const onFilter = async () => {
    filterRef.current = {
      category: categoryFilter === "all" ? "" : categoryFilter,
      severity: severityFilter === "all" ? "" : severityFilter,
    };
    setPage(1);
    await loadData({ page: 1, filters: filterRef.current });
  };

  const onSeedData = async () => {
    if (!confirm("Bạn có chắc muốn thêm 30+ issue types mẫu vào hệ thống?\n\nLưu ý: Các issue type trùng lặp sẽ bị bỏ qua.")) {
      return;
    }

    setSeeding(true);
    toast.info("Đang thêm data mẫu, vui lòng đợi...");
    
    try {
      const result = await seedIssueTypes();
      
      if (result.success > 0) {
        toast.success(
          `✅ Đã thêm ${result.success}/${result.total} issue types!\n` +
          (result.error > 0 ? `⚠️ ${result.error} lỗi (có thể do trùng lặp)` : "")
        );
        await loadData(); // Reload data
      } else {
        toast.error("Không thể thêm data mẫu. Có thể tất cả đã tồn tại.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Lỗi khi thêm data mẫu");
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate("/dashboard/admin")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại
          </Button>
          <h1 className="text-2xl font-bold">Quản lý Issue Types</h1>
        </div>
        <div className="flex gap-2">
          {items.length === 0 && (
            <Button variant="secondary" onClick={onSeedData} disabled={seeding}>
              {seeding ? "Đang thêm..." : "🌱 Thêm data mẫu"}
            </Button>
          )}
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" /> Thêm issue type mới
          </Button>
        </div>
      </div>

      <Card className="mb-4">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <Label htmlFor="categoryFilter">Danh mục</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tất cả" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="severityFilter">Mức độ nghiêm trọng</Label>
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tất cả" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  {Object.entries(SEVERITY_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={onFilter} variant="secondary" className="flex-1">
                Lọc
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách Issue Types</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Đang tải...</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Danh mục</TableHead>
                    <TableHead>Mức độ nghiêm trọng</TableHead>
                    <TableHead>Ngày tạo</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center">
                        Không có issue type nào
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((it) => (
                      <TableRow key={it._id}>
                        <TableCell className="font-medium">
                          {CATEGORY_LABELS[it.category]}
                        </TableCell>
                        <TableCell>
                          <Badge className={SEVERITY_COLORS[it.severity]}>
                            {SEVERITY_LABELS[it.severity]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {it.createdAt
                            ? new Date(it.createdAt).toLocaleDateString("vi-VN")
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
                        {`${(page - 1) * limit + 1}-${
                          (page - 1) * limit + items.length
                        }`}{" "}
                        của {items.length} kết quả
                      </span>
                    ) : (
                      <span>0 kết quả</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}>
                      {"<"}
                    </Button>
                    <span className="min-w-8 text-center">{page}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                      {">"}
                    </Button>
                    <Select
                      value={String(limit)}
                      onValueChange={(v) => {
                        setLimit(Number(v));
                        setPage(1);
                      }}>
                      <SelectTrigger className="w-[90px]">
                        <SelectValue />
                      </SelectTrigger>
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
            <DialogTitle>Thêm Issue Type</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="createCategory">Danh mục *</Label>
              <Select
                value={category}
                onValueChange={(v) => setCategory(v as IssueCategory)}>
                <SelectTrigger id="createCategory">
                  <SelectValue placeholder="Chọn danh mục" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="createSeverity">Mức độ nghiêm trọng *</Label>
              <Select
                value={severity}
                onValueChange={(v) => setSeverity(v as IssueSeverity)}>
                <SelectTrigger id="createSeverity">
                  <SelectValue placeholder="Chọn mức độ" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SEVERITY_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
            <DialogTitle>Chỉnh sửa Issue Type</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="editCategory">Danh mục *</Label>
              <Select
                value={category}
                onValueChange={(v) => setCategory(v as IssueCategory)}>
                <SelectTrigger id="editCategory">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="editSeverity">Mức độ nghiêm trọng *</Label>
              <Select
                value={severity}
                onValueChange={(v) => setSeverity(v as IssueSeverity)}>
                <SelectTrigger id="editSeverity">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SEVERITY_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
            Bạn có chắc muốn xóa issue type "
            {current ? CATEGORY_LABELS[current.category] : ""} -{" "}
            {current ? SEVERITY_LABELS[current.severity] : ""}"?
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

export default IssueTypeManagement;
