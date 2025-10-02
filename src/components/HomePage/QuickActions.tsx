import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, MessageSquare, CreditCard, Plus } from "lucide-react";

const QuickActions = () => {
  const actions = [
    {
      id: "book-service",
      title: "Đặt lịch bảo dưỡng",
      description: "Đặt lịch nhanh cho xe của bạn",
      icon: Calendar,
      color: "gradient-primary",
      urgent: false
    },
    {
      id: "emergency",
      title: "Hỗ trợ khẩn cấp",
      description: "Cần hỗ trợ ngay lập tức",
      icon: MessageSquare,
      color: "bg-destructive text-destructive-foreground",
      urgent: true
    },
    {
      id: "payment",
      title: "Thanh toán",
      description: "Thanh toán hóa đơn dịch vụ",
      icon: CreditCard,
      color: "gradient-secondary",
      urgent: false
    },
    {
      id: "add-vehicle",
      title: "Thêm xe mới",
      description: "Đăng ký xe điện mới",
      icon: Plus,
      color: "bg-ev-green text-primary-foreground",
      urgent: false
    }
  ];

  return (
    <Card className="p-6 shadow-card gradient-card border-0">
      <h2 className="text-xl font-semibold text-foreground mb-4">Thao tác nhanh</h2>
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action) => (
          <Button
            key={action.id}
            variant="ghost"
            className={`h-auto p-4 flex flex-col space-y-2 hover:shadow-glow transition-smooth relative ${
              action.urgent ? 'border border-destructive/20' : ''
            }`}
          >
            {action.urgent && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full animate-pulse" />
            )}
            <div className={`w-10 h-10 rounded-lg ${action.color} flex items-center justify-center`}>
              <action.icon className="h-5 w-5" />
            </div>
            <div className="text-center">
              <p className="font-medium text-sm text-foreground">{action.title}</p>
              <p className="text-xs text-muted-foreground">{action.description}</p>
            </div>
          </Button>
        ))}
      </div>
    </Card>
  );
};

export default QuickActions;