import { apiRequest } from "@/api/api";

export interface Notification {
  _id: string;
  reminder_type: "time_based" | "appointment" | "maintenance";
  due_date: Date;
  message: string;
  is_sent: boolean;
  is_read?: boolean;
  vehicle_id: {
    _id: string;
    license_plate: string;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

export interface GetNotificationsResponse {
  message: string;
  data: Notification[];
}

/**
 * Lấy danh sách notifications từ server
 */
export async function getNotifications(): Promise<GetNotificationsResponse> {
  const token = localStorage.getItem("accessToken");
  
  if (!token) {
    throw new Error("No access token found");
  }

  try {
    console.log("🔄 Fetching notifications from API...");
    console.log("📍 Endpoint: /api/notifications/get");
    
    const response = await apiRequest("/api/notifications/get", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    console.log("✅ Notifications fetched successfully:", response);
    return response;
  } catch (error) {
    console.error("❌ Error fetching notifications:", error);
    // Nếu API chưa có, trả về mảng rỗng thay vì throw error
    console.warn("⚠️ API endpoint might not be available yet. Returning empty array.");
    return {
      message: "No notifications available",
      data: []
    };
  }
}

/**
 * Đánh dấu 1 thông báo đã đọc
 */
export async function markNotificationAsRead(notificationId: string): Promise<void> {
  const token = localStorage.getItem("accessToken");
  
  if (!token) {
    throw new Error("No access token found");
  }

  try {
    await apiRequest(`/api/notifications/${notificationId}/read`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    console.log("✅ Notification marked as read:", notificationId);
  } catch (error) {
    console.error("❌ Error marking notification as read:", error);
    throw error;
  }
}

/**
 * Đánh dấu tất cả thông báo đã đọc
 */
export async function markAllNotificationsAsRead(): Promise<void> {
  const token = localStorage.getItem("accessToken");
  
  if (!token) {
    throw new Error("No access token found");
  }

  try {
    await apiRequest("/api/notifications/read-all", {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    console.log("✅ All notifications marked as read");
  } catch (error) {
    console.error("❌ Error marking all notifications as read:", error);
    throw error;
  }
}

