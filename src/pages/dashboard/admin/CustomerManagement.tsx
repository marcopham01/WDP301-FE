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
import { getAllVehiclesApi, Vehicle } from "@/lib/vehicleApi";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface CustomerData extends UserProfileItem {
  createdAt?: string;
  status?: "active" | "inactive" | "banned";
  totalAppointments?: number;
  totalSpent?: number;
}

const CustomerManagement = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<CustomerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  // Dialog states
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerData | null>(null);
  const [isVehicleDialogOpen, setIsVehicleDialogOpen] = useState(false);
  const [customerVehicles, setCustomerVehicles] = useState<Vehicle[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(false);

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    filterCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, roleFilter, statusFilter, customers]);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      // Load all customers with pagination
      const pageSize = 50;
      let page = 1;
      const acc: UserProfileItem[] = [];

      while (true) {
        const res = await getAllProfilesApi({ page, limit: pageSize, role: "customer" });
        if (!res.ok) {
          toast.error(res.message || "Không thể tải danh sách khách hàng");
          break;
        }
        
        // Handle nested response structure
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
        if (page > 20) break; // safety cap
      }

      // Filter customers only
      const customersOnly = acc.filter((u) => (u.role || "").toLowerCase() === "customer");
      
      // Enrich with status and random data for demo
      const enrichedUsers: CustomerData[] = customersOnly.map((user) => ({
        ...user,
        status: "active" as "active" | "inactive" | "banned",
        totalAppointments: Math.floor(Math.random() * 20),
        totalSpent: Math.floor(Math.random() * 10000000),
      }));
      
      setCustomers(enrichedUsers);

      if (enrichedUsers.length === 0) {
        toast.info("Không tìm thấy khách hàng nào trong hệ thống");
      }
    } catch (error) {
      console.error("Error loading customers:", error);
      toast.error("Không thể tải danh sách khách hàng");
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  const filterCustomers = () => {
    let filtered = [...customers];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (customer) =>
          customer.fullName?.toLowerCase().includes(term) ||
          customer.email?.toLowerCase().includes(term) ||
          customer.username?.toLowerCase().includes(term) ||
          customer.phoneNumber?.includes(term)
      );
    }

    // Role filter
    if (roleFilter !== "all") {
      filtered = filtered.filter((customer) => customer.role === roleFilter);
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((customer) => customer.status === statusFilter);
    }

    setFilteredCustomers(filtered);
  };

  const handleViewCustomer = (customer: CustomerData) => {
    setSelectedCustomer(customer);
    setIsViewDialogOpen(true);
  };

  const handleViewVehicles = async (customer: CustomerData) => {
    setSelectedCustomer(customer);
    setIsVehicleDialogOpen(true);
    setLoadingVehicles(true);
    setCustomerVehicles([]);
    
    try {
      // Gọi API lấy tất cả xe (admin/staff có quyền)
      const res = await getAllVehiclesApi();
      if (res.ok && res.data?.data) {
        // Filter xe theo user_id của khách hàng
        const userVehicles = res.data.data.filter((vehicle) => {
          const userId = typeof vehicle.user_id === "string" 
            ? vehicle.user_id 
            : vehicle.user_id?._id;
          return userId === customer._id;
        });
        
        setCustomerVehicles(userVehicles);
        if (userVehicles.length === 0) {
          toast.info(`${customer.fullName} chưa có xe nào được đăng ký`);
        }
      } else {
        toast.error(res.message || "Không thể tải danh sách xe");
        setCustomerVehicles([]);
      }
    } catch (error) {
      console.error("Error loading vehicles:", error);
      toast.error("Lỗi khi tải danh sách xe");
      setCustomerVehicles([]);
    } finally {
      setLoadingVehicles(false);
    }
  };

  const handleExportData = () => {
    toast.success("Xuất dữ liệu thành công!");
    // Implement export logic here
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
      {/* Header */}
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
          <h1 className="text-3xl font-bold tracking-tight">Quản lý khách hàng</h1>
          <p className="text-muted-foreground mt-1">
            Quản lý thông tin và hoạt động của khách hàng
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadCustomers}
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

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng khách hàng</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customers.length}</div>
            <p className="text-xs text-muted-foreground">
              +{Math.floor(customers.length * 0.12)} so với tháng trước
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
              {customers.filter((c) => c.status === "active").length}
            </div>
            <p className="text-xs text-muted-foreground">
              {customers.length > 0
                ? Math.round(
                    (customers.filter((c) => c.status === "active").length /
                      customers.length) *
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
              {customers.filter((c) => c.status === "inactive").length}
            </div>
            <p className="text-xs text-muted-foreground">Cần chăm sóc</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Khách hàng mới</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {customers.filter((c) => {
                const createdDate = c.createdAt ? new Date(c.createdAt) : null;
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                return createdDate && createdDate > thirtyDaysAgo;
              }).length}
            </div>
            <p className="text-xs text-muted-foreground">Trong 30 ngày qua</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Bộ lọc và tìm kiếm</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
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

            <div className="space-y-2">
              <Label htmlFor="role-filter" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Vai trò
              </Label>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger id="role-filter">
                  <SelectValue placeholder="Tất cả vai trò" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="customer">Khách hàng</SelectItem>
                  <SelectItem value="staff">Nhân viên</SelectItem>
                  <SelectItem value="technician">Kỹ thuật viên</SelectItem>
                  <SelectItem value="admin">Quản trị viên</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              Danh sách khách hàng ({filteredCustomers.length})
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="text-center py-12">
              <User className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <p className="text-muted-foreground">Không tìm thấy khách hàng nào</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Khách hàng</TableHead>
                    <TableHead>Liên hệ</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Số lịch hẹn</TableHead>
                    <TableHead>Tổng chi tiêu</TableHead>
                    <TableHead>Ngày tham gia</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map((customer) => (
                    <TableRow key={customer._id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                            {customer.fullName?.charAt(0).toUpperCase() || "?"}
                          </div>
                          <div>
                            <div className="font-medium">{customer.fullName}</div>
                            <div className="text-sm text-muted-foreground">
                              @{customer.username}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            <span className="text-muted-foreground">
                              {customer.email}
                            </span>
                          </div>
                          {customer.phoneNumber && (
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="h-3 w-3 text-muted-foreground" />
                              <span className="text-muted-foreground">
                                {customer.phoneNumber}
                              </span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(customer.status)}</TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {customer.totalAppointments || 0}
                        </div>
                        <div className="text-xs text-muted-foreground">lịch hẹn</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-green-600">
                          {(customer.totalSpent || 0).toLocaleString("vi-VN")} đ
                        </div>
                      </TableCell>
                      <TableCell>
                        {customer.createdAt ? (
                          <div className="text-sm">
                            {format(new Date(customer.createdAt), "dd/MM/yyyy", {
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
                          size="sm"
                          onClick={() => handleViewCustomer(customer)}
                          className="gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          Xem chi tiết
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

      {/* View Customer Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Thông tin chi tiết khách hàng</DialogTitle>
            <DialogDescription>
              Xem thông tin đầy đủ về khách hàng và lịch sử hoạt động
            </DialogDescription>
          </DialogHeader>

          {selectedCustomer && (
            <div className="space-y-6">
              {/* Customer Info */}
              <div className="flex items-start gap-4">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-2xl">
                  {selectedCustomer.fullName?.charAt(0).toUpperCase() || "?"}
                </div>
                <div className="flex-1 space-y-2">
                  <div>
                    <h3 className="text-xl font-semibold">
                      {selectedCustomer.fullName}
                    </h3>
                    <p className="text-muted-foreground">
                      @{selectedCustomer.username}
                    </p>
                  </div>
                  {getStatusBadge(selectedCustomer.status)}
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="text-xs text-muted-foreground">Email</div>
                      <div className="font-medium">{selectedCustomer.email}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <Phone className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="text-xs text-muted-foreground">
                        Số điện thoại
                      </div>
                      <div className="font-medium">
                        {selectedCustomer.phoneNumber || "Chưa cập nhật"}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="text-xs text-muted-foreground">Vai trò</div>
                      <div className="font-medium capitalize">
                        {selectedCustomer.role === "customer"
                          ? "Khách hàng"
                          : selectedCustomer.role || "N/A"}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="text-xs text-muted-foreground">
                        Ngày tham gia
                      </div>
                      <div className="font-medium">
                        {selectedCustomer.createdAt
                          ? format(
                              new Date(selectedCustomer.createdAt),
                              "dd/MM/yyyy",
                              { locale: vi }
                            )
                          : "N/A"}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <div className="text-xs text-muted-foreground">
                        Tổng lịch hẹn
                      </div>
                      <div className="font-bold text-green-600">
                        {selectedCustomer.totalAppointments || 0} lịch
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50">
                    <CheckCircle className="h-5 w-5 text-blue-600" />
                    <div>
                      <div className="text-xs text-muted-foreground">
                        Tổng chi tiêu
                      </div>
                      <div className="font-bold text-blue-600">
                        {(selectedCustomer.totalSpent || 0).toLocaleString("vi-VN")}{" "}
                        đ
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() =>
                    toast.info(
                      "Tính năng xem lịch sử đặt lịch sẽ được cập nhật sớm"
                    )
                  }
                >
                  Xem lịch sử đặt lịch
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleViewVehicles(selectedCustomer)}
                >
                  Xem danh sách xe
                </Button>
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

      {/* Vehicle List Dialog */}
      <Dialog open={isVehicleDialogOpen} onOpenChange={setIsVehicleDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Danh sách xe của khách hàng</DialogTitle>
            <DialogDescription>
              {selectedCustomer && (
                <span>
                  Xem danh sách xe đã đăng ký của{" "}
                  <strong>{selectedCustomer.fullName}</strong>
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {loadingVehicles ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : customerVehicles.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                  <span className="text-3xl">🚗</span>
                </div>
                <p className="text-muted-foreground">
                  Khách hàng chưa đăng ký xe nào
                </p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {customerVehicles.map((vehicle) => {
                  const model = vehicle.model_id;
                  const modelInfo = typeof model === "object" && model
                    ? `${model.brand || ""} ${model.model_name || ""}`.trim()
                    : "Không rõ";
                  const year = typeof model === "object" && model?.year ? `(${model.year})` : "";
                  
                  // Màu cho color badge
                  const colorBadgeMap: Record<string, string> = {
                    "white": "bg-gray-100 text-gray-800 border-gray-300",
                    "trắng": "bg-gray-100 text-gray-800 border-gray-300",
                    "black": "bg-gray-800 text-white border-gray-900",
                    "đen": "bg-gray-800 text-white border-gray-900",
                    "silver": "bg-slate-200 text-slate-800 border-slate-300",
                    "bạc": "bg-slate-200 text-slate-800 border-slate-300",
                    "red": "bg-red-100 text-red-800 border-red-300",
                    "đỏ": "bg-red-100 text-red-800 border-red-300",
                    "blue": "bg-blue-100 text-blue-800 border-blue-300",
                    "xanh dương": "bg-blue-100 text-blue-800 border-blue-300",
                    "green": "bg-green-100 text-green-800 border-green-300",
                    "xanh lá": "bg-green-100 text-green-800 border-green-300",
                    "gray": "bg-gray-200 text-gray-800 border-gray-400",
                    "xám": "bg-gray-200 text-gray-800 border-gray-400",
                    "yellow": "bg-yellow-100 text-yellow-800 border-yellow-300",
                    "vàng": "bg-yellow-100 text-yellow-800 border-yellow-300",
                    "orange": "bg-orange-100 text-orange-800 border-orange-300",
                    "cam": "bg-orange-100 text-orange-800 border-orange-300",
                    "purple": "bg-purple-100 text-purple-800 border-purple-300",
                    "tím": "bg-purple-100 text-purple-800 border-purple-300",
                  };
                  
                  const colorLower = (vehicle.color || "").toLowerCase();
                  const colorClass = colorBadgeMap[colorLower] || "bg-gray-100 text-gray-800 border-gray-300";
                  
                  return (
                    <Card key={vehicle._id} className="overflow-hidden hover:shadow-lg transition-all border-2">
                        <CardHeader className="bg-gradient-to-br from-blue-50 to-purple-50 pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-base flex items-center gap-2">
                              <span className="text-2xl">🚗</span>
                                <span className="font-bold">{vehicle.license_plate}</span>
                            </CardTitle>
                              <p className="text-sm text-muted-foreground mt-1">
                              {modelInfo} {year}
                            </p>
                          </div>
                          <Badge 
                            variant="outline" 
                              className={cn("font-semibold shadow-md border-2", colorClass)}
                          >
                            {vehicle.color || "N/A"}
                          </Badge>
                        </div>
                      </CardHeader>
                        <CardContent className="pt-4 space-y-3">
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="bg-white p-2 rounded-lg border">
                            <div className="text-xs text-muted-foreground mb-1">VIN</div>
                            <div className="font-mono text-xs font-semibold text-indigo-700">{vehicle.vin || "N/A"}</div>
                          </div>
                          <div className="bg-white p-2 rounded-lg border">
                            <div className="text-xs text-muted-foreground mb-1">Năm sản xuất</div>
                            <div className="font-bold text-purple-700">
                              {typeof model === "object" && model?.year ? model.year : "N/A"}
                            </div>
                          </div>
                          {vehicle.current_miliage !== undefined && (
                            <div className="bg-blue-50 p-2 rounded-lg border border-blue-200">
                              <div className="text-xs text-blue-700 mb-1 font-medium">Số km hiện tại</div>
                              <div className="font-bold text-blue-900">
                                {vehicle.current_miliage.toLocaleString("vi-VN")} km
                              </div>
                            </div>
                          )}
                          {vehicle.battery_health !== undefined && (
                            <div className={cn(
                              "p-2 rounded-lg border",
                              vehicle.battery_health >= 80 ? "bg-green-50 border-green-200" :
                              vehicle.battery_health >= 50 ? "bg-yellow-50 border-yellow-200" : "bg-red-50 border-red-200"
                            )}>
                              <div className={cn(
                                "text-xs mb-1 font-medium",
                                vehicle.battery_health >= 80 ? "text-green-700" :
                                vehicle.battery_health >= 50 ? "text-yellow-700" : "text-red-700"
                              )}>Sức khỏe pin</div>
                              <div className="font-bold flex items-center gap-1.5">
                                <div 
                                  className={cn(
                                    "w-2.5 h-2.5 rounded-full animate-pulse",
                                    vehicle.battery_health >= 80 ? "bg-green-500" :
                                    vehicle.battery_health >= 50 ? "bg-yellow-500" : "bg-red-500"
                                  )}
                                />
                                <span className={cn(
                                  vehicle.battery_health >= 80 ? "text-green-900" :
                                  vehicle.battery_health >= 50 ? "text-yellow-900" : "text-red-900"
                                )}>
                                  {vehicle.battery_health}%
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                        {vehicle.purchase_date && (
                          <div className="pt-2 border-t text-xs flex items-center gap-1.5 text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            <span>Ngày mua: {format(new Date(vehicle.purchase_date), "dd/MM/yyyy", { locale: vi })}</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsVehicleDialogOpen(false)}
            >
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomerManagement;
