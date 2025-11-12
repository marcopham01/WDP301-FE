import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Paperclip, Smile } from "lucide-react";
import Header from "@/components/MainLayout/Header";
import Footer from "@/components/MainLayout/Footer";
import { useAuth } from "@/context/AuthContext/useAuth";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface Message {
  id: number;
  sender: string;
  message: string;
  time: string;
  isSupport: boolean;
}

const ChatPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const userId = user?.id || "default";
  const storageKey =
    userId === "default" ? "chatMessages" : `chatMessages_${userId}`;
  const scrollAreaRef = useRef<HTMLDivElement>(null);

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

  // Load messages from localStorage
  useEffect(() => {
    let savedMessages = localStorage.getItem(storageKey);
    if (!savedMessages && storageKey !== "chatMessages") {
      savedMessages = localStorage.getItem("chatMessages");
    }
    if (savedMessages) {
      try {
        const parsed = JSON.parse(savedMessages);
        setMessages(parsed);
      } catch (error) {
        console.error("Error loading chat messages:", error);
      }
    }
  }, [storageKey]);

  // Save messages to localStorage
  useEffect(() => {
    if (messages.length > 1) {
      const payload = JSON.stringify(messages);
      localStorage.setItem(storageKey, payload);
      if (storageKey !== "chatMessages") {
        localStorage.setItem("chatMessages", payload);
      }
    }
  }, [messages, storageKey]);

  // Auto scroll to bottom when new message arrives
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]"
      );
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

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
      }, 2000);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    toast.success("Đăng xuất thành công!");
    setTimeout(() => {
      navigate("/login");
    }, 1000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
      className="min-h-screen flex flex-col bg-gray-50" // Background xám nhạt
    >
      <Header onLogout={handleLogout} />
      <main className="flex-1 py-8">
        <div className="container max-w-5xl pt-20 px-4">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {" "}
              {/* Text đen, không gradient */}
              Trung tâm Chat
            </h1>
            <p className="text-gray-600">
              Liên hệ với đội ngũ hỗ trợ của chúng tôi
            </p>{" "}
            {/* Text xám */}
          </div>

          {/* Modern Chat Container */}
          <div className="w-full max-w-4xl mx-auto bg-white rounded-lg shadow-md border border-gray-200 flex flex-col overflow-hidden">
            {" "}
            {/* Trắng, border xám, shadow nhẹ */}
            {/* Chat Header - Modern Design */}
            <div className="bg-ev-green p-6 flex items-center justify-between">
              {" "}
              {/* ev-green, không gradient */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar className="h-14 w-14 border-2 border-white shadow-sm">
                    {" "}
                    {/* Shadow nhẹ */}
                    <AvatarImage src="/support-avatar.png" />
                    <AvatarFallback className="bg-white text-ev-green font-bold text-lg">
                      EV
                    </AvatarFallback>
                  </Avatar>
                  <span className="absolute bottom-0 right-0 w-4 h-4 bg-green-400 border-2 border-white rounded-full"></span>
                </div>
                <div className="text-white">
                  <h3 className="font-semibold text-lg">EV Care Support</h3>
                  <p className="text-sm text-green-100 flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></span>
                    Đang hoạt động • Phản hồi trong 24h
                  </p>
                </div>
              </div>
            </div>
            {/* Quick Actions Banner */}
            <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
              {" "}
              {/* Xám nhạt, border xám */}
              <div className="flex gap-2 overflow-x-auto">
                <Badge
                  variant="secondary"
                  className="cursor-pointer hover:bg-ev-green hover:text-white transition-colors whitespace-nowrap bg-gray-100 text-gray-700" // Xám nhạt, hover ev-green
                  onClick={() =>
                    setNewMessage("Tôi muốn đặt lịch bảo dưỡng xe")
                  }
                >
                  📅 Đặt lịch
                </Badge>
                <Badge
                  variant="secondary"
                  className="cursor-pointer hover:bg-ev-green hover:text-white transition-colors whitespace-nowrap bg-gray-100 text-gray-700"
                  onClick={() => setNewMessage("Tôi cần hỗ trợ thanh toán")}
                >
                  💰 Thanh toán
                </Badge>
                <Badge
                  variant="secondary"
                  className="cursor-pointer hover:bg-ev-green hover:text-white transition-colors whitespace-nowrap bg-gray-100 text-gray-700"
                  onClick={() => setNewMessage("Tôi có câu hỏi về dịch vụ")}
                >
                  ❓ Hỏi đáp
                </Badge>
                <Badge
                  variant="secondary"
                  className="cursor-pointer hover:bg-ev-green hover:text-white transition-colors whitespace-nowrap bg-gray-100 text-gray-700"
                  onClick={() => setNewMessage("Tôi cần kiểm tra lịch sử xe")}
                >
                  🚗 Lịch sử xe
                </Badge>
              </div>
            </div>
            {/* Messages Area */}
            <ScrollArea
              ref={scrollAreaRef}
              className="flex-1 p-6 bg-gray-50 h-[500px]"
            >
              {" "}
              {/* Xám nhạt */}
              <div className="space-y-4">
                {messages.map((msg, index) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`flex ${
                      msg.isSupport ? "justify-start" : "justify-end"
                    }`}
                  >
                    {msg.isSupport && (
                      <Avatar className="h-8 w-8 mr-2 mt-1">
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
                      {msg.isSupport && (
                        <div className="text-xs text-gray-500 mb-1 ml-1">
                          {msg.sender}
                        </div>
                      )}

                      <div
                        className={`px-4 py-2.5 rounded-lg shadow-sm ${
                          // Bo góc vừa, shadow nhẹ
                          msg.isSupport
                            ? "bg-white text-gray-900 rounded-tl-sm border border-gray-200" // Trắng, border xám
                            : "bg-ev-green text-white rounded-tr-sm" // ev-green
                        }`}
                      >
                        <div className="text-sm leading-relaxed">
                          {msg.message}
                        </div>
                      </div>

                      <div
                        className={`text-xs mt-1 px-1 ${
                          msg.isSupport ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        {msg.time}
                      </div>
                    </div>

                    {!msg.isSupport && (
                      <Avatar className="h-8 w-8 ml-2 mt-1">
                        <AvatarFallback className="bg-gray-200 text-gray-700 text-xs">
                          {(user?.fullName || user?.username || "U")
                            .charAt(0)
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
            {/* Typing Indicator */}
            <div className="px-6 py-2 border-t border-gray-200 bg-white">
              {" "}
              {/* Border xám, trắng */}
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <div className="flex gap-1">
                  <span
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  ></span>
                  <span
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  ></span>
                  <span
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  ></span>
                </div>
                <span className="opacity-0">Support đang nhập...</span>
              </div>
            </div>
            {/* Input Area - Modern Design */}
            <div className="p-6 border-t border-gray-200 bg-white">
              {" "}
              {/* Border xám, trắng */}
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-full hover:bg-gray-100 text-gray-500" // Hover xám nhạt
                  title="Đính kèm file"
                >
                  <Paperclip className="h-4 w-4" />
                </Button>

                <div className="flex-1 relative">
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
                    className="pr-10 rounded-full border-2 border-gray-200 focus:border-ev-green" // Border xám, focus ev-green
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full hover:bg-gray-100 text-gray-500" // Hover xám nhạt
                    title="Chọn emoji"
                  >
                    <Smile className="h-4 w-4" />
                  </Button>
                </div>

                <Button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  size="icon"
                  className="h-11 w-11 rounded-full bg-ev-green hover:bg-ev-green/90 shadow-md disabled:opacity-50" // ev-green, shadow nhẹ
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>
              <div className="mt-2 text-xs text-center text-gray-400">
                Nhấn Enter để gửi, Shift + Enter để xuống dòng
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </motion.div>
  );
};

export default ChatPage;
