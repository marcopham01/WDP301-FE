import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, X, MessageCircle, Minimize2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext/useAuth";
import { useChatSocket } from "@/hooks/useChatSocket";
import axios from "axios";
import { config } from "@/config/config";
import { fetchDefaultStaffId } from "@/lib/chatApi";

interface Message {
  _id?: string;
  sender: string;
  receiver: string;
  content: string;
  createdAt?: string;
  isSupport?: boolean;
  message?: string;
  time?: string;
}

const ChatWidget = () => {
  const { user, accessToken } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [staffId, setStaffId] = useState<string>("");
  const [newMessage, setNewMessage] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // const userId = user?.id || "default";

  // Lấy lịch sử chat với staff (ví dụ: staffId = 'admin' hoặc lấy từ context)
  // Lấy staff mặc định từ API
  useEffect(() => {
    if (!accessToken) return;
    fetchDefaultStaffId(accessToken).then((id) => {
      console.log("💬 ChatWidget - Staff ID:", id);
      if (id) setStaffId(id);
    });
  }, [accessToken]);

  useEffect(() => {
    if (user?.id && accessToken && staffId) {
      axios
        .get(`${config.API_BASE_URL}/api/chat/history/${staffId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        .then((res) => {
          setMessages(
            res.data.map((msg: Message) => ({
              ...msg,
              isSupport: msg.sender === staffId,
              message: msg.content,
              time: msg.createdAt
                ? new Date(msg.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "",
            }))
          );
        });
    }
  }, [user?.id, staffId, accessToken]);

  // Auto scroll
  useEffect(() => {
    if (scrollAreaRef.current && isOpen) {
      const scrollContainer = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]"
      );
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages, isOpen]);

  // Gửi tin nhắn
  const handleSendMessage = useCallback(() => {
  if (newMessage.trim() && user?.id && accessToken && staffId) {
      const msgData = {
        receiver: staffId,
        content: newMessage,
      };
      axios
        .post(`${config.API_BASE_URL}/api/chat/send`, msgData, {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        .then((res) => {
          // Gửi qua socket để staff nhận realtime
          import("@/lib/socket").then((socket) => {
            socket.getSocket()?.emit("chat_message", {
              sender: user.id,
              receiver: staffId,
              content: newMessage,
            });
          });
          setMessages((prev) => [
            ...prev,
            {
              ...res.data,
              isSupport: false,
              message: res.data.content,
              time: res.data.createdAt
                ? new Date(res.data.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "",
            },
          ]);
          setNewMessage("");
        });
    }
  }, [newMessage, user, staffId, accessToken]);

  // Nhận tin nhắn realtime
  const handleReceiveMessage = useCallback(
    (msg: { sender: string; content: string; createdAt?: string; _id?: string; receiver: string }) => {
      if (msg.sender === staffId) {
        setMessages((prev) => [
          ...prev,
          {
            ...msg,
            isSupport: true,
            message: msg.content,
            time: msg.createdAt
              ? new Date(msg.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "",
          },
        ]);
        if (!isOpen) setUnreadCount((prev) => prev + 1);
      }
    },
    [staffId, isOpen]
  );

  useChatSocket(user?.id || "", handleReceiveMessage);

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setUnreadCount(0);
    }
  };

  return (
    <>
      {/* Chat Button */}
      <motion.div
        className="fixed bottom-6 right-6 z-50"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      >
        <Button
          onClick={handleToggle}
          className="h-14 w-14 rounded-full bg-ev-green hover:bg-ev-green/90 shadow-lg relative"
        >
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <X className="h-6 w-6" />
              </motion.div>
            ) : (
              <motion.div
                key="open"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <MessageCircle className="h-6 w-6" />
              </motion.div>
            )}
          </AnimatePresence>
          {unreadCount > 0 && !isOpen && (
            <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Button>
      </motion.div>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 w-96 h-[600px] bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col overflow-hidden z-50"
          >
            {/* Header */}
            <div className="bg-ev-green p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border-2 border-white">
                  <AvatarImage src="/support-avatar.png" />
                  <AvatarFallback className="bg-white text-ev-green font-bold">
                    EV
                  </AvatarFallback>
                </Avatar>
                <div className="text-white">
                  <h3 className="font-semibold text-sm">EV Care Support</h3>
                  <p className="text-xs text-green-100 flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></span>
                    Đang hoạt động
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleToggle}
                className="h-8 w-8 text-white hover:bg-white/20"
              >
                <Minimize2 className="h-4 w-4" />
              </Button>
            </div>

            {/* Quick Actions */}
            <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
              <div className="flex gap-2 overflow-x-auto">
                <Badge
                  variant="secondary"
                  className="cursor-pointer hover:bg-ev-green hover:text-white transition-colors text-xs whitespace-nowrap"
                  onClick={() => setNewMessage("Đặt lịch bảo dưỡng")}
                >
                  📅 Đặt lịch
                </Badge>
                <Badge
                  variant="secondary"
                  className="cursor-pointer hover:bg-ev-green hover:text-white transition-colors text-xs whitespace-nowrap"
                  onClick={() => setNewMessage("Hỗ trợ thanh toán")}
                >
                  💰 Thanh toán
                </Badge>
                <Badge
                  variant="secondary"
                  className="cursor-pointer hover:bg-ev-green hover:text-white transition-colors text-xs whitespace-nowrap"
                  onClick={() => setNewMessage("Câu hỏi về dịch vụ")}
                >
                  ❓ Hỏi đáp
                </Badge>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea ref={scrollAreaRef} className="flex-1 p-4 bg-gray-50">
              <div className="space-y-3">
                {messages.map((msg, idx) => (
                  <div
                    key={msg._id || idx}
                    className={`flex ${
                      msg.isSupport ? "justify-start" : "justify-end"
                    }`}
                  >
                    {msg.isSupport && (
                      <Avatar className="h-7 w-7 mr-2 mt-1">
                        <AvatarFallback className="bg-ev-green text-white text-xs">
                          EV
                        </AvatarFallback>
                      </Avatar>
                    )}

                    <div
                      className={`max-w-[75%] ${
                        msg.isSupport ? "" : "flex flex-col items-end"
                      }`}
                    >
                      <div
                        className={`px-3 py-2 rounded-lg text-sm ${
                          msg.isSupport
                            ? "bg-white text-gray-900 rounded-tl-sm border border-gray-200"
                            : "bg-ev-green text-white rounded-tr-sm"
                        }`}
                      >
                        {msg.message}
                      </div>
                      <div className="text-xs mt-1 text-gray-400">
                        {msg.time}
                      </div>
                    </div>

                    {!msg.isSupport && (
                      <Avatar className="h-7 w-7 ml-2 mt-1">
                        <AvatarFallback className="bg-gray-200 text-gray-700 text-xs">
                          {(user?.fullName || user?.username || "U")
                            .charAt(0)
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="p-4 border-t border-gray-200 bg-white">
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Nhập tin nhắn..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  className="flex-1 rounded-full text-sm"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  size="icon"
                  className="h-10 w-10 rounded-full bg-ev-green hover:bg-ev-green/90"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatWidget;
