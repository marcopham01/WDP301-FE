import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, Clock, MapPin, Eye, Trash2, RefreshCw, CheckCircle2, XCircle, PlayCircle, Wrench, FileText } from "lucide-react";
import Header from "@/components/MainLayout/Header";
import Footer from "@/components/MainLayout/Footer";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { getMyAppointmentsApi, deleteAppointmentApi, Appointment } from "@/lib/appointmentApi";
import { toast } from "react-toastify";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
// Use relative path to avoid any alias resolution edge cases in this file
import { PaymentDialog } from "../../components/customer/PaymentDialog";
import { config } from "@/config/config";
import { initializeSocket, onAppointmentUpdated } from "@/lib/socket";
import { useAuth } from "@/context/AuthContext/useAuth";

const BASE_URL = config.API_BASE_URL;

// Type guard and helpers
// (removed unused toVNDate helper)

function statusLabel(s?: string) {
  switch (s) {
    case "pending": return { text: "Đợi ứng tiền", variant: "secondary" as const };
    case "assigned": return { text: "Đã sắp nhân viên", variant: "default" as const };
    case "check_in": return { text: "Chờ báo giá", variant: "outline" as const };
    case "in_progress": return { text: "Đang sửa chữa", variant: "default" as const };
    case "repaired": return { text: "Đã sửa xong", variant: "default" as const };
    case "completed": return { text: "Đơn hoàn thành", variant: "default" as const };
    case "delay": return { text: "Trì hoãn", variant: "secondary" as const };
    case "canceled":
    case "cancelled": return { text: "Đã hủy", variant: "destructive" as const };
    default: return { text: s || "—", variant: "secondary" as const };
  }
}

type SortKey = "none" | "date_asc" | "date_desc";

type MyAppointment = Appointment & {
  service_type_id?: { _id?: string; service_name?: string };
  center_id?: { _id?: string; name?: string; center_name?: string; address?: string };
  estimated_end_time?: string;
  notes?: string;
  note?: string;
  createdAt?: string;
  updatedAt?: string;
  final_cost?: number;
};

