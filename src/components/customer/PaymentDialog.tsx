import { useEffect, useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Copy, ExternalLink, X, Clock, AlertCircle } from "lucide-react";
import { toast } from "react-toastify";
import { useCountdown } from "@/hooks/use-countdown";

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
  // interval handled by useCountdown hook

  // 🕒 Countdown logic via reusable hook
  const countdown = useCountdown(paymentInfo?.timeoutAt ?? null, open && !!paymentInfo?.timeoutAt);
  useEffect(() => {
    setRemainingSeconds(countdown.remainingSeconds);
    setIsExpired(countdown.isExpired);
  }, [countdown.remainingSeconds, countdown.isExpired]);

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

  // 🔄 Normalize QR source (backend có thể trả về nhiều định dạng khác nhau)
  const { qrRenderMode, qrImgSrc, qrSvgMarkup } = useMemo(() => {
    const raw = paymentInfo?.qr_code?.trim();
    if (!raw) return { qrRenderMode: "none" as const, qrImgSrc: "", qrSvgMarkup: "" };

    // Case 1: Already a full data URL
    if (/^data:image\/(png|jpg|jpeg|gif|svg\+xml);base64,/i.test(raw)) {
      return { qrRenderMode: "img" as const, qrImgSrc: raw, qrSvgMarkup: "" };
    }

    // Case 2: Raw base64 without prefix (length heuristic >= 100)
    if (/^[A-Za-z0-9+/=]+$/.test(raw) && raw.length > 100) {
      return { qrRenderMode: "img" as const, qrImgSrc: `data:image/png;base64,${raw}` , qrSvgMarkup: "" };
    }

    // Case 3: SVG markup
    if (raw.startsWith("<svg")) {
      return { qrRenderMode: "svg" as const, qrImgSrc: "", qrSvgMarkup: raw };
    }

    // Case 4: URL (http/https)
    if (/^https?:\/\//i.test(raw)) {
      return { qrRenderMode: "img" as const, qrImgSrc: raw, qrSvgMarkup: "" };
    }

    return { qrRenderMode: "none" as const, qrImgSrc: "", qrSvgMarkup: "" };
  }, [paymentInfo?.qr_code]);

  // 🔁 Fallback: nếu backend không trả qr_code hợp lệ, tự tạo QR tạm từ checkout_url thông qua public API
  const fallbackQr = useMemo(() => {
    if (qrRenderMode === "none" && paymentInfo?.checkout_url) {
      const encoded = encodeURIComponent(paymentInfo.checkout_url);
      return `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encoded}`;
    }
    return "";
  }, [qrRenderMode, paymentInfo?.checkout_url]);

  const effectiveHasQr = qrRenderMode !== "none" || !!fallbackQr;

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
          {paymentInfo?.timeoutAt && (
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

          {/* QR Code (multi-format + fallback) */}
          {!isExpired && effectiveHasQr && (
            <div className="flex flex-col items-center gap-2 p-3 bg-white rounded-lg border relative">
              <p className="text-xs font-medium">Quét mã QR</p>
              {qrRenderMode === "img" && (
                <img
                  src={qrImgSrc}
                  alt="QR thanh toán"
                  className="w-48 h-48 object-contain rounded-md"
                  onError={(e) => {
                    // Nếu load ảnh thất bại và có fallback => dùng fallback
                    if (fallbackQr) (e.currentTarget as HTMLImageElement).src = fallbackQr;
                  }}
                />
              )}
              {qrRenderMode === "svg" && (
                <div
                  className="w-48 h-48 rounded-md flex items-center justify-center"
                  /* Using SVG received from backend (trusted internal source) */
                  dangerouslySetInnerHTML={{ __html: qrSvgMarkup }}
                />
              )}
              {qrRenderMode === "none" && fallbackQr && (
                <img
                  src={fallbackQr}
                  alt="QR thanh toán (tạo tạm)"
                  className="w-48 h-48 object-contain rounded-md"
                />
              )}
              <p className="text-xs text-muted-foreground text-center">
                Sử dụng ứng dụng ngân hàng để quét mã QR
              </p>
              {paymentInfo?.checkout_url && (
                <Button
                  variant="link"
                  size="sm"
                  className="absolute top-2 right-2 h-auto p-0 text-[10px]"
                  onClick={handleOpenPayment}
                >
                  Mở link
                </Button>
              )}
            </div>
          )}
          {!isExpired && !effectiveHasQr && (
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
                disabled={isExpired}
                onClick={handleOpenPayment}
                className="w-full gap-1 h-9"
              >
                <ExternalLink className="w-3 h-3" />
                <span className="text-xs">Mở trang thanh toán</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={isExpired}
                onClick={handleCopyLink}
                className="w-full gap-1 h-9"
              >
                <Copy className="w-3 h-3" />
                <span className="text-xs">Sao chép link</span>
              </Button>
            </div>
          </div>

          {/* Cancel button */}
          {onCancel && (
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
          {!isExpired && (
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
          {isExpired && onViewHistory && (
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
