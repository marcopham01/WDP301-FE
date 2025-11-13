/**
 * Lắng nghe sự kiện new_message từ server (chat realtime)
 */
import type { ChatMessageDTO } from "./chatApi";
export function onNewMessage(callback: (data: ChatMessageDTO) => void): void {
  if (!socket) {
    console.warn("⚠️ Socket not initialized. Call initializeSocket() first.");
    return;
  }
  socket.on("new_message", callback);
}
import { io, Socket } from "socket.io-client";
import { config } from "@/config/config";

const SOCKET_URL = config.SOCKET_URL;

let socket: Socket | null = null;

export interface ReminderMessage {
  message: string;
  vehicle: string;
  due_date: string;
  reminder_id: string;
  type: "maintenance_reminder";
}

/**
 * Khởi tạo kết nối Socket.IO
 */
export function initializeSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, config.SOCKET_CONFIG);

    socket.on("connect", () => {
      console.log("✅ Socket.IO connected:", socket?.id);
      console.log("✅ Transport:", socket?.io.engine.transport.name);
    });

    socket.on("disconnect", (reason) => {
      console.log("❌ Socket.IO disconnected:", reason);
    });

    socket.on("connect_error", (error) => {
      console.error("❌ Socket.IO connection error:", error.message);
      console.error("❌ Error details:", error);
    });

    socket.on("message", (data) => {
      console.log("📨 Message from server:", data);
    });

    socket.on("error", (error) => {
      console.error("❌ Socket error:", error);
    });
  }

  return socket;
}

/**
 * Lắng nghe sự kiện reminder từ server
 */
export function onReminderSent(callback: (data: ReminderMessage) => void): void {
  if (!socket) {
    console.warn("⚠️ Socket not initialized. Call initializeSocket() first.");
    return;
  }

  socket.on("reminderSent", (data: ReminderMessage) => {
    console.log("📢 Received reminder:", data);
    callback(data);
  });
}

/**
 * Lắng nghe sự kiện cập nhật lịch hẹn (appointment realtime)
 */
export function onAppointmentUpdated(
  callback: (data: { appointment_id: string; status: string; appointment?: unknown }) => void
): void {
  if (!socket) {
    console.warn("⚠️ Socket not initialized. Call initializeSocket() first.");
    return;
  }
  socket.on("appointment_updated", callback);
}

/**
 * Ngắt kết nối Socket.IO
 */
export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
    console.log("🔌 Socket.IO disconnected");
  }
}

/**
 * Lấy instance socket hiện tại
 */
export function getSocket(): Socket | null {
  return socket;
}
