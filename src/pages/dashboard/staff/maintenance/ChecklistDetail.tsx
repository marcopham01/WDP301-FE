import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Calendar,
  Clock,
  DollarSign,
  Wrench,
  User,
  Car,
  MapPin,
  Package,
  Search,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  Warehouse,
  Hash,
  Mail,
  Phone,
  Building2,
} from "lucide-react";
import {
  Checklist,
  IssueType,
  PartItem,
  getInventoryApi,
  InventoryItem,
  getChecklistsApi,
  getIssueTypeByIdApi,
  getPartByIdApi,
  acceptChecklistApi,
  cancelChecklistApi,
} from "@/lib/checklistApi";
import { Appointment, getAppointmentByIdApi } from "@/lib/appointmentApi";
import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

type IssueTypeRef =
  | string
  | {
      _id?: string;
      category?: string;
      severity?: string;
    };

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

function formatIssueTypeLabel(
  resolved?: IssueType | null,
  reference?: IssueTypeRef
): string {
  if (resolved) {
    const pieces = [resolved.category, resolved.severity].filter(
      (value): value is string => Boolean(value && value.trim())
    );
    if (pieces.length) return pieces.join(" • ");
    if (resolved._id) return resolved._id;
  }
  if (!reference) return "";
  if (typeof reference === "string") return reference;
  const pieces = [reference.category, reference.severity].filter(
    (value): value is string => Boolean(value && value.trim())
  );
  if (pieces.length) return pieces.join(" • ");
  return reference._id ?? "";
}

