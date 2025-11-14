import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getPaymentTransactionApi } from "@/lib/paymentApi";

export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentData, setPaymentData] = useState<{
    orderCode?: number;
    amount?: number;
    status?: string;
    description?: string;
  } | null>(null);

  useEffect(() => {
    const orderCode = searchParams.get("orderCode");
    
    if (!orderCode) {
      setError("Không tìm thấy mã đơn hàng");
      setLoading(false);
      return;
    }

    // Verify payment status from backend
    const verifyPayment = async () => {
      try {
        const res = await getPaymentTransactionApi(parseInt(orderCode));
        if (res.ok && res.data?.data) {
          setPaymentData({
            orderCode: res.data.data.order_code,
            amount: res.data.data.amount,
            status: res.data.data.status,
            description: res.data.data.description,
          });
        } else {
          setError("Không thể xác minh trạng thái thanh toán");
        }
      } catch (e) {
        console.error("Verify payment error:", e);
        setError("Lỗi kết nối đến server");
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [searchParams]);

  const handleGoToBookingHistory = () => {
    navigate("/customer/booking-history");
  };

  const handleGoToHome = () => {
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-ev-green" />
              <p className="text-sm text-muted-foreground">Đang xác minh thanh toán...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="w-full max-w-md border-red-200">
            <CardHeader>
              <div className="flex items-center gap-3">
                <XCircle className="h-8 w-8 text-red-500" />
                <CardTitle className="text-red-700">Có lỗi xảy ra</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">{error}</p>
              <div className="flex gap-2">
                <Button onClick={handleGoToHome} variant="outline" className="flex-1">
                  Về trang chủ
                </Button>
                <Button onClick={handleGoToBookingHistory} className="flex-1 bg-ev-green hover:bg-ev-green/90">
                  Xem lịch hẹn
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="w-full max-w-md border-green-200">
          <CardHeader>
            <div className="flex flex-col items-center gap-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              >
                <CheckCircle2 className="h-16 w-16 text-green-500" />
              </motion.div>
              <CardTitle className="text-2xl text-green-700 text-center">
                Thanh toán thành công!
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Mã đơn hàng:</span>
                <span className="font-medium">#{paymentData?.orderCode}</span>
              </div>
              {paymentData?.amount && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Số tiền:</span>
                  <span className="font-bold text-green-700">
                    {paymentData.amount.toLocaleString("vi-VN")} VND
                  </span>
                </div>
              )}
              {paymentData?.description && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Mô tả:</span>
                  <span className="font-medium text-right">{paymentData.description}</span>
                </div>
              )}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800 leading-relaxed">
                ✅ Lịch hẹn của bạn đã được xác nhận. Chúng tôi sẽ gửi thông báo chi tiết qua email và SMS.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <Button 
                onClick={handleGoToBookingHistory} 
                className="w-full bg-ev-green hover:bg-ev-green/90"
              >
                Xem lịch hẹn của tôi
              </Button>
              <Button onClick={handleGoToHome} variant="outline" className="w-full">
                Về trang chủ
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
