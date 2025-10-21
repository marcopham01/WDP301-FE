import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, CreditCard, Eye, Clock, RefreshCw, Trash2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Header from "@/components/MainLayout/Header";
import Footer from "@/components/MainLayout/Footer";
import { getMyTransactionsApi, getAllMyTransactionsApi, Transaction, Pagination } from "@/lib/paymentApi";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

const PaymentHistoryPage = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Fetch all transactions for statistics
  async function fetchAllTransactions() {
    try {
      const res = await getAllMyTransactionsApi();
      if (res.ok && res.data?.data) {
        const data = res.data.data as { items?: Transaction[]; transactions?: Transaction[] };
        const txns: Transaction[] = (data.items || data.transactions || []) ?? [];
        setAllTransactions(txns);
      }
    } catch (e: unknown) {
      console.error("Error fetching all transactions:", e);
    }
  }

  // Fetch paginated data
  async function fetchData(opts?: { resetPage?: boolean; soft?: boolean }) {
    try {
      if (opts?.soft) setRefreshing(true); else setLoading(true);
      setError(null);
      const reqPage = opts?.resetPage ? 1 : page;
      const res = await getMyTransactionsApi({
        page: reqPage,
        limit,
        status: statusFilter !== "all" ? (statusFilter as "pending" | "paid" | "cancelled") : undefined,
      });

      if (!res.ok || !res.data?.data) {
        setTransactions([]);
        setTotalItems(0);
        setTotalPages(1);
        throw new Error(res.message || "Không thể tải dữ liệu thanh toán");
      }

  const data = res.data.data as { items?: Transaction[]; transactions?: Transaction[]; pagination?: Partial<Pagination> };
  const txns: Transaction[] = (data.items || data.transactions || []) ?? [];
  const p = data.pagination || {};
  const pSnake = p as Record<string, number | undefined>;
  const currentPage = pSnake.current_page ?? (p as { page?: number }).page ?? reqPage;
  const totalPagesN = pSnake.total_pages ?? (p as { totalPages?: number }).totalPages ?? 1;
  const totalDocs = pSnake.total_items ?? (p as { totalDocs?: number }).totalDocs ?? txns.length;

      setTransactions(txns);
      setPage(currentPage);
      setTotalPages(totalPagesN);
      setTotalItems(totalDocs);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Lỗi không xác định";
      setError(message);
      toast({ title: "Lỗi", description: message || "Không thể tải thanh toán", variant: "destructive" });
    } finally {
      if (opts?.soft) setRefreshing(false); else setLoading(false);
      if (initialLoad) setInitialLoad(false);
    }
  }

  useEffect(() => {
    fetchAllTransactions();
    fetchData({ soft: !initialLoad });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, statusFilter]);

  const handleRefresh = () => fetchData({ soft: true });
  const handleClearFilters = () => {
    setStatusFilter("all");
    setPage(1);
    fetchData({ resetPage: true });
  };

  // Counters - use allTransactions for stats
  const counters = useMemo(() => {
    const paidTxns = allTransactions.filter(t => t.status === "paid");
    const pendingTxns = allTransactions.filter(t => t.status === "pending");
    const cancelledTxns = allTransactions.filter(t => t.status === "cancelled");

    const paidAmount = paidTxns.reduce((sum, t) => sum + t.amount, 0);
    const pendingCount = pendingTxns.length;
    const cancelledCount = cancelledTxns.length;
    const totalCount = allTransactions.length;

    return { paidAmount, pendingCount, cancelledCount, totalCount };
  }, [allTransactions]);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Chờ thanh toán', variant: 'secondary' as const },
      paid: { label: 'Đã thanh toán', variant: 'default' as const },
      cancelled: { label: 'Đã hủy', variant: 'destructive' as const }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;

    return (
      <Badge variant={config.variant} className="capitalize">
        {config.label}
      </Badge>
    );
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    window.location.href = "/login";
  };

  if (initialLoad && loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

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
                <CreditCard className="w-6 h-6" /> Lịch sử thanh toán
              </h1>
              <p className="opacity-90 mt-1">Xem và quản lý lịch sử thanh toán của bạn</p>
            </div>
            <Button variant="secondary" onClick={handleRefresh} className="gap-2" disabled={refreshing} aria-busy={refreshing}>
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} /> Làm mới
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">Đã thanh toán</div>
                <div className="mt-1 font-bold text-xl flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-green-600" />
                  {formatPrice(counters.paidAmount)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">Chờ thanh toán</div>
                <div className="mt-1 font-bold text-xl flex items-center gap-2">
                  <Clock className="w-5 h-5 text-orange-600" />
                  {counters.pendingCount}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">Tổng giao dịch</div>
                <div className="mt-1 font-bold text-xl flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  {counters.totalCount}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">Đã hủy/Thất bại</div>
                <div className="mt-1 font-bold text-xl flex items-center gap-2">
                  <Trash2 className="w-5 h-5 text-red-600" />
                  {counters.cancelledCount}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="p-0 relative" aria-busy={refreshing}>
              <div className="flex flex-col md:flex-row gap-3 items-center">
                {/* Status */}
                <div className="w-full md:w-48">
                  <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Tất cả" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả</SelectItem>
                      <SelectItem value="pending">Chờ thanh toán</SelectItem>
                      <SelectItem value="paid">Đã thanh toán</SelectItem>
                      <SelectItem value="cancelled">Đã hủy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2 ml-auto">
                  <Button variant="outline" className="gap-2" onClick={handleClearFilters}>
                    <Trash2 className="w-4 h-4" /> Xóa bộ lọc
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transactions List */}
          <Card>
            <CardContent className="p-0 relative" aria-busy={refreshing}>
              {error ? (
                <div className="px-4 py-6 text-center text-destructive">{error}</div>
              ) : transactions.length === 0 ? (
                <div className="px-4 py-12 text-center">
                  <CreditCard className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Không có giao dịch nào</h3>
                  <p className="text-muted-foreground mb-4">
                    {statusFilter === 'all'
                      ? 'Bạn chưa có giao dịch thanh toán nào.'
                      : `Không có giao dịch nào ở trạng thái "${statusFilter}".`
                    }
                  </p>
                </div>
              ) : (
                <div className={`overflow-x-auto transition-opacity duration-200 ${refreshing ? "opacity-70" : "opacity-100"}`}>
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 text-muted-foreground">
                      <tr>
                        <th className="text-left px-4 py-3">Mã đơn hàng</th>
                        <th className="text-left px-4 py-3">Dịch vụ & Thông tin</th>
                        <th className="text-left px-4 py-3">Số tiền</th>
                        <th className="text-left px-4 py-3">Trạng thái</th>
                        <th className="text-left px-4 py-3">Hành động</th>
                        <th className="text-left px-4 py-3">Ngày tạo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((txn) => (
                        <tr key={txn._id} className="border-b last:border-0">
                          <td className="px-4 py-3 font-medium">{txn.order_code}</td>
                          <td className="px-4 py-3">
                            <div className="font-medium">{txn.description}</div>
                            <div className="text-xs text-muted-foreground">{txn.description}</div>
                          </td>
                          <td className="px-4 py-3 font-semibold text-primary">{formatPrice(txn.amount)}</td>
                          <td className="px-4 py-3">{getStatusBadge(txn.status)}</td>
                          <td className="px-4 py-3">
                            <Button size="sm" variant="ghost" className="h-8 px-2" title="Xem chi tiết">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">
                            {format(new Date(txn.createdAt), "dd/MM/yyyy HH:mm")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {refreshing && (
                <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent"></div>
                </div>
              )}

              {/* Pagination */}
              {transactions.length > 0 && (
                <div className="flex items-center justify-between p-4 text-sm text-muted-foreground">
                  <div>
                    {transactions.length > 0 ? (
                      <span>
                        {`${(page - 1) * limit + 1}-${(page - 1) * limit + transactions.length}`} của {totalItems} kết quả
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
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </motion.div>
  );
};

export default PaymentHistoryPage;