const ChecklistDetail = () => {
  const { checklistId } = useParams<{ checklistId: string }>();
  const navigate = useNavigate();
  const [checklist, setChecklist] = useState<Checklist | null>(null);
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [issueType, setIssueType] = useState<IssueType | null>(null);
  const [parts, setParts] = useState<
    Array<{ id: string; quantity: number; detail?: PartItem }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectError, setRejectError] = useState<string | null>(null);
  const [submittingReject, setSubmittingReject] = useState(false);
  const [unitCostMap, setUnitCostMap] = useState<Record<string, number>>({});
  const [inventoryCheck, setInventoryCheck] = useState<
    Record<
      string,
      {
        available: number;
        required: number;
        sufficient: boolean;
        checking: boolean;
        inventoryId?: string;
        inventoryItem?: InventoryItem;
      }
    >
  >({});
  const [checkingInventory, setCheckingInventory] = useState(false);

  // Compute derived data (must be before early returns)
  const appointmentData =
    checklist &&
    (appointment ||
      (typeof checklist.appointment_id === "object"
        ? (checklist.appointment_id as Appointment)
        : undefined));

  const center = appointmentData?.center_id as
    | {
        center_name?: string;
        name?: string;
        address?: string;
        phone?: string;
        _id?: string;
      }
    | undefined;

  const partsDetailList = useMemo(() => {
    if (!checklist) return [];
    if (parts && parts.length) return parts;
    if (Array.isArray(checklist.parts)) {
      return checklist.parts.map((p) => ({
        id:
          typeof p.part_id === "string"
            ? p.part_id
            : (p.part_id as { _id?: string })?._id || "",
        quantity: p.quantity,
        detail:
          typeof p.part_id === "object" ? (p.part_id as PartItem) : undefined,
      }));
    }
    return [] as Array<{ id: string; quantity: number; detail?: PartItem }>;
  }, [parts, checklist]);

  useEffect(() => {
    if (!checklist || !partsDetailList.length) return;
    const fetchCosts = async () => {
      const centerId = center?._id;
      const uniqueParts = Array.from(
        new Set(partsDetailList.map((p) => p.id).filter(Boolean))
      );
      const updates: Record<string, number> = {};
      await Promise.all(
        uniqueParts.map(async (pid) => {
          const partName = partsDetailList.find((p) => p.id === pid)?.detail
            ?.part_name;
          if (!partName) return;
          const res = await getInventoryApi({
            center_id: centerId,
            part_name: partName,
            limit: 50,
          });
          if (res.ok && res.data?.success) {
            const items = (res.data.data.items || []) as InventoryItem[];
            // Ưu tiên đúng part_id nếu có
            const matched =
              items.find(
                (it) => (it.part_id as unknown as { _id?: string })?._id === pid
              ) || items[0];
            if (matched?.cost_per_unit !== undefined) {
              updates[pid] = matched.cost_per_unit as number;
            }
          }
        })
      );
      if (Object.keys(updates).length)
        setUnitCostMap((prev) => ({ ...prev, ...updates }));
    };
    fetchCosts();
  }, [partsDetailList, center?._id, checklist]);

  const totalPartsCost = useMemo(() => {
    if (!checklist) return 0;
    return partsDetailList.reduce((sum, p) => {
      const unit = unitCostMap[p.id] || 0;
      return sum + unit * (p.quantity || 0);
    }, 0);
  }, [partsDetailList, unitCostMap, checklist]);

  // Check if all parts have sufficient inventory
  const allPartsSufficient = useMemo(() => {
    if (!partsDetailList.length) return true;
    if (Object.keys(inventoryCheck).length === 0) return false; // Not checked yet
    // Check if all parts have been checked and are sufficient
    const allChecked = partsDetailList.every((p) => {
      const check = inventoryCheck[p.id];
      return check && !check.checking; // All checks completed
    });
    if (!allChecked) return false; // Still checking
    return partsDetailList.every((p) => {
      const check = inventoryCheck[p.id];
      return check && check.sufficient;
    });
  }, [partsDetailList, inventoryCheck]);

  // Function to check inventory for all parts
  const handleCheckInventory = async () => {
    if (!center?._id || !partsDetailList.length) {
      alert(
        "Không thể kiểm tra tồn kho: thiếu thông tin trung tâm hoặc phụ tùng"
      );
      return;
    }

    try {
      setCheckingInventory(true);
      const results: Record<
        string,
        {
          available: number;
          required: number;
          sufficient: boolean;
          checking: boolean;
          inventoryId?: string;
          inventoryItem?: InventoryItem;
        }
      > = {};

      // Initialize all parts as checking
      partsDetailList.forEach((p) => {
        results[p.id] = {
          available: 0,
          required: p.quantity || 0,
          sufficient: false,
          checking: true,
          inventoryId: undefined,
          inventoryItem: undefined,
        };
      });
      setInventoryCheck(results);

      const checkPromises = partsDetailList.map(async (item) => {
        const partName = item.detail?.part_name;
        const partId = item.id;

        if (!partName || !center?._id) {
          return {
            id: partId,
            result: {
              available: 0,
              required: item.quantity || 0,
              sufficient: false,
              checking: false,
              inventoryId: undefined,
              inventoryItem: undefined,
            },
          };
        }

        try {
          const res = await getInventoryApi({
            center_id: center._id,
            part_name: partName,
            limit: 50,
          });

          if (!res.ok || !res.data?.success) {
            return {
              id: partId,
              result: {
                available: 0,
                required: item.quantity || 0,
                sufficient: false,
                checking: false,
                inventoryId: undefined,
                inventoryItem: undefined,
              },
            };
          }

          const items = (res.data.data?.items || []) as InventoryItem[];

          console.log("🔍 Checking inventory:", {
            partId,
            partName,
            itemsCount: items.length,
            items: items.map((it) => ({
              inventoryId: it._id,
              partId:
                typeof it.part_id === "string"
                  ? it.part_id
                  : (it.part_id as { _id?: string })?._id,
              partIdType: typeof it.part_id,
              partIdValue: it.part_id,
            })),
          });

          const matched = items.find((it) => {
            const invPartId =
              typeof it.part_id === "string"
                ? it.part_id
                : (it.part_id as { _id?: string })?._id;
            return invPartId === partId;
          });

          if (matched) {
            const matchedWithTypo = matched as InventoryItem & {
              quantity_avaiable?: number;
            };
            const available =
              matchedWithTypo.quantity_available ??
              matchedWithTypo.quantity_avaiable ??
              0;
            const required = item.quantity || 0;

            return {
              id: partId,
              result: {
                available,
                required,
                sufficient: available >= required,
                checking: false,
                inventoryId: matched._id,
                inventoryItem: matched,
              },
            };
          }

          return {
            id: partId,
            result: {
              available: 0,
              required: item.quantity || 0,
              sufficient: false,
              checking: false,
              inventoryId: undefined,
              inventoryItem: undefined,
            },
          };
        } catch {
          return {
            id: partId,
            result: {
              available: 0,
              required: item.quantity || 0,
              sufficient: false,
              checking: false,
              inventoryId: undefined,
              inventoryItem: undefined,
            },
          };
        }
      });

      const checkResults = await Promise.all(checkPromises);

      // Update results with all check results
      checkResults.forEach(({ id, result }) => {
        results[id] = result;
      });

      // Update state with all results at once
      setInventoryCheck({ ...results });
    } catch (err) {
      alert("Có lỗi xảy ra khi kiểm tra tồn kho");
      console.error("Error checking inventory:", err);
    } finally {
      setCheckingInventory(false);
    }
  };

  // Fetch checklist data
  useEffect(() => {
    const fetchChecklistDetail = async () => {
      if (!checklistId) return;

      try {
        setLoading(true);
        setError(null);

        // Fetch checklist
        const checklistRes = await getChecklistsApi({ limit: 200 });
        if (!checklistRes.ok || !checklistRes.data?.success) {
          setError(checklistRes.message || "Không thể tải checklist");
          setLoading(false);
          return;
        }

        const payload = checklistRes.data.data as
          | { items?: Checklist[]; checklists?: Checklist[] }
          | Checklist[];
        const normalized = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.items)
          ? payload?.items
          : Array.isArray((payload as { checklists?: Checklist[] })?.checklists)
          ? (payload as { checklists?: Checklist[] }).checklists
          : [];

        const foundChecklist = (normalized as Checklist[]).find(
          (c) => c._id === checklistId
        );

        if (!foundChecklist) {
          setError("Không tìm thấy checklist");
          setLoading(false);
          return;
        }

        setChecklist(foundChecklist);

        // Fetch related data
        const apptId =
          typeof foundChecklist.appointment_id === "string"
            ? foundChecklist.appointment_id
            : (
                foundChecklist as unknown as {
                  appointment_id?: { _id?: string };
                }
              ).appointment_id?._id;

        const issueTypeField = (
          foundChecklist as unknown as {
            issue_type_id?: string | { _id?: string };
          }
        ).issue_type_id;
        const issueTypeId =
          typeof issueTypeField === "string"
            ? issueTypeField
            : (issueTypeField as { _id?: string })?._id;

        const partsWithQuantity = Array.isArray(foundChecklist.parts)
          ? foundChecklist.parts.map((p) => ({
              raw: p,
              id:
                typeof p.part_id === "string"
                  ? p.part_id
                  : (p.part_id as unknown as { _id?: string })?._id || "",
            }))
          : [];
        const partIds = partsWithQuantity.map((p) => p.id).filter((id) => id);

        const [apptResRaw, issueResRaw, partRes] = await Promise.all([
          apptId ? getAppointmentByIdApi(apptId) : Promise.resolve(null),
          issueTypeId
            ? getIssueTypeByIdApi(issueTypeId)
            : Promise.resolve(null),
          Promise.all(partIds.map((id) => getPartByIdApi(id))),
        ]);

        const apptRes: { ok: boolean; data: { data: Appointment } } | null =
          (apptResRaw as { ok: boolean; data: { data: Appointment } } | null) ||
          null;
        const issueRes: { ok: boolean; data: { data: IssueType } } | null =
          (issueResRaw as { ok: boolean; data: { data: IssueType } } | null) ||
          null;

        setAppointment(apptRes && apptRes.ok ? apptRes.data.data : null);
        setIssueType(issueRes && issueRes.ok ? issueRes.data.data : null);
        setParts(
          Array.isArray(partRes) && partsWithQuantity
            ? partsWithQuantity.map((p, i) => ({
                id: p.id,
                quantity: p.raw.quantity,
                detail: partRes[i]?.ok ? partRes[i].data.data : undefined,
              }))
            : []
        );
      } catch (err) {
        setError("Có lỗi xảy ra khi tải dữ liệu");
        console.error("Error fetching checklist detail:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchChecklistDetail();
  }, [checklistId]);

  if (!checklist) {
    if (loading) {
      return (
        <main className="flex-1 p-6 bg-background">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/dashboard/staff/maintenance")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại
            </Button>
            <h2 className="text-2xl font-bold">Chi tiết checklist</h2>
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
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/dashboard/staff/maintenance")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại
            </Button>
            <h2 className="text-2xl font-bold">Chi tiết checklist</h2>
          </div>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-destructive mb-4">{error}</p>
              <Button onClick={() => navigate("/dashboard/staff/maintenance")}>
                Quay về trang chủ
              </Button>
            </div>
          </div>
        </main>
      );
    }

    return null;
  }

  const serviceType = appointmentData?.service_type_id as
    | {
        service_name?: string;
        description?: string;
        base_price?: number;
        estimated_duration?: string;
      }
    | undefined;
  const customer = appointmentData?.user_id as
    | { fullName?: string; email?: string; phone?: string; username?: string }
    | undefined;
  const vehicle = appointmentData?.vehicle_id as
    | {
        brand?: string;
        model?: string;
        model_name?: string;
        model_id?:
          | string
          | {
              brand?: string;
              model_name?: string;
            };
        license_plate?: string;
        vin?: string;
        color?: string;
        year?: number;
      }
    | undefined;

  const issueTypeReference = (checklist as { issue_type_id?: IssueTypeRef })
    .issue_type_id;
  const issueTypeLabel = formatIssueTypeLabel(issueType, issueTypeReference);
  const issueDescriptionText =
    typeof checklist.issue_description === "string" &&
    checklist.issue_description.trim()
      ? checklist.issue_description
      : issueTypeLabel || "Không có mô tả";

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "assigned":
      case "pending":
        return "bg-warning text-white";
      case "check_in":
      case "in_progress":
      case "working":
        return "bg-primary text-white";
      case "repaired":
      case "completed":
      case "done":
      case "accepted":
      case "approved":
        return "bg-success text-white";
      case "delay":
        return "bg-orange-500 text-white";
      case "canceled":
      case "rejected":
        return "bg-destructive text-white";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getStatusText = (status?: string) => {
    switch (status) {
      case "assigned":
        return "Đã giao";
      case "pending":
        return "Chờ xử lý";
      case "check_in":
        return "Đã nhận xe";
      case "in_progress":
      case "working":
        return "Đang thực hiện";
      case "repaired":
        return "Đã sửa xong";
      case "completed":
      case "done":
        return "Hoàn thành";
      case "accepted":
      case "approved":
        return "Đã duyệt";
      case "delay":
        return "Trì hoãn";
      case "canceled":
      case "rejected":
        return "Đã hủy";
      default:
        return status || "Chờ xử lý";
    }
  };

  return (
    <main className="flex-1 p-6 bg-background">
      {/* Header với nút back */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate("/dashboard/staff/maintenance")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Quay lại
        </Button>
        <div>
          <h2 className="text-2xl font-bold">Chi tiết checklist</h2>
          <p className="text-muted-foreground">
            Thông tin chi tiết về checklist được gửi
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content - left side */}
        <div className="lg:col-span-2 space-y-6">
          {/* Appointment Information */}
          <Card className="bg-gradient-card border-2 border-border shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Thông tin Appointment
                </h3>
                <Badge
                  className={`${getStatusColor(
                    appointmentData?.status || checklist.status
                  )} px-3 py-1.5 text-sm font-semibold`}>
                  {getStatusText(appointmentData?.status || checklist.status)}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3 p-3 bg-primary/5 rounded-lg border border-primary/10">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      Ngày hẹn
                    </p>
                    <p className="font-bold text-base">
                      {formatDate(appointmentData?.appoinment_date) || "-"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-primary/5 rounded-lg border border-primary/10">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      Giờ hẹn
                    </p>
                    <p className="font-bold text-base">
                      {appointmentData?.appoinment_time || "-"}
                    </p>
                  </div>
                </div>

                {serviceType?.estimated_duration && (
                  <div className="flex items-start gap-3 p-3 bg-primary/5 rounded-lg border border-primary/10">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Wrench className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">
                        Thời gian dự kiến
                      </p>
                      <p className="font-bold text-base">
                        {serviceType.estimated_duration} giờ
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {appointmentData?.notes && (
                <div className="mt-6 pt-4 border-t">
                  <p className="text-sm font-semibold text-muted-foreground mb-2">
                    Ghi chú
                  </p>
                  <p className="text-sm bg-muted/50 p-4 rounded-lg border">
                    {appointmentData.notes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Customer + Vehicle Information */}
          <Card className="bg-gradient-card border-2 border-border shadow-md">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Thông tin khách hàng & Phương tiện
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Customer Information */}
                <div className="p-4 bg-blue-50/50 dark:bg-blue-950/20 rounded-lg border border-blue-200/50">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                    <h4 className="font-semibold text-base">Khách hàng</h4>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">
                        Họ tên
                      </p>
                      <p className="font-bold text-base">
                        {customer?.fullName || customer?.username || "Chưa rõ"}
                      </p>
                    </div>
                    {customer?.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          {customer.email}
                        </p>
                      </div>
                    )}
                    {customer?.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          {customer.phone}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Vehicle Information */}
                <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-lg border border-emerald-200/50">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-emerald-500/10 rounded-lg">
                      <Car className="h-5 w-5 text-emerald-600" />
                    </div>
                    <h4 className="font-semibold text-base">Phương tiện</h4>
                  </div>
                  <div className="space-y-3">
                    {(vehicle?.brand || vehicle?.model) && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">
                          Loại xe
                        </p>
                        <p className="font-bold text-base">
                          {[
                            vehicle?.brand,
                            vehicle?.model_name ||
                              (vehicle?.model_id &&
                                typeof vehicle.model_id === "object" &&
                                (vehicle.model_id as { model_name?: string })
                                  ?.model_name) ||
                              vehicle?.model,
                          ]
                            .filter(Boolean)
                            .join(" ")}
                        </p>
                      </div>
                    )}
                    {vehicle?.license_plate && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">
                          Biển số
                        </p>
                        <p className="font-bold text-lg text-emerald-700 dark:text-emerald-400">
                          {vehicle.license_plate}
                        </p>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {vehicle?.color && (
                        <div>
                          <p className="text-xs text-muted-foreground">Màu</p>
                          <p className="font-medium">{vehicle.color}</p>
                        </div>
                      )}
                      {vehicle?.year && (
                        <div>
                          <p className="text-xs text-muted-foreground">Năm</p>
                          <p className="font-medium">{vehicle.year}</p>
                        </div>
                      )}
                    </div>
                    {vehicle?.vin && (
                      <div>
                        <p className="text-xs text-muted-foreground">VIN</p>
                        <p className="text-sm font-mono font-medium">
                          {vehicle.vin}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Service + Center Information */}
          <Card className="bg-gradient-card border-2 border-border shadow-md">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <Wrench className="h-5 w-5 text-primary" />
                Thông tin dịch vụ & Trung tâm
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Service Information */}
                <div className="p-4 bg-purple-50/50 dark:bg-purple-950/20 rounded-lg border border-purple-200/50">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-purple-500/10 rounded-lg">
                      <Wrench className="h-5 w-5 text-purple-600" />
                    </div>
                    <h4 className="font-semibold text-base">Dịch vụ</h4>
                  </div>
                  <div className="space-y-2">
                    <p className="font-bold text-base">
                      {serviceType?.service_name || "Không xác định"}
                    </p>
                    {serviceType?.description && (
                      <p className="text-sm text-muted-foreground">
                        {serviceType.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Center Information */}
                <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-lg border border-indigo-200/50">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-indigo-500/10 rounded-lg">
                      <Building2 className="h-5 w-5 text-indigo-600" />
                    </div>
                    <h4 className="font-semibold text-base">Trung tâm</h4>
                  </div>
                  <div className="space-y-2">
                    <p className="font-bold text-base">
                      {center?.center_name || center?.name || "Không xác định"}
                    </p>
                    {center?.address && (
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-muted-foreground">
                          {center.address}
                        </p>
                      </div>
                    )}
                    {center?.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          Hotline: {center.phone}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Issue Information */}
          <Card className="bg-gradient-card border-2 border-border shadow-md">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-primary" />
                Thông tin vấn đề
              </h3>
              <div className="space-y-4">
                <div className="p-4 bg-primary/5 rounded-lg border-l-4 border-primary">
                  <p className="text-xs text-muted-foreground mb-1">
                    Loại vấn đề
                  </p>
                  <p className="font-bold text-lg">
                    {issueTypeLabel || "Không xác định"}
                  </p>
                </div>
                <div className="p-4 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-2">
                    Mô tả vấn đề
                  </p>
                  <p className="font-medium text-base">
                    {issueDescriptionText}
                  </p>
                </div>
                {checklist.solution_applied && (
                  <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-lg border border-emerald-200/50">
                    <p className="text-xs text-muted-foreground mb-2">
                      Giải pháp áp dụng
                    </p>
                    <p className="font-bold text-base text-emerald-700 dark:text-emerald-400">
                      {checklist.solution_applied}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Parts Information */}
          <Card className="bg-gradient-card border-2 border-border shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Phụ tùng sử dụng</h3>
                </div>
                {partsDetailList.length > 0 &&
                  (checklist.status === "pending" ||
                    checklist.status === "check_in") && (
                    <Button
                      variant={checkingInventory ? "secondary" : "default"}
                      size="sm"
                      onClick={handleCheckInventory}
                      disabled={checkingInventory || !center?._id}
                      className="gap-2">
                      {checkingInventory ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Đang kiểm tra...
                        </>
                      ) : (
                        <>
                          <Search className="h-4 w-4" />
                          Kiểm tra tồn kho
                        </>
                      )}
                    </Button>
                  )}
              </div>
              {partsDetailList.length ? (
                <div className="space-y-4">
                  {partsDetailList.map((item, idx) => {
                    const detail = item.detail;
                    const label =
                      detail?.part_name ||
                      detail?.part_number ||
                      item.id ||
                      `Phụ tùng ${idx + 1}`;
                    const unit = unitCostMap[item.id] || 0;
                    const total = unit * (item.quantity || 0);
                    const check = inventoryCheck[item.id];
                    const isChecking = check?.checking;
                    const isChecked = check && !isChecking;
                    const isSufficient = check?.sufficient;

                    return (
                      <Card
                        key={item.id || idx}
                        className={`border-2 transition-all duration-200 ${
                          isChecking
                            ? "border-primary/50 bg-primary/5 animate-pulse"
                            : isChecked
                            ? isSufficient
                              ? "border-green-500/50 bg-green-50/50 dark:bg-green-950/20"
                              : "border-red-500/50 bg-red-50/50 dark:bg-red-950/20"
                            : "border-border bg-background/60"
                        }`}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 space-y-3">
                              <div className="flex items-start gap-3">
                                <div className="p-2 rounded-lg bg-primary/10 mt-0.5">
                                  <Package
                                    className={`h-5 w-5 ${
                                      isChecking
                                        ? "text-primary animate-pulse"
                                        : isChecked
                                        ? isSufficient
                                          ? "text-green-600"
                                          : "text-red-600"
                                        : "text-muted-foreground"
                                    }`}
                                  />
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-semibold text-base mb-1">
                                    {label}
                                  </h4>
                                  {detail?.description && (
                                    <p className="text-sm text-muted-foreground mb-2">
                                      {detail.description}
                                    </p>
                                  )}

                                  {/* Inventory Status */}
                                  {isChecking && (
                                    <div className="flex items-center gap-2 mt-3 p-2 rounded-md bg-primary/10 border border-primary/20">
                                      <Loader2 className="h-4 w-4 text-primary animate-spin" />
                                      <span className="text-sm text-primary font-medium">
                                        Đang kiểm tra tồn kho...
                                      </span>
                                    </div>
                                  )}

                                  {isChecked && (
                                    <div
                                      className={`mt-3 p-3 rounded-lg border-2 ${
                                        isSufficient
                                          ? "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800"
                                          : "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800"
                                      }`}>
                                      <div className="flex items-center gap-2 mb-2">
                                        {isSufficient ? (
                                          <CheckCircle className="h-5 w-5 text-green-600" />
                                        ) : (
                                          <XCircle className="h-5 w-5 text-red-600" />
                                        )}
                                        <span
                                          className={`font-semibold text-sm ${
                                            isSufficient
                                              ? "text-green-700 dark:text-green-400"
                                              : "text-red-700 dark:text-red-400"
                                          }`}>
                                          {isSufficient
                                            ? "Đủ tồn kho"
                                            : "Không đủ tồn kho"}
                                        </span>
                                      </div>
                                      <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div className="flex items-center gap-2">
                                          <Warehouse className="h-4 w-4 text-muted-foreground" />
                                          <span className="text-muted-foreground">
                                            Tồn kho:
                                          </span>
                                          <span
                                            className={`font-semibold ${
                                              isSufficient
                                                ? "text-green-700 dark:text-green-400"
                                                : "text-red-700 dark:text-red-400"
                                            }`}>
                                            {check.available}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                                          <span className="text-muted-foreground">
                                            Cần:
                                          </span>
                                          <span className="font-semibold">
                                            {check.required}
                                          </span>
                                        </div>
                                      </div>
                                      {!isSufficient && (
                                        <div className="mt-2 text-xs text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-950/50 p-2 rounded">
                                          ⚠️ Cần bổ sung{" "}
                                          {check.required - check.available} đơn
                                          vị để đáp ứng yêu cầu
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Right side - Quantity and Price */}
                            <div className="text-right space-y-2 min-w-[120px]">
                              <div className="p-2 rounded-md bg-muted/50">
                                <div className="text-xs text-muted-foreground mb-1">
                                  Số lượng
                                </div>
                                <div className="text-lg font-bold">
                                  {item.quantity}
                                </div>
                              </div>
                              {unit > 0 && (
                                <>
                                  <div className="text-xs text-muted-foreground">
                                    Đơn giá
                                  </div>
                                  <div className="text-sm font-medium">
                                    {unit.toLocaleString("vi-VN")} VNĐ
                                  </div>
                                  {total > 0 && (
                                    <>
                                      <div className="text-xs text-muted-foreground mt-2">
                                        Thành tiền
                                      </div>
                                      <div className="text-base font-semibold text-primary">
                                        {total.toLocaleString("vi-VN")} VNĐ
                                      </div>
                                    </>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                  {totalPartsCost ? (
                    <div className="mt-4 p-4 rounded-lg bg-primary/5 border-2 border-primary/20">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">
                          Tổng chi phí phụ tùng:
                        </span>
                        <span className="text-xl font-bold text-primary">
                          {totalPartsCost.toLocaleString("vi-VN")} VNĐ
                        </span>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Không có phụ tùng kèm theo.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - right side */}
        <div className="space-y-6">
          {/* Checklist Info */}
          <Card className="bg-gradient-card border-2 border-border shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  Thông tin checklist
                </h3>
                <Badge
                  className={`${getStatusColor(
                    checklist.status
                  )} px-3 py-1.5 text-sm font-semibold`}>
                  {getStatusText(checklist.status)}
                </Badge>
              </div>
              <div className="space-y-4">
                {/* Short ID */}
                <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Hash className="h-4 w-4 text-primary" />
                    <p className="text-xs text-muted-foreground">
                      ID Checklist
                    </p>
                  </div>
                  <p className="font-bold text-lg text-primary font-mono">
                    {checklist._id
                      ? checklist._id.slice(-4).toUpperCase()
                      : "N/A"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 font-mono">
                    {checklist._id}
                  </p>
                </div>

                {/* Dates */}
                <div className="space-y-3">
                  {(checklist as { createdAt?: string }).createdAt && (
                    <div className="flex items-center gap-3 p-2 bg-muted/30 rounded-lg">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Tạo lúc</p>
                        <p className="text-sm font-semibold">
                          {formatDate(
                            (checklist as { createdAt?: string }).createdAt
                          )}
                        </p>
                      </div>
                    </div>
                  )}
                  {(checklist as { updatedAt?: string }).updatedAt && (
                    <div className="flex items-center gap-3 p-2 bg-muted/30 rounded-lg">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Cập nhật
                        </p>
                        <p className="text-sm font-semibold">
                          {formatDate(
                            (checklist as { updatedAt?: string }).updatedAt
                          )}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Total Cost */}
                {(checklist as { total_cost?: number }).total_cost && (
                  <div className="p-3 bg-amber-50/50 dark:bg-amber-950/20 rounded-lg border border-amber-200/50">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="h-4 w-4 text-amber-600" />
                      <p className="text-xs text-muted-foreground">
                        Tổng chi phí
                      </p>
                    </div>
                    <p className="font-bold text-lg text-amber-700 dark:text-amber-400">
                      {(
                        checklist as { total_cost?: number }
                      ).total_cost?.toLocaleString("vi-VN")}{" "}
                      VNĐ
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Actions - only show when pending/check_in */}
          {(checklist.status === "pending" ||
            checklist.status === "check_in") && (
            <Card className="bg-gradient-card border-2 border-border shadow-md">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Hành động</h3>
                <div className="space-y-3">
                  <Button
                    className="w-full bg-success text-success-foreground"
                    disabled={
                      workingId === checklist._id ||
                      !allPartsSufficient ||
                      partsDetailList.length === 0
                    }
                    onClick={async () => {
                      if (!allPartsSufficient) {
                        alert(
                          "Vui lòng kiểm tra tồn kho và đảm bảo tất cả phụ tùng đều đủ trước khi duyệt"
                        );
                        return;
                      }
                      try {
                        setWorkingId(checklist._id);

                        // Backend sẽ tự cập nhật (trừ) inventory khi duyệt checklist.
                        // Ở FE chỉ gọi accept để tránh trừ 2 lần.
                        const res = await acceptChecklistApi(checklist._id);
                        if (!res.ok) {
                          alert(res.message || "Duyệt checklist thất bại");
                        } else {
                          window.location.reload();
                        }
                      } catch (err) {
                        const errorMessage =
                          err instanceof Error
                            ? err.message
                            : "Có lỗi xảy ra khi duyệt checklist";
                        alert(errorMessage);
                      } finally {
                        setWorkingId(null);
                      }
                    }}>
                    Duyệt checklist
                    {!allPartsSufficient && partsDetailList.length > 0 && (
                      <span className="ml-2 text-xs">
                        (Cần kiểm tra tồn kho)
                      </span>
                    )}
                  </Button>
                  <Button
                    className="w-full"
                    variant="outline"
                    disabled={workingId === checklist._id}
                    onClick={() => {
                      setRejectError(null);
                      setRejectReason("");
                      setRejectDialogOpen(true);
                    }}>
                    Từ chối checklist
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Dialog
        open={rejectDialogOpen}
        onOpenChange={(open) => {
          setRejectDialogOpen(open);
          if (!open) {
            setRejectReason("");
            setRejectError(null);
          }
        }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lý do từ chối checklist</DialogTitle>
            <DialogDescription>
              Vui lòng ghi rõ lý do để thông báo cho kỹ thuật viên.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Textarea
              placeholder="Nhập lý do từ chối..."
              rows={4}
              value={rejectReason}
              onChange={(e) => {
                setRejectReason(e.target.value);
                if (rejectError) setRejectError(null);
              }}
              disabled={submittingReject}
            />
            {rejectError ? (
              <p className="text-sm text-destructive">{rejectError}</p>
            ) : null}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectDialogOpen(false)}
              disabled={submittingReject}>
              Hủy
            </Button>
            <Button
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={submittingReject}
              onClick={async () => {
                if (!rejectReason.trim()) {
                  setRejectError("Vui lòng nhập lý do từ chối.");
                  return;
                }
                try {
                  setSubmittingReject(true);
                  setWorkingId(checklist._id);
                  const res = await cancelChecklistApi(
                    checklist._id,
                    rejectReason.trim()
                  );
                  if (!res.ok) {
                    alert(res.message || "Từ chối checklist thất bại");
                  } else {
                    setRejectDialogOpen(false);
                    window.location.reload();
                  }
                } catch {
                  alert("Có lỗi xảy ra khi từ chối checklist");
                } finally {
                  setSubmittingReject(false);
                  setWorkingId(null);
                }
              }}>
              Xác nhận từ chối
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
};

export default ChecklistDetail;
