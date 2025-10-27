import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Bell, MessageSquare, Wrench, Clock, DollarSign, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { getNotifications, Notification as ApiNotification } from "@/lib/notificationApi";
import { initializeSocket, onReminderSent, disconnectSocket, ReminderMessage } from "@/lib/socket";
import { toast } from "react-toastify";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

interface NotificationDropdownProps {
  children: React.ReactNode;
}

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  priority: string;
  vehicle?: string;
  due_date?: string;
}

export function NotificationDropdown({ children }: NotificationDropdownProps) {
  const [maintenanceNotifications, setMaintenanceNotifications] = useState<NotificationItem[]>([]);

  // Fetch notifications từ API và khởi tạo Socket.IO
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        console.log("🔄 NotificationDropdown: Fetching notifications...");
        const response = await getNotifications();
        
        if (response.data && response.data.length > 0) {
          const apiNotifications = response.data.map((notification: ApiNotification) => ({
            id: notification._id,
            type: notification.reminder_type === "maintenance" ? "maintenance" : 
                  notification.reminder_type === "time_based" ? "maintenance" : "appointment",
            title: `Nhắc nhở bảo dưỡng - ${notification.vehicle_id.license_plate}`,
            message: notification.message || `Xe ${notification.vehicle_id.license_plate} cần bảo dưỡng`,
            time: formatDistanceToNow(new Date(notification.due_date), { 
              addSuffix: true, 
              locale: vi 
            }),
            read: false,
            priority: "high",
            vehicle: notification.vehicle_id.license_plate,
            due_date: new Date(notification.due_date).toLocaleDateString('vi-VN'),
          }));
          
          setMaintenanceNotifications(apiNotifications);
          console.log("✅ NotificationDropdown: Loaded", apiNotifications.length, "notifications");
        } else {
          console.log("ℹ️ NotificationDropdown: No notifications available");
        }
      } catch (error) {
        console.error("❌ NotificationDropdown: Error fetching notifications:", error);
        // Không hiển thị toast error để tránh làm phiền user
      }
    };

    fetchNotifications();

    // Khởi tạo Socket.IO để nhận real-time notifications
    console.log("🔌 NotificationDropdown: Initializing Socket.IO...");
    initializeSocket();

    // Lắng nghe sự kiện reminderSent từ server
    onReminderSent((data: ReminderMessage) => {
      console.log("🔔 NotificationDropdown: New reminder received:", data);
      
      // Thêm notification mới vào đầu danh sách
      const newNotification: NotificationItem = {
        id: data.reminder_id,
        type: "maintenance",
        title: `Nhắc nhở bảo dưỡng - ${data.vehicle}`,
        message: data.message,
        time: "Vừa xong",
        read: false,
        priority: "high",
        vehicle: data.vehicle,
        due_date: new Date(data.due_date).toLocaleDateString('vi-VN'),
      };

      setMaintenanceNotifications(prev => [newNotification, ...prev]);

      // Hiển thị toast notification
      toast.info(`🔔 ${data.message}`, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    });

    // Cleanup khi component unmount
    return () => {
      disconnectSocket();
    };
  }, []);

  const unreadCount = maintenanceNotifications.filter(n => !n.read).length;

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
          <TabsList className="grid w-full grid-cols-2 rounded-none border-b">
            <TabsTrigger value="all" className="rounded-none">
              Tất cả ({maintenanceNotifications.length})
            </TabsTrigger>
            <TabsTrigger value="maintenance" className="rounded-none">
              Bảo dưỡng ({maintenanceNotifications.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="p-0">
            <ScrollArea className="h-96">
              <div className="p-2">
                {maintenanceNotifications.length > 0 ? (
                  maintenanceNotifications.map((notification, index) => (
                    <div key={notification.id}>
                      <NotificationItem notification={notification} />
                      {index < maintenanceNotifications.length - 1 && (
                        <Separator className="my-1" />
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Bell className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Không có thông báo</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="maintenance" className="p-0">
            <ScrollArea className="h-96">
              <div className="p-2">
                {maintenanceNotifications.length > 0 ? (
                  maintenanceNotifications.map((notification, index) => (
                    <div key={notification.id}>
                      <NotificationItem notification={notification} />
                      {index < maintenanceNotifications.length - 1 && (
                        <Separator className="my-1" />
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Wrench className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Không có thông báo bảo dưỡng</p>
                  </div>
                )}
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
