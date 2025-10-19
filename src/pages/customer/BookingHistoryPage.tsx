import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, Clock, MapPin, Eye, Trash2, RefreshCw, CheckCircle2, XCircle, PlayCircle, ListChecks } from "lucide-react";
import Header from "@/components/MainLayout/Header";
import Footer from "@/components/MainLayout/Footer";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getMyAppointmentsApi, deleteAppointmentApi, Appointment } from "@/lib/appointmentApi";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

// Type guard and helpers
function toVNDate(dateStr?: string) {
  if (!dateStr) return "—";
  try { return new Date(dateStr).toLocaleDateString("vi-VN"); } catch { return dateStr; }
}

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
};

export default function BookingHistoryPage() {
  const [loading, setLoading] = useState(true);
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

  // Fetch data
  async function fetchData(opts?: { resetPage?: boolean }) {
    try {
      setLoading(true);
      setError(null);
      const reqPage = opts?.resetPage ? 1 : page;
      const res = await getMyAppointmentsApi({ page: reqPage, limit, status: statusFilter !== "all" ? statusFilter : undefined });
      if (!res.ok || !res.data?.data) {
        setItems([]);
        setTotalItems(0);
        setTotalPages(1);
        throw new Error(res.message || "Không thể tải dữ liệu lịch hẹn");
      }

      const data = res.data.data as any;
      const appts: MyAppointment[] = (data.items || data.appointments || []) as MyAppointment[];
      const p = data.pagination || {};
      // try to normalize pagination shape
      const currentPage = p.current_page ?? p.page ?? reqPage;
      const totalPagesN = p.total_pages ?? p.totalPages ?? 1;
      const totalDocs = p.total_items ?? p.totalDocs ?? appts.length;

      setItems(appts);
      setPage(currentPage);
      setTotalPages(totalPagesN);
      setTotalItems(totalDocs);
    } catch (e: any) {
      setError(e?.message || "Lỗi không xác định");
      toast({ title: "Lỗi", description: e?.message || "Không thể tải lịch hẹn", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
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

  const handleRefresh = () => fetchData();
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
      toast({ title: "Đã xóa lịch hẹn" });
      fetchData();
    } else {
      toast({ title: "Không thể xóa", description: res.message || "Vui lòng thử lại", variant: "destructive" });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    window.location.href = "/login";
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
            <Button variant="secondary" onClick={handleRefresh} className="gap-2">
              <RefreshCw className="w-4 h-4" /> Làm mới
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
                  <Button variant="default" className="gap-2" onClick={handleRefresh}><RefreshCw className="w-4 h-4" /> Tải lại</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-muted-foreground">
                    <tr>
                      <th className="text-left px-4 py-3 w-12">STT</th>
                      <th className="text-left px-4 py-3">Ngày hẹn</th>
                      <th className="text-left px-4 py-3">Dịch vụ</th>
                      <th className="text-left px-4 py-3">Thời gian</th>
                      <th className="text-left px-4 py-3">Trạng thái</th>
                      <th className="text-left px-4 py-3">Hành động</th>
                      <th className="text-left px-4 py-3">Đánh giá</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={7} className="px-4 py-6 text-center text-muted-foreground">Đang tải...</td></tr>
                    ) : error ? (
                      <tr><td colSpan={7} className="px-4 py-6 text-center text-destructive">{error}</td></tr>
                    ) : visibleItems.length === 0 ? (
                      <tr><td colSpan={7} className="px-4 py-6 text-center text-muted-foreground">Không có lịch hẹn phù hợp</td></tr>
                    ) : (
                      visibleItems.map((item, idx) => {
                        const row = idx + 1 + (page - 1) * limit;
                        const dateStr = item.appoinment_date ? format(new Date(item.appoinment_date), "dd/MM/yyyy (EEE)") : "—";
                        const timeRange = item.estimated_end_time ? `${item.appoinment_time || ""} - ${item.estimated_end_time}` : item.appoinment_time || "—";
                        const svcName = item.service_type_id?.service_name || "—";
                        const centerName = item.center_id?.name || item.center_id?.center_name || "";
                        const centerAddress = (item as any).center_id?.address || "";
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
                                <Button size="sm" variant="ghost" className="h-8 px-2" title="Xem chi tiết"><Eye className="w-4 h-4" /></Button>
                                {item.status === "pending" && (
                                  <Button size="sm" variant="ghost" className="h-8 px-2 text-red-600" title="Xóa" onClick={()=> handleDelete(item._id)}>
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3">-</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

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
    </motion.div>
  );
}
