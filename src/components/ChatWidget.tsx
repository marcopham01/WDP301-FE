import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, X, MessageCircle, Minimize2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext/useAuth";

interface Message {
  id: number;
  sender: string;
  message: string;
  time: string;
  isSupport: boolean;
}

const ChatWidget = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      sender: "EV Care Support",
      message: "Xin chào! Chúng tôi có thể giúp gì cho bạn hôm nay?",
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      isSupport: true,
    },
  ]);
  const [newMessage, setNewMessage] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const userId = user?.id || "default";
  const storageKey = `chatWidget_${userId}`;

  // Load messages
  useEffect(() => {
    const savedMessages = localStorage.getItem(storageKey);
    if (savedMessages) {
      try {
        setMessages(JSON.parse(savedMessages));
      } catch (error) {
        console.error("Error loading chat messages:", error);
      }
    }
  }, [storageKey]);

  // Save messages
  useEffect(() => {
    if (messages.length > 1) {
      localStorage.setItem(storageKey, JSON.stringify(messages));
    }
  }, [messages, storageKey]);

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

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const message: Message = {
        id: messages.length + 1,
        sender: user?.fullName || user?.username || "Bạn",
        message: newMessage,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        isSupport: false,
      };
      setMessages([...messages, message]);
      setNewMessage("");

      // Simulate support response
      setTimeout(() => {
        const supportMessage: Message = {
          id: messages.length + 2,
          sender: "EV Care Support",
          message:
            "Cảm ơn bạn đã liên hệ. Chúng tôi sẽ phản hồi sớm nhất có thể!",
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          isSupport: true,
        };
        setMessages((prev) => [...prev, supportMessage]);
        if (!isOpen) {
          setUnreadCount((prev) => prev + 1);
        }
      }, 2000);
    }
  };

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
                {messages.map((msg) => (
                  <div
                    key={msg.id}
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
