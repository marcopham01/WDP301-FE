import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { initializeSocket, onReminderSent, disconnectSocket, ReminderMessage } from "@/lib/socket";
import { getNotifications, Notification } from "@/lib/notificationApi";
import { Bell, Wifi, WifiOff } from "lucide-react";

export default function SocketTestPage() {
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [realtimeMessages, setRealtimeMessages] = useState<ReminderMessage[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Khởi tạo socket khi component mount
    const socket = initializeSocket();
    
    socket.on("connect", () => {
      setIsConnected(true);
      console.log("✅ Connected to Socket.IO server");
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
      console.log("❌ Disconnected from Socket.IO server");
    });

    // Lắng nghe sự kiện reminderSent
    onReminderSent((data: ReminderMessage) => {
      console.log("📢 New reminder:", data);
      setRealtimeMessages(prev => [data, ...prev]);
    });

    // Cleanup
    return () => {
      disconnectSocket();
    };
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await getNotifications();
      setNotifications(response.data);
      console.log("✅ Fetched notifications:", response.data);
    } catch (error) {
      console.error("❌ Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-6 w-6" />
            Socket.IO Test Page
          </CardTitle>
          <CardDescription>
            Test kết nối Socket.IO và API Notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Connection Status */}
          <div className="flex items-center gap-2">
            <Badge variant={isConnected ? "default" : "destructive"}>
              {isConnected ? (
                <>
                  <Wifi className="h-4 w-4 mr-1" />
                  Connected
                </>
              ) : (
                <>
                  <WifiOff className="h-4 w-4 mr-1" />
                  Disconnected
                </>
              )}
            </Badge>
          </div>

          {/* Fetch Notifications Button */}
          <Button onClick={fetchNotifications} disabled={loading}>
            {loading ? "Loading..." : "Fetch Notifications from API"}
          </Button>

          {/* API Notifications */}
          <div className="space-y-2">
            <h3 className="font-semibold text-lg">API Notifications ({notifications.length})</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {notifications.map((notification) => (
                <Card key={notification._id}>
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{notification.vehicle_id.license_plate}</p>
                        <p className="text-sm text-muted-foreground">{notification.message}</p>
                        <p className="text-xs text-muted-foreground">
                          Due: {new Date(notification.due_date).toLocaleDateString('vi-VN')}
                        </p>
                      </div>
                      <Badge variant="outline">{notification.reminder_type}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Real-time Messages */}
          <div className="space-y-2">
            <h3 className="font-semibold text-lg">
              Real-time Messages (Socket.IO) ({realtimeMessages.length})
            </h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {realtimeMessages.map((msg, index) => (
                <Card key={msg.reminder_id + index} className="border-green-500">
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <Badge className="mb-2" variant="default">NEW</Badge>
                        <p className="font-medium">{msg.vehicle}</p>
                        <p className="text-sm text-muted-foreground">{msg.message}</p>
                        <p className="text-xs text-muted-foreground">
                          Due: {new Date(msg.due_date).toLocaleDateString('vi-VN')}
                        </p>
                      </div>
                      <Badge variant="outline">{msg.type}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Hướng dẫn Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <ol className="list-decimal list-inside space-y-2">
            <li>Kiểm tra trạng thái kết nối Socket.IO (màu xanh = đã kết nối)</li>
            <li>Click "Fetch Notifications from API" để lấy danh sách thông báo từ server</li>
            <li>Mở Console (F12) để xem logs chi tiết</li>
            <li>Khi server gửi reminder mới, nó sẽ xuất hiện trong "Real-time Messages"</li>
            <li>Toast notification cũng sẽ hiển thị khi có reminder mới</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
