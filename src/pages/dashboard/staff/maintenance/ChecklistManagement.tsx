import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Eye,
  Trash2,
  Clock,
  CheckCircle,
  FileText,
  Wrench,
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
    const vehicleDetails = vehicle
      ? {
          brand: vehicle.brand || "-",
          model: vehicle.model || "-",
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

    return (
      <Card key={c._id} className="bg-gradient-card border-0 shadow-soft">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              {/* Checklist Header - Technician info */}
              <div className="flex items-center gap-2 mb-3 pb-3 border-b">
                <Wrench className="h-4 w-4 text-primary" />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">
                    Checklist gửi bởi
                  </p>
                  <p className="text-sm font-semibold text-primary">
                    {technicianName}
                  </p>
                  {(technicianEmail !== "-" || technicianPhone !== "-") && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {technicianEmail !== "-" && technicianEmail}
                      {technicianEmail !== "-" &&
                        technicianPhone !== "-" &&
                        " • "}
                      {technicianPhone !== "-" && technicianPhone}
                    </p>
                  )}
                </div>
                {checklistCreatedDate && (
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Ngày gửi</p>
                    <p className="text-xs font-medium">
                      {checklistCreatedDate}
                    </p>
                  </div>
                )}
              </div>

              {/* Issue Type */}
              <div className="mb-3">
                <h4 className="font-semibold text-lg">
                  {issueTypeText || "Vấn đề không xác định"}
                </h4>
                <p className="text-sm text-muted-foreground mt-1">
                  {issueDescription}
                </p>
              </div>

              {/* Solution Applied */}
              {solutionApplied && solutionApplied !== "Chưa cập nhật" && (
                <div className="mb-3">
                  <p className="text-sm text-muted-foreground">
                    Giải pháp áp dụng:
                  </p>
                  <p className="text-sm font-medium">{solutionApplied}</p>
                </div>
              )}

              {/* Parts */}
              {partsSummary.length > 0 && (
                <div className="mb-3 p-2 bg-muted/30 rounded-md">
                  <p className="text-xs text-muted-foreground mb-1">
                    Phụ tùng yêu cầu
                  </p>
                  <p className="text-sm font-medium">{partsSummary}</p>
                </div>
              )}

              {/* Appointment basic info */}
              <div className="mt-3 pt-3 border-t space-y-3">
                {/* Vehicle Information */}
                {vehicleDetails && (
                  <div className="p-2 bg-muted/20 rounded-md">
                    <p className="text-xs text-muted-foreground mb-1">
                      Thông tin xe
                    </p>
                    <p className="text-sm font-medium">
                      {vehicleDetails.brand} {vehicleDetails.model}
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mt-1">
                      <p>Biển số: {vehicleDetails.licensePlate}</p>
                      {vehicleDetails.year !== "-" && (
                        <p>Năm: {vehicleDetails.year}</p>
                      )}
                      {vehicleDetails.vin !== "-" && (
                        <p className="col-span-2">VIN: {vehicleDetails.vin}</p>
                      )}
                      {vehicleDetails.color !== "-" && (
                        <p>Màu: {vehicleDetails.color}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Customer Information */}
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Khách hàng
                  </p>
                  <p className="text-sm font-medium">{customerName}</p>
                  {(customerEmail !== "N/A" || customerPhone !== "N/A") && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {customerEmail !== "N/A" && customerEmail}
                      {customerEmail !== "N/A" &&
                        customerPhone !== "N/A" &&
                        " • "}
                      {customerPhone !== "N/A" && customerPhone}
                    </p>
                  )}
                </div>

                {/* Appointment Details */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Ngày hẹn</p>
                    <p className="font-medium">{appointmentDate || "-"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Giờ hẹn</p>
                    <p className="font-medium">{appointmentTime}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Trung tâm</p>
                    <p className="font-medium">{centerName}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button variant="outline" size="sm" onClick={() => handleView(c)}>
              <Eye className="h-4 w-4 mr-1" />
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-gradient-card border-0 shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10">
                <Clock className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Chờ duyệt</p>
                <p className="text-2xl font-bold">{pendingChecklists.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-0 shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/10">
                <Trash2 className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Đã từ chối</p>
                <p className="text-2xl font-bold">
                  {rejectedChecklists.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-0 shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10">
                <CheckCircle className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Đã duyệt</p>
                <p className="text-2xl font-bold">
                  {approvedChecklists.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-0 shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tổng số</p>
                <p className="text-2xl font-bold">{items.length}</p>
              </div>
            </div>
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
