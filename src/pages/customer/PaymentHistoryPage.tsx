import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, CreditCard, Eye, Clock, RefreshCw, Trash2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import Header from "@/components/MainLayout/Header";
import Footer from "@/components/MainLayout/Footer";
import { getMyTransactionsApi, getAllMyTransactionsApi, retryPaymentApi, cancelPaymentApi, Transaction, Pagination, normalizeTransaction, RetryPaymentResponse } from "@/lib/paymentApi";
import { toast } from "react-toastify";
import { format } from "date-fns";
import { useSearchParams } from "react-router-dom";
import { PaymentDialog } from "@/components/customer/PaymentDialog";

const PaymentHistoryPage = () => {
  const [searchParams] = useSearchParams();
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
  const [selectedTxn, setSelectedTxn] = useState<Transaction | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  // Global retrying flag + specific payment being retried to prevent double-click race
  const [retrying, setRetrying] = useState(false);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);  // Fetch all transactions for statistics
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
      const statusParam = statusFilter !== "all" ? (statusFilter.toUpperCase() as Transaction["status"]) : undefined;
      const res = await getMyTransactionsApi({
        page: reqPage,
        limit,
        status: statusParam,
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
  toast.error(message || "Không thể tải thanh toán");
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

  // Auto refresh when coming back from payment
  useEffect(() => {
    const fromPayment = searchParams.get('from');
    if (fromPayment === 'payment') {
      // Refresh data after a short delay to ensure backend has updated
      setTimeout(() => {
        fetchData({ soft: true });
        fetchAllTransactions();
      }, 1000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleRefresh = () => fetchData({ soft: true });
  const handleClearFilters = () => {
    setStatusFilter("all");
    setPage(1);
    fetchData({ resetPage: true });
  };

  // Counters - use allTransactions for stats
  const counters = useMemo(() => {
    const paidTxns = allTransactions.filter(t => (t.status || "").toUpperCase() === "PAID");
    const pendingTxns = allTransactions.filter(t => (t.status || "").toUpperCase() === "PENDING");
    const cancelledTxns = allTransactions.filter(t => {
      const s = (t.status || "").toUpperCase();
      return s === "CANCELLED" || s === "FAILED" || s === "EXPIRED" || s === "TIMEOUT";
    });

    const paidAmount = paidTxns.reduce((sum, t) => sum + t.amount, 0);
    const pendingCount = pendingTxns.length;
    const cancelledCount = cancelledTxns.length;
    const totalCount = allTransactions.length;

    return { paidAmount, pendingCount, cancelledCount, totalCount };
  }, [allTransactions]);

  const getStatusBadge = (raw: string) => {
    const status = raw?.toUpperCase() || "PENDING";
    const map: Record<string, { label: string; className: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      PENDING: { label: "Đang chờ", variant: "secondary", className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100" },
      PAID: { label: "Đã thanh toán", variant: "default", className: "bg-green-100 text-green-800 hover:bg-green-100" },
      FAILED: { label: "Thất bại", variant: "destructive", className: "bg-red-100 text-red-800 hover:bg-red-100" },
      CANCELLED: { label: "Đã hủy", variant: "destructive", className: "bg-red-100 text-red-800 hover:bg-red-100" },
      EXPIRED: { label: "Hết hạn (link)\n", variant: "destructive", className: "bg-red-100 text-red-800 hover:bg-red-100" },
      TIMEOUT: { label: "Quá thời gian", variant: "destructive", className: "bg-orange-100 text-orange-800 hover:bg-orange-100" },
    };
    const cfg = map[status] || map.PENDING;
    return <Badge variant={cfg.variant} className={cfg.className}>{cfg.label}</Badge>;
  };

  const openPaymentDialog = (txn: Transaction) => {
    const normalized = normalizeTransaction(txn);
    setSelectedTxn(normalized);
    setShowPaymentDialog(true);
  };

  const isPending = (status: string) => status.toUpperCase() === "PENDING";
  const canPayStatus = (status: string) => ["PENDING", "FAILED", "CANCELLED", "EXPIRED", "TIMEOUT"].includes(status.toUpperCase());
  
  // Helper để phân biệt text button
  const getPaymentButtonText = (status: string) => {
    return status.toUpperCase() === "PENDING" ? "Thanh toán" : "Thanh toán lại";
  };

  const handleRetry = async (txn: Transaction) => {
    // Guard: prevent duplicate clicks while retrying the same transaction
    if (retrying && retryingId === txn._id) {
      return;
    }
    try {
      setRetrying(true);
      setRetryingId(txn._id);
      const res = await retryPaymentApi(txn._id);
      if (res.ok && res.data?.data) {
          toast.success("Tạo lại giao dịch thành công");
        fetchData({ soft: true });
  const data: RetryPaymentResponse["data"] = res.data.data as RetryPaymentResponse["data"];
        const updated: Transaction = {
          ...txn,
          orderCode: data.newOrderCode,
          order_code: data.newOrderCode,
          checkoutUrl: data.checkoutUrl,
          checkout_url: data.checkoutUrl,
          qrCode: data.qrCode,
          qr_code: data.qrCode,
          status: "PENDING" as Transaction["status"],
          timeoutAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        };
        openPaymentDialog(updated);
      } else {
          toast.error(res.message || "Không thể thanh toán lại");
      }
    } catch (e) {
      console.error("Retry payment error", e);
      toast.error("Lỗi tạo lại thanh toán");
    } finally {
      setRetrying(false);
      setRetryingId(null);
    }
  };

  const handleCancelPayment = async (txn: Transaction) => {
    try {
      setCancelling(true);
  const order = txn.order_code || txn.orderCode;
      if (!order) return;
      const res = await cancelPaymentApi(order);
      if (res.ok) {
        toast.success("Đã hủy giao dịch");
        fetchData({ soft: true });
        if (selectedTxn?._id === txn._id) {
          setSelectedTxn({ ...selectedTxn, status: "CANCELLED" } as Transaction);
        }
      } else {
        toast.error(res.message || "Không thể hủy");
      }
    } catch (e) {
      console.error("Cancel payment error", e);
      toast.error("Lỗi hủy giao dịch");
    } finally {
      setCancelling(false);
    }
  };

  const isTxnExpired = (txn: Transaction) => {
    const t = txn.timeoutAt || txn.expiredAt || txn.timeout_at || txn.expired_at;
    if (!t) return false;
    return new Date(t).getTime() <= Date.now();
  };

  const handlePayNow = (txn: Transaction) => openPaymentDialog(txn);

  const handleViewPaymentDetail = (txn: Transaction) => {
    const normalized = normalizeTransaction(txn);
    console.log("🔍 View Detail - Original:", txn);
    console.log("🔍 View Detail - Normalized:", normalized);
    console.log("🔍 Order Code:", normalized.orderCode, normalized.order_code);
    setSelectedTxn(normalized);
    setShowDetailDialog(true);
  };



    const handlePayment = async (txn: Transaction) => {
      const pending = isPending(txn.status);
      const expiredNow = isTxnExpired(txn);
      if (pending) {
        if (expiredNow) {
          toast.info("Liên kết đã hết hạn. Đang tạo lại giao dịch mới...");
          await handleRetry(txn); // tạo giao dịch mới
        } else {
          toast.info("Tiếp tục thanh toán giao dịch hiện tại");
          openPaymentDialog(txn);
        }
        return;
      }
      // Các trạng thái khác: tạo giao dịch mới
      await handleRetry(txn);
    };
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    toast.success("Đăng xuất thành công!");
    setTimeout(() => {
      window.location.href = "/login";
    }, 1000);
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
      className="min-h-screen flex flex-col bg-gradient-to-br from-ev-green-light via-green-50/30 to-teal-50/20"
    >
      <Header onLogout={handleLogout} />
      <main className="flex-1 py-8">
        <div className="container max-w-[1200px] pt-20 space-y-6">
          {/* Hero / Header */}
          <div className="bg-gradient-to-r from-ev-green to-teal-500 text-white rounded-xl p-6 flex items-center justify-between">
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
                        <th className="text-left px-4 py-3 font-medium">Mã đơn hàng</th>
                        <th className="text-left px-4 py-3 font-medium">Dịch vụ & Trung tâm</th>
                        <th className="text-left px-4 py-3 font-medium">Số tiền</th>
                        <th className="text-left px-4 py-3 font-medium">Trạng thái</th>
                        <th className="text-left px-4 py-3 font-medium">Ngày tạo</th>
                        <th className="text-left px-4 py-3 font-medium">Thời gian hẹn</th>
                        <th className="text-left px-4 py-3 font-medium">Hành động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((txn) => {
                        const normalized = normalizeTransaction(txn);
                        const orderCode = normalized.orderCode || normalized.order_code;
                        const timeoutAt = normalized.timeoutAt || normalized.timeout_at;
                        return (
                        <tr key={txn._id} className="border-b last:border-0 hover:bg-muted/30">
                          <td className="px-4 py-3">
                            <span className="text-ev-green font-medium">#{orderCode || '--'}</span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-medium">{txn.description}</div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {txn.description}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-semibold text-primary">{formatPrice(txn.amount)}</span>
                          </td>
                          <td className="px-4 py-3">{getStatusBadge(txn.status)}</td>
                          <td className="px-4 py-3">
                            <div className="text-sm">{format(new Date(txn.createdAt), "dd/MM/yyyy")}</div>
                            <div className="text-xs text-muted-foreground">{format(new Date(txn.createdAt), "HH:mm")}</div>
                          </td>
                          <td className="px-4 py-3">
                            {timeoutAt ? (
                              <>
                                <div className="text-sm">{format(new Date(timeoutAt), "dd/MM/yyyy")}</div>
                                <div className="text-xs text-muted-foreground">{format(new Date(timeoutAt), "HH:mm")}</div>
                              </>
                            ) : (
                              <span className="text-xs text-muted-foreground">--</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {isPending(txn.status) && txn.checkout_url && !isTxnExpired(txn) ? (
                                <>
                                  <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    className="h-8 px-2 hover:bg-green-50" 
                                    title="Xem chi tiết thanh toán"
                                    onClick={() => handleViewPaymentDetail(txn)}
                                  >
                                    <Eye className="w-4 h-4 text-ev-green" />
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="default"
                                    className="h-8 px-3 bg-gradient-to-r from-ev-green to-teal-500 hover:from-green-700 hover:to-teal-600 text-white gap-1" 
                                    title="Thanh toán ngay"
                                    onClick={() => handlePayNow(txn)}
                                  >
                                    <CreditCard className="w-4 h-4" />
                                    Thanh toán
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 px-2 text-red-600"
                                    disabled={cancelling || retrying}
                                    title="Hủy giao dịch"
                                    onClick={() => handleCancelPayment(txn)}
                                  >
                                    {cancelling ? "Đang hủy..." : "Hủy"}
                                  </Button>
                                </>
                              ) : (isPending(txn.status) && isTxnExpired(txn)) ? (
                                <>
                                  <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    className="h-8 px-2 hover:bg-green-50" 
                                    title="Xem chi tiết thanh toán"
                                    onClick={() => handleViewPaymentDetail(txn)}
                                  >
                                    <Eye className="w-4 h-4 text-ev-green" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 px-2 text-orange-600 border-orange-300"
                                    disabled={retrying && retryingId === txn._id}
                                    title="Liên kết hết hạn - tạo lại"
                                    onClick={() => handlePayment(txn)}
                                  >
                                    {(retrying && retryingId === txn._id) ? "Đang xử lý..." : "Tạo lại giao dịch"}
                                  </Button>
                                </>
                              ) : canPayStatus(txn.status) ? (
                                <>
                                  <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    className="h-8 px-2 hover:bg-green-50" 
                                    title="Xem chi tiết thanh toán"
                                    onClick={() => handleViewPaymentDetail(txn)}
                                  >
                                    <Eye className="w-4 h-4 text-ev-green" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 px-2 text-blue-600"
                                    disabled={retrying && retryingId === txn._id}
                                    title={getPaymentButtonText(txn.status)}
                                      onClick={() => handlePayment(txn)}
                                  >
                                    {(retrying && retryingId === txn._id) ? "Đang xử lý..." : getPaymentButtonText(txn.status)}
                                  </Button>
                                </>
                              ) : (
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="h-8 px-2 hover:bg-green-50" 
                                  title="Xem chi tiết"
                                  onClick={() => handleViewPaymentDetail(txn)}
                                >
                                  <Eye className="w-4 h-4 text-ev-green" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                      })}
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

       {/* Payment Dialog - Using shared component */}
       <PaymentDialog
         open={showPaymentDialog}
         onOpenChange={setShowPaymentDialog}
         paymentInfo={selectedTxn ? {
           amount: selectedTxn.amount,
           checkout_url: selectedTxn.checkoutUrl || selectedTxn.checkout_url,
           qr_code: selectedTxn.qrCode || selectedTxn.qr_code,
           order_code: selectedTxn.orderCode || selectedTxn.order_code,
           timeoutAt: selectedTxn.timeoutAt || selectedTxn.timeout_at,
           status: selectedTxn.status,
           description: selectedTxn.description,
         } : null}
         technician={null}
         onCancel={selectedTxn ? () => handleCancelPayment(selectedTxn) : undefined}
         onViewHistory={() => {
           setShowPaymentDialog(false);
           // Already on history page, just refresh
           fetchData({ soft: true });
         }}
       />

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Chi tiết thanh toán</DialogTitle>
            <DialogDescription>
              Thông tin chi tiết giao dịch #{selectedTxn?.order_code}
            </DialogDescription>
          </DialogHeader>
          {selectedTxn && (
            <div className="space-y-4">
              {/* Thông tin thanh toán */}
              <div className="space-y-3 rounded-lg bg-muted/30 p-3">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase">Thông tin thanh toán</h3>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm">
                  <div className="space-y-0.5">
                    <div className="text-[11px] text-muted-foreground">Mã đơn hàng</div>
                    <button
                      type="button"
                      onClick={async () => { 
                        const code = selectedTxn.orderCode || selectedTxn.order_code;
                        await navigator.clipboard.writeText(String(code)); 
                        toast.success('Đã sao chép'); 
                      }}
                      className="inline-flex items-center rounded border bg-blue-50 px-1.5 py-0.5 text-[11px] font-semibold text-blue-700 hover:bg-blue-100 transition"
                      title="Sao chép"
                    >
                      #{selectedTxn.orderCode || selectedTxn.order_code || 'N/A'}
                    </button>
                  </div>
                  <div className="space-y-0.5">
                    <div className="text-[11px] text-muted-foreground">Trạng thái</div>
                    <div>{getStatusBadge(selectedTxn.status)}</div>
                  </div>
                  <div className="space-y-0.5">
                    <div className="text-[11px] text-muted-foreground">Số tiền</div>
                    <div className="text-ev-green font-bold">{formatPrice(selectedTxn.amount)}</div>
                  </div>
                  <div className="space-y-0.5">
                    <div className="text-[11px] text-muted-foreground">Phương thức</div>
                    <div className="text-xs font-medium">PAYOS</div>
                  </div>
                  <div className="space-y-0.5 col-span-2">
                    <div className="text-[11px] text-muted-foreground">Mô tả</div>
                    <div className="text-xs leading-relaxed">{selectedTxn.description || '---'}</div>
                  </div>
                </div>
              </div>

              {/* Thông tin giao dịch */}
              <div className="space-y-3 rounded-lg bg-muted/30 p-3">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase">Thông tin giao dịch</h3>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div className="space-y-0.5">
                    <div className="text-[11px] text-muted-foreground">Phí giao dịch</div>
                    <div className="text-xs font-medium">0 ₫</div>
                  </div>
                  <div className="space-y-0.5">
                    <div className="text-[11px] text-muted-foreground">Webhook</div>
                    <div className="inline-flex items-center rounded border border-yellow-400 bg-yellow-50 px-1.5 py-0.5 text-[10px] font-medium text-yellow-700">Chưa nhận</div>
                  </div>
                </div>
              </div>

              {/* Lịch sử thanh toán */}
              <div className="space-y-2.5 rounded-lg bg-muted/30 p-3">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase">Lịch sử thanh toán</h3>
                <ol className="space-y-2 text-xs">
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                    <div className="flex-1 leading-tight">
                      <div className="font-medium">Tạo thanh toán</div>
                      <div className="text-[11px] text-muted-foreground">{format(new Date(selectedTxn.createdAt), 'dd/MM/yyyy HH:mm')}</div>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-slate-400 flex-shrink-0" />
                    <div className="flex-1 leading-tight">
                      <div className="font-medium">Cập nhật cuối</div>
                      <div className="text-[11px] text-muted-foreground">{format(new Date(selectedTxn.updatedAt), 'dd/MM/yyyy HH:mm')}</div>
                    </div>
                  </li>
                  {selectedTxn.paid_at && (
                    <li className="flex items-start gap-2">
                      <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-green-500 flex-shrink-0" />
                      <div className="flex-1 leading-tight">
                        <div className="font-medium">Đã thanh toán</div>
                        <div className="text-[11px] text-muted-foreground">{format(new Date(selectedTxn.paid_at), 'dd/MM/yyyy HH:mm')}</div>
                      </div>
                    </li>
                  )}
                  {(selectedTxn.timeout_at || selectedTxn.expired_at) && (
                    <li className="flex items-start gap-2">
                      <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-red-500 flex-shrink-0" />
                      <div className="flex-1 leading-tight">
                        <div className="font-medium">Hết hạn</div>
                        <div className="text-[11px] text-muted-foreground">{format(new Date(selectedTxn.timeout_at || selectedTxn.expired_at as string), 'dd/MM/yyyy HH:mm')}</div>
                      </div>
                    </li>
                  )}
                </ol>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setShowDetailDialog(false)}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default PaymentHistoryPage;
