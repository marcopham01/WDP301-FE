import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Eye,
  Trash2,
  Clock,
  CheckCircle,
  FileText,
  Wrench,
  User,
  Bike,
  DollarSign,
  Hash,
} from "lucide-react";
import { getChecklistsApi, Checklist } from "@/lib/checklistApi";
import { Appointment } from "@/lib/appointmentApi";

function formatDate(date?: string) {
  if (!date) return "";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export default function ChecklistManagement() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Checklist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getChecklistsApi({ limit: 50 });
      if (res.ok && res.data?.success) {
        const payload = res.data.data as
          | { items?: Checklist[]; checklists?: Checklist[] }
          | Checklist[];
        const normalized = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.items)
          ? payload?.items
          : Array.isArray((payload as { checklists?: Checklist[] })?.checklists)
          ? (payload as { checklists?: Checklist[] }).checklists
          : [];
        setItems(normalized as Checklist[]);
      } else {
        setError(res.message || "Không thể tải danh sách checklist");
      }
    } catch {
      setError("Có lỗi khi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleView = (c: Checklist) => {
    navigate(`/dashboard/staff/maintenance/${c._id}`);
  };

  const renderCard = (c: Checklist) => {
    const appointmentData =
      typeof c.appointment_id === "object"
        ? (c.appointment_id as Partial<Appointment> & {
            service_type_id?: {
              service_name?: string;
              description?: string;
              base_price?: number;
            };
            center_id?: { center_name?: string; name?: string };
            appoinment_date?: string;
            appoinment_time?: string;
            user_id?:
              | string
              | {
                  _id?: string;
                  fullName?: string;
                  username?: string;
                  email?: string;
                  phone?: string;
                };
            vehicle_id?:
              | string
              | {
                  _id?: string;
                  license_plate?: string;
                  brand?: string;
                  model?: string;
                  model_id?:
                    | string
                    | {
                        brand?: string;
                        model_name?: string;
                      };
                  year?: number;
                  vin?: string;
                  color?: string;
                };
            technician_id?:
              | string
              | {
                  _id?: string;
                  fullName?: string;
                  username?: string;
                  email?: string;
                  phone?: string;
                };
          })
        : undefined;

    // Checklist information
    const issueTypeText = issueTypeIdToText(
      (
        c as {
          issue_type_id?:
            | string
            | { _id?: string; category?: string; severity?: string };
        }
      ).issue_type_id
    );
    const issueDescription = (() => {
      const raw = c.issue_description as unknown;
      if (typeof raw === "string" && raw.trim()) return raw;
      return issueTypeText || "Không có mô tả";
    })();
    const solutionApplied = c.solution_applied || "Chưa cập nhật";
    const partsSummary = formatPartSummary(c.parts);

    // Technician information (người gửi checklist)
    const technicianRaw = appointmentData?.technician_id;
    const technician =
      typeof technicianRaw === "object" ? technicianRaw : undefined;
    const technicianName =
      technician?.fullName || technician?.username || "Không xác định";
    const technicianEmail = technician?.email || "-";
    const technicianPhone = technician?.phone || "-";

    // User/Customer information
    const userRaw = appointmentData?.user_id;
    const user = typeof userRaw === "object" ? userRaw : undefined;
    const customerName = user?.fullName || user?.username || "N/A";
    const customerEmail = user?.email || "N/A";
    const customerPhone = user?.phone || "N/A";

    // Vehicle information
    const vehicleRaw = appointmentData?.vehicle_id;
    const vehicle = typeof vehicleRaw === "object" ? vehicleRaw : undefined;
    const modelData =
      vehicle && typeof vehicle.model_id === "object"
        ? (vehicle.model_id as { brand?: string; model_name?: string })
        : undefined;
    const vehicleDetails = vehicle
      ? {
          brand: modelData?.brand || vehicle.brand || "-",
          model: modelData?.model_name || vehicle.model || "-",
          licensePlate: vehicle.license_plate || "-",
          year: vehicle.year || "-",
          vin: vehicle.vin || "-",
          color: vehicle.color || "-",
        }
      : null;

    // Checklist metadata
    const checklistCreatedDate = c.createdAt ? formatDate(c.createdAt) : null;

    // Appointment information (basic)
    const appointmentDate = formatDate(appointmentData?.appoinment_date);
    const appointmentTime = appointmentData?.appoinment_time || "-";
    const centerName =
      appointmentData?.center_id?.center_name ||
      appointmentData?.center_id?.name ||
      "-";

    // Get short ID (last 4 characters)
    const shortId = c._id ? c._id.slice(-4).toUpperCase() : "N/A";

    // Get status badge info
    const getStatusBadge = (status?: string) => {
      switch (status) {
        case "pending":
        case "check_in":
          return {
            text: "Chờ duyệt",
            variant: "default" as const,
            className: "bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100",
          };
        case "accepted":
        case "approved":
          return {
            text: "Đã duyệt",
            variant: "default" as const,
            className: "bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100",
          };
        case "in_progress":
          return {
            text: "Đang xử lý",
            variant: "default" as const,
            className: "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100",
          };
        case "canceled":
        case "rejected":
          return {
            text: "Đã từ chối",
            variant: "destructive" as const,
            className: "bg-red-100 text-red-800 border-red-200 hover:bg-red-100",
          };
        default:
          return {
            text: status || "N/A",
            variant: "secondary" as const,
            className: "",
          };
      }
    };

    const statusBadge = getStatusBadge(c.status);

    // Format total cost
    const totalCost = (c as { total_cost?: number }).total_cost;
    const formattedCost = totalCost
      ? totalCost.toLocaleString("vi-VN") + " VNĐ"
      : "Chưa có";

    return (
      <Card
        key={c._id}
        className="bg-card border-2 rounded-xl shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden">
        {/* Header with ID and Status */}
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-primary/10 px-3 py-1.5 rounded-lg border border-primary/20">
                <Hash className="h-4 w-4 text-primary" />
                <span className="font-bold text-lg text-primary font-mono">
                  {shortId}
                </span>
              </div>
              <Badge
                variant={statusBadge.variant}
                className={`text-xs px-2.5 py-1 font-semibold border ${statusBadge.className || ""}`}>
                {statusBadge.text}
              </Badge>
            </div>
            {checklistCreatedDate && (
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Ngày gửi</p>
                <p className="text-sm font-semibold">{checklistCreatedDate}</p>
              </div>
            )}
          </div>
        </div>

        <CardContent className="p-6">
          {/* Key Information Grid - Most Important Info */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {/* Technician */}
            <div className="flex items-start gap-3 p-3 bg-muted/40 rounded-lg border">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Wrench className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground mb-1">
                  Kỹ thuật viên
                </p>
                <p className="text-sm font-semibold text-foreground truncate">
                  {technicianName}
                </p>
                {technicianEmail !== "-" && (
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {technicianEmail}
                  </p>
                )}
              </div>
            </div>

            {/* Customer */}
            <div className="flex items-start gap-3 p-3 bg-muted/40 rounded-lg border">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <User className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground mb-1">Khách hàng</p>
                <p className="text-sm font-semibold text-foreground truncate">
                  {customerName}
                </p>
                {customerEmail !== "N/A" && (
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {customerEmail}
                  </p>
                )}
              </div>
            </div>

            {/* Vehicle Information */}
            {vehicleDetails && (
              <div className="flex items-start gap-3 p-3 bg-muted/40 rounded-lg border">
                <div className="p-2 bg-emerald-500/10 rounded-lg">
                  <Bike className="h-4 w-4 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground mb-1">Phương tiện</p>
                  {(vehicleDetails.brand !== "-" || vehicleDetails.model !== "-") && (
                    <p className="text-sm font-semibold text-foreground">
                      {[
                        vehicleDetails.brand !== "-" ? vehicleDetails.brand : null,
                        vehicleDetails.model !== "-" ? vehicleDetails.model : null,
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    </p>
                  )}
                  {vehicleDetails.licensePlate !== "-" && (
                    <p className="text-sm font-bold text-foreground mt-1">
                      {vehicleDetails.licensePlate}
                    </p>
                  )}
                  {vehicleDetails.color !== "-" && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Màu: {vehicleDetails.color}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Total Cost */}
            <div className="flex items-start gap-3 p-3 bg-muted/40 rounded-lg border">
              <div className="p-2 bg-amber-500/10 rounded-lg">
                <DollarSign className="h-4 w-4 text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground mb-1">
                  Tổng chi phí
                </p>
                <p className="text-sm font-bold text-foreground">
                  {formattedCost}
                </p>
              </div>
            </div>
          </div>

          {/* Issue Type - Prominent */}
          <div className="mb-4 p-4 bg-primary/5 rounded-lg border-l-4 border-primary">
            <p className="text-xs text-muted-foreground mb-1">Loại vấn đề</p>
            <h4 className="font-bold text-lg text-foreground">
              {issueTypeText || "Vấn đề không xác định"}
            </h4>
            {issueDescription && issueDescription !== issueTypeText && (
              <p className="text-sm text-muted-foreground mt-1.5">
                {issueDescription}
              </p>
            )}
          </div>

          {/* Solution and Parts - Compact */}
          <div className="space-y-2 mb-4">
            {solutionApplied && solutionApplied !== "Chưa cập nhật" && (
              <div className="flex items-start gap-2 text-sm">
                <span className="text-muted-foreground min-w-[120px]">
                  Giải pháp:
                </span>
                <span className="font-medium">{solutionApplied}</span>
              </div>
            )}

            {partsSummary.length > 0 && (
              <div className="flex items-start gap-2 text-sm">
                <span className="text-muted-foreground min-w-[120px]">
                  Phụ tùng:
                </span>
                <span className="font-medium">{partsSummary}</span>
              </div>
            )}
          </div>

          {/* Additional Info - Compact Grid */}
          <div className="pt-4 border-t space-y-2">
            <div className="grid grid-cols-3 gap-3 text-xs">
              {appointmentDate && (
                <div>
                  <p className="text-muted-foreground">Ngày hẹn</p>
                  <p className="font-medium">{appointmentDate}</p>
                </div>
              )}
              {appointmentTime !== "-" && (
                <div>
                  <p className="text-muted-foreground">Giờ hẹn</p>
                  <p className="font-medium">{appointmentTime}</p>
                </div>
              )}
              {centerName !== "-" && (
                <div>
                  <p className="text-muted-foreground">Trung tâm</p>
                  <p className="font-medium truncate">{centerName}</p>
                </div>
              )}
            </div>
          </div>

          {/* Action Button */}
          <div className="flex gap-2 mt-6 pt-4 border-t">
            <Button
              variant="default"
              size="sm"
              onClick={() => handleView(c)}
              className="flex-1">
              <Eye className="h-4 w-4 mr-2" />
              Xem chi tiết
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Phân loại checklists theo status
  const pendingChecklists = items.filter(
    (c) => c.status === "pending" || c.status === "check_in"
  );
  const rejectedChecklists = items.filter(
    (c) => c.status === "canceled" || c.status === "rejected"
  );
  const approvedChecklists = items.filter(
    (c) =>
      c.status === "approved" ||
      c.status === "accepted" ||
      c.status === "in_progress"
  );

  if (loading) {
    return (
      <main className="flex-1 p-6 bg-background">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">Quản lý bảo dưỡng</h2>
          <p className="text-muted-foreground">
            Quản lý và duyệt các checklist từ kỹ thuật viên
          </p>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Đang tải dữ liệu...</p>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex-1 p-6 bg-background">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">Quản lý bảo dưỡng</h2>
          <p className="text-muted-foreground">
            Quản lý và duyệt các checklist từ kỹ thuật viên
          </p>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={load}>Thử lại</Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 p-6 bg-background">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Quản lý bảo dưỡng</h2>
        <p className="text-muted-foreground">
          Quản lý và duyệt các checklist từ kỹ thuật viên
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chờ duyệt</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingChecklists.length}</div>
            <p className="text-xs text-muted-foreground">Đang chờ xử lý</p>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Đã từ chối</CardTitle>
            <Trash2 className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {rejectedChecklists.length}
            </div>
            <p className="text-xs text-muted-foreground">Cần xem xét lại</p>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Đã duyệt</CardTitle>
            <CheckCircle className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {approvedChecklists.length}
            </div>
            <p className="text-xs text-muted-foreground">Đã hoàn tất</p>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng số</CardTitle>
            <FileText className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{items.length}</div>
            <p className="text-xs text-muted-foreground">
              Tổng checklist nhận được
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:grid-cols-3">
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Chờ duyệt
          </TabsTrigger>
          <TabsTrigger value="rejected" className="flex items-center gap-2">
            <Trash2 className="h-4 w-4" />
            Đã từ chối
          </TabsTrigger>
          <TabsTrigger value="approved" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Đã duyệt
          </TabsTrigger>
        </TabsList>

        {/* Pending Checklists */}
        <TabsContent value="pending" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              Chờ duyệt ({pendingChecklists.length})
            </h3>
          </div>

          <div className="grid gap-4">
            {pendingChecklists.length > 0 ? (
              pendingChecklists.map((c) => renderCard(c))
            ) : (
              <Card className="bg-gradient-card border-0 shadow-soft">
                <CardContent className="p-6 text-sm text-muted-foreground">
                  Hiện chưa có checklist nào chờ duyệt.
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Rejected Checklists */}
        <TabsContent value="rejected" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              Đã từ chối ({rejectedChecklists.length})
            </h3>
          </div>

          <div className="grid gap-4">
            {rejectedChecklists.length > 0 ? (
              rejectedChecklists.map((c) => renderCard(c))
            ) : (
              <Card className="bg-gradient-card border-0 shadow-soft">
                <CardContent className="p-6 text-sm text-muted-foreground">
                  Hiện chưa có checklist nào bị từ chối.
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Approved Checklists */}
        <TabsContent value="approved" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              Đã duyệt ({approvedChecklists.length})
            </h3>
          </div>

          <div className="grid gap-4">
            {approvedChecklists.length > 0 ? (
              approvedChecklists.map((c) => renderCard(c))
            ) : (
              <Card className="bg-gradient-card border-0 shadow-soft">
                <CardContent className="p-6 text-sm text-muted-foreground">
                  Hiện chưa có checklist nào đã duyệt.
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </main>
  );
}

function issueTypeIdToText(
  issueTypeId?: string | { _id?: string; category?: string; severity?: string }
) {
  if (!issueTypeId) return "";
  if (typeof issueTypeId === "string") return issueTypeId;
  const pieces = [];
  if (issueTypeId.category) pieces.push(issueTypeId.category);
  if (issueTypeId.severity) pieces.push(issueTypeId.severity);
  if (pieces.length) return pieces.join(" • ");
  return issueTypeId._id ?? "";
}

function formatPartSummary(
  parts?: Array<{ part_id?: unknown; quantity?: number }>
): string {
  if (!Array.isArray(parts) || parts.length === 0) return "";
  return parts
    .map((p) => {
      if (!p) return null;
      if (typeof p.part_id === "string") {
        return `${p.part_id} × ${p.quantity || 0}`;
      }
      const partObj = p.part_id as {
        part_name?: string;
        part_number?: string;
        _id?: string;
      };
      const label =
        partObj?.part_name ||
        partObj?.part_number ||
        partObj?._id ||
        "Phụ tùng";
      return `${label} × ${p.quantity || 0}`;
    })
    .filter(Boolean)
    .join(", ");
}
