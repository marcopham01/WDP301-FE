import { useEffect } from "react";
import { initializeSocket, onNewMessage } from "@/lib/socket";
import type { ChatMessageDTO } from "@/lib/chatApi";

export function useChatSocket(userId: string, onMessage: (msg: ChatMessageDTO) => void) {
  useEffect(() => {
    const socket = initializeSocket();
    if (userId) {
      socket.emit("join", userId);
    }
    onNewMessage(onMessage);
    return () => {
      socket.off("new_message", onMessage);
    };
  }, [userId, onMessage]);
}
