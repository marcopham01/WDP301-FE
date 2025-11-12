import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Paperclip, Smile } from "lucide-react";
import Header from "@/components/MainLayout/Header";
import Footer from "@/components/MainLayout/Footer";
import { useAuth } from "@/context/AuthContext/useAuth";
import { initializeSocket } from "@/lib/socket";
import { getChatHistory, sendChatMessage, fetchAllStaff, ChatMessageDTO, StaffInfo } from "@/lib/chatApi";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";


interface MessageUI {
  id: string;
  senderLabel: string;
  message: string;
  time: string;
  isSupport: boolean;
}

const ChatPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { accessToken } = useAuth();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<MessageUI[]>([]);
  const [staffId, setStaffId] = useState<string>("");
  const [newMessage, setNewMessage] = useState("");
  const [loadingStaff, setLoadingStaff] = useState(true);
  const [allStaff, setAllStaff] = useState<StaffInfo[]>([]);

  // Helper
  const fmt = (d: Date) => d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  // Lấy tất cả staff
  useEffect(() => {
    if (!accessToken) return;
    fetchAllStaff(accessToken).then((staff) => {
      setAllStaff(staff);
      if (staff.length > 0) {
        const defaultId = staff[0]._id || staff[0].id;
        setStaffId(defaultId || "");
        console.log("✅ Loaded", staff.length, "staff, default:", defaultId);
      }
      setLoadingStaff(false);
    });
  }, [accessToken]);

  // Lấy lịch sử khi staffId thay đổi
  useEffect(() => {
    if (!accessToken || !user?.id || !staffId) return;
    console.log("📜 Loading chat history with staff:", staffId);
    getChatHistory(staffId, accessToken).then((list) => {
      setMessages(
        list.map((m: ChatMessageDTO) => ({
          id: m._id || crypto.randomUUID(),
          senderLabel: m.sender === staffId ? "EV Care Support" : user?.fullName || user?.username || "Bạn",
          message: m.content,
          time: fmt(new Date(m.createdAt || Date.now())),
          isSupport: m.sender === staffId,
        }))
      );
    }).catch((err) => {
      console.error("❌ Lỗi load lịch sử chat:", err);
    });
  }, [staffId, accessToken, user?.id, user?.fullName, user?.username]);

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

  // Socket join và lắng nghe tin nhắn mới từ staff
  useEffect(() => {
    if (!user?.id || !staffId) return;
    const socket = initializeSocket();
    socket.emit("join", user.id);
    
    const handleNewMessage = (msg: ChatMessageDTO) => {
      console.log("📨 Received message:", msg);
      if (msg.sender !== staffId) {
        console.log("⚠️ Message not from current staff, ignoring");
        return; // chỉ nhận từ staff hiện tại
      }
      setMessages((prev) => [
        ...prev,
        {
          id: msg._id || crypto.randomUUID(),
          senderLabel: allStaff.find(s => (s._id || s.id) === staffId)?.fullName || "EV Care Support",
          message: msg.content,
          time: fmt(new Date(msg.createdAt || Date.now())),
          isSupport: true,
        },
      ]);
    };
    
    socket.on("new_message", handleNewMessage);
    
    return () => {
      socket.off("new_message", handleNewMessage);
    };
  }, [user?.id, staffId, allStaff]);

  const handleSendMessage = useCallback(() => {
    console.log("📤 Trying to send:", { newMessage, accessToken: !!accessToken, staffId });
    if (!newMessage.trim() || !accessToken || !staffId) {
      console.warn("⚠️ Missing data:", { hasMessage: !!newMessage.trim(), hasToken: !!accessToken, hasStaffId: !!staffId });
      return;
    }
    sendChatMessage(staffId, newMessage, accessToken).then((saved) => {
      console.log("✅ Message sent:", saved);
      setMessages((prev) => [
        ...prev,
        {
          id: saved._id || crypto.randomUUID(),
          senderLabel: user?.fullName || user?.username || "Bạn",
          message: saved.content,
          time: fmt(new Date(saved.createdAt || Date.now())),
          isSupport: false,
        },
      ]);
      setNewMessage("");
    }).catch((err) => {
      console.error("❌ Send failed:", err);
      toast.error("Không thể gửi tin nhắn. Vui lòng thử lại!");
    });
  }, [newMessage, accessToken, staffId, user?.fullName, user?.username]);

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
        <div className="container max-w-4xl mx-auto pt-20 px-4">
          <div className="mb-6 text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Trung tâm Chat
            </h1>
            <p className="text-gray-600">
              Liên hệ với đội ngũ hỗ trợ của chúng tôi
            </p>
            {loadingStaff && (
              <p className="text-sm text-yellow-600 mt-2">⏳ Đang tải thông tin staff...</p>
            )}
            {!loadingStaff && !staffId && (
              <p className="text-sm text-red-600 mt-2">
                ⚠️ Không tìm thấy staff. Vui lòng liên hệ admin.
              </p>
            )}
          </div>

          {/* Modern Chat Container */}
          <div className="w-full bg-white rounded-lg shadow-md border border-gray-200 flex flex-col overflow-hidden">
            {" "}
            {/* Trắng, border xám, shadow nhẹ */}
            {/* Chat Header - Modern Design */}
            <div className="bg-ev-green p-4 flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-3 flex-1 min-w-[220px]">
                <div className="relative">
                  <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                    <AvatarImage src="/support-avatar.png" />
                    <AvatarFallback className="bg-white text-ev-green font-bold text-base">EV</AvatarFallback>
                  </Avatar>
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></span>
                </div>
                <div className="text-white leading-tight">
                  <h3 className="font-semibold text-base">
                    {allStaff.find(s => (s._id || s.id) === staffId)?.fullName || "EV Care Support"}
                  </h3>
                  <p className="text-[11px] text-green-100 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-300 rounded-full animate-pulse"></span>
                    Online • Phản hồi nhanh
                  </p>
                </div>
              </div>
              {allStaff.length > 1 && (
                <div className="ml-auto w-full sm:w-auto">
                  <label className="text-xs text-white/80 block mb-1">Chọn nhân viên hỗ trợ</label>
                  <div className="relative">
                    <select
                      className="text-sm rounded-md bg-white/90 text-gray-700 px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-ev-green shadow-sm"
                      value={staffId}
                      onChange={(e) => setStaffId(e.target.value)}
                    >
                      {allStaff.map(st => (
                        <option key={st._id || st.id} value={st._id || st.id}>
                          {st.fullName || st.username}
                        </option>
                      ))}
                    </select>
                    <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-gray-500">▾</span>
                  </div>
                </div>
              )}
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
                          {msg.senderLabel}
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
                  disabled={!newMessage.trim() || !staffId || !accessToken}
                  size="icon"
                  className="h-11 w-11 rounded-full bg-ev-green hover:bg-ev-green/90 shadow-md disabled:opacity-50" // ev-green, shadow nhẹ
                  title={!staffId ? "Đang tải thông tin staff..." : !accessToken ? "Chưa đăng nhập" : "Gửi tin nhắn"}
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
