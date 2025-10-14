import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Bell, MessageSquare, Wrench, Clock, DollarSign, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

// Mock data - replace with real API calls
const mockMaintenanceNotifications = [
  {
    id: "1",
    type: "maintenance",
    title: "Nhắc nhở bảo dưỡng định kỳ",
    message: "Xe 30A-12345 cần bảo dưỡng định kỳ sau 5000km nữa",
    time: "2 giờ trước",
    read: false,
    priority: "high",
  },
  {
    id: "2",
    type: "payment",
    title: "Gia hạn gói bảo dưỡng",
    message: "Gói bảo dưỡng của bạn sẽ hết hạn trong 7 ngày",
    time: "1 ngày trước",
    read: false,
    priority: "medium",
  },
  {
    id: "3",
    type: "maintenance",
    title: "Bảo dưỡng theo thời gian",
    message: "Đã đến thời điểm bảo dưỡng 6 tháng cho xe 30A-12345",
    time: "3 ngày trước",
    read: true,
    priority: "medium",
  },
];

const mockMessageNotifications = [
  {
    id: "4",
    type: "message",
    title: "Tin nhắn từ nhân viên",
    message: "Cảm ơn bạn đã sử dụng dịch vụ. Xe của bạn đã sẵn sàng.",
    time: "30 phút trước",
    read: false,
    priority: "low",
  },
  {
    id: "5",
    type: "message",
    title: "Trả lời yêu cầu",
    message: "Chúng tôi đã nhận được yêu cầu của bạn về thay dầu.",
    time: "2 ngày trước",
    read: true,
    priority: "low",
  },
];

interface NotificationDropdownProps {
  children: React.ReactNode;
}

export function NotificationDropdown({ children }: NotificationDropdownProps) {
  const [maintenanceNotifications] = useState(mockMaintenanceNotifications);
  const [messageNotifications] = useState(mockMessageNotifications);

  const unreadCount = [...maintenanceNotifications, ...messageNotifications].filter(n => !n.read).length;

  const NotificationTrigger = React.forwardRef<HTMLDivElement, object>((props, ref) => (
    <div 
      ref={ref} 
      className="relative cursor-pointer pointer-events-auto"
      {...props}
    >
      {children}
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-medium">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </div>
  ));

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "destructive";
      case "medium": return "secondary";
      default: return "outline";
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "maintenance": return <Wrench className="h-4 w-4" />;
      case "payment": return <DollarSign className="h-4 w-4" />;
      case "message": return <MessageSquare className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  priority: string;
}

  const NotificationItem = ({ notification }: { notification: Notification }) => (
    <div className={cn(
      "flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer",
      !notification.read && "bg-muted/30"
    )}>
      <div className="flex-shrink-0 mt-0.5">
        {getIcon(notification.type)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="text-sm font-medium truncate">{notification.title}</h4>
          <Badge variant={getPriorityColor(notification.priority)} className="text-xs px-1.5 py-0.5">
            {notification.priority === "high" ? "Cao" : notification.priority === "medium" ? "Trung bình" : "Thấp"}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2">{notification.message}</p>
        <div className="flex items-center gap-2 mt-2">
          <Clock className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">{notification.time}</span>
          {!notification.read && (
            <div className="w-2 h-2 bg-primary rounded-full ml-auto" />
          )}
        </div>
      </div>
    </div>
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <NotificationTrigger />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96 p-0">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Thông báo</h3>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="text-xs">
              {unreadCount} chưa đọc
            </Badge>
          )}
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-3 rounded-none border-b">
            <TabsTrigger value="all" className="rounded-none">
              Tất cả ({maintenanceNotifications.length + messageNotifications.length})
            </TabsTrigger>
            <TabsTrigger value="maintenance" className="rounded-none">
              Bảo dưỡng ({maintenanceNotifications.length})
            </TabsTrigger>
            <TabsTrigger value="messages" className="rounded-none">
              Tin nhắn ({messageNotifications.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="p-0">
            <ScrollArea className="h-96">
              <div className="p-2">
                {[...maintenanceNotifications, ...messageNotifications]
                  .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
                  .map((notification, index) => (
                    <div key={notification.id}>
                      <NotificationItem notification={notification} />
                      {index < maintenanceNotifications.length + messageNotifications.length - 1 && (
                        <Separator className="my-1" />
                      )}
                    </div>
                  ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="maintenance" className="p-0">
            <ScrollArea className="h-96">
              <div className="p-2">
                {maintenanceNotifications.map((notification, index) => (
                  <div key={notification.id}>
                    <NotificationItem notification={notification} />
                    {index < maintenanceNotifications.length - 1 && (
                      <Separator className="my-1" />
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="messages" className="p-0">
            <ScrollArea className="h-96">
              <div className="p-2">
                {messageNotifications.map((notification, index) => (
                  <div key={notification.id}>
                    <NotificationItem notification={notification} />
                    {index < messageNotifications.length - 1 && (
                      <Separator className="my-1" />
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <div className="p-3 border-t bg-muted/50">
          <Button variant="ghost" size="sm" className="w-full text-xs">
            <CheckCircle className="h-3 w-3 mr-2" />
            Đánh dấu tất cả đã đọc
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
