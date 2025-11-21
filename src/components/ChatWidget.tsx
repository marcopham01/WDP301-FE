import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, X, MessageCircle, Minimize2, Paperclip, Smile, Image as ImageIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext/useAuth";
import { useChatSocket } from "@/hooks/useChatSocket";
import axios from "axios";
import { config } from "@/config/config";
import { fetchDefaultStaffId, fetchAllStaff, uploadChatFile, sendChatWithAttachments, ChatMessageDTO, StaffInfo, AttachmentDTO } from "@/lib/chatApi";
import { toast } from "react-toastify";
import EmojiPicker, { EmojiClickData } from "emoji-picker-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface Message {
  _id?: string;
  sender: string;
  receiver: string;
  content: string;
  createdAt?: string;
  isSupport?: boolean;
  message?: string;
  time?: string;
  attachments?: AttachmentDTO[];
}

const ChatWidget = () => {
  const { user, accessToken } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [staffId, setStaffId] = useState<string>("");
  const [newMessage, setNewMessage] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [allStaff, setAllStaff] = useState<StaffInfo[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(true);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [attachedFilePreview, setAttachedFilePreview] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      }
      setLoadingStaff(false);
    });
  }, [accessToken]);

  // Lấy lịch sử chat với staff được chọn
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
                ? fmt(new Date(msg.createdAt))
                : "",
              attachments: msg.attachments,
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
    const messageText = newMessage.trim();
    if ((!messageText && !attachedFile) || !accessToken || !staffId) return;

    const sendFlow = async () => {
      const attachments: AttachmentDTO[] = [];
      if (attachedFile) {
        try {
          setUploading(true);
          const uploaded = await uploadChatFile(attachedFile, accessToken);
          attachments.push(uploaded);
        } catch (e) {
          console.error('❌ Upload failed', e);
          toast.error('Upload file thất bại');
        } finally {
          setUploading(false);
        }
      }
      const saved = await sendChatWithAttachments({ receiver: staffId, content: messageText, attachments }, accessToken);
      setMessages((prev) => [
        ...prev,
        {
          ...saved,
          isSupport: false,
          message: saved.content,
          time: fmt(new Date(saved.createdAt || Date.now())),
          attachments: saved.attachments,
        },
      ]);
      setNewMessage("");
      setAttachedFile(null);
      setAttachedFilePreview("");
    };
    sendFlow().catch(err => {
      console.error('❌ Send flow failed:', err);
      toast.error('Không thể gửi tin nhắn.');
    });
  }, [newMessage, user, staffId, accessToken, attachedFile]);

  // Nhận tin nhắn realtime
  const handleReceiveMessage = useCallback(
    (msg: { sender: string; content: string; createdAt?: string; _id?: string; receiver: string; attachments?: AttachmentDTO[] }) => {
      if (msg.sender === staffId) {
        setMessages((prev) => [
          ...prev,
          {
            ...msg,
            isSupport: true,
            message: msg.content,
            time: msg.createdAt
              ? fmt(new Date(msg.createdAt))
              : "",
            attachments: msg.attachments,
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

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setNewMessage((prev) => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Kiểm tra kích thước file (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File quá lớn! Vui lòng chọn file nhỏ hơn 10MB");
      return;
    }

    setAttachedFile(file);

    // Tạo preview nếu là ảnh
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachedFilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setAttachedFilePreview("");
    }

    toast.success(`Đã đính kèm: ${file.name}`);
  };

  const handleRemoveFile = () => {
    setAttachedFile(null);
    setAttachedFilePreview("");
    if (fileInputRef.current) fileInputRef.current.value = "";
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
                  <h3 className="font-semibold text-sm">
                    {allStaff.find(s => (s._id || s.id) === staffId)?.fullName || "EV Care Support"}
                  </h3>
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

            {/* Staff Selector */}
            {allStaff.length > 1 && (
              <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                <label className="text-xs text-gray-600 block mb-1">Chọn nhân viên hỗ trợ</label>
                <select
                  className="text-sm rounded-md bg-white text-gray-700 px-3 py-1 w-full focus:outline-none focus:ring-2 focus:ring-ev-green"
                  value={staffId}
                  onChange={(e) => setStaffId(e.target.value)}
                >
                  {allStaff.map(st => (
                    <option key={st._id || st.id} value={st._id || st.id}>
                      {st.fullName || st.username}
                    </option>
                  ))}
                </select>
              </div>
            )}

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
                <Badge
                  variant="secondary"
                  className="cursor-pointer hover:bg-ev-green hover:text-white transition-colors text-xs whitespace-nowrap"
                  onClick={() => setNewMessage("Kiểm tra lịch sử xe")}
                >
                  🚗 Lịch sử xe
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
                      <div className="space-y-1 max-w-full">
                        <div
                          className={`px-3 py-2 rounded-lg text-sm ${
                            msg.isSupport
                              ? "bg-white text-gray-900 rounded-tl-sm border border-gray-200"
                              : "bg-ev-green text-white rounded-tr-sm"
                          }`}
                        >
                          {msg.message}
                        </div>
                        {/* Attachments */}
                        {msg.attachments?.length > 0 && (
                          <div className={`flex flex-col gap-2 ${msg.isSupport ? '' : 'items-end'}`}>
                            {msg.attachments.map((att: AttachmentDTO, i: number) => {
                              const href = att.url.startsWith('http') ? att.url : `${config.API_BASE_URL}${att.url}`;
                              return att.type.startsWith('image/') ? (
                                <a
                                  key={i}
                                  href={href}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block rounded-md overflow-hidden border border-gray-200 hover:opacity-90 transition w-32"
                                >
                                  <img src={href} alt={att.name} className="w-full h-20 object-cover" />
                                  <div className="bg-white text-[10px] text-gray-600 px-2 py-1 truncate">{att.name}</div>
                                </a>
                              ) : (
                                <a
                                  key={i}
                                  href={href}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs px-2 py-1 rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 inline-flex items-center gap-1"
                                >
                                  <Paperclip className="h-3 w-3" /> {att.name || 'Tệp đính kèm'}
                                </a>
                              )
                            })}
                          </div>
                        )}
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
              {/* File preview */}
              {attachedFile && (
                <div className="mb-3 p-2 bg-gray-50 rounded border flex items-center gap-2">
                  {attachedFilePreview ? (
                    <img src={attachedFilePreview} alt="Preview" className="w-10 h-10 object-cover rounded" />
                  ) : (
                    <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                      <ImageIcon className="h-4 w-4 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-700 truncate">{attachedFile.name}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleRemoveFile}
                    className="h-6 w-6 text-gray-400 hover:text-red-500"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  className="hidden"
                  accept="image/*,.pdf,.doc,.docx,.txt"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-10 w-10 rounded-full hover:bg-gray-100 text-gray-500"
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
                    className="pr-10 rounded-full text-sm"
                  />
                  <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full hover:bg-gray-100 text-gray-500"
                        title="Chọn emoji"
                      >
                        <Smile className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0 border-0" align="end">
                      <EmojiPicker onEmojiClick={handleEmojiClick} width={320} height={400} />
                    </PopoverContent>
                  </Popover>
                </div>

                <Button
                  onClick={handleSendMessage}
                  disabled={uploading || ((!newMessage.trim() && !attachedFile) || !staffId || !accessToken)}
                  size="icon"
                  className="h-10 w-10 rounded-full bg-ev-green hover:bg-ev-green/90"
                >
                  {uploading ? (
                    <span className="animate-pulse text-xs">...</span>
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
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