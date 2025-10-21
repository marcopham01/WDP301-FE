import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Header from "@/components/MainLayout/Header";
import Footer from "@/components/MainLayout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle } from "lucide-react";
import { updateAppointmentStatusApi, getMyAppointmentsApi } from "@/lib/appointmentApi";

interface TransactionData {
  _id?: string;
  order_code?: number;
  amount?: number;
  status?: string;
  description?: string;
}

const PaymentCancelPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderCode = searchParams.get("order_code");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tx, setTx] = useState<TransactionData | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!orderCode) {
      setError("Thiếu mã đơn hàng (order_code)");
      setLoading(false);
      return;
    }

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;

    const run = async () => {
      try {
        // Update status to 'cancelled'
        await fetch("/api/payment/update-status", {
          method: "POST",
          headers,
          body: JSON.stringify({ order_code: Number(orderCode), status: "cancelled" }),
        });

        // Fetch transaction details
        const res = await fetch(`/api/payment/transaction/${encodeURIComponent(orderCode)}`, {
          method: "GET",
          headers,
        });
        let data: Record<string, unknown> | null = null;
        try { data = await res.json(); } catch { data = null; }
        if (!res.ok) {
          setError((data as Record<string, unknown>)?.message as string || "Không thể lấy thông tin giao dịch");
        } else {
          setTx((data as Record<string, unknown>)?.data as TransactionData || null);

          // Find appointment by payment_id and update its status to 'canceled'
          try {
            const paymentId = (data as Record<string, unknown>)?.data?._id as string;
            if (paymentId) {
              // Add a small delay to ensure backend has processed the payment status update
              await new Promise(resolve => setTimeout(resolve, 500));

              // Get all appointments to find the one with matching payment_id
              const appointmentsRes = await getMyAppointmentsApi({ limit: 100 });
              if (appointmentsRes.ok && appointmentsRes.data?.data) {
                const appointmentsList = (appointmentsRes.data?.data as Record<string, unknown>)?.items as Record<string, unknown>[] ||
                                        (appointmentsRes.data?.data as Record<string, unknown>)?.appointments as Record<string, unknown>[] || [];
                const appointment = appointmentsList.find((apt: Record<string, unknown>) => {
                  // Check if payment_id is an object with _id property or a string
                  const aptPaymentId = (apt.payment_id as Record<string, unknown>)?._id || apt.payment_id;
                  return String(aptPaymentId) === String(paymentId);
                });
                if (appointment) {
                  await updateAppointmentStatusApi({
                    appointment_id: (appointment as Record<string, unknown>)._id as string,
                    status: "canceled"
                  });
                }
              }
            }
          } catch {
            console.error("Failed to update appointment status");
            // Don't show error to user, payment cancellation is still successful
          }
        }
      } catch {
        setError("Lỗi kết nối máy chủ");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [orderCode]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header onLogout={() => { localStorage.removeItem("accessToken"); navigate("/login"); }} />
      <main className="flex-1 py-8">
        <div className="container max-w-2xl pt-20">
          <Card>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-2">
                <XCircle className="h-12 w-12 text-red-600" />
              </div>
              <CardTitle>Thanh toán bị hủy</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center text-muted-foreground">Đang xử lý...</div>
              ) : error ? (
                <div className="text-center text-destructive">{error}</div>
              ) : (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span>Mã đơn hàng:</span><span className="font-medium">{tx?.order_code || orderCode}</span></div>
                  <div className="flex justify-between"><span>Số tiền:</span><span className="font-semibold text-primary">{tx?.amount ? tx.amount.toLocaleString("vi-VN") + " VND" : "—"}</span></div>
                  <div className="flex justify-between"><span>Trạng thái:</span><span className="font-medium capitalize">{tx?.status || "cancelled"}</span></div>
                  {tx?.description && (<div className="flex justify-between"><span>Mô tả:</span><span className="font-medium">{tx.description}</span></div>)}
                </div>
              )}

              <div className="mt-6 flex gap-2 justify-center">
                <Button onClick={() => navigate("/")}>Về trang chủ</Button>
                <Button variant="outline" onClick={() => navigate("/booking")}>Đặt lại</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PaymentCancelPage;
