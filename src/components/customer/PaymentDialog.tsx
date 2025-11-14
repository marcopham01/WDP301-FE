import { useEffect, useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Copy, ExternalLink, X, Clock, AlertCircle } from "lucide-react";
import { toast } from "react-toastify";
import { useCountdown } from "@/hooks/use-countdown";
import { QRCodeSVG } from "qrcode.react";
import { getPaymentTransactionApi } from "@/lib/paymentApi";
import { useNavigate } from "react-router-dom";

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paymentInfo: {
    amount?: number;
    checkout_url?: string;
    qr_code?: string;
    order_code?: number;
    timeoutAt?: string;
    status?: string;
    description?: string;
  } | null;
  technician?: {
    fullName?: string;
    phone?: string;
    email?: string;
  } | null;
  onCancel?: () => void;
  onViewHistory?: () => void;
}

function formatTime(seconds: number): string {
  if (seconds <= 0) return "00:00";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export function PaymentDialog({
  open,
  onOpenChange,
  paymentInfo,
  technician,
  onCancel,
  onViewHistory, // (future use – reserved for navigating to history)
}: PaymentDialogProps) {
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  const [isExpired, setIsExpired] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<string | undefined>(paymentInfo?.status);
  const navigate = useNavigate();
  // interval handled by useCountdown hook

  // 🕒 Countdown logic via reusable hook
  const countdown = useCountdown(paymentInfo?.timeoutAt ?? null, open && !!paymentInfo?.timeoutAt);
  useEffect(() => {
    setRemainingSeconds(countdown.remainingSeconds);
    setIsExpired(countdown.isExpired);
  }, [countdown.remainingSeconds, countdown.isExpired]);

  // Poll payment status every 3s until reaching a terminal state
  useEffect(() => {
    if (!open) {
      // Reset state when dialog closes
      setRemainingSeconds(0);
      setIsExpired(false);
      return;
    }
    if (!paymentInfo?.order_code) return;
    if (currentStatus && ["PAID", "FAILED", "CANCELLED", "TIMEOUT", "EXPIRED"].includes(currentStatus)) return;

    const interval = setInterval(async () => {
      try {
        const res = await getPaymentTransactionApi(paymentInfo.order_code);
        if (res.ok && res.data?.data) {
          const newStatus = (res.data.data.status || "").toUpperCase();
          if (newStatus && newStatus !== currentStatus) {
            setCurrentStatus(newStatus);
            if (newStatus === "PAID") {
              toast.success("✅ Thanh toán thành công!");
              setTimeout(() => {
                onOpenChange(false);
                navigate("/customer/booking-history");
              }, 1200);
            } else if (["FAILED", "CANCELLED"].includes(newStatus)) {
              toast.error("Thanh toán không thành công (" + newStatus + ")");
              setTimeout(() => {
                onOpenChange(false);
              }, 1500);
            }
          }
        }
      } catch {
        // ignore polling errors
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [open, paymentInfo?.order_code, currentStatus, onOpenChange, navigate]);

  // Keep local status in sync if prop changes externally
  useEffect(() => {
    if (paymentInfo?.status && paymentInfo.status !== currentStatus) {
      setCurrentStatus(paymentInfo.status);
    }
  }, [paymentInfo?.status, currentStatus]);

  // 🧭 Copy & open
  const handleCopyLink = async () => {
    if (paymentInfo?.checkout_url) {
      await navigator.clipboard.writeText(paymentInfo.checkout_url);
      toast.success("Đã sao chép link thanh toán");
    }
  };

  const handleOpenPayment = () => {
    if (paymentInfo?.checkout_url) {
      window.open(paymentInfo.checkout_url, "_blank");
    }
  };

  // 🔄 Parse QR code data - PayOS trả về raw EMVCo string, cần generate thành image
  const qrCodeValue = useMemo(() => {
    const raw = paymentInfo?.qr_code?.trim();
    
    console.log("🔍 [PaymentDialog] QR Code Analysis:", {
      raw: raw,
      type: typeof raw,
      length: raw?.length,
      preview: raw?.substring(0, 50),
    });
    
    if (!raw) {
      console.warn("⚠️ [PaymentDialog] QR code is empty or undefined");
      return null;
    }

    // PayOS returns EMVCo QR format as string (e.g., "00020101021238...")
    // We need to generate QR image from this string
    console.log("✅ [PaymentDialog] QR code string received, will generate QR image");
    return raw;
  }, [paymentInfo]);

  // Fallback: Generate QR from checkout URL if qr_code is not available
  const fallbackQrValue = useMemo(() => {
    if (!qrCodeValue && paymentInfo?.checkout_url) {
      console.log("🔄 [PaymentDialog] Using checkout URL as fallback for QR generation");
      return paymentInfo.checkout_url;
    }
    return null;
  }, [qrCodeValue, paymentInfo?.checkout_url]);

  const effectiveQrValue = qrCodeValue || fallbackQrValue;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-4 pb-3 border-b">
          <DialogTitle className="text-lg font-bold">Thanh toán đặt lịch</DialogTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            {paymentInfo?.description || "Vui lòng thanh toán tiền đặt cọc để xác nhận lịch hẹn"}
          </p>
        </DialogHeader>

        <div className="p-4 space-y-3">
          {/* Countdown Timer */}
          {paymentInfo?.timeoutAt && currentStatus !== "PAID" && (
            <Card
              className={`border-2 ${isExpired ? "border-red-200 bg-red-50" : "border-yellow-200 bg-yellow-50"}`}
            >
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className={`w-4 h-4 ${isExpired ? "text-red-600" : "text-yellow-600"}`} />
                    <span className="font-medium text-xs">
                      {isExpired ? "Link thanh toán đã hết hạn" : "Thời gian còn lại"}
                    </span>
                  </div>
                  <div
                    className={`text-xl font-bold font-mono ${
                      isExpired ? "text-red-600" : "text-yellow-600"
                    }`}
                  >
                    {formatTime(remainingSeconds)}
                  </div>
                </div>
                {isExpired && (
                  <div className="mt-2 flex items-start gap-2 text-xs text-red-600">
                    <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    <span className="leading-tight">Link thanh toán đã hết hạn. Bạn có thể thanh toán lại từ lịch sử thanh toán.</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {currentStatus === "PAID" && (
            <Card className="border-2 border-green-200 bg-green-50">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">💳</span>
                    <span className="font-medium text-xs">Thanh toán đã xác nhận</span>
                  </div>
                  <span className="text-green-600 text-xs font-semibold">Đang chuyển...</span>
                </div>
                <div className="mt-2 text-xs text-green-700 leading-tight">
                  Lịch hẹn của bạn đã được cập nhật. Cảm ơn bạn!
                </div>
              </CardContent>
            </Card>
          )}

          {/* Technician Info */}
          {technician && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-3">
                <div className="flex items-start gap-2">
                  <span className="text-lg">🔧</span>
                  <div className="flex-1">
                    <p className="text-xs font-medium">Kỹ thuật viên phụ trách: {technician.fullName}</p>
                    {technician.phone && (
                      <p className="text-xs text-muted-foreground mt-0.5">SĐT: {technician.phone}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Amount */}
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Số tiền</span>
                <span className="text-xl font-bold text-primary">
                  {paymentInfo?.amount ? `${paymentInfo.amount.toLocaleString("vi-VN")} VND` : "—"}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Order code */}
          {paymentInfo?.order_code && (
            <Card>
              <CardContent className="p-3">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Mã đơn hàng:</span>
                  <span className="font-medium">#{paymentInfo.order_code}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* QR Code - Generated from PayOS EMVCo string */}
          {!isExpired && effectiveQrValue && (
            <div className="flex flex-col items-center gap-3 p-4 bg-white rounded-lg border-2 border-gray-200 relative">
              <p className="text-sm font-semibold text-gray-900">Quét mã QR để thanh toán</p>
              <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100">
                <QRCodeSVG
                  value={effectiveQrValue}
                  size={220}
                  level="H"
                  includeMargin={true}
                  bgColor="#ffffff"
                  fgColor="#000000"
                />
              </div>
              <div className="text-center space-y-1">
                <p className="text-xs text-gray-600 font-medium">
                  Mở app ngân hàng và quét mã QR này
                </p>
                <p className="text-xs text-gray-500">
                  Hỗ trợ tất cả ngân hàng tại Việt Nam
                </p>
              </div>
              {paymentInfo?.checkout_url && (
                <Button
                  variant="link"
                  size="sm"
                  className="absolute top-2 right-2 h-auto p-1 text-[10px]"
                  onClick={handleOpenPayment}
                >
                  Mở link
                </Button>
              )}
            </div>
          )}
          {!isExpired && !effectiveQrValue && (
            <div className="flex flex-col items-center gap-2 p-3 bg-white rounded-lg border animate-pulse">
              <p className="text-xs font-medium">Đang chuẩn bị mã QR…</p>
              <div className="w-48 h-48 rounded-md bg-muted flex items-center justify-center text-[10px] text-muted-foreground">
                Đang tải
              </div>
              {paymentInfo?.checkout_url && (
                <p className="text-[10px] text-muted-foreground text-center">
                  Nếu chờ quá lâu, bấm “Mở trang thanh toán” bên dưới.
                </p>
              )}
            </div>
          )}

          {/* Payment Buttons */}
          <div className="space-y-2">
            <p className="text-xs font-medium">Thanh toán online</p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="default"
                size="sm"
                disabled={isExpired || currentStatus === "PAID"}
                onClick={handleOpenPayment}
                className="w-full gap-1 h-9"
              >
                <ExternalLink className="w-3 h-3" />
                <span className="text-xs">Mở trang thanh toán</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={isExpired || currentStatus === "PAID"}
                onClick={handleCopyLink}
                className="w-full gap-1 h-9"
              >
                <Copy className="w-3 h-3" />
                <span className="text-xs">Sao chép link</span>
              </Button>
            </div>
          </div>

          {/* Cancel button */}
          {onCancel && currentStatus !== "PAID" && (
            <Button
              variant="destructive"
              size="sm"
              disabled={isExpired || paymentInfo?.status === "CANCELLED"}
              onClick={onCancel}
              className="w-full gap-1 h-9"
            >
              <X className="w-3 h-3" />
              <span className="text-xs">Hủy giao dịch</span>
            </Button>
          )}

          {/* Guide */}
          {!isExpired && currentStatus !== "PAID" && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-3">
                <p className="text-xs text-blue-800 font-medium mb-1">Hướng dẫn thanh toán</p>
                <ul className="text-xs text-blue-700 space-y-0.5 list-disc list-inside leading-relaxed">
                  <li>Chọn một trong các phương thức thanh toán trên</li>
                  <li>Thanh toán bằng thẻ ngân hàng hoặc ví điện tử</li>
                  <li>Sau khi thanh toán thành công, lịch hẹn sẽ được xác nhận tự động</li>
                  <li>Bạn sẽ nhận được email xác nhận trong vòng vài phút</li>
                </ul>
                {onViewHistory && (
                  <div className="mt-2 text-right">
                    <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={onViewHistory}>
                      Xem lịch sử thanh toán
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          
          {/* Expired message */}
          {isExpired && currentStatus !== "PAID" && onViewHistory && (
            <Card className="bg-orange-50 border-orange-200">
              <CardContent className="p-3">
                <p className="text-xs text-orange-800 font-medium mb-1">⚠️ Link thanh toán đã hết hạn</p>
                <p className="text-xs text-orange-700 leading-relaxed mb-2">
                  Vui lòng tạo lại giao dịch mới từ lịch sử thanh toán để tiếp tục.
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full h-8 text-xs border-orange-300 text-orange-700 hover:bg-orange-100" 
                  onClick={onViewHistory}
                >
                  Xem lịch sử thanh toán
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
