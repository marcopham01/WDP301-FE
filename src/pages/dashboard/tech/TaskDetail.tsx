import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Car,
  MapPin,
  Wrench,
  DollarSign,
  AlertCircle,
  Package,
  Plus,
  Trash2,
  FileText,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext/useAuth";
import {
  updateAppointmentStatusApi,
  getAppointmentByIdApi,
  Appointment,
  getAppointmentsApi,
} from "@/lib/appointmentApi";
import {
  getIssueTypesApi,
  getPartsApi,
  createChecklistApi,
  IssueType,
  PartItem,
  getInventoryApi,
  InventoryItem,
  getChecklistsApi,
  Checklist,
  getIssueTypeByIdApi,
  getPartByIdApi,
} from "@/lib/checklistApi";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ChecklistFormState = {
  issue_type_id: string;
  issue_description: string;
  solution_applied: string;
  parts: Array<{ part_id: string; quantity: number }>;
};

function formatDate(date?: string) {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return date;
  return d.toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export const TaskDetail = () => {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [showChecklistForm, setShowChecklistForm] = useState(false);
  const [checklistCreated, setChecklistCreated] = useState(false);
  const [checklistMessage, setChecklistMessage] = useState<string | null>(null);
  const [issueTypes, setIssueTypes] = useState<IssueType[]>([]);
  const [parts, setParts] = useState<PartItem[]>([]);
  const createEmptyChecklistForm = (): ChecklistFormState => ({
    issue_type_id: "",
    issue_description: "",
    solution_applied: "",
    parts: [],
  });
  const [checklistForm, setChecklistForm] = useState<ChecklistFormState>(
    createEmptyChecklistForm
  );
  const [checklist, setChecklist] = useState<Checklist | null>(null);
  const [checklistIssueType, setChecklistIssueType] =
    useState<IssueType | null>(null);
  const [checklistParts, setChecklistParts] = useState<
    Array<{ part: PartItem; quantity: number; cost: number }>
  >([]);
  const closeChecklistForm = () => {
    setShowChecklistForm(false);
    setChecklistForm(createEmptyChecklistForm());
  };

  // Lấy thông tin chi tiết appointment trực tiếp theo ID
  useEffect(() => {
    const fetchAppointmentDetail = async () => {
      if (!user?.id || !appointmentId) return;

      try {
        setLoading(true);
        setError(null);

        const result = await getAppointmentByIdApi(appointmentId);
        if (result.ok && result.data?.success) {
          setAppointment(result.data.data);
        } else if (result.status === 403) {
          // Fallback: bị chặn quyền -> lấy từ danh sách của technician rồi chọn theo ID
          const listResult = await getAppointmentsApi({
            technicianId: user.id,
            limit: 200,
          });
          if (listResult.ok && listResult.data?.success) {
            const data = listResult.data.data as {
              items?: Appointment[];
              appointments?: Appointment[];
            };
            const items = (data.items ||
              data.appointments ||
              []) as Appointment[];
            const found = items.find((a) => a._id === appointmentId);
            if (found) {
              setAppointment(found);
            } else {
              setError(
                "Không tìm thấy thông tin appointment trong danh sách của bạn"
              );
            }
          } else {
            setError(
              listResult.message || "Không thể tải danh sách appointments"
            );
          }
        } else {
          setError(result.message || "Không thể tải dữ liệu appointment");
        }
      } catch (err) {
        setError("Có lỗi xảy ra khi tải dữ liệu");
        console.error("Error fetching appointment detail:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointmentDetail();
  }, [user?.id, appointmentId]);

  // Fetch checklist nếu appointment đã có checklist
  useEffect(() => {
    const fetchChecklist = async () => {
      if (!appointmentId || !appointment) return;
      // Chỉ fetch nếu appointment đã có checklist (status check_in, in_progress, hoặc completed)
      if (
        appointment.status === "check_in" ||
        appointment.status === "in_progress" ||
        appointment.status === "working" ||
        appointment.status === "completed" ||
        appointment.status === "done" ||
        appointment.status === "repaired"
      ) {
        try {
          const res = await getChecklistsApi({ limit: 200 });
          if (res.ok && res.data?.success) {
            const payload = res.data.data as
              | { items?: Checklist[]; checklists?: Checklist[] }
              | Checklist[];
            const normalized = Array.isArray(payload)
              ? payload
              : Array.isArray(payload?.items)
              ? payload?.items
              : Array.isArray(
                  (payload as { checklists?: Checklist[] })?.checklists
                )
              ? (payload as { checklists?: Checklist[] }).checklists
              : [];
            const foundChecklist = (normalized as Checklist[]).find(
              (c) =>
                (typeof c.appointment_id === "string"
                  ? c.appointment_id
                  : (c.appointment_id as { _id?: string })?._id) ===
                appointmentId
            );
            if (foundChecklist) {
              setChecklist(foundChecklist);
              // Fetch issue type
              const issueTypeId =
                typeof foundChecklist.issue_type_id === "string"
                  ? foundChecklist.issue_type_id
                  : (foundChecklist.issue_type_id as { _id?: string })?._id;
              if (issueTypeId) {
                const issueRes = await getIssueTypeByIdApi(issueTypeId);
                if (issueRes.ok && issueRes.data?.success) {
                  setChecklistIssueType(issueRes.data.data);
                }
              }
              // Fetch parts và inventory costs
              const partsWithCosts = await Promise.all(
                foundChecklist.parts.map(async (p) => {
                  const partId =
                    typeof p.part_id === "string"
                      ? p.part_id
                      : (p.part_id as { _id?: string })?._id;
                  if (!partId) return null;
                  const partRes = await getPartByIdApi(partId);
                  if (!partRes.ok || !partRes.data?.success) return null;
                  const part = partRes.data.data;
                  // Get inventory cost
                  const centerId = appointment.center_id?._id;
                  const partName = part.part_name;
                  let cost = 0;
                  if (centerId && partName) {
                    const invRes = await getInventoryApi({
                      center_id: centerId,
                      part_name: partName,
                      limit: 50,
                    });
                    if (invRes.ok && invRes.data?.success) {
                      const items = (invRes.data.data.items ||
                        []) as InventoryItem[];
                      const matched =
                        items.find(
                          (it) =>
                            (it.part_id as unknown as { _id?: string })?._id ===
                            partId
                        ) || items[0];
                      if (matched) {
                        const matchedWithTypo = matched as InventoryItem & {
                          quantity_avaiable?: number;
                        };
                        cost = matchedWithTypo.cost_per_unit || 0;
                      }
                    }
                  }
                  return {
                    part,
                    quantity: p.quantity,
                    cost: cost * p.quantity,
                  };
                })
              );
              setChecklistParts(
                partsWithCosts.filter(
                  (
                    p
                  ): p is { part: PartItem; quantity: number; cost: number } =>
                    p !== null
                )
              );
            }
          }
        } catch (err) {
          console.error("Error fetching checklist:", err);
        }
      }
    };
    fetchChecklist();
  }, [appointmentId, appointment]);

  // Function để bắt đầu công việc (đổi status thành in_progress)
  const handleStartWork = async () => {
    if (!appointmentId) return;

    try {
      // Mở form checklist và nạp dữ liệu hỗ trợ
      setShowChecklistForm(true);
      const [issueRes, partsRes] = await Promise.all([
        getIssueTypesApi(),
        getPartsApi({ limit: 50 }),
      ]);
      if (issueRes.ok && issueRes.data?.success) {
        setIssueTypes(issueRes.data.data.items || []);
      }
      if (partsRes.ok && partsRes.data?.success) {
        setParts(partsRes.data.data.items || []);
      }
    } catch (err) {
      setError("Có lỗi xảy ra khi bắt đầu công việc");
      console.error("Error starting work:", err);
    }
  };

  const submitChecklist = async () => {
    if (!appointmentId) return;
    try {
      setUpdating(true);
      const payload = {
        appointment_id: appointmentId,
        issue_type_id: checklistForm.issue_type_id,
        issue_description: checklistForm.issue_description,
        solution_applied: checklistForm.solution_applied,
        parts: checklistForm.parts,
      };
      const res = await createChecklistApi(payload);
      if (!res.ok || !res.data?.success) {
        setError(res.message || "Tạo checklist thất bại");
        setUpdating(false);
        return;
      }
      // Sau khi tạo checklist, cập nhật trạng thái appointment -> check_in
      const statusRes = await updateAppointmentStatusApi({
        appointment_id: appointmentId,
        status: "check_in",
      });
      if (statusRes.ok && statusRes.data?.success) {
        if (appointment) setAppointment({ ...appointment, status: "check_in" });
      }
      setChecklistCreated(true);
      setChecklistMessage(
        "Checklist đã gửi thành công. Trạng thái đã chuyển sang 'check_in'. Vui lòng chờ staff duyệt."
      );
      closeChecklistForm();
    } catch (err) {
      setError("Có lỗi khi gửi checklist");
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  // Function để hoàn thành công việc
  const handleCompleteWork = async () => {
    if (!appointmentId) return;

    try {
      setUpdating(true);
      const result = await updateAppointmentStatusApi({
        appointment_id: appointmentId,
        status: "repaired",
      });

      if (result.ok && result.data?.success) {
        if (appointment) {
          setAppointment({ ...appointment, status: "repaired" });
        }
        console.log("Đã hoàn thành công việc thành công");
      } else {
        setError(result.message || "Không thể hoàn thành công việc");
      }
    } catch (err) {
      setError("Có lỗi xảy ra khi hoàn thành công việc");
      console.error("Error completing work:", err);
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "assigned":
      case "pending":
        return "bg-warning";
      case "check_in":
      case "in_progress":
      case "working":
        return "bg-primary";
      case "repaired":
      case "completed":
      case "done":
        return "bg-success";
      case "delay":
        return "bg-orange-500";
      case "canceled":
        return "bg-destructive";
      default:
        return "bg-muted";
    }
  };

  const getStatusText = (status: string) => {
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
      case "delay":
        return "Trì hoãn";
      case "canceled":
        return "Đã hủy";
      default:
        return status;
    }
  };

  // Loading state
  if (loading) {
    return (
      <main className="flex-1 p-6 bg-background">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/dashboard/technician")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại
          </Button>
          <h2 className="text-2xl font-bold">Chi tiết công việc</h2>
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

  // Error state
  if (error || !appointment) {
    return (
      <main className="flex-1 p-6 bg-background">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/dashboard/technician")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại
          </Button>
          <h2 className="text-2xl font-bold">Chi tiết công việc</h2>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-destructive mb-4">
              {error || "Không tìm thấy thông tin"}
            </p>
            <Button onClick={() => navigate("/dashboard/technician")}>
              Quay về trang chủ
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 p-6 bg-background">
      {/* Header với nút back */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate("/dashboard/technician")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Quay lại
        </Button>
        <div>
          <h2 className="text-2xl font-bold">Chi tiết công việc</h2>
          <p className="text-muted-foreground">
            Thông tin chi tiết về appointment được giao
          </p>
          {checklistMessage && (
            <p className="text-sm text-blue-600 mt-1">{checklistMessage}</p>
          )}
        </div>
      </div>

      {/* Thông tin chính */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Thông tin appointment */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-gradient-card border border-border shadow-soft">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Thông tin Appointment</h3>
                <Badge
                  className={`${getStatusColor(
                    appointment.status
                  )} text-white`}>
                  {getStatusText(appointment.status)}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Ngày hẹn</p>
                    <p className="font-medium">
                      {formatDate(appointment.appoinment_date)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Giờ hẹn</p>
                    <p className="font-medium">{appointment.appoinment_time}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <DollarSign className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Chi phí dịch vụ
                    </p>
                    <p className="font-medium">
                      {appointment.service_type_id?.base_price?.toLocaleString(
                        "vi-VN"
                      )}{" "}
                      VNĐ
                    </p>
                  </div>
                </div>

                {appointment.service_type_id?.estimated_duration && (
                  <div className="flex items-center gap-3">
                    <Wrench className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Thời gian dự kiến
                      </p>
                      <p className="font-medium">
                        {appointment.service_type_id.estimated_duration} giờ
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {appointment.notes && (
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground mb-2">Ghi chú</p>
                  <p className="text-sm bg-muted/50 p-3 rounded-lg">
                    {appointment.notes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Thông tin khách hàng + xe */}
          <Card className="bg-gradient-card border border-border shadow-soft">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">
                Thông tin khách hàng
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">
                      {appointment.user_id?.fullName ||
                        appointment.user_id?.username}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {appointment.user_id?.email}
                    </p>
                    {appointment.user_id?.phone && (
                      <p className="text-sm text-muted-foreground">
                        {appointment.user_id?.phone}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Car className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">
                      {(appointment.vehicle_id as { brand?: string })?.brand ||
                        ""}{" "}
                      {(appointment.vehicle_id as { model?: string })?.model ||
                        ""}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Biển số: {appointment.vehicle_id?.license_plate}
                    </p>
                    {(appointment.vehicle_id as { vin?: string })?.vin && (
                      <p className="text-sm text-muted-foreground">
                        VIN: {(appointment.vehicle_id as { vin?: string }).vin}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Thông tin dịch vụ + trung tâm */}
          <Card className="bg-gradient-card border border-border shadow-soft">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Thông tin dịch vụ</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="font-medium mb-2">
                    {appointment.service_type_id?.service_name}
                  </p>
                  {(appointment.service_type_id as { description?: string })
                    ?.description && (
                    <p className="text-sm text-muted-foreground">
                      {
                        (
                          appointment.service_type_id as {
                            description?: string;
                          }
                        ).description
                      }
                    </p>
                  )}
                </div>
                <div className="flex items-start gap-3 md:justify-end">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="text-right md:text-left">
                    <p className="font-medium">
                      {appointment.center_id?.center_name ||
                        appointment.center_id?.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {appointment.center_id?.address}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Thông tin checklist */}
          {checklist && (
            <Card className="bg-gradient-card border border-border shadow-soft">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">
                  Thông tin checklist
                </h3>
                <div className="space-y-4">
                  {/* Issue Type */}
                  {checklistIssueType && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        Loại vấn đề
                      </p>
                      <p className="font-medium">
                        {checklistIssueType.category &&
                        checklistIssueType.severity
                          ? `${checklistIssueType.category} • ${checklistIssueType.severity}`
                          : checklistIssueType.category ||
                            checklistIssueType.severity ||
                            "Không xác định"}
                      </p>
                    </div>
                  )}

                  {/* Issue Description */}
                  {checklist.issue_description && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        Mô tả vấn đề
                      </p>
                      <p className="font-medium">
                        {checklist.issue_description}
                      </p>
                    </div>
                  )}

                  {/* Solution Applied */}
                  {checklist.solution_applied && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        Giải pháp áp dụng
                      </p>
                      <p className="font-medium">
                        {checklist.solution_applied}
                      </p>
                    </div>
                  )}

                  {/* Parts Used */}
                  {checklistParts.length > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Phụ tùng sử dụng
                      </p>
                      <div className="space-y-2">
                        {checklistParts.map((item, idx) => (
                          <div
                            key={idx}
                            className="rounded-md border border-border p-3 bg-background/60">
                            <div className="flex items-center justify-between">
                              <div className="font-medium">
                                {item.part.part_name ||
                                  item.part.part_number ||
                                  `Phụ tùng ${idx + 1}`}
                              </div>
                              <div className="text-right">
                                <div className="text-sm">
                                  Số lượng: {item.quantity}
                                </div>
                                {item.cost > 0 && (
                                  <div className="text-xs text-muted-foreground">
                                    Thành tiền:{" "}
                                    {item.cost.toLocaleString("vi-VN")} VNĐ
                                  </div>
                                )}
                              </div>
                            </div>
                            {item.part.description && (
                              <p className="text-xs text-muted-foreground mt-2">
                                {item.part.description}
                              </p>
                            )}
                          </div>
                        ))}
                        <div className="text-right text-sm font-medium mt-2">
                          Tổng chi phí phụ tùng:{" "}
                          {checklistParts
                            .reduce((sum, item) => sum + item.cost, 0)
                            .toLocaleString("vi-VN")}{" "}
                          VNĐ
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tổng chi phí */}
          {checklist && checklistParts.length > 0 && (
            <Card className="bg-gradient-card border border-primary/20 shadow-soft">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Tổng chi phí</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Chi phí dịch vụ:
                    </span>
                    <span className="font-medium">
                      {appointment.service_type_id?.base_price?.toLocaleString(
                        "vi-VN"
                      ) || "0"}{" "}
                      VNĐ
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Chi phí phụ tùng:
                    </span>
                    <span className="font-medium">
                      {checklistParts
                        .reduce((sum, item) => sum + item.cost, 0)
                        .toLocaleString("vi-VN")}{" "}
                      VNĐ
                    </span>
                  </div>
                  <div className="border-t pt-2 mt-2 flex justify-between">
                    <span className="font-semibold text-lg">Tổng cộng:</span>
                    <span className="font-bold text-lg text-primary">
                      {(
                        (appointment.service_type_id?.base_price || 0) +
                        checklistParts.reduce((sum, item) => sum + item.cost, 0)
                      ).toLocaleString("vi-VN")}{" "}
                      VNĐ
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar với actions */}
        <div className="space-y-6">
          {/* Actions */}
          <Card className="bg-gradient-card border border-border shadow-soft">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Hành động</h3>
              <div className="space-y-3">
                {checklistCreated || appointment.status === "check_in" ? (
                  <div className="text-center">
                    <Badge className="bg-primary text-white">
                      Đã gửi checklist
                    </Badge>
                    <p className="text-sm text-muted-foreground mt-2">
                      Vui lòng chờ staff duyệt
                    </p>
                  </div>
                ) : appointment.status === "assigned" ||
                  appointment.status === "pending" ? (
                  showChecklistForm ? (
                    <Button className="w-full" variant="outline" disabled>
                      Đang tạo checklist - vui lòng gửi biểu mẫu bên trên
                    </Button>
                  ) : (
                    <Button
                      className="w-full bg-primary text-primary-foreground"
                      onClick={handleStartWork}
                      disabled={updating}>
                      Bắt đầu công việc
                    </Button>
                  )
                ) : appointment.status === "in_progress" ||
                  appointment.status === "working" ? (
                  <Button
                    className="w-full bg-success text-success-foreground"
                    onClick={handleCompleteWork}
                    disabled={updating}>
                    {updating ? "Đang cập nhật..." : "Hoàn thành công việc"}
                  </Button>
                ) : (
                  <div className="text-center">
                    <Badge className="bg-success text-white">
                      Công việc đã hoàn thành
                    </Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog
        open={showChecklistForm}
        onOpenChange={(open) => {
          if (!open) {
            closeChecklistForm();
          }
        }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <FileText className="h-5 w-5 text-primary" />
              Tạo checklist khi bắt đầu
            </DialogTitle>
            <DialogDescription className="text-base">
              Ghi nhận vấn đề, giải pháp và phụ tùng sử dụng trước khi gửi cho
              bộ phận điều phối.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Loại vấn đề và Giải pháp */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-medium">
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                  Loại vấn đề
                </Label>
                <Select
                  value={checklistForm.issue_type_id}
                  onValueChange={(value) =>
                    setChecklistForm((s) => ({
                      ...s,
                      issue_type_id: value,
                    }))
                  }>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Chọn loại vấn đề" />
                  </SelectTrigger>
                  <SelectContent>
                    {issueTypes.map((it) => (
                      <SelectItem key={it._id} value={it._id}>
                        {it.category} • {it.severity}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-medium">
                  <Wrench className="h-4 w-4 text-muted-foreground" />
                  Giải pháp áp dụng
                </Label>
                <Input
                  value={checklistForm.solution_applied}
                  onChange={(e) =>
                    setChecklistForm((s) => ({
                      ...s,
                      solution_applied: e.target.value,
                    }))
                  }
                  placeholder="Ví dụ: Thay phanh, cân chỉnh..."
                  className="w-full"
                />
              </div>
            </div>

            {/* Mô tả vấn đề */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <FileText className="h-4 w-4 text-muted-foreground" />
                Mô tả vấn đề
              </Label>
              <Textarea
                rows={4}
                value={checklistForm.issue_description}
                onChange={(e) =>
                  setChecklistForm((s) => ({
                    ...s,
                    issue_description: e.target.value,
                  }))
                }
                placeholder="Mô tả chi tiết vấn đề khách gặp phải..."
                className="resize-none"
              />
            </div>

            {/* Phụ tùng sử dụng */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2 text-sm font-medium">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  Phụ tùng sử dụng
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setChecklistForm((s) => ({
                      ...s,
                      parts: [...s.parts, { part_id: "", quantity: 1 }],
                    }))
                  }
                  className="gap-2">
                  <Plus className="h-4 w-4" />
                  Thêm phụ tùng
                </Button>
              </div>

              {checklistForm.parts.length === 0 ? (
                <div className="border-2 border-dashed rounded-lg p-8 text-center bg-muted/30">
                  <Package className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Chưa thêm phụ tùng nào. Nhấn nút "Thêm phụ tùng" để bắt đầu.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {checklistForm.parts.map((p, idx) => (
                    <Card
                      key={`${idx}-${p.part_id}`}
                      className="border border-border bg-card">
                      <CardContent className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                          <div className="md:col-span-8 space-y-2">
                            <Label className="text-xs text-muted-foreground">
                              Phụ tùng
                            </Label>
                            <Select
                              value={p.part_id}
                              onValueChange={(value) => {
                                setChecklistForm((s) => {
                                  const partsArr = [...s.parts];
                                  partsArr[idx] = {
                                    ...partsArr[idx],
                                    part_id: value,
                                  };
                                  return { ...s, parts: partsArr };
                                });
                              }}>
                              <SelectTrigger>
                                <SelectValue placeholder="Chọn phụ tùng" />
                              </SelectTrigger>
                              <SelectContent>
                                {parts.map((pt) => (
                                  <SelectItem key={pt._id} value={pt._id}>
                                    {pt.part_name || pt.part_number || pt._id}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="md:col-span-3 space-y-2">
                            <Label className="text-xs text-muted-foreground">
                              Số lượng
                            </Label>
                            <Input
                              type="number"
                              min={1}
                              value={p.quantity}
                              onChange={(e) => {
                                const quantity = Math.max(
                                  1,
                                  Number(e.target.value) || 1
                                );
                                setChecklistForm((s) => {
                                  const partsArr = [...s.parts];
                                  partsArr[idx] = {
                                    ...partsArr[idx],
                                    quantity,
                                  };
                                  return { ...s, parts: partsArr };
                                });
                              }}
                              className="w-full"
                            />
                          </div>
                          <div className="md:col-span-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                setChecklistForm((s) => ({
                                  ...s,
                                  parts: s.parts.filter((_, i) => i !== idx),
                                }))
                              }
                              className="text-destructive hover:text-destructive hover:bg-destructive/10">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter className="sm:justify-end sm:space-x-2 border-t pt-4">
            <Button variant="outline" onClick={closeChecklistForm}>
              Hủy
            </Button>
            <Button
              className="bg-primary text-primary-foreground"
              disabled={updating || !checklistForm.issue_type_id}
              onClick={submitChecklist}>
              {updating ? "Đang gửi..." : "Gửi checklist & bắt đầu"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
};
