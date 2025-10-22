import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, Clock, MapPin, Eye, Trash2, RefreshCw, CheckCircle2, XCircle, PlayCircle, ListChecks } from "lucide-react";
import Header from "@/components/MainLayout/Header";
import Footer from "@/components/MainLayout/Footer";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getMyAppointmentsApi, deleteAppointmentApi, Appointment } from "@/lib/appointmentApi";
import { toast } from "react-toastify";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

// Type guard and helpers
// (removed unused toVNDate helper)

function statusLabel(s?: string) {
  switch (s) {
    case "pending": return { text: "Chờ xác nhận", variant: "secondary" as const };
    case "accepted": return { text: "Đã xác nhận", variant: "default" as const };
    case "assigned": return { text: "Đã phân công", variant: "outline" as const };
    case "deposited": return { text: "Đã đặt cọc", variant: "outline" as const };
    case "in_progress": return { text: "Đang thực hiện", variant: "default" as const };
    case "completed": return { text: "Hoàn thành", variant: "default" as const };
    case "paid": return { text: "Đã thanh toán", variant: "default" as const };
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
};

export default function BookingHistoryPage() {
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

  // Derived counters (from current page data)
  const counters = useMemo(() => {
    const all = items.length;
    const accepted = items.filter(i => i.status === "accepted").length;
    const inProgress = items.filter(i => i.status === "in_progress").length;
    const completed = items.filter(i => i.status === "completed" || i.status === "paid").length;
    const canceled = items.filter(i => i.status === "canceled" || i.status === "cancelled").length;
    return { all, accepted, inProgress, completed, canceled };
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

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa lịch hẹn này? Chỉ xóa được khi trạng thái pending.")) return;
    const res = await deleteAppointmentApi(id);
    if (res.ok) {
      toast.success("Đã xóa lịch hẹn");
      fetchData();
    } else {
      toast.error(res.message || "Không thể xóa. Vui lòng thử lại");
    }
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
      className="min-h-screen flex flex-col"
    >
      <Header onLogout={handleLogout} />
      <main className="flex-1 py-8">
        <div className="container max-w-[1200px] pt-20 space-y-6">
          {/* Hero / Header */}
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl p-6 flex items-center justify-between">
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
            <Card><CardContent className="p-4"><div className="text-sm text-muted-foreground">Đã xác nhận</div><div className="mt-1 font-bold text-xl flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-green-600" />{counters.accepted}</div></CardContent></Card>
            <Card><CardContent className="p-4"><div className="text-sm text-muted-foreground">Đang thực hiện</div><div className="mt-1 font-bold text-xl flex items-center gap-2"><PlayCircle className="w-5 h-5 text-yellow-600" />{counters.inProgress}</div></CardContent></Card>
            <Card><CardContent className="p-4"><div className="text-sm text-muted-foreground">Hoàn thành</div><div className="mt-1 font-bold text-xl flex items-center gap-2"><ListChecks className="w-5 h-5 text-emerald-600" />{counters.completed}</div></CardContent></Card>
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
                      <SelectItem value="pending">Chờ xác nhận</SelectItem>
                      <SelectItem value="accepted">Đã xác nhận</SelectItem>
                      <SelectItem value="deposited">Đã đặt cọc</SelectItem>
                      <SelectItem value="assigned">Đã phân công</SelectItem>
                      <SelectItem value="in_progress">Đang thực hiện</SelectItem>
                      <SelectItem value="completed">Hoàn thành</SelectItem>
                      <SelectItem value="paid">Đã thanh toán</SelectItem>
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
                              <div className="flex items-center gap-2">
                                <Button size="sm" variant="ghost" className="h-8 px-2" title="Xem chi tiết" onClick={() => handleViewDetail(item)}><Eye className="w-4 h-4" /></Button>
                                {item.status === "pending" && (
                                  <Button size="sm" variant="ghost" className="h-8 px-2 text-red-600" title="Xóa" onClick={()=> handleDelete(item._id)}>
                                    <Trash2 className="w-4 h-4" />
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
              <div className="p-3 bg-muted/50 rounded-md">
                <div className="font-medium">Dịch vụ</div>
                <div className="text-sm text-muted-foreground">
                  {selectedAppointment.service_type_id?.service_name || "Chưa xác định"}
                </div>
              </div>

              {/* Trung tâm */}
              <div className="p-3 bg-muted/50 rounded-md">
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

              {/* Mô tả/Ghi chú */}
              {selectedAppointment.notes && (
                <div className="p-3 bg-muted/50 rounded-md">
                  <div className="font-medium">Mô tả</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {selectedAppointment.notes}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
