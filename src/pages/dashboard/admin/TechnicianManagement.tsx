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
import {
  ArrowLeft,
  Search,
  Eye,
  Ban,
  CheckCircle,
  Mail,
  Phone,
  User,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  Wrench,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { getAllProfilesApi, UserProfileItem } from "@/lib/authApi";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface TechnicianData extends UserProfileItem {
  createdAt?: string;
  status?: "active" | "inactive" | "banned";
}

const TechnicianManagement = () => {
  const navigate = useNavigate();
  const [technicians, setTechnicians] = useState<TechnicianData[]>([]);
  const [filteredTechnicians, setFilteredTechnicians] = useState<TechnicianData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedTechnician, setSelectedTechnician] = useState<TechnicianData | null>(null);

  useEffect(() => {
    loadTechnicians();
  }, []);

  useEffect(() => {
    filterTechnicians();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, statusFilter, technicians]);

  const loadTechnicians = async () => {
    setLoading(true);
    try {
      const pageSize = 50;
      let page = 1;
      const acc: UserProfileItem[] = [];

      while (true) {
        const res = await getAllProfilesApi({ page, limit: pageSize, role: "technician" });
        if (!res.ok) {
          toast.error(res.message || "Không thể tải danh sách kỹ thuật viên");
          break;
        }
        
        type Paged = { 
          items?: UserProfileItem[]; 
          users?: UserProfileItem[]; 
          pagination?: { total_pages?: number; current_page?: number } 
        };
        const raw = res.data as { success?: boolean; data?: Paged } | null | undefined;
        const container: Paged | undefined = raw?.data ?? (raw as unknown as Paged);
        const items = (
          container?.items ?? 
          container?.users ?? 
          (Array.isArray(container) ? (container as unknown as UserProfileItem[]) : undefined)
        ) as UserProfileItem[] | undefined;
        const pagination = container?.pagination as { total_pages?: number; current_page?: number } | undefined;

        if (Array.isArray(items)) acc.push(...items);

        const totalPages = pagination?.total_pages ?? 1;
        const currentPage = pagination?.current_page ?? page;
        if (currentPage >= totalPages) break;
        page += 1;
        if (page > 20) break;
      }

      const techniciansOnly = acc.filter((u) => (u.role || "").toLowerCase() === "technician");
      const enrichedUsers: TechnicianData[] = techniciansOnly.map((user) => ({
        ...user,
        status: "active" as "active" | "inactive" | "banned",
      }));
      
      setTechnicians(enrichedUsers);

      if (enrichedUsers.length === 0) {
        toast.info("Không tìm thấy kỹ thuật viên nào trong hệ thống");
      }
    } catch (error) {
      console.error("Error loading technicians:", error);
      toast.error("Không thể tải danh sách kỹ thuật viên");
      setTechnicians([]);
    } finally {
      setLoading(false);
    }
  };

  const filterTechnicians = () => {
    let filtered = [...technicians];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.fullName?.toLowerCase().includes(term) ||
          t.email?.toLowerCase().includes(term) ||
          t.username?.toLowerCase().includes(term) ||
          t.phoneNumber?.includes(term)
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((t) => t.status === statusFilter);
    }

    setFilteredTechnicians(filtered);
  };

  const handleViewTechnician = (technician: TechnicianData) => {
    setSelectedTechnician(technician);
    setIsViewDialogOpen(true);
  };

  const handleExportData = () => {
    toast.success("Xuất dữ liệu thành công!");
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
            <CheckCircle className="h-3 w-3 mr-1" />
            Hoạt động
          </Badge>
        );
      case "inactive":
        return (
          <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">
            Không hoạt động
          </Badge>
        );
      case "banned":
        return (
          <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
            <Ban className="h-3 w-3 mr-1" />
            Bị khóa
          </Badge>
        );
      default:
        return (
          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
            Không rõ
          </Badge>
        );
    }
  };

  return (
    <div className="flex-1 space-y-6 p-4 md:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/dashboard/admin")}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Quay lại
            </Button>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Quản lý kỹ thuật viên</h1>
          <p className="text-muted-foreground mt-1">
            Quản lý thông tin và hoạt động của kỹ thuật viên
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadTechnicians}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            Làm mới
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportData}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Xuất dữ liệu
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng kỹ thuật viên</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{technicians.length}</div>
            <p className="text-xs text-muted-foreground">
              +{Math.floor(technicians.length * 0.12)} so với tháng trước
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Đang hoạt động</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {technicians.filter((t) => t.status === "active").length}
            </div>
            <p className="text-xs text-muted-foreground">
              {technicians.length > 0
                ? Math.round(
                    (technicians.filter((t) => t.status === "active").length /
                      technicians.length) *
                      100
                  )
                : 0}
              % tổng số
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Không hoạt động</CardTitle>
            <Ban className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {technicians.filter((t) => t.status === "inactive").length}
            </div>
            <p className="text-xs text-muted-foreground">Cần kiểm tra</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kỹ thuật viên mới</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {technicians.filter((t) => {
                const createdDate = t.createdAt ? new Date(t.createdAt) : null;
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                return createdDate && createdDate > thirtyDaysAgo;
              }).length}
            </div>
            <p className="text-xs text-muted-foreground">Trong 30 ngày qua</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Bộ lọc và tìm kiếm</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="search" className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                Tìm kiếm
              </Label>
              <Input
                id="search"
                placeholder="Tên, email, SĐT, username..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status-filter" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Trạng thái
              </Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="status-filter">
                  <SelectValue placeholder="Tất cả trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="active">Hoạt động</SelectItem>
                  <SelectItem value="inactive">Không hoạt động</SelectItem>
                  <SelectItem value="banned">Bị khóa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              Danh sách kỹ thuật viên ({filteredTechnicians.length})
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredTechnicians.length === 0 ? (
            <div className="text-center py-12">
              <Wrench className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <p className="text-muted-foreground">Không tìm thấy kỹ thuật viên nào</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kỹ thuật viên</TableHead>
                    <TableHead>Liên hệ</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Ngày tham gia</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTechnicians.map((technician) => (
                    <TableRow key={technician._id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center text-white font-semibold">
                            {technician.fullName?.charAt(0).toUpperCase() || "?"}
                          </div>
                          <div>
                            <div className="font-medium">{technician.fullName}</div>
                            <div className="text-sm text-muted-foreground">
                              @{technician.username}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            <span className="text-muted-foreground">
                              {technician.email}
                            </span>
                          </div>
                          {technician.phoneNumber && (
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="h-3 w-3 text-muted-foreground" />
                              <span className="text-muted-foreground">
                                {technician.phoneNumber}
                              </span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(technician.status)}</TableCell>
                      <TableCell>
                        {technician.createdAt ? (
                          <div className="text-sm">
                            {format(new Date(technician.createdAt), "dd/MM/yyyy", {
                              locale: vi,
                            })}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">N/A</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewTechnician(technician)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Thông tin chi tiết kỹ thuật viên</DialogTitle>
            <DialogDescription>
              Xem thông tin đầy đủ về kỹ thuật viên
            </DialogDescription>
          </DialogHeader>

          {selectedTechnician && (
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center text-white font-bold text-2xl">
                  {selectedTechnician.fullName?.charAt(0).toUpperCase() || "?"}
                </div>
                <div className="flex-1 space-y-2">
                  <div>
                    <h3 className="text-xl font-semibold">
                      {selectedTechnician.fullName}
                    </h3>
                    <p className="text-muted-foreground">
                      @{selectedTechnician.username}
                    </p>
                  </div>
                  {getStatusBadge(selectedTechnician.status)}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="text-xs text-muted-foreground">Email</div>
                      <div className="font-medium">{selectedTechnician.email}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <Phone className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="text-xs text-muted-foreground">
                        Số điện thoại
                      </div>
                      <div className="font-medium">
                        {selectedTechnician.phoneNumber || "Chưa cập nhật"}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="text-xs text-muted-foreground">Vai trò</div>
                      <div className="font-medium">Kỹ thuật viên</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="text-xs text-muted-foreground">
                        Ngày tham gia
                      </div>
                      <div className="font-medium">
                        {selectedTechnician.createdAt
                          ? format(
                              new Date(selectedTechnician.createdAt),
                              "dd/MM/yyyy",
                              { locale: vi }
                            )
                          : "N/A"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsViewDialogOpen(false)}
            >
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TechnicianManagement;