export default function BookingHistoryPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<MyAppointment[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [sortKey, setSortKey] = useState<SortKey>("none");

  // Dialog state
  const [selectedAppointment, setSelectedAppointment] = useState<MyAppointment | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [appointmentToDelete, setAppointmentToDelete] = useState<string | null>(null);
  
  // Payment dialog state
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState<{
    amount?: number;
    checkout_url?: string;
    qr_code?: string;
    order_code?: number;
    timeoutAt?: string;
    status?: string;
    description?: string;
  } | null>(null);

  // Fetch data
  async function fetchData(opts?: { resetPage?: boolean; soft?: boolean }) {
    try {
      if (opts?.soft) setRefreshing(true); else setLoading(true);
      setError(null);
      const reqPage = opts?.resetPage ? 1 : page;
      const res = await getMyAppointmentsApi({ page: reqPage, limit, status: statusFilter !== "all" ? statusFilter : undefined });
      if (!res.ok || !res.data?.data) {
        setItems([]);
        setTotalItems(0);
        setTotalPages(1);
        throw new Error(res.message || "Không thể tải dữ liệu lịch hẹn");
      }

  const data = res.data.data as { appointments?: MyAppointment[]; items?: MyAppointment[]; pagination?: Partial<{ page: number; limit: number; totalPages: number; totalDocs: number }> };
  const appts: MyAppointment[] = (data.items || data.appointments || []) ?? [];
  const p = data.pagination || {};
  // normalize pagination shape (supports both camelCase and snake_case)
  const pSnake = p as Record<string, number | undefined>;
  const currentPage = pSnake.current_page ?? (p as { page?: number }).page ?? reqPage;
  const totalPagesN = pSnake.total_pages ?? (p as { totalPages?: number }).totalPages ?? 1;
  const totalDocs = pSnake.total_items ?? (p as { totalDocs?: number }).totalDocs ?? appts.length;

      setItems(appts);
      setPage(currentPage);
      setTotalPages(totalPagesN);
      setTotalItems(totalDocs);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Lỗi không xác định";
      setError(message);
      toast.error(message || "Không thể tải lịch hẹn");
    } finally {
      if (opts?.soft) setRefreshing(false); else setLoading(false);
      if (initialLoad) setInitialLoad(false);
    }
  }

  useEffect(() => {
    fetchData({ soft: !initialLoad });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, statusFilter]);

  // Realtime: subscribe to appointment updates for current user
  useEffect(() => {
    const socket = initializeSocket();
    if (user?.id) {
      try {
        socket.emit("join", user.id);
      } catch {
        /* no-op */
      }
    }
    const handler = (payload: { appointment_id: string; status: string }) => {
      // Soft refresh current list to reflect latest status
      fetchData({ soft: true });
      const st = statusLabel(payload.status).text;
      toast.info(`Cập nhật lịch hẹn: ${st}`);
    };
    onAppointmentUpdated(handler);
    return () => {
      try {
        socket.off("appointment_updated", handler);
      } catch {
        /* no-op */
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Derived counters (from current page data)
  const counters = useMemo(() => {
    const all = items.length;
    const pending = items.filter(i => i.status === "pending").length;
    const assigned = items.filter(i => i.status === "assigned").length;
    const checkIn = items.filter(i => i.status === "check_in").length;
    const inProgress = items.filter(i => i.status === "in_progress").length;
    const repaired = items.filter(i => i.status === "repaired").length;
    const completed = items.filter(i => i.status === "completed").length;
    const canceled = items.filter(i => i.status === "canceled" || i.status === "cancelled").length;
    return { all, pending, assigned, checkIn, inProgress, repaired, completed, canceled };
  }, [items]);

  // Client-side filters: date range + sorting
  const visibleItems = useMemo(() => {
    let arr = [...items];
    if (fromDate) {
      const from = new Date(fromDate);
      arr = arr.filter(a => a.appoinment_date && new Date(a.appoinment_date) >= from);
    }
    if (toDate) {
      const to = new Date(toDate);
      to.setHours(23,59,59,999);
      arr = arr.filter(a => a.appoinment_date && new Date(a.appoinment_date) <= to);
    }
    if (sortKey !== "none") {
      arr.sort((a,b) => {
        const ad = a.appoinment_date ? new Date(a.appoinment_date).getTime() : 0;
        const bd = b.appoinment_date ? new Date(b.appoinment_date).getTime() : 0;
        if (sortKey === "date_asc") return ad - bd;
        return bd - ad;
      });
    }
    return arr;
  }, [items, fromDate, toDate, sortKey]);

  const handleRefresh = () => fetchData({ soft: true });
  const handleClearFilters = () => {
    setStatusFilter("all");
    setFromDate("");
    setToDate("");
    setSortKey("none");
    fetchData({ resetPage: true });
  };

  const handleDelete = (id: string) => {
    setAppointmentToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!appointmentToDelete) return;
    const res = await deleteAppointmentApi(appointmentToDelete);
    if (res.ok) {
      toast.success("Đã xóa lịch hẹn");
      fetchData();
    } else {
      toast.error(res.message || "Không thể xóa. Vui lòng thử lại");
    }
    setDeleteDialogOpen(false);
    setAppointmentToDelete(null);
  };

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    toast.success("Đăng xuất thành công!");
    setTimeout(() => {
      window.location.href = "/login";
    }, 1000);
  };


  const handleViewDetail = (appointment: MyAppointment) => {
    setSelectedAppointment(appointment);
    setIsDetailDialogOpen(true);
  };

  // Hàm xử lý thanh toán final payment
  const handleFinalPayment = async (item: MyAppointment) => {
    try {
      interface FinalPaymentResp {
        success?: boolean;
        message?: string;
        data?: {
          final_payment_id?: {
            orderCode?: number;
            checkoutUrl?: string;
            qrCode?: string;
            status?: string;
            timeoutAt?: string;
          };
        } & Record<string, unknown>;
      }
      const res = await fetch(`${BASE_URL}/api/appointment/${item._id}/final-payment`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });
      const obj = (await res.json().catch(() => ({}))) as FinalPaymentResp;
      if (!res.ok) {
        toast.error(obj?.message || "Không thể thực hiện thanh toán");
        return;
      }

      // API trả về đối tượng appointment đã populate
      const appt = obj?.data || {};
      type FP = {
        orderCode?: number; order_code?: number;
        checkoutUrl?: string; checkout_url?: string;
        qrCode?: string; qr_code?: string;
        status?: string;
        timeoutAt?: string; timeout_at?: string;
      };
      const fp = (appt as { final_payment_id?: FP }).final_payment_id || ({} as FP);

      // Chuẩn hóa key từ camelCase -> snake_case cho PaymentDialog
      const checkoutUrl = fp.checkoutUrl || fp.checkout_url;
      const qrCode = fp.qrCode || fp.qr_code;
      const orderCode = fp.orderCode || fp.order_code;
      const timeoutAt = fp.timeoutAt || fp.timeout_at;
      const status = (fp.status || "").toUpperCase();

      if (checkoutUrl || qrCode || orderCode) {
        setPaymentInfo({
          amount: item.final_cost,
          checkout_url: checkoutUrl,
          qr_code: qrCode,
          order_code: orderCode,
          timeoutAt,
          status,
          description: `Thanh toán số tiền còn lại cho lịch hẹn ngày ${item.appoinment_date}`,
        });
        setPaymentDialogOpen(true);
        if (status === "PAID") {
          toast.success("Đã thanh toán thành công!");
          fetchData({ soft: true });
        } else if (status === "PENDING") {
          // nhắc người dùng hoàn tất
          toast.info("Vui lòng hoàn tất thanh toán.");
        }
      } else {
        // Không có thông tin link/qr -> báo lỗi rõ ràng
        toast.error("Không nhận được link thanh toán.");
      }
    } catch {
      toast.error("Lỗi khi thực hiện thanh toán");
    }
  };



  const handleCancelPayment = async () => {
    try {
      if (!paymentInfo?.order_code) return;
      const res = await fetch(`${BASE_URL}/api/payment/cancel/${paymentInfo.order_code}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        toast.success("Đã hủy giao dịch thanh toán");
        setPaymentInfo((prev) => (prev ? { ...prev, status: "CANCELLED" } : prev));
        fetchData({ soft: true });
      } else {
        toast.error(json?.message || "Không thể hủy thanh toán");
      }
    } catch (e) {
      console.error("Cancel payment error", e);
      toast.error("Lỗi hủy thanh toán");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
      className="min-h-screen flex flex-col bg-gradient-to-br from-ev-green-light via-green-50/30 to-teal-50/20"
    >
      <Header onLogout={handleLogout} />
      <main className="flex-1 py-8">
        <div className="container max-w-[1200px] pt-20 space-y-6">
          {/* Hero / Header */}
          <div className="bg-gradient-to-r from-ev-green to-teal-500 text-white rounded-xl p-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                <Clock className="w-6 h-6" /> Lịch sử đặt lịch
              </h1>
              <p className="opacity-90 mt-1">Xem và quản lý lịch sử đặt lịch của bạn</p>
            </div>
            <Button variant="secondary" onClick={handleRefresh} className="gap-2" disabled={refreshing} aria-busy={refreshing}>
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} /> Làm mới
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card><CardContent className="p-4"><div className="text-sm text-muted-foreground">Tổng số lịch</div><div className="mt-1 font-bold text-xl flex items-center gap-2"><CalendarIcon className="w-5 h-5 text-primary" />{counters.all}</div></CardContent></Card>
            <Card><CardContent className="p-4"><div className="text-sm text-muted-foreground">Đợi ứng tiền</div><div className="mt-1 font-bold text-xl flex items-center gap-2"><Clock className="w-5 h-5 text-yellow-600" />{counters.pending}</div></CardContent></Card>
            <Card><CardContent className="p-4"><div className="text-sm text-muted-foreground">Đang sửa chữa</div><div className="mt-1 font-bold text-xl flex items-center gap-2"><PlayCircle className="w-5 h-5 text-blue-600" />{counters.inProgress}</div></CardContent></Card>
            <Card><CardContent className="p-4"><div className="text-sm text-muted-foreground">Hoàn thành</div><div className="mt-1 font-bold text-xl flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-emerald-600" />{counters.completed}</div></CardContent></Card>
            <Card><CardContent className="p-4"><div className="text-sm text-muted-foreground">Đã hủy</div><div className="mt-1 font-bold text-xl flex items-center gap-2"><XCircle className="w-5 h-5 text-rose-600" />{counters.canceled}</div></CardContent></Card>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-3 items-center">
                {/* Status */}
                <div className="w-full md:w-48">
                  <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Tất cả" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả</SelectItem>
                      <SelectItem value="pending">Đợi ứng tiền</SelectItem>
                      <SelectItem value="assigned">Đã sắp nhân viên</SelectItem>
                      <SelectItem value="check_in">Chờ báo giá</SelectItem>
                      <SelectItem value="in_progress">Đang sửa chữa</SelectItem>
                      <SelectItem value="repaired">Đã sửa xong</SelectItem>
                      <SelectItem value="completed">Đơn hoàn thành</SelectItem>
                      <SelectItem value="canceled">Đã hủy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* From - To */}
                <div className="flex items-center gap-2 w-full md:w-auto">
                  <input type="date" className="h-9 rounded-md border px-3 text-sm" value={fromDate} onChange={(e)=> setFromDate(e.target.value)} />
                  <span className="text-muted-foreground">→</span>
                  <input type="date" className="h-9 rounded-md border px-3 text-sm" value={toDate} onChange={(e)=> setToDate(e.target.value)} />
                </div>

                {/* Sort */}
                <div className="w-full md:w-52">
                  <Select value={sortKey} onValueChange={(v)=> setSortKey(v as SortKey)}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Không sắp xếp" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Không sắp xếp</SelectItem>
                      <SelectItem value="date_asc">Ngày tăng dần</SelectItem>
                      <SelectItem value="date_desc">Ngày giảm dần</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2 ml-auto">
                  <Button variant="outline" className="gap-2" onClick={handleClearFilters}><Trash2 className="w-4 h-4" /> Xóa bộ lọc</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Table */}
          <Card>
            <CardContent className="p-0 relative" aria-busy={refreshing}>
              <div className={`overflow-x-auto transition-opacity duration-200 ${refreshing ? "opacity-70" : "opacity-100"}`}>
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-muted-foreground">
                    <tr>
                      <th className="text-left px-4 py-3 w-12">STT</th>
                      <th className="text-left px-4 py-3">Ngày hẹn</th>
                      <th className="text-left px-4 py-3">Dịch vụ</th>
                      <th className="text-left px-4 py-3">Thời gian</th>
                      <th className="text-left px-4 py-3">Trạng thái</th>
                      <th className="text-left px-4 py-3">Số tiền còn lại</th>
                      <th className="text-left px-4 py-3">Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(initialLoad && loading) ? (
                      <>
                        {Array.from({ length: 5 }).map((_, i) => (
                          <tr key={i} className="border-b last:border-0">
                            <td className="px-4 py-3"><Skeleton className="h-4 w-8" /></td>
                            <td className="px-4 py-3"><Skeleton className="h-4 w-40" /></td>
                            <td className="px-4 py-3"><Skeleton className="h-4 w-48" /></td>
                            <td className="px-4 py-3"><Skeleton className="h-4 w-40" /></td>
                            <td className="px-4 py-3"><Skeleton className="h-6 w-24 rounded-full" /></td>
                            <td className="px-4 py-3"><Skeleton className="h-8 w-16" /></td>
                          </tr>
                        ))}
                      </>
                    ) : error ? (
                      <tr><td colSpan={6} className="px-4 py-6 text-center text-destructive">{error}</td></tr>
                    ) : visibleItems.length === 0 ? (
                      <tr><td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">Không có lịch hẹn phù hợp</td></tr>
                    ) : (
                      visibleItems.map((item, idx) => {
                        const row = idx + 1 + (page - 1) * limit;
                        const dateStr = item.appoinment_date ? format(new Date(item.appoinment_date), "dd/MM/yyyy (EEE)") : "—";
                        const timeRange = item.estimated_end_time ? `${item.appoinment_time || ""} - ${item.estimated_end_time}` : item.appoinment_time || "—";
                        const svcName = item.service_type_id?.service_name || "—";
                        const centerName = item.center_id?.name || item.center_id?.center_name || "";
                        const centerAddress = item.center_id?.address || "";
                        const st = statusLabel(item.status);
                        return (
                          <tr key={item._id} className="border-b last:border-0">
                            <td className="px-4 py-3">{row}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2"><CalendarIcon className="w-4 h-4" />{dateStr}</div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="font-medium">{svcName}</div>
                              <div className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" /> {centerName}{centerAddress ? ` · ${centerAddress}` : ""}</div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2"><Clock className="w-4 h-4" />{timeRange}</div>
                            </td>
                            <td className="px-4 py-3"><Badge variant={st.variant}>{st.text}</Badge></td>
                            <td className="px-4 py-3">
                              {(item.status === "repaired" && typeof item.final_cost === "number" && item.final_cost > 0)
                                ? item.final_cost.toLocaleString("vi-VN", { style: "currency", currency: "VND" })
                                : "—"}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <Button size="sm" variant="ghost" className="h-8 px-2" title="Xem chi tiết" onClick={() => handleViewDetail(item)}><Eye className="w-4 h-4" /></Button>
                                {(item.status === "pending" || item.status === "assigned") && (
                                  <></>
                                )}
                                {item.status === "pending" && (
                                  <Button size="sm" variant="ghost" className="h-8 px-2 text-red-600" title="Xóa" onClick={()=> handleDelete(item._id)}>
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                )}
                                {/* Nút thanh toán cho lịch đã sửa xong */}
                                {item.status === "repaired" && typeof item.final_cost === "number" && item.final_cost > 0 && (
                                  <Button size="sm" variant="default" className="h-8 px-3 text-white bg-emerald-600 hover:bg-emerald-700" onClick={() => handleFinalPayment(item)}>
                                    Thanh toán
                                  </Button>
                                )}
                              </div>
                            </td>


                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {refreshing && (
                <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent"></div>
                </div>
              )}

              {/* Pagination */}
              <div className="flex items-center justify-between p-4 text-sm text-muted-foreground">
                <div>
                  {visibleItems.length > 0 ? (
                    <span>
                      {`${(page - 1) * limit + 1}-${(page - 1) * limit + visibleItems.length}`} của {totalItems} kết quả
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
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />

      {/* Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Chi tiết lịch hẹn
            </DialogTitle>
          </DialogHeader>
          {selectedAppointment && (
            <div className="space-y-4">
              {/* Trạng thái */}
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                <span className="font-medium">Trạng thái:</span>
                <Badge variant={statusLabel(selectedAppointment.status).variant}>
                  {statusLabel(selectedAppointment.status).text}
                </Badge>
              </div>

              {/* Ngày hẹn */}
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-md">
                <CalendarIcon className="w-5 h-5 text-primary" />
                <div>
                  <div className="font-medium">Ngày hẹn</div>
                  <div className="text-sm text-muted-foreground">
                    {selectedAppointment.appoinment_date
                      ? format(new Date(selectedAppointment.appoinment_date), "dd/MM/yyyy (EEEE)")
                      : "Chưa xác định"}
                  </div>
                </div>
              </div>

              {/* Thời gian */}
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-md">
                <Clock className="w-5 h-5 text-primary" />
                <div>
                  <div className="font-medium">Thời gian</div>
                  <div className="text-sm text-muted-foreground">
                    {selectedAppointment.estimated_end_time
                      ? `${selectedAppointment.appoinment_time || ""} - ${selectedAppointment.estimated_end_time}`
                      : selectedAppointment.appoinment_time || "Chưa xác định"}
                  </div>
                </div>
              </div>

              {/* Dịch vụ */}
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-md">
                <Wrench className="w-5 h-5 text-primary" />
                <div>
                  <div className="font-medium">Dịch vụ</div>
                  <div className="text-sm text-muted-foreground">
                    {selectedAppointment.service_type_id?.service_name || "Chưa xác định"}
                  </div>
                </div>
              </div>

              {/* Trung tâm */}
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-md">
                <MapPin className="w-5 h-5 text-primary" />
                <div>
                  <div className="font-medium">Trung tâm</div>
                  <div className="text-sm text-muted-foreground">
                    {(() => {
                      const center = selectedAppointment.center_id;
                      const centerName = center?.center_name || center?.name;
                      const centerAddress = center?.address;
                      const centerId = center?._id;
                      if (centerName) {
                        return centerAddress ? `${centerName} (${centerAddress})` : centerName;
                      }
                      return centerId ? `Trung tâm: ${centerId}` : "Chưa xác định";
                    })()}
                  </div>
                </div>
              </div>

              {/* Mô tả/Ghi chú */}
              {selectedAppointment.notes && (
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-md">
                  <FileText className="w-5 h-5 text-primary" />
                  <div>
                    <div className="font-medium">Mô tả</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {selectedAppointment.notes}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <PaymentDialog
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        paymentInfo={paymentInfo}
        technician={
          selectedAppointment
            ? ((selectedAppointment as unknown as { technician_id?: { fullName?: string; phone?: string; email?: string } }).technician_id ||
               (selectedAppointment as unknown as { assigned?: { fullName?: string; phone?: string; email?: string } }).assigned)
            : null
        }
        onCancel={handleCancelPayment}
        onViewHistory={() => {
          setPaymentDialogOpen(false);
          fetchData({ soft: true });
        }}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bạn có chắc muốn xóa lịch hẹn này?</AlertDialogTitle>
            <AlertDialogDescription>
              Lịch hẹn chỉ có thể xóa được khi đang ở trạng thái pending. 
              Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
